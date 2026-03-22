import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { property_id, property_title, name, email, phone, preferred_date, message } = body;

  if (!name || !email || !preferred_date) {
    return NextResponse.json({ error: "Name, E-Mail und Wunschtermin sind Pflichtfelder." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("appointments").insert({
    tenant_id: tenantId,
    property_id: property_id || null,
    property_title: property_title || null,
    name, email,
    phone: phone || null,
    preferred_date,
    message: message || null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
