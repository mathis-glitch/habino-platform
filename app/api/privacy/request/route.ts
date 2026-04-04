import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_TYPES = ["access", "delete", "export", "rectification", "restriction", "object", "withdraw"] as const;
type RequestType = typeof VALID_TYPES[number];

// Response deadlines by request type (days)
const DEADLINES: Record<RequestType, string> = {
  access:        "30 days (GDPR) / 21 days (Kenya DPA)",
  delete:        "30 days — anonymised within 30 days of confirmation",
  export:        "30 days",
  rectification: "30 days",
  restriction:   "30 days",
  object:        "30 days",
  withdraw:      "Immediate",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, email, name, details } = body;

  // Validate
  if (!type || !VALID_TYPES.includes(type as RequestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Record the request in the DB for audit trail
  const { error: insertErr } = await supabase
    .from("privacy_requests")
    .insert({
      type:       type as RequestType,
      email:      email.trim().toLowerCase(),
      name:       name?.trim() || null,
      details:    details?.trim() || null,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      user_agent: request.headers.get("user-agent") || null,
      status:     "pending",
      deadline:   DEADLINES[type as RequestType],
    });

  // If table doesn't exist yet, still return success (graceful degradation)
  if (insertErr && !insertErr.message.includes("does not exist")) {
    console.error("privacy_requests insert error:", insertErr.message);
    // Still proceed — don't fail the user request just because of a DB issue
  }

  // For delete requests: look up the user and flag account for deletion
  if (type === "delete") {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (profileData?.id) {
      // Mark the profile as deletion-requested (soft flag)
      await supabase
        .from("profiles")
        .update({ deletion_requested_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("id", profileData.id);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Your ${type} request has been received. We will respond within ${DEADLINES[type as RequestType]}.`,
    reference: `HAB-${Date.now()}`,
  }, { status: 200 });
}
