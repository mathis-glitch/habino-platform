import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cities
 *
 * Returns all active cities for the current tenant.
 * Pass ?include=districts to embed districts in each city.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const includeDistricts =
    request.nextUrl.searchParams.get("include") === "districts";

  const supabase = createServiceClient();

  const { data: cities, error } = await supabase
    .from("cities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (includeDistricts && cities && cities.length > 0) {
    const cityIds = cities.map((c: { id: string }) => c.id);
    const { data: districts, error: dErr } = await supabase
      .from("districts")
      .select("*")
      .in("city_id", cityIds)
      .order("name");

    if (dErr) {
      return NextResponse.json({ error: dErr.message }, { status: 500 });
    }

    const byCity = new Map<string, typeof districts>();
    for (const d of districts ?? []) {
      const arr = byCity.get(d.city_id) ?? [];
      arr.push(d);
      byCity.set(d.city_id, arr);
    }

    for (const city of cities) {
      (city as Record<string, unknown>).districts = byCity.get(city.id) ?? [];
    }
  }

  return NextResponse.json(
    { data: cities ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
