"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Conversation, Message } from "@/lib/types";

// Light-mode tokens — forest green CI
const T = {
  bg:      "#FFFFFF",
  bgSoft:  "#F7F7F7",
  bgSoft2: "#F0F2F0",
  border:  "rgba(0,0,0,0.07)",
  border2: "rgba(0,0,0,0.11)",
  text1:   "#1A1A2E",
  text2:   "#6B7280",
  text3:   "#9CA3AF",
  primary: "#2D6A4F",
  primaryL:"rgba(45,106,79,0.10)",
  ok:      "#34C759",
  err:     "#FF453A",
  font:    "'Inter',-apple-system,sans-serif",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Conversation list item ─────────────────────────────────────────────────────
function ConvItem({ conv, userId, isActive, onClick }: {
  conv: Conversation; userId: string; isActive: boolean; onClick: () => void;
}) {
  const unread = conv.participant_a === userId ? conv.unread_a : conv.unread_b;
  const title  = conv.property?.title ?? "Property Inquiry";
  const sub    = conv.property
    ? `${conv.property.neighbourhood ?? conv.property.city ?? "Addis Abeba"}`
    : "General inquiry";
  const initial = title.charAt(0).toUpperCase();

  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      padding: "14px 18px",
      background: isActive ? T.primaryL : "transparent",
      borderBottom: `1px solid ${T.border}`,
      borderLeft: `3px solid ${isActive ? T.primary : "transparent"}`,
      cursor: "pointer", transition: "background 0.12s",
      display: "flex", gap: 12, alignItems: "flex-start",
      border: "none",
    }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: isActive ? T.primary : T.bgSoft2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, fontWeight: 700, color: isActive ? "#fff" : T.primary,
      }}>
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
          <span style={{
            fontSize: 14, fontWeight: unread > 0 ? 700 : 600,
            color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </span>
          <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>
            {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.text3, marginBottom: 3 }}>{sub}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 13, color: T.text2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontWeight: unread > 0 ? 600 : 400,
          }}>
            {conv.last_message ?? "No messages yet"}
          </span>
          {unread > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, flexShrink: 0,
              background: T.primary, color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px", marginLeft: 6,
            }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Chat Thread ────────────────────────────────────────────────────────────────
function ChatThread({ conv, messages, userId, onSend, sending, onBack }: {
  conv: Conversation; messages: Message[];
  userId: string; onSend: (text: string) => Promise<void>;
  sending: boolean; onBack: () => void;
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
    ? `${conv.property.neighbourhood ?? conv.property.city ?? "Addis Abeba"}`
    : "General";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, minHeight: 0 }}>
      {/* Thread header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 18px", background: T.bg,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.bgSoft, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.text1, flexShrink: 0,
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: T.primary, flexShrink: 0 }}>
          {title.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          <div style={{ fontSize: 11, color: T.text3 }}>{sub}</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.ok, flexShrink: 0 }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: T.bgSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="22" height="22" fill="none" stroke={T.text3} strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 13, color: T.text3 }}>Start the conversation…</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px",
                  borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isOwn ? T.primary : T.bgSoft,
                  color: isOwn ? "#fff" : T.text1,
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  <p style={{ margin: 0 }}>{msg.body}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.6, textAlign: "right" }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "10px 14px", borderTop: `1px solid ${T.border}`, background: T.bg,
        display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0,
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1, resize: "none", padding: "10px 14px", borderRadius: 20,
            background: T.bgSoft, border: `1px solid ${T.border2}`,
            color: T.text1, fontSize: 14, outline: "none",
            lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
            fontFamily: T.font,
          }}
        />
        <button onClick={handleSend} disabled={!draft.trim() || sending} style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: draft.trim() ? T.primary : T.bgSoft2,
          border: "none", cursor: draft.trim() ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}>
          <svg width="18" height="18" fill="none" stroke={draft.trim() ? "#fff" : T.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MessagesClient() {
  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [userId,         setUserId]         = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user?.id) setUserId(d.user.id); })
      .catch(() => {});
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch { /* ok */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

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
        setConversations((prev) => prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        ));
      }
    } finally { setSending(false); }
  };

  // Auth gate — not logged in
  if (!loading && !userId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(45,106,79,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="28" height="28" fill="none" stroke="#2D6A4F" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text1, marginBottom: 8, letterSpacing: -0.4 }}>Sign in to view messages</h2>
        <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, maxWidth: 280, marginBottom: 28 }}>
          Your conversations with brokers and agents are private. Sign in to access them.
        </p>
        <a href="/auth/signup" style={{
          display: "block", width: "100%", maxWidth: 280,
          padding: "13px 0", borderRadius: 14,
          background: "#2D6A4F", color: "#fff",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
          marginBottom: 10,
        }}>
          Create account
        </a>
        <a href="/auth/login" style={{
          display: "block", width: "100%", maxWidth: 280,
          padding: "13px 0", borderRadius: 14,
          background: "rgba(45,106,79,0.08)", color: "#2D6A4F",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
          border: "1.5px solid rgba(45,106,79,0.18)",
        }}>
          Sign in
        </a>
      </div>
    );
  }

  // Mobile: show thread if active, otherwise show list
  if (activeConv && userId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <ChatThread
          conv={activeConv}
          messages={messages}
          userId={userId}
          onSend={handleSend}
          sending={sending}
          onBack={() => setActiveConvId(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font }}>

      {/* Header */}
      <div style={{ padding: "52px 20px 16px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill={T.primary} />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: T.primary, letterSpacing: -0.5 }}>habino</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text1, letterSpacing: -0.6 }}>Messages</h1>
        <p style={{ fontSize: 13, color: T.text3, marginTop: 2 }}>
          {loading ? "Loading…" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 14, background: T.bgSoft }} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: T.bgSoft2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="24" height="24" fill="none" stroke={T.text3} strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 6 }}>No agent messages yet</h3>
            <p style={{ fontSize: 13, color: T.text2, maxWidth: 260, lineHeight: 1.6, marginBottom: 20 }}>
              When you contact a broker or inquire about a property, your conversations will appear here.
            </p>
            <a href="/explore" style={{
              padding: "10px 22px", borderRadius: 12,
              background: T.primary, color: "#fff",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              Browse properties
            </a>
          </div>
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
    </div>
  );
}
