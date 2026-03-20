"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { formatPrice, getHeroImage } from "@/lib/utils";
import { useSavedListings } from "@/app/hooks/useSavedListings";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
  appointment?: { success: boolean; error?: string };
  filters?: Record<string, unknown>;
}

// ── Inline property card ─────────────────────────────────────────────────────
function ChatPropertyCard({ property }: { property: Property }) {
  const hero = getHeroImage(property.images);
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(property.id);

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <button
        onClick={() => toggle(property.id)}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-110"
      >
        <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: saved ? "#ef4444" : "#94a3b8" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link href={`/properties/${property.id}`}>
        <div className="relative h-36 bg-slate-100 overflow-hidden">
          {hero ? (
            <Image src={hero} alt={property.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="300px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}>
              {property.listing_type === "buy" ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-bold text-slate-900 text-sm">
            {formatPrice(property.price, property.currency)}
            {property.listing_type === "rent" && <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{property.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {property.neighbourhood ? `${property.neighbourhood}, ` : ""}{property.city}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            {property.bedrooms > 0 && <span>{property.bedrooms} bd</span>}
            {property.bathrooms > 0 && <span>{property.bathrooms} ba</span>}
            {property.area_sqm && <span>{property.area_sqm} m²</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Appointment card ─────────────────────────────────────────────────────────
function AppointmentCard({ result }: { result: { success: boolean; error?: string } }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
        Could not save appointment: {result.error || "Unknown error"}
      </div>
    );
  }
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-emerald-800">Viewing request sent!</p>
        <p className="text-xs text-emerald-600 mt-0.5">We&apos;ll confirm by email shortly.</p>
      </div>
    </div>
  );
}

// ── Follow-up chips ──────────────────────────────────────────────────────────
function FollowUpChips({ msg, onSend }: { msg: ChatMessage; onSend: (text: string) => void }) {
  const chips: string[] = [];
  if (msg.properties && msg.properties.length > 0) {
    chips.push("Schedule a viewing");
    chips.push("Show cheaper options");
    chips.push("Show larger properties");
  } else if (msg.properties && msg.properties.length === 0) {
    chips.push("Show all listings");
    chips.push("Increase budget");
    chips.push("Try a different city");
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip) => (
        <button key={chip} onClick={() => onSend(chip)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 font-medium hover:border-slate-300 hover:bg-slate-50 transition-all">
          {chip}
        </button>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const pathname  = usePathname();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const currentProperty = pathname?.startsWith("/properties/")
      ? pathname.replace("/properties/", "") : undefined;

    try {
      const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: currentProperty ? { currentProperty } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages([...newMessages, { role: "assistant", content: `⚠️ Error: ${data.error || `HTTP ${res.status}`}` }]);
        return;
      }
      setMessages([...newMessages, {
        role: "assistant",
        content: data.reply ?? "",
        properties: data.properties !== undefined ? data.properties : undefined,
        appointment: data.appointment,
        filters: data.filters,
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages([...newMessages, { role: "assistant", content: `⚠️ Connection error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function renderText(text: string) {
    const parts = text.split(/(\[.*?\]\(\/properties\/[^)]+\))/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[(.+?)\]\((\/properties\/[^)]+)\)$/);
      if (m) return <Link key={i} href={m[2]} className="underline font-semibold" style={{ color: "var(--color-primary)" }}>{m[1]}</Link>;
      return <span key={i}>{part}</span>;
    });
  }

  const suggestions = [
    { icon: "🏠", text: "Show apartments for rent" },
    { icon: "💰", text: "What's available under $300k?" },
    { icon: "🛏️", text: "I need a 3-bedroom home" },
    { icon: "📅", text: "Book a property viewing" },
  ];

  const hasMessages = messages.length > 0;

  return (
    <main className="flex flex-col" style={{ minHeight: "calc(100vh - 64px - 60px)" }}>

      {/* ── Empty / Hero state ── */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

          {/* Headline */}
          <div className="text-center max-w-xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              AI-Powered Real Estate
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
              Find your perfect<br />
              <span style={{ color: "var(--color-primary)" }}>home with AI</span>
            </h1>
            <p className="text-slate-500 text-lg">
              Describe what you&apos;re looking for in plain language — I&apos;ll find matching properties and book viewings for you.
            </p>
          </div>

          {/* Main input bar */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-end gap-3 bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 focus-within:border-primary transition-all shadow-lg focus-within:shadow-xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 3-bedroom apartment near the city centre under $400k..."
                rows={1}
                className="flex-1 bg-transparent text-base text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-300 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>

          {/* Suggestion chips */}
          <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
            {suggestions.map((s) => (
              <button key={s.text} onClick={() => sendMessage(s.text)}
                className="flex items-center gap-3 text-left px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:shadow-sm hover:border-slate-300 transition-all text-sm text-slate-600 font-medium">
                <span className="text-base">{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>

          {/* Subtle agent link */}
          <p className="text-xs text-slate-300 mt-8">
            Are you a property agent?{" "}
            <Link href="/admin" className="underline hover:text-slate-500 transition-colors">
              Go to dashboard →
            </Link>
          </p>
        </div>
      )}

      {/* ── Message thread ── */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                    AI
                  </div>
                )}
                <div className="flex flex-col gap-3 max-w-[85%]">
                  {msg.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                    }`} style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : {}}>
                      {msg.role === "assistant" ? renderText(msg.content) : msg.content}
                    </div>
                  )}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ maxWidth: "520px" }}>
                      {msg.properties.map((p) => <ChatPropertyCard key={p.id} property={p} />)}
                    </div>
                  )}
                  {msg.appointment && <AppointmentCard result={msg.appointment} />}
                  {msg.role === "assistant" && i === messages.length - 1 && !loading && (
                    <FollowUpChips msg={msg} onSend={sendMessage} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  AI
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

      {/* ── Input bar (chat mode) ── */}
      {hasMessages && (
        <div className="border-t border-slate-200 bg-white py-4 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about properties..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-300 mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </main>
  );
}
