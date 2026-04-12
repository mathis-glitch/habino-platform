import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/properties/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }     = await params;
  const tenantId   = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (data.images) {
    data.images.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  }

  return NextResponse.json(data);
}

// ── Ownership check helper ─────────────────────────────────────────────────────
// Verifies the authenticated user owns this property OR has operator role in the tenant.
async function assertCanModify(
  userId: string,
  propertyId: string,
  tenantId: string,
): Promise<boolean> {
  const sb = createServiceClient();

  // Check operator role first (operators can manage all tenant properties)
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .eq("tenant_id", tenantId)
    .single();

  if (profile?.role === "operator" || profile?.role === "admin") return true;

  // Otherwise check ownership via created_by (if column exists) or agent_email match
  const { data: property } = await sb
    .from("properties")
    .select("created_by")
    .eq("id", propertyId)
    .eq("tenant_id", tenantId)
    .single();

  if (!property) return false;
  return property.created_by === userId;
}

// PUT /api/properties/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canModify = await assertCanModify(user.id, id, tenantId);
  if (!canModify) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  delete body.id;
  delete body.tenant_id;
  delete body.created_at;
  delete body.created_by;
  body.updated_at = new Date().toISOString();

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("properties")
    .update(body)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/properties/[id] — soft delete (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canModify = await assertCanModify(user.id, id, tenantId);
  if (!canModify) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("properties")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
