import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/map/cities
 *
 * Returns all city cluster data for the tenant — typically ~1 500 rows.
 * Used by the map at zoom < 8 to show a lightweight city-bubble layer
 * instead of loading individual property pins (much faster on 1M rows).
 *
 * Response:
 *   { data: Array<{ city, country, lat, lng, listing_count }> }
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("city_listing_counts")
    .select("city, country, lat, lng, listing_count")
    .eq("tenant_id", tenantId)
    .order("listing_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: data ?? [] },
    {
      headers: {
        // Cache for 5 minutes — city counts change only after a re-seed
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
