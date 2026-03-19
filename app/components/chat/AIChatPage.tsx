"use client";

import { useState, useRef, useEffect } from "react";
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
}

// ── Inline property card ────────────────────────────────────────────────────
function ChatPropertyCard({ property }: { property: Property }) {
  const hero = getHeroImage(property.images);
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(property.id);

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Save button */}
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
        {/* Image */}
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
              {property.listing_type === "buy" ? "Kaufen" : "Mieten"}
            </span>
          </div>
        </div>

        {/* Info */}
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
            {property.bedrooms > 0 && <span>{property.bedrooms} Zi.</span>}
            {property.bathrooms > 0 && <span>{property.bathrooms} Bad</span>}
            {property.area_sqm && <span>{property.area_sqm} m²</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Appointment confirmation card ────────────────────────────────────────────
function AppointmentCard({ result }: { result: { success: boolean; error?: string } }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
        Termin konnte nicht gespeichert werden: {result.error || "Unbekannter Fehler"}
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
        <p className="text-sm font-semibold text-emerald-800">Termin angefragt!</p>
        <p className="text-xs text-emerald-600 mt-0.5">Wir melden uns per E-Mail zur Bestätigung.</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text?: string) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const currentProperty = pathname?.startsWith("/properties/")
      ? pathname.replace("/properties/", "") : undefined;

    try {
      // Send only role+content to the API (strip UI-only fields)
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

      setMessages([...newMessages, {
        role: "assistant",
        content: data.reply || "Entschuldigung, keine Antwort erhalten.",
        properties: data.properties?.length ? data.properties : undefined,
        appointment: data.appointment,
      }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Verbindungsfehler. Bitte erneut versuchen." }]);
    } finally {
      setLoading(false);
    }
  }

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
    { icon: "🏠", text: "Wohnungen zur Miete zeigen" },
    { icon: "💰", text: "Was gibt es unter 300.000 €?" },
    { icon: "🛏️", text: "3-Zimmer-Wohnung gesucht" },
    { icon: "📅", text: "Ich möchte eine Besichtigung buchen" },
  ];

  const hasMessages = messages.length > 0;

  return (
    <main className="flex flex-col" style={{ minHeight: "calc(100vh - 64px - 60px)" }}>

      {/* ── Empty state ── */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Ihr KI-Immobilienmakler</h1>
          <p className="text-slate-500 text-base max-w-md mb-10">
            Beschreiben Sie, was Sie suchen — ich finde passende Inserate und buche Besichtigungen direkt für Sie.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
            {suggestions.map((s) => (
              <button key={s.text} onClick={() => sendMessage(s.text)}
                className="flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition-all text-sm text-slate-700 font-medium hover:border-primary">
                <span className="text-lg">{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>
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
                    KI
                  </div>
                )}

                <div className="flex flex-col gap-3 max-w-[85%]">
                  {/* Text bubble */}
                  {msg.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                    }`}
                      style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : {}}>
                      {msg.role === "assistant" ? renderText(msg.content) : msg.content}
                    </div>
                  )}

                  {/* Inline property cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.properties.map((p) => (
                        <ChatPropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                  )}

                  {/* Appointment confirmation */}
                  {msg.appointment && <AppointmentCard result={msg.appointment} />}
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

      {/* ── Input bar ── */}
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
