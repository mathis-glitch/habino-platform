import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/map/poi?bbox=south,west,north,east&types=school,hospital,park
 *
 * Returns POIs within the given bounding box for the requested types.
 * Used by the map to render a POI overlay layer (toggleable per category).
 *
 * Response shape:
 *   { data: [{ id, name, type, category, lat, lng }] }
 *
 * Cache: 10 minutes (POI data changes rarely)
 */

const MAX_POIS_PER_REQUEST = 2000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const bboxParam  = searchParams.get("bbox");
  const typesParam = searchParams.get("types"); // comma-separated, e.g. "school,hospital"

  if (!bboxParam) {
    return NextResponse.json({ error: "bbox required" }, { status: 400 });
  }

  const [south, west, north, east] = bboxParam.split(",").map(Number);
  if ([south, west, north, east].some(isNaN)) {
    return NextResponse.json({ error: "invalid bbox" }, { status: 400 });
  }

  const requestedTypes = typesParam
    ? typesParam.split(",").map(t => t.trim()).filter(Boolean)
    : null; // null = all types

  const supabase = createServiceClient();

  let q = supabase
    .from("points_of_interest")
    .select("id,name,type,category,lat,lng")
    .gte("lat", south)
    .lte("lat", north)
    .gte("lng", west)
    .lte("lng", east)
    .limit(MAX_POIS_PER_REQUEST);

  if (requestedTypes && requestedTypes.length > 0) {
    q = q.in("type", requestedTypes);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: data ?? [], count: data?.length ?? 0 },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    }
  );
}
