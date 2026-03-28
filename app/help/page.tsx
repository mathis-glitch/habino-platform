"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ = [
  {
    q: "How do I search for properties?",
    a: "Use the AI search bar and describe what you need in plain language — for example, '2-bedroom apartment in Bole under 40,000 ETB'. Habino will find matching listings and show them on the map.",
  },
  {
    q: "How do I contact an agent?",
    a: "Click any property listing to see the agent's details. Tap the WhatsApp button to open a chat with them directly. No registration is required to contact agents.",
  },
  {
    q: "How do I list my property?",
    a: "Open the AI chat and type 'List my property'. The guided wizard will walk you through adding all the details. Listings are published immediately after confirmation.",
  },
  {
    q: "Is Habino free to use?",
    a: "Yes — browsing and searching listings on Habino is completely free. Listing a property is also free during our launch period.",
  },
  {
    q: "Which areas does Habino cover?",
    a: "Habino currently focuses on Addis Ababa and its surroundings, including all major neighbourhoods such as Bole, Kazanchis, Megenagna, Ayat, Piassa, and Arat Kilo.",
  },
  {
    q: "Can I save listings I like?",
    a: "Yes. Tap the heart icon on any listing to save it. You can view all your saved properties in the Saved section from the menu.",
  },
  {
    q: "How do I generate a rental contract?",
    a: "Open the AI chat and type 'Draft a rental contract'. The wizard will guide you through providing the landlord, tenant, and property details, then generate a professional contract.",
  },
  {
    q: "Is my data safe with Habino?",
    a: "Yes. Habino uses Supabase with row-level security and encryption in transit. We never sell your personal data. See our Privacy Policy for full details.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">Help Center</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mb-6">Everything you need to know about Habino.</p>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800 pr-4">{item.q}</span>
                <svg
                  width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  className="shrink-0 transition-transform"
                  style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)", color: "#94a3b8" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3 bg-slate-50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-slate-100 bg-slate-50 text-center">
          <p className="text-sm font-semibold text-slate-800 mb-1">Still need help?</p>
          <p className="text-xs text-slate-500 mb-3">Our team is available via WhatsApp or email.</p>
          <a
            href="mailto:support@habino.com"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
