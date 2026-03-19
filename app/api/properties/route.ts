import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PropertyFilters } from "@/lib/types";

// GET /api/properties — public listing feed
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const filters: PropertyFilters = {
    listing_type:  (searchParams.get("type") as any)      || undefined,
    property_type: (searchParams.get("property_type") as any) || undefined,
    city:          searchParams.get("city")               || undefined,
    min_price:     searchParams.get("min_price") ? parseInt(searchParams.get("min_price")!) : undefined,
    max_price:     searchParams.get("max_price") ? parseInt(searchParams.get("max_price")!) : undefined,
    bedrooms:      searchParams.get("bedrooms")  ? parseInt(searchParams.get("bedrooms")!)  : undefined,
    page:          parseInt(searchParams.get("page")  || "1"),
    limit:         parseInt(searchParams.get("limit") || "12"),
    sort:          (searchParams.get("sort") as any) || "newest",
  };

  const supabase = createServiceClient();
  const offset   = ((filters.page || 1) - 1) * (filters.limit || 12);

  let query = supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .range(offset, offset + (filters.limit || 12) - 1);

  if (filters.listing_type)  query = query.eq("listing_type",  filters.listing_type);
  if (filters.property_type) query = query.eq("property_type", filters.property_type);
  if (filters.city)          query = query.ilike("city", `%${filters.city}%`);
  if (filters.min_price)     query = query.gte("price", filters.min_price);
  if (filters.max_price)     query = query.lte("price", filters.max_price);
  if (filters.bedrooms)      query = query.eq("bedrooms", filters.bedrooms);

  if (filters.sort === "price_asc")  query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count || 0,
    page:  filters.page,
    limit: filters.limit,
  });
}

// POST /api/properties — create listing (operator auth required)
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const serviceClient = createServiceClient();

  const body = await request.json();

  const { data, error } = await serviceClient
    .from("properties")
    .insert({ ...body, tenant_id: tenantId })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
