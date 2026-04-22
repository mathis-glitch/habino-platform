import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const COSTS: Record<string, number> = {
  promote_listing: 10,   // 10 credits = 1 week promoted listing
  promote_ad: 5,         // 5 credits = 1 week carousel ad
  top_placement: 20,     // 20 credits = 1 week top search position
};

/**
 * GET /api/credits?userId=xxx&userType=broker
 * Returns credit balance + transaction history
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const userType = searchParams.get("userType") ?? "broker";

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const sb = createServiceClient();
  const table = userType === "servicer" ? "service_providers" : "broker_profiles";

  const { data: profile } = await sb.from(table).select("credits").eq("id", userId).single();
  const { data: transactions } = await sb
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    credits: profile?.credits ?? 0,
    transactions: transactions ?? [],
  });
}

/**
 * POST /api/credits
 * Body: { userId, userType, action, propertyId? }
 * Actions: promote_listing, promote_ad, top_placement
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id")?.trim() ?? "";
  const { userId, userType, action, propertyId } = await req.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  const cost = COSTS[action];
  if (!cost) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const sb = createServiceClient();
  const table = userType === "servicer" ? "service_providers" : "broker_profiles";

  // Check balance
  const { data: profile } = await sb.from(table).select("credits").eq("id", userId).single();
  if (!profile || profile.credits < cost) {
    return NextResponse.json({
      error: "Insufficient credits",
      credits: profile?.credits ?? 0,
      cost,
    }, { status: 402 });
  }

  // Deduct credits
  const { error: deductErr } = await sb
    .from(table)
    .update({ credits: profile.credits - cost })
    .eq("id", userId);

  if (deductErr) {
    return NextResponse.json({ error: deductErr.message }, { status: 500 });
  }

  // Record transaction
  await sb.from("credit_transactions").insert({
    tenant_id: tenantId || undefined,
    user_type: userType,
    user_id: userId,
    amount: -cost,
    reason: action,
    reference_id: propertyId || undefined,
  });

  // Apply promotion
  if (action === "promote_listing" && propertyId) {
    const promotedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from("properties")
      .update({ promoted_until: promotedUntil, promoted_by: userId })
      .eq("id", propertyId);
  }

  return NextResponse.json({
    success: true,
    credits: profile.credits - cost,
    action,
    cost,
  });
}
