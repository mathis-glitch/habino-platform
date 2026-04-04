"use client";

import { useState, useRef, useEffect } from "react";

const G  = "#2D6A4F";
const GL = "rgba(45,106,79,0.09)";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIPanelProps {
  /** Title shown in the header */
  title: string;
  /** Subtitle / tagline in the header */
  subtitle: string;
  /** Placeholder text for the input */
  placeholder: string;
  /** Quick-suggestion chips shown before the first message */
  suggestions: string[];
  /**
   * If provided, the panel calls /api/chat with this extra context and
   * streams responses (property / broker context mode).
   * If omitted, the panel still works and calls /api/chat without context.
   */
  context?: Record<string, string>;
  /**
   * Optional callback: fires with the typed/selected query every time the
   * user submits. Useful for local filtering (services, broker search) IN
   * ADDITION to the AI response.
   */
  onSearch?: (query: string) => void;
  /** Reset the search filter when input is cleared */
  onClear?: () => void;
}

export function AIPanel({
  title, subtitle, placeholder, suggestions,
  context, onSearch, onClear,
}: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    setInput("");
    onSearch?.(query);

    const next: Message[] = [...messages, { role: "user", content: query }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });

      if (!res.ok || !res.body) throw new Error("Network error");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.t) { full += p.t; setMessages([...next, { role: "assistant", content: full }]); }
          } catch { /* ignore */ }
        }
      }

      if (!full) setMessages([...next, { role: "assistant", content: "Keine Antwort — bitte erneut versuchen." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Verbindungsfehler. Bitte nochmal versuchen." }]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setInput("");
    setMessages([]);
    onClear?.();
  }

  const font = "'Inter',-apple-system,sans-serif";

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      overflow: "hidden",
      fontFamily: font,
    }}>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`,
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: loading ? "#FF9F0A" : "#34C759",
          }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
            {loading ? "Thinking…" : "Online"}
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: 220, overflowY: "auto",
          padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", gap: 8,
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
            }}>
              {m.role === "assistant" && (
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: G, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, color: "#fff",
                }}>
                  AI
                </div>
              )}
              <div style={{
                maxWidth: "80%", padding: "8px 12px", borderRadius: 14,
                fontSize: 13, lineHeight: 1.6,
                background: m.role === "user" ? G : "#F3F4F6",
                color: m.role === "user" ? "#fff" : "#1A1A2E",
                borderTopLeftRadius: m.role === "assistant" ? 4 : 14,
                borderTopRightRadius: m.role === "user" ? 4 : 14,
                whiteSpace: "pre-wrap",
              }}>
                {m.content || (
                  <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 150, 300].map(d => (
                      <span key={d} style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#9CA3AF",
                        animation: "aipulse 1s ease-in-out infinite",
                        animationDelay: `${d}ms`,
                        display: "inline-block",
                      }} />
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Suggestions (before first message) ── */}
      {messages.length === 0 && (
        <div style={{ padding: "10px 14px 0", display: "flex", gap: 7, flexWrap: "wrap" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: "5px 11px", borderRadius: 20,
              border: "1px solid rgba(45,106,79,0.25)",
              background: GL, color: G,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font,
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={{ padding: "10px 14px 14px", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent", fontSize: 13, color: "#1A1A2E", fontFamily: font,
          }}
        />
        {input ? (
          <button onClick={() => send()} disabled={loading} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: loading ? "#9CA3AF" : G,
            border: "none", cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        ) : messages.length > 0 ? (
          <button onClick={clear} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", padding: 4, display: "flex",
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <style>{`
        @keyframes aipulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}
