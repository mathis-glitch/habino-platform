"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Conversation, Message } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Derive display name from conversation (we don't have profile data in the list)
function convTitle(conv: Conversation, userId: string): string {
  if (conv.property?.title) return conv.property.title;
  return conv.participant_a === userId ? "Conversation" : "Conversation";
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyConversations() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: "var(--surface2)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <svg width="24" height="24" fill="none" stroke="var(--text-3)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>No messages yet</h3>
      <p style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 260, lineHeight: 1.6 }}>
        When you contact an agent or inquire about a property, your conversations will appear here.
      </p>
    </div>
  );
}

// ── Conversation list item ─────────────────────────────────────────────────────
function ConvItem({
  conv, userId, isActive, onClick,
}: {
  conv: Conversation;
  userId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const unread = conv.participant_a === userId ? conv.unread_a : conv.unread_b;
  const title  = conv.property?.title ?? "Property Inquiry";
  const sub    = conv.property
    ? `${conv.property.neighbourhood ?? conv.property.city ?? "Addis Abeba"}`
    : "General inquiry";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "14px 20px",
        background: isActive ? "rgba(124,110,242,0.08)" : "transparent",
        borderBottom: "1px solid var(--border)",
        borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
        cursor: "pointer", transition: "background 0.12s",
        display: "flex", gap: 12, alignItems: "flex-start",
        border: "none",
      }}
    >
      {/* Avatar placeholder */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, color: "#fff",
      }}>
        {title.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{
            fontSize: 14, fontWeight: unread > 0 ? 700 : 500,
            color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
            {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{
            fontSize: 13, color: "var(--text-2)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontWeight: unread > 0 ? 500 : 400,
          }}>
            {conv.last_message ?? "No messages yet"}
          </span>
          {unread > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, flexShrink: 0,
              background: "var(--color-primary)", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Chat thread ────────────────────────────────────────────────────────────────
function ChatThread({
  conv, messages, userId, onSend, sending,
}: {
  conv: Conversation;
  messages: Message[];
  userId: string;
  onSend: (text: string) => Promise<void>;
  sending: boolean;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    await onSend(text);
  };

  const title = conv.property?.title ?? "Property Inquiry";
  const sub   = conv.property
    ? `${conv.property.city ?? "Addis Abeba"} · ${conv.property.neighbourhood ?? ""}`
    : "General";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
        background: "var(--surface2)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff",
        }}>
          {title.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 24px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Start the conversation…</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: isOwn ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "70%", padding: "10px 14px", borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isOwn ? "var(--color-primary)" : "var(--surface2)",
                  color: isOwn ? "#fff" : "var(--text-1)",
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}>
                  <p style={{ margin: 0 }}>{msg.body}</p>
                  <p style={{
                    margin: "4px 0 0",
                    fontSize: 10, opacity: 0.65, textAlign: "right",
                  }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid var(--border)",
        background: "var(--surface2)",
        display: "flex", gap: 10, alignItems: "flex-end",
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1, resize: "none",
            padding: "10px 14px", borderRadius: 20,
            background: "var(--surface3)", border: "1px solid var(--border2)",
            color: "var(--text-1)", fontSize: 14,
            outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: draft.trim() ? "var(--color-primary)" : "var(--surface3)",
            border: "none", cursor: draft.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" fill="none" stroke={draft.trim() ? "#fff" : "var(--text-3)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Fake userId — in production this would come from Supabase auth context
  // The component works without it; messages sent will 401 if not auth'd
  const [userId, setUserId] = useState<string>("");

  // Fetch user id from session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user?.id) setUserId(d.user.id); })
      .catch(() => {});
  }, []);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
      else setError(data.error ?? "Failed to load conversations");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);

    fetch(`/api/messages/${activeConvId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  const handleSend = async (text: string) => {
    if (!activeConvId) return;
    setSending(true);
    try {
      const res  = await fetch(`/api/messages/${activeConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        // Update last_message in conv list
        setConversations((prev) => prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        ));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Sidebar — conversation list */}
      <div style={{
        width: 340, flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        background: "var(--surface)",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface2)",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
            Messages
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 72, borderRadius: 10, marginBottom: 8,
                background: "var(--surface2)", animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--err)" }}>{error}</p>
            <button onClick={fetchConversations} style={{
              marginTop: 12, padding: "8px 16px", borderRadius: 8,
              background: "var(--color-primary)", color: "#fff", border: "none",
              fontSize: 13, cursor: "pointer",
            }}>Retry</button>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyConversations />
        ) : (
          conversations.map((conv) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              userId={userId}
              isActive={conv.id === activeConvId}
              onClick={() => setActiveConvId(conv.id)}
            />
          ))
        )}
      </div>

      {/* Chat panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--surface)", minWidth: 0 }}>
        {activeConv && userId ? (
          <ChatThread
            conv={activeConv}
            messages={messages}
            userId={userId}
            onSend={handleSend}
            sending={sending}
          />
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 48, textAlign: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "var(--surface2)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <svg width="28" height="28" fill="none" stroke="var(--text-3)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>
              Select a conversation
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 280, lineHeight: 1.6 }}>
              Choose a conversation from the list to read your messages and continue the discussion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
