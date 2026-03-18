import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/tenant/config — public config for current tenant
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("name, slug, logo_url, primary_color, secondary_color, tagline, contact_email, whatsapp")
    .eq("id", tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/tenant/config — update config (operator auth required)
export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body    = await request.json();
  const allowed = ["name", "tagline", "primary_color", "secondary_color", "contact_email", "whatsapp", "custom_domain"];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("tenants")
    .update(updates)
    .eq("id", tenantId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
