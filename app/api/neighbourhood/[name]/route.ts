/**
 * GET /api/neighbourhood/[name]
 *
 * Returns an AI-generated neighbourhood intelligence summary.
 * Uses POI data from the database + Claude to generate a description.
 * Cached for 7 days in the neighbourhood_insights table.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function getTenantId(request: NextRequest): Promise<string | null> {
  let tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    const svc = createServiceClient();
    const { data } = await svc.from("tenants").select("id").eq("is_active", true).limit(1).single();
    tenantId = data?.id ?? null;
  }
  return tenantId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const neighbourhood = decodeURIComponent(name).trim();
  if (!neighbourhood) return NextResponse.json({ error: "name required" }, { status: 400 });

  const tenantId = await getTenantId(request);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const supabase = createServiceClient();

  // ── Check cache (7 days) ──────────────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("neighbourhood_insights")
    .select("summary, highlights, poi_counts")
    .eq("tenant_id", tenantId)
    .ilike("name", neighbourhood)
    .gte("created_at", sevenDaysAgo)
    .single();

  if (cached?.summary) {
    return NextResponse.json({ neighbourhood, ...cached, cached: true });
  }

  // ── Fetch POI counts for this neighbourhood ───────────────────────────────
  const { data: pois } = await supabase
    .from("points_of_interest")
    .select("type, name")
    .ilike("city", "Addis Ababa")
    .limit(200);

  // Count POI types within the city (neighbourhood filter is approximate — POIs don't have neighbourhood field)
  const poiCounts: Record<string, number> = {};
  for (const poi of pois ?? []) {
    poiCounts[poi.type] = (poiCounts[poi.type] ?? 0) + 1;
  }

  // ── Fetch property stats for this neighbourhood ───────────────────────────
  const { data: propStats } = await supabase
    .from("properties")
    .select("listing_type, price, area_sqm")
    .eq("tenant_id", tenantId)
    .ilike("neighbourhood", `%${neighbourhood}%`)
    .eq("status", "active")
    .limit(100);

  type PropStat = { listing_type: string | null; price: number | null; area_sqm: number | null };
  const rentProps  = (propStats as PropStat[] ?? []).filter(p => p.listing_type === "rent");
  const buyProps   = (propStats as PropStat[] ?? []).filter(p => p.listing_type === "buy");
  const avgRent    = rentProps.length > 0 ? Math.round(rentProps.reduce((s: number, p: PropStat) => s + (p.price ?? 0), 0) / rentProps.length) : null;
  const avgBuy     = buyProps.length  > 0 ? Math.round(buyProps.reduce((s: number, p: PropStat)  => s + (p.price ?? 0), 0) / buyProps.length)  : null;

  // ── Generate AI summary ───────────────────────────────────────────────────
  const context = [
    `Neighbourhood: ${neighbourhood}, Addis Ababa, Ethiopia`,
    avgRent ? `Average rent: ETB ${avgRent.toLocaleString()}/month` : null,
    avgBuy  ? `Average purchase price: ETB ${avgBuy.toLocaleString()}` : null,
    `Active listings: ${(propStats ?? []).length}`,
    Object.keys(poiCounts).length > 0
      ? `Nearby amenities (city-wide): ${Object.entries(poiCounts).map(([k, v]) => `${v} ${k}s`).join(", ")}`
      : null,
  ].filter(Boolean).join("\n");

  let summary    = "";
  let highlights: string[] = [];

  try {
    const msg = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:     `You are a local real estate expert for Addis Ababa, Ethiopia.
Write a concise, honest neighbourhood description for property seekers.
Respond ONLY with valid JSON: { "summary": "2-3 sentence description", "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"] }
Keep the summary factual and practical. Highlights should be specific benefits or notable features.`,
      messages: [{ role: "user", content: context }],
    });

    const raw  = (msg.content[0] as { type: string; text: string }).text ?? "{}";
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
    summary    = json.summary    ?? "";
    highlights = json.highlights ?? [];
  } catch {
    summary    = `${neighbourhood} is a district in Addis Ababa with active property listings.`;
    highlights = [];
  }

  // ── Upsert cache ──────────────────────────────────────────────────────────
  await supabase.from("neighbourhood_insights").upsert({
    tenant_id:  tenantId,
    name:       neighbourhood,
    summary,
    highlights,
    poi_counts: poiCounts,
    created_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,name" });

  return NextResponse.json({
    neighbourhood,
    summary,
    highlights,
    poi_counts: poiCounts,
    cached: false,
  });
}
