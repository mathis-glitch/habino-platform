import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/analytics
// Returns: property views, contacts, bookings, conversion rate, top properties
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const sb = createServiceClient();
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalProperties },
    { count: activeProperties },
    { count: totalBookings },
    { count: pendingBookings },
    { count: totalMessages },
    { count: savedCount },
    { data: topProperties },
    { data: recentBookings },
  ] = await Promise.all([
    sb.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    sb.from("properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
    sb.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("created_at", since),
    sb.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
    sb.from("conversations").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("created_at", since),
    sb.from("saved_properties").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("created_at", since),
    // Top properties by saves
    sb.from("saved_properties")
      .select("property_id, properties(id, title, price, currency, neighbourhood, listing_type, property_type)")
      .eq("tenant_id", tenantId)
      .gte("created_at", since)
      .limit(50),
    // Recent bookings
    sb.from("appointments")
      .select("id, name, email, preferred_date, status, property_title, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Aggregate top properties by save count
  const saveCounts: Record<string, { count: number; property: unknown }> = {};
  for (const row of topProperties ?? []) {
    const pid = row.property_id;
    if (!saveCounts[pid]) saveCounts[pid] = { count: 0, property: row.properties };
    saveCounts[pid].count++;
  }
  const topBysaves = Object.values(saveCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const conversionRate = totalMessages && totalBookings
    ? ((totalBookings / Math.max(totalMessages, 1)) * 100).toFixed(1)
    : "0";

  return NextResponse.json({
    period_days:       days,
    total_properties:  totalProperties ?? 0,
    active_properties: activeProperties ?? 0,
    bookings_total:    totalBookings ?? 0,
    bookings_pending:  pendingBookings ?? 0,
    messages_total:    totalMessages ?? 0,
    saves_total:       savedCount ?? 0,
    conversion_rate:   conversionRate,
    top_properties:    topBysaves,
    recent_bookings:   recentBookings ?? [],
  });
}
