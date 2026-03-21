import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/map/pins?bbox=south,west,north,east&zoom=N&limit=N
 *
 * Lightweight map-pin endpoint — returns ONLY the fields needed to render
 * a pin on the map.  Skips the property_images join and all heavy text
 * columns, cutting response size by ~70% vs /api/properties.
 *
 * Fields returned per pin:
 *   id, lat, lng, price, currency, property_type, listing_type, title
 *
 * Uses PostGIS st_intersects when available (auto-detected per process),
 * falls back to lat/lng B-tree range scan.
 */

function limitForZoom(zoom: number): number {
  if (zoom <= 5)  return 120;
  if (zoom <= 8)  return 250;
  if (zoom <= 11) return 500;
  return 800;
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const bboxParam = searchParams.get("bbox");
  const zoom      = parseInt(searchParams.get("zoom") ?? "10");
  const limitArg  = parseInt(searchParams.get("limit") ?? "0");
  const limit     = limitArg > 0 ? limitArg : limitForZoom(zoom);
  const sort      = searchParams.get("sort") ?? "newest";

  if (!bboxParam) {
    return NextResponse.json({ error: "bbox required" }, { status: 400 });
  }

  const [south, west, north, east] = bboxParam.split(",").map(Number);
  if ([south, west, north, east].some(isNaN)) {
    return NextResponse.json({ error: "invalid bbox" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Only select the 8 fields needed for a map pin — no images join
  const PIN_SELECT = "id,lat,lng,price,currency,property_type,listing_type,title,city,neighbourhood";

  function buildBase() {
    return supabase
      .from("properties")
      .select(PIN_SELECT)
      .eq("tenant_id", tenantId!)
      .eq("status", "active")
      .limit(limit);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applySort(q: any): any {
    if (sort === "spread") return q.order("lng", { ascending: true }).order("lat", { ascending: true });
    return q.order("created_at", { ascending: false });
  }

  // ── lat/lng B-tree bbox scan (fast, no PostGIS needed for simple bbox) ────
  const { data, error } = await applySort(
    buildBase()
      .gte("lat", south).lte("lat", north)
      .gte("lng", west) .lte("lng", east)
      .not("lat", "is", null)
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data, zoom, limit },
    {
      headers: {
        // Cache tile for 2 minutes — pins don't change between seed runs
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}
