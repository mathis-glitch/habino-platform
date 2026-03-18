import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/properties/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }     = await params;
  const tenantId   = request.headers.get("x-tenant-id");
  if (!tenantId) {
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

  // Sort images by sort_order
  if (data.images) {
    data.images.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  }

  return NextResponse.json(data);
}

// PUT /api/properties/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: { user } } = await createServiceClient().auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // Remove fields that shouldn't be updated directly
  delete body.id;
  delete body.tenant_id;
  delete body.created_at;
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
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: { user } } = await createServiceClient().auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("properties")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
