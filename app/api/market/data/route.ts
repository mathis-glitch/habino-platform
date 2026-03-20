import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/market/data?city=Hamburg&district=Eimsbüttel&usage=residential
 *
 * Returns market data for a given city / district / usage type.
 * Falls back gracefully: if no data is found, returns { data: null }
 * so the frontend can fall back to sample data.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const city     = searchParams.get("city")     || "";
  const district = searchParams.get("district") || "All districts";
  const usage    = searchParams.get("usage")    || "residential";

  if (!city) return NextResponse.json({ error: "city is required" }, { status: 400 });

  const supabase = createServiceClient();

  // ── District stats ───────────────────────────────────────────────────────
  const { data: stats } = await supabase
    .from("market_district_stats")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("city", city)
    .eq("district", district)
    .eq("usage_type", usage)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Price trend (last 12 months) ─────────────────────────────────────────
  const { data: trend } = await supabase
    .from("market_price_trend")
    .select("month, buy_price_sqm, rent_price_sqm")
    .eq("tenant_id", tenantId)
    .eq("city", city)
    .eq("district", district)
    .eq("usage_type", usage)
    .order("month", { ascending: true })
    .limit(12);

  // ── District comparison (for bar chart) ──────────────────────────────────
  const { data: districtComparison } = await supabase
    .from("market_district_stats")
    .select("district, buy_price_sqm, rent_price_sqm")
    .eq("tenant_id", tenantId)
    .eq("city", city)
    .eq("usage_type", usage)
    .neq("district", "All districts")
    .order("buy_price_sqm", { ascending: false })
    .limit(6);

  // ── Micro-location scores ────────────────────────────────────────────────
  const { data: micro } = await supabase
    .from("market_micro_scores")
    .select("factor, score")
    .eq("tenant_id", tenantId)
    .eq("city", city)
    .eq("district", district)
    .order("factor", { ascending: true });

  // If no stats found, return null so frontend falls back to sample data
  if (!stats) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      stats: {
        buy_price_sqm:  stats.buy_price_sqm,
        rent_price_sqm: stats.rent_price_sqm,
        gross_yield:    stats.gross_yield,
        trend_pct:      stats.trend_pct,
        trend_up:       stats.trend_up,
      },
      trend:               trend || [],
      district_comparison: districtComparison || [],
      micro_scores:        micro || [],
    },
  });
}
