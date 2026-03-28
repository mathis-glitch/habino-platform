"use client";

import { useState } from "react";
import Link from "next/link";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ backgroundColor: on ? "var(--color-primary)" : "#e2e8f0" }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("ETB");
  const [notif, setNotif] = useState({ newListings: true, priceDrops: true, messages: true, marketing: false });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/explore" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-semibold text-slate-800 text-sm">Settings</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* Language & Region */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language & Region</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Display Language</label>
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none">
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic) — coming soon</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Default Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none">
                <option value="ETB">ETB — Ethiopian Birr</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</p>
          </div>
          <div className="divide-y divide-slate-100">
            {([
              { key: "newListings" as const, label: "New matching listings" },
              { key: "priceDrops"  as const, label: "Price drops on saved listings" },
              { key: "messages"    as const, label: "Agent messages" },
              { key: "marketing"   as const, label: "News & updates from Habino" },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-slate-700">{item.label}</span>
                <Toggle on={notif[item.key]} onToggle={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
          </div>
          <div className="divide-y divide-slate-100">
            <Link href="/profile" className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-700">Edit Profile</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-red-50 transition-colors text-left">
              <span className="text-sm text-red-500">Delete Account</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-red-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--color-primary)" }}>
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
