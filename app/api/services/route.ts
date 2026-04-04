import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

async function getTenantId(request: NextRequest): Promise<string | null> {
  let tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    const svc = createServiceClient();
    const { data } = await svc
      .from("tenants")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .single();
    tenantId = data?.id ?? null;
  }
  return tenantId;
}

// POST /api/services — create a new service listing
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant found" }, { status: 404 });
  }

  const body = await request.json();

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("service_providers")
    .insert({
      tenant_id:     tenantId,
      category:      body.category,
      name:          body.name,
      contact_name:  body.contact_name,
      phone:         body.phone,
      whatsapp:      body.whatsapp,
      email:         body.email,
      address:       body.address,
      district:      body.district,
      description:   body.description,
      price_from:    body.price_from,
      currency:      body.currency ?? "ETB",
      price_unit:    body.price_unit,
      service_areas: body.service_areas,
      working_hours: body.working_hours,
      response_time: body.response_time,
      languages:     body.languages,
      team_size:     body.team_size,
      founded_year:  body.founded_year,
      tags:          body.tags,
      highlights:    body.highlights,
      photo_url:     body.photo_url,
      status:        body.status ?? "active",
      verified:      false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("service insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id }, { status: 201 });
}

// GET /api/services — list service providers
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const page     = parseInt(searchParams.get("page")  || "1");
  const limit    = parseInt(searchParams.get("limit") || "20");
  const offset   = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from("service_providers")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("verified", { ascending: false })
    .order("rating", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}
