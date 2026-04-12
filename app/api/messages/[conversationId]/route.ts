import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { sendNewMessageEmail } from "@/lib/email";

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

// GET /api/messages/[conversationId] — load messages in a conversation
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = params;
  const supabase = createServiceClient();

  // Verify user is a participant
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .single();

  if (convErr || !conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread messages from the other participant as read
  const unreadField = conv.participant_a === user.id ? "unread_a" : "unread_b";
  await supabase
    .from("conversations")
    .update({ [unreadField]: 0 })
    .eq("id", conversationId);

  return NextResponse.json({ messages: messages ?? [] });
}

// POST /api/messages/[conversationId] — send a message in existing conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = params;
  const body = await request.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: message.trim(),
      message_type: "text",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the other participant via email (non-blocking)
  const recipientId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
  if (recipientId) {
    (async () => {
      try {
        const { data: recipient } = await supabase
          .from("profiles").select("email, full_name").eq("id", recipientId).single();
        const { data: sender } = await supabase
          .from("profiles").select("full_name").eq("id", user.id).single();
        // Get property title from conversation
        const { data: convFull } = await supabase
          .from("conversations").select("property_id").eq("id", conversationId).single();
        let propertyTitle = "a property";
        if (convFull?.property_id) {
          const { data: prop } = await supabase
            .from("properties").select("title").eq("id", convFull.property_id).single();
          if (prop?.title) propertyTitle = prop.title;
        }
        if (recipient?.email) {
          await sendNewMessageEmail({
            agentEmail:     recipient.email,
            agentName:      recipient.full_name ?? undefined,
            senderName:     sender?.full_name ?? user.email ?? "A user",
            propertyTitle,
            messagePreview: message.trim().slice(0, 120),
          });
        }
      } catch { /* non-blocking */ }
    })();
  }

  return NextResponse.json({ message: msg }, { status: 201 });
}
