"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AgentChat() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const pathname  = usePathname();

  // Don't show on admin pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function sendMessage(text?: string) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setGreeting(false);

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    // Get context from current page
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
      const reply = data.reply || "Sorry, I couldn't generate a response.";

      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
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

  const suggestions = [
    "Show me apartments for rent",
    "What's available under $200k?",
    "Find me a 3-bedroom house",
  ];

  function renderContent(text: string) {
    // Convert /properties/[id] links to clickable anchors
    const parts = text.split(/(\[.*?\]\(\/properties\/[^)]+\)|\/properties\/[a-z0-9-]+)/g);
    return parts.map((part, i) => {
      // Markdown link: [Title](/properties/id)
      const mdMatch = part.match(/^\[(.+?)\]\((\/properties\/[^)]+)\)$/);
      if (mdMatch) {
        return (
          <a key={i} href={mdMatch[2]} className="underline font-medium" style={{ color: "var(--color-primary)" }}
            onClick={() => setOpen(false)}>
            {mdMatch[1]}
          </a>
        );
      }
      // Bare /properties/id
      const bareMatch = part.match(/^(\/properties\/[a-z0-9-]+)$/);
      if (bareMatch) {
        return (
          <a key={i} href={bareMatch[1]} className="underline font-medium" style={{ color: "var(--color-primary)" }}
            onClick={() => setOpen(false)}>
            View property
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 text-white shrink-0"
            style={{ backgroundColor: "var(--color-secondary)" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Property Assistant</p>
              <p className="text-xs text-white/60">AI-powered · Ask me anything</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/60">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

            {/* Welcome + suggestions */}
            {greeting && messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    AI
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-slate-700 max-w-[80%]">
                    Hi! I'm your property assistant. I can help you find listings, answer questions about the market, and guide your search. What are you looking for?
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-9">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-left text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors bg-white">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    AI
                  </div>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-slate-100 text-slate-700 rounded-tl-sm"
                }`}
                  style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : {}}>
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  AI
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about properties..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "80px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
