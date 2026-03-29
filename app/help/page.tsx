"use client";

import { useState } from "react";
import Link from "next/link";

const TOPICS = [
  { icon: "👤", label: "Account",   count: 6,  id: "account" },
  { icon: "🏠", label: "Listings",  count: 8,  id: "listings" },
  { icon: "📄", label: "Contracts", count: 5,  id: "contracts" },
  { icon: "🔒", label: "Security",  count: 4,  id: "security" },
  { icon: "💬", label: "Chat & AI", count: 7,  id: "chat" },
  { icon: "⚙️", label: "Technical", count: 9,  id: "technical" },
];

const FAQ = [
  { q: "How do I search for properties?", a: "Use the AI chat and describe what you need in plain language — for example, '2-bedroom apartment in Bole under 40,000 ETB'. Habino finds matching listings and places them on the map.", topic: "chat" },
  { q: "How do I contact an agent?", a: "Click any listing to see the agent card. Tap 'WhatsApp' to open a direct chat. No account is required to contact agents.", topic: "listings" },
  { q: "How do I list my property?", a: "Open the AI chat and type 'List my property'. The step-by-step wizard guides you through all details. Listings go live immediately after confirmation.", topic: "listings" },
  { q: "Is Habino free?", a: "Yes — searching and browsing is free. Listing a property is also free during our launch period.", topic: "account" },
  { q: "Which areas does Habino cover?", a: "Habino currently covers Addis Ababa and its surroundings — Bole, Kazanchis, Megenagna, Ayat, Piassa, Arat Kilo, and more.", topic: "listings" },
  { q: "Can I save listings?", a: "Tap the bookmark icon on any listing to save it. Find your saved properties under My Account in the menu.", topic: "account" },
  { q: "How do I generate a rental contract?", a: "Open the AI chat and type 'Draft a rental contract'. The wizard collects the landlord, tenant, and property details, then generates a professional contract.", topic: "contracts" },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit. We use Supabase with row-level security — users can only access their own data. We never sell personal data.", topic: "security" },
];

export default function HelpPage() {
  const [open,          setOpen]          = useState<number | null>(null);
  const [activeTopic,   setActiveTopic]   = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");

  const filtered = FAQ.filter((item) => {
    const matchesTopic = !activeTopic || item.topic === activeTopic;
    const matchesSearch = !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Sticky top bar ─────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Help Center</span>
      </div>

      {/* ── Search hero ────────────────────────────────── */}
      <div
        className="px-4 pt-10 pb-12 flex flex-col items-center gap-5"
        style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}
      >
        <div className="text-center">
          <h1 className="text-[22px] font-bold text-white">How can we help?</h1>
          <p className="text-[14px] text-white/60 mt-1">Search or browse topics below</p>
        </div>
        <div className="relative w-full max-w-md">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setOpen(null); }}
            className="w-full h-12 pl-11 pr-4 bg-white rounded-xl text-[15px] text-slate-900 placeholder-slate-400 outline-none border-0"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">

        {/* ── Topic chips ─────────────────────────────── */}
        {!searchQuery && (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">Browse by topic</p>
            <div className="grid grid-cols-3 gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(activeTopic === t.id ? null : t.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all"
                  style={{
                    backgroundColor: activeTopic === t.id ? "var(--color-primary-light)" : "white",
                    borderColor: activeTopic === t.id ? "var(--color-primary)" : "#E2E8F0",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <span className="text-[20px] leading-none">{t.icon}</span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: activeTopic === t.id ? "var(--color-primary)" : "#334155" }}
                  >
                    {t.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{t.count} articles</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ accordion ────────────────────────────── */}
        <div className="mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">
            {activeTopic
              ? `${TOPICS.find((t) => t.id === activeTopic)?.label ?? ""} questions`
              : searchQuery
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
              : "Popular questions"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-[16px] font-semibold text-slate-800">No results found</p>
            <p className="text-[13px] text-slate-400 mt-1.5">Try different keywords or browse by topic.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveTopic(null); }}
              className="mt-4 text-[13px] font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
            {filtered.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors gap-4"
                >
                  <span className="text-[14px] font-medium text-slate-800">{item.q}</span>
                  <svg
                    width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                    className="shrink-0 mt-0.5 text-slate-400 transition-transform"
                    style={{ transform: open === i ? "rotate(180deg)" : "none" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-[14px] text-slate-500 leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Contact CTA ──────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
          <div className="px-5 py-4">
            <p className="text-[15px] font-semibold text-slate-800">Still need help?</p>
            <p className="text-[13px] text-slate-500 mt-0.5">Mon – Fri, 9am – 6pm EAT</p>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-800">Email Support</p>
              <p className="text-[12px] text-slate-400">Response within 24 hours</p>
            </div>
            <a
              href="mailto:support@habino.com"
              className="h-9 px-4 rounded-xl text-white text-[13px] font-semibold flex items-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Email us
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
