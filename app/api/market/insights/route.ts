import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MarketInsight } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CACHE_HOURS = 24;
const GUEST_DAILY_LIMIT = 5;

// POST /api/market/insights
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { location, property_type, area_sqm } = body;

  if (!location || !property_type) {
    return NextResponse.json({ error: "location and property_type are required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // Rate-limit guests
  if (!user) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const today = new Date().toISOString().split("T")[0];

    const serviceClient = createServiceClient();
    const { data: rateRow } = await serviceClient
      .from("ai_rate_limits")
      .select("count")
      .eq("ip_address", ip)
      .eq("date", today)
      .single();

    const currentCount = rateRow?.count || 0;
    if (currentCount >= GUEST_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily query limit reached. Sign in for unlimited access." },
        { status: 429 }
      );
    }

    // Upsert count
    await serviceClient.from("ai_rate_limits").upsert({
      ip_address: ip,
      date: today,
      count: currentCount + 1,
    });
  }

  // Normalise cache key
  const cacheLocation = location.toLowerCase().trim();
  const cachePropType = property_type.toLowerCase().trim();

  // Check cache
  const serviceClient = createServiceClient();
  const cacheExpiry   = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: cached } = await serviceClient
    .from("market_queries")
    .select("result_json")
    .eq("tenant_id", tenantId)
    .eq("location",  cacheLocation)
    .eq("property_type", cachePropType)
    .gte("created_at", cacheExpiry)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return NextResponse.json({ ...cached.result_json, cached: true });
  }

  // Call OpenAI
  try {
    const prompt = `You are a real estate market analyst. Return a JSON object with EXACTLY these fields (no extra text):
{
  "avg_price_sqm": number,
  "trend_pct": number (positive = price increase, negative = decrease),
  "trend_direction": "up" | "down" | "stable",
  "demand_level": "low" | "medium" | "high",
  "avm_min": number,
  "avm_max": number,
  "currency": string (ISO 4217 code, infer from location),
  "summary": string (1-2 sentences),
  "data_confidence": "low" | "medium" | "high"
}

Location: ${location}
Property type: ${property_type}
${area_sqm ? `Floor area: ${area_sqm} m²` : ""}

Base your estimates on publicly known market conditions for this location.
The avm_min/avm_max should be monthly rent range OR sale price range depending on what makes sense for the location.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a real estate market analyst. Always respond with valid JSON only, no markdown." },
        { role: "user",   content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const result: MarketInsight = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    // Store in cache
    await serviceClient.from("market_queries").insert({
      tenant_id:     tenantId,
      user_id:       user?.id || null,
      location:      cacheLocation,
      property_type: cachePropType,
      result_json:   result,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("OpenAI error:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 503 });
  }
}
