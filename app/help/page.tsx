"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ = [
  { q: "How do I search for properties?", a: "Use the AI chat and describe what you need in plain language — for example, '2-bedroom apartment in Bole under 40,000 ETB'. Habino finds matching listings and places them on the map." },
  { q: "How do I contact an agent?", a: "Click any listing to see the agent card. Tap 'WhatsApp' to open a direct chat. No account is required to contact agents." },
  { q: "How do I list my property?", a: "Open the AI chat and type 'List my property'. The step-by-step wizard guides you through all details. Listings go live immediately after confirmation." },
  { q: "Is Habino free?", a: "Yes — searching and browsing is free. Listing a property is also free during our launch period." },
  { q: "Which areas does Habino cover?", a: "Habino currently covers Addis Ababa and its surroundings — Bole, Kazanchis, Megenagna, Ayat, Piassa, Arat Kilo, and more." },
  { q: "Can I save listings?", a: "Tap the heart icon on any listing to save it. Find your saved properties under My Account in the menu." },
  { q: "How do I generate a rental contract?", a: "Open the AI chat and type 'Draft a rental contract'. The wizard collects the landlord, tenant, and property details, then generates a professional contract." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit. We use Supabase with row-level security — users can only access their own data. We never sell personal data." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/explore" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Help Center</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mb-6">Everything you need to know about Habino.</p>

        <div className="space-y-px rounded-2xl overflow-hidden border border-slate-200 bg-white">
          {FAQ.map((item, i) => (
            <div key={i} className={i < FAQ.length - 1 ? "border-b border-slate-100" : ""}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors gap-4"
              >
                <span className="text-sm font-medium text-slate-800">{item.q}</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  className="shrink-0 mt-0.5 transition-transform text-slate-400"
                  style={{ transform: open === i ? "rotate(180deg)" : "none" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{item.a}</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Still need help?</p>
          <p className="text-sm text-slate-500 mb-4">Our team is available Monday–Friday, 9am–6pm EAT.</p>
          <a href="mailto:support@habino.com"
            className="inline-block text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Email support
          </a>
        </div>
      </div>
    </div>
  );
}
