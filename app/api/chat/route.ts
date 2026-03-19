import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { messages, context } = await request.json();
  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Load tenant info
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("name, tagline, contact_email, whatsapp")
    .eq("id", tenantId)
    .single();

  // Load recent active listings (limit to avoid token overload)
  const { data: properties } = await serviceClient
    .from("properties")
    .select("id, title, listing_type, property_type, price, currency, bedrooms, bathrooms, area_sqm, city, neighbourhood, status")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  // Build listing summary for context
  const listingSummary = properties?.length
    ? properties.map((p) =>
        `• [${p.listing_type === "buy" ? "For Sale" : "For Rent"}] ${p.title} — ${p.currency} ${p.price.toLocaleString()} — ${p.bedrooms}bd/${p.bathrooms}ba — ${p.neighbourhood ? `${p.neighbourhood}, ` : ""}${p.city} — ID: ${p.id}`
      ).join("\n")
    : "No listings currently available.";

  const systemPrompt = `You are a helpful real estate assistant for ${tenant?.name || "this platform"}. ${tenant?.tagline ? `The platform's tagline is: "${tenant.tagline}".` : ""}

You help users find properties, answer questions about the market, and guide them through their property search. You are friendly, professional, and concise.

CURRENT LISTINGS (${properties?.length || 0} active):
${listingSummary}

When recommending properties, use the listing IDs to link them like: /properties/[ID]
${context?.currentProperty ? `\nThe user is currently viewing: ${context.currentProperty}` : ""}
${tenant?.contact_email ? `\nFor enquiries: ${tenant.contact_email}` : ""}
${tenant?.whatsapp ? `\nWhatsApp: ${tenant.whatsapp}` : ""}

Guidelines:
- Keep responses concise and helpful (2-4 sentences max unless asked for more)
- When recommending listings, mention 2-3 max and include the property link
- For detailed market analysis, suggest using the Market Insights page
- If you don't have relevant listings, say so honestly and suggest broadening the search
- Don't make up prices or data not in the listings`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10), // keep last 10 messages for context
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "AI service unavailable." }, { status: 500 });
  }
}
