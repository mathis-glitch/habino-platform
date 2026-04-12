import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST /api/brokers/verify — broker submits verification request
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { doc_url, note } = await req.json();
  if (!doc_url) return NextResponse.json({ error: "doc_url required" }, { status: 400 });

  const sb = createServiceClient();
  const { error } = await sb
    .from("broker_profiles")
    .update({
      verification_status:  "pending",
      verification_doc_url: doc_url,
      verification_note:    note ?? null,
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: "pending" });
}

// PATCH /api/brokers/verify — admin approves or rejects
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only operators/admins
  const tenantId = req.headers.get("x-tenant-id");
  const sb = createServiceClient();
  const { data: profile } = await sb
    .from("profiles").select("role").eq("id", user.id).single();
  if (!["operator", "admin"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { broker_id, status, note } = await req.json();
  if (!broker_id || !["verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "broker_id and status (verified|rejected) required" }, { status: 400 });
  }

  const { error } = await sb
    .from("broker_profiles")
    .update({
      verification_status: status,
      verification_note:   note ?? null,
      verification_at:     new Date().toISOString(),
    })
    .eq("id", broker_id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status });
}
