import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const tenantId   = req.headers.get("x-tenant-id") ?? "(empty)";
  const tenantSlug = req.headers.get("x-tenant-slug") ?? "(empty)";

  const sb = createServiceClient();

  const { count: propCount } = await sb
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { count: activeCount } = await sb
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  const { data: tenants } = await sb
    .from("tenants")
    .select("id, slug, is_active")
    .limit(5);

  return NextResponse.json({
    resolved_tenant_id:   tenantId,
    resolved_tenant_slug: tenantSlug,
    total_properties:     propCount ?? 0,
    active_properties:    activeCount ?? 0,
    all_tenants_in_db:    tenants ?? [],
  });
}
