"use client";

import { useState } from "react";
import Link from "next/link";

// ── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-checked={on}
      role="switch"
      className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: on ? "var(--color-primary)" : "#e2e8f0" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ── Channel toggle (master switch) ───────────────────────────────────────────
function ChannelBadge({ active }: { active: boolean }) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: active ? "var(--color-primary-light)" : "#f1f5f9",
        color: active ? "var(--color-primary)" : "#94a3b8",
      }}
    >
      {active ? "ON" : "OFF"}
    </span>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const TOPICS = [
  {
    key: "new_listings",
    icon: "🏠",
    label: "New matching listings",
    desc: "When listings match your saved search criteria",
  },
  {
    key: "price_drops",
    icon: "📉",
    label: "Price drops",
    desc: "When a saved listing drops in price",
  },
  {
    key: "viewing_reminders",
    icon: "📅",
    label: "Viewing reminders",
    desc: "Confirmations and reminders for booked viewings",
  },
  {
    key: "agent_messages",
    icon: "💬",
    label: "Agent messages",
    desc: "When an agent replies to your enquiry",
  },
  {
    key: "contract_updates",
    icon: "📄",
    label: "Contract updates",
    desc: "Status changes and signature requests",
  },
  {
    key: "marketing",
    icon: "✨",
    label: "Habino news & updates",
    desc: "Product news, tips, and special offers",
  },
] as const;

type TopicKey = typeof TOPICS[number]["key"];
type ChannelKey = "email" | "push" | "in_app";

type TopicPrefs = Record<ChannelKey, boolean>;
type Prefs = Record<TopicKey, TopicPrefs>;

const DEFAULT_PREFS: Prefs = {
  new_listings:      { email: true,  push: true,  in_app: true  },
  price_drops:       { email: true,  push: false, in_app: true  },
  viewing_reminders: { email: true,  push: true,  in_app: true  },
  agent_messages:    { email: true,  push: true,  in_app: true  },
  contract_updates:  { email: true,  push: false, in_app: true  },
  marketing:         { email: false, push: false, in_app: false },
};

const CHANNELS: { key: ChannelKey; label: string; icon: string }[] = [
  { key: "email",  label: "Email",  icon: "✉️" },
  { key: "push",   label: "Push",   icon: "🔔" },
  { key: "in_app", label: "In-app", icon: "📱" },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [masters, setMasters] = useState<Record<ChannelKey, boolean>>({
    email: true, push: true, in_app: true,
  });
  const [quietHours, setQuietHours] = useState({ enabled: false, from: "21:00", to: "07:00" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggle(topic: TopicKey, channel: ChannelKey) {
    setPrefs(p => ({
      ...p,
      [topic]: { ...p[topic], [channel]: !p[topic][channel] },
    }));
  }

  function toggleMaster(channel: ChannelKey) {
    const next = !masters[channel];
    setMasters(m => ({ ...m, [channel]: next }));
    // Propagate: if turning off, disable all; if turning on, restore defaults
    setPrefs(p => {
      const updated = { ...p } as Prefs;
      (Object.keys(updated) as TopicKey[]).forEach(topic => {
        updated[topic] = { ...updated[topic], [channel]: next ? DEFAULT_PREFS[topic][channel] : false };
      });
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-16" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center gap-3">
          <Link href="/settings"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-xl text-white">Notifications</h1>
            <p className="text-white/50 text-xs mt-0.5">Control what Habino sends you</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-10 space-y-4">

        {/* ── Channel master switches ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
          style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Channels</p>
            <p className="text-xs text-slate-400 mt-0.5">Master switches — turn off a channel to stop all notifications via that method</p>
          </div>
          <div className="divide-y divide-slate-100">
            {CHANNELS.map(ch => (
              <div key={ch.key} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{ch.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ch.label}</p>
                    <ChannelBadge active={masters[ch.key]} />
                  </div>
                </div>
                <Toggle on={masters[ch.key]} onToggle={() => toggleMaster(ch.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Per-topic controls ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
          style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notification topics</p>
          </div>

          {/* Column headers */}
          <div className="hidden sm:flex items-center px-5 py-2 border-b border-slate-50 bg-slate-50/60">
            <div className="flex-1" />
            {CHANNELS.map(ch => (
              <div key={ch.key} className="w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {ch.label}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {TOPICS.map(topic => (
              <div key={topic.key} className="px-5 py-4">
                {/* Mobile: label + 3 toggles in a row */}
                <div className="flex items-start gap-3">
                  <span className="text-lg w-7 text-center shrink-0 mt-0.5">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{topic.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.desc}</p>
                  </div>
                  {/* Toggles */}
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    {CHANNELS.map(ch => (
                      <div key={ch.key} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-300 sm:hidden uppercase">{ch.label.slice(0,4)}</span>
                        <Toggle
                          on={prefs[topic.key][ch.key]}
                          onToggle={() => toggle(topic.key, ch.key)}
                          disabled={!masters[ch.key]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quiet hours ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
          style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌙</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Quiet hours</p>
                <p className="text-xs text-slate-400 mt-0.5">No push notifications during this window</p>
              </div>
            </div>
            <Toggle on={quietHours.enabled} onToggle={() => setQuietHours(q => ({ ...q, enabled: !q.enabled }))} />
          </div>

          {quietHours.enabled && (
            <div className="px-5 pb-4 border-t border-slate-100 pt-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">From</label>
                <input
                  type="time"
                  value={quietHours.from}
                  onChange={e => setQuietHours(q => ({ ...q, from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary"
                  style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
                />
              </div>
              <div className="pt-5 text-slate-300 font-semibold">→</div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">To</label>
                <input
                  type="time"
                  value={quietHours.to}
                  onChange={e => setQuietHours(q => ({ ...q, to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Save button ────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: saved ? "#16a34a" : "var(--color-primary)",
            boxShadow: "0 2px 10px rgba(46,125,70,0.25)",
          }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
