import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/admin/analytics/behavior?days=30
// Returns district demand heatmap, event breakdown, hourly distribution
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb   = createServiceClient();
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  // ── 1. Total events ──────────────────────────────────────────────────────────
  const { count: total_events } = await sb
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  // ── 2. Unique user sessions (distinct non-null user_ids) ────────────────────
  const { data: userRows } = await sb
    .from("analytics_events")
    .select("user_id")
    .gte("created_at", since)
    .not("user_id", "is", null);

  const unique_sessions = new Set((userRows ?? []).map((r: any) => r.user_id)).size;

  // ── 3. Event type breakdown ──────────────────────────────────────────────────
  const { data: evtRows } = await sb
    .from("analytics_events")
    .select("event_type")
    .gte("created_at", since);

  const evtCounts: Record<string, number> = {};
  for (const r of evtRows ?? []) {
    evtCounts[r.event_type] = (evtCounts[r.event_type] ?? 0) + 1;
  }
  const top_event_types = Object.entries(evtCounts)
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count);

  // ── 4. District demand ───────────────────────────────────────────────────────
  const { data: distRows } = await sb
    .from("analytics_events")
    .select("event_type, district")
    .gte("created_at", since)
    .not("district", "is", null);

  const distMap: Record<string, { views: number; searches: number; saves: number }> = {};
  for (const r of distRows ?? []) {
    if (!r.district) continue;
    if (!distMap[r.district]) distMap[r.district] = { views: 0, searches: 0, saves: 0 };
    if (r.event_type === "property_viewed")  distMap[r.district].views++;
    if (r.event_type === "search_performed" || r.event_type === "ai_search_used") distMap[r.district].searches++;
    if (r.event_type === "property_saved")   distMap[r.district].saves++;
  }
  const district_demand = Object.entries(distMap)
    .map(([district, counts]) => ({ district, ...counts, total: counts.views + counts.searches + counts.saves }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // ── 5. Hourly distribution (local time ≈ UTC+3) ──────────────────────────────
  const { data: hourRows } = await sb
    .from("analytics_events")
    .select("created_at")
    .gte("created_at", since);

  const hourCounts: Record<number, number> = {};
  for (const r of hourRows ?? []) {
    const hour = (new Date(r.created_at).getUTCHours() + 3) % 24; // EAT = UTC+3
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const hourly_distribution = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => a.hour - b.hour);

  return NextResponse.json({
    total_events:        total_events ?? 0,
    unique_sessions,
    top_event_types,
    district_demand,
    hourly_distribution,
  });
}
