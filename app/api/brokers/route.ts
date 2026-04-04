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

// GET /api/brokers — list broker profiles
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get("page")  || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  const { data, count, error } = await supabase
    .from("broker_profiles")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("verified", { ascending: false })
    .order("rating", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}
