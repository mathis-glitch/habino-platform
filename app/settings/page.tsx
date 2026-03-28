"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("ETB");
  const [notifications, setNotifications] = useState({
    newListings: true,
    priceDrops: true,
    messages: true,
    marketing: false,
  });

  function handleSave() {
    // In a real app, persist to Supabase profile
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const toggle = (key: keyof typeof notifications) => {
    setNotifications(n => ({ ...n, [key]: !n[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link href="/explore" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-bold text-slate-900 text-sm">Account Settings</span>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Language & Region */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language & Region</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Language</label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
              >
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic) — coming soon</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none"
              >
                <option value="ETB">ETB — Ethiopian Birr</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { key: "newListings" as const, label: "New listings matching my searches", sub: "Get notified when new properties are added" },
              { key: "priceDrops" as const, label: "Price drops on saved listings", sub: "Be the first to know about price reductions" },
              { key: "messages" as const, label: "Messages from agents", sub: "Receive replies from property agents" },
              { key: "marketing" as const, label: "Tips & updates from Habino", sub: "Product news and real estate insights" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  className="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200"
                  style={{ backgroundColor: notifications[item.key] ? "var(--color-primary)" : "#e2e8f0" }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: notifications[item.key] ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
          </div>
          <div className="divide-y divide-slate-50">
            <Link href="/profile" className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-700 font-medium">Edit Profile</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-700 font-medium">Change Password</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 transition-colors">
              <span className="text-sm text-red-500 font-medium">Delete Account</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-red-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--color-primary)" }}
        >
          {saved ? "✓ Settings saved" : "Save Changes"}
        </button>

      </div>
    </div>
  );
}
