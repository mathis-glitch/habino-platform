import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/messages — list conversations for the current user
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      property:properties(id, title, city, neighbourhood, price, currency, images:property_images(url, sort_order))
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

// POST /api/messages — create or get conversation, then send first message
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId?.trim()) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { property_id, recipient_id, message } = body;

  if (!recipient_id || !message?.trim()) {
    return NextResponse.json({ error: "recipient_id and message are required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Upsert conversation (requester is always participant_a)
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .upsert(
      {
        tenant_id: tenantId,
        property_id: property_id ?? null,
        participant_a: user.id,
        participant_b: recipient_id,
      },
      { onConflict: "tenant_id,property_id,participant_a,participant_b", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

  // Insert message
  const { data: msg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body: message.trim(),
      message_type: "text",
    })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ conversation: conv, message: msg }, { status: 201 });
}
