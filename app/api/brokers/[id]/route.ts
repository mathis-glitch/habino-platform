import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

async function getTenantId(request: NextRequest): Promise<string | null> {
  let tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) {
    const svc = createServiceClient();
    const { data } = await svc.from("tenants").select("id").eq("is_active", true).limit(1).single();
    tenantId = data?.id ?? null;
  }
  return tenantId;
}

// GET /api/brokers/[id] — single broker + their listings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = await getTenantId(request);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const supabase = createServiceClient();

  // Fetch broker profile
  const { data: broker, error } = await supabase
    .from("broker_profiles")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 });

  // Fetch their listings by name match
  const { data: listings } = await supabase
    .from("properties")
    .select("*, images:property_images(id, url, sort_order)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("agent_name", broker.full_name)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ broker, listings: listings ?? [] });
}
