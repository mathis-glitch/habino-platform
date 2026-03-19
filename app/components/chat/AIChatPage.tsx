"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const pathname  = usePathname();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text?: string) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const currentProperty = pathname?.startsWith("/properties/")
      ? pathname.replace("/properties/", "")
      : undefined;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: currentProperty ? { currentProperty } : undefined,
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Entschuldigung, keine Antwort erhalten." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Verbindungsfehler. Bitte erneut versuchen." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderContent(text: string) {
    const parts = text.split(/(\[.*?\]\(\/properties\/[^)]+\)|\/properties\/[a-z0-9-]+)/g);
    return parts.map((part, i) => {
      const mdMatch = part.match(/^\[(.+?)\]\((\/properties\/[^)]+)\)$/);
      if (mdMatch) {
        return (
          <Link key={i} href={mdMatch[2]} className="underline font-semibold" style={{ color: "var(--color-primary)" }}>
            {mdMatch[1]}
          </Link>
        );
      }
      const bareMatch = part.match(/^(\/properties\/[a-z0-9-]+)$/);
      if (bareMatch) {
        return (
          <Link key={i} href={bareMatch[1]} className="underline font-semibold" style={{ color: "var(--color-primary)" }}>
            Zum Inserat →
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  const suggestions = [
    { icon: "🏠", text: "Zeig mir Wohnungen zur Miete" },
    { icon: "💰", text: "Was gibt es unter 300.000 €?" },
    { icon: "📍", text: "3-Zimmer-Haus gesucht" },
    { icon: "📊", text: "Wie ist die aktuelle Marktlage?" },
  ];

  const hasMessages = messages.length > 0;

  return (
    <main className="flex flex-col" style={{ minHeight: "calc(100vh - 64px - 60px)" }}>

      {/* Centered intro when empty */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Ihr KI-Immobilienmakler
          </h1>
          <p className="text-slate-500 text-base max-w-md mb-10">
            Beschreiben Sie, was Sie suchen — ich kenne alle aktuellen Inserate und helfe Ihnen, das Richtige zu finden.
          </p>

          {/* Quick-start chips */}
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full mb-10">
            {suggestions.map((s) => (
              <button key={s.text} onClick={() => sendMessage(s.text)}
                className="flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border border-slate-200 bg-white hover:border-primary hover:shadow-sm transition-all text-sm text-slate-700 font-medium">
                <span className="text-lg">{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                    KI
                  </div>
                )}

                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm ml-auto"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                }`}
                  style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : {}}>
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  KI
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Input bar — always at bottom */}
      <div className="border-t border-slate-200 bg-white py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Was suchen Sie? z.B. 3-Zimmer-Wohnung unter 500 € ..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 active:scale-95 shadow-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-300 mt-2">Enter zum Senden · Shift+Enter für neue Zeile</p>
        </div>
      </div>

    </main>
  );
}
