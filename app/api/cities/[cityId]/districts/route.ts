import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cities/:cityId/districts
 *
 * Returns all districts for a given city.
 * Pass ?major=true to get only major districts (used for map labels / chips).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> },
) {
  const { cityId } = await params;

  const supabase = createServiceClient();

  let query = supabase
    .from("districts")
    .select("*")
    .eq("city_id", cityId)
    .order("name");

  if (request.nextUrl.searchParams.get("major") === "true") {
    query = query.eq("is_major", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: data ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
