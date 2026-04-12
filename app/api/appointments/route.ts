import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBookingEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { property_id, property_title, name, email, phone, preferred_date, message, scheduled_at } = body;

  if (!name || !email || !preferred_date) {
    return NextResponse.json({ error: "Name, email and preferred date are required." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Insert appointment
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

  // Look up agent email from property
  let agentEmail: string | undefined;
  let agentName: string | undefined;
  if (property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("agent_name, agent_email")
      .eq("id", property_id)
      .single();
    agentEmail = prop?.agent_email ?? undefined;
    agentName  = prop?.agent_name  ?? undefined;
  }

  // Send confirmation emails (non-blocking)
  sendBookingEmails({
    userEmail:      email,
    userName:       name,
    agentEmail,
    agentName,
    propertyTitle:  property_title ?? "Property",
    scheduledAt:    scheduled_at ?? preferred_date,
    notes:          message ?? undefined,
  }).catch(() => { /* non-blocking */ });

  return NextResponse.json({ ok: true });
}
