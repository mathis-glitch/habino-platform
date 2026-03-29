"use client";

import { useState } from "react";
import Link from "next/link";

// ── Data ─────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "am", label: "Amharic", flag: "🇪🇹", native: "አማርኛ", beta: true },
  { code: "de", label: "German",  flag: "🇩🇪", native: "Deutsch" },
  { code: "fr", label: "French",  flag: "🇫🇷", native: "Français" },
  { code: "ar", label: "Arabic",  flag: "🇸🇦", native: "العربية" },
];

const CURRENCIES = [
  { code: "ETB", label: "Ethiopian Birr",  symbol: "Br",  flag: "🇪🇹" },
  { code: "USD", label: "US Dollar",       symbol: "$",   flag: "🇺🇸" },
  { code: "EUR", label: "Euro",            symbol: "€",   flag: "🇪🇺" },
  { code: "GBP", label: "British Pound",   symbol: "£",   flag: "🇬🇧" },
  { code: "AED", label: "UAE Dirham",      symbol: "د.إ", flag: "🇦🇪" },
];

const DATE_FORMATS = [
  { code: "dmy", label: "DD/MM/YYYY", example: "25/12/2025" },
  { code: "mdy", label: "MM/DD/YYYY", example: "12/25/2025" },
  { code: "ymd", label: "YYYY-MM-DD", example: "2025-12-25" },
];

const UNITS = [
  { code: "metric",   label: "Metric",   example: "m², km" },
  { code: "imperial", label: "Imperial", example: "sqft, mi" },
];

const TIMEZONES = [
  { code: "Africa/Addis_Ababa",    label: "Addis Ababa (EAT, UTC+3)" },
  { code: "Europe/Berlin",         label: "Berlin (CET, UTC+1/2)" },
  { code: "America/New_York",      label: "New York (EST, UTC-5/-4)" },
  { code: "Asia/Dubai",            label: "Dubai (GST, UTC+4)" },
  { code: "Europe/London",         label: "London (GMT, UTC+0/1)" },
];

// ── RadioCard ────────────────────────────────────────────────────────────────
function RadioCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
      style={{
        borderColor: selected ? "var(--color-primary)" : "#e2e8f0",
        background: selected ? "var(--color-primary-light)" : "white",
        boxShadow: selected ? "0 0 0 2px rgba(46,125,70,0.15)" : "none",
      }}
    >
      {/* Radio dot */}
      <span
        className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
        style={{ borderColor: selected ? "var(--color-primary)" : "#cbd5e1" }}
      >
        {selected && (
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
        )}
      </span>
      {children}
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function LanguagePage() {
  const [lang,       setLang]       = useState("en");
  const [currency,   setCurrency]   = useState("ETB");
  const [dateFormat, setDateFormat] = useState("dmy");
  const [unit,       setUnit]       = useState("metric");
  const [timezone,   setTimezone]   = useState("Africa/Addis_Ababa");
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const amhara = LANGUAGES.find(l => l.code === "am")?.beta && lang === "am";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-16" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center gap-3">
          <Link href="/settings"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-xl text-white">Language & Region</h1>
            <p className="text-white/50 text-xs mt-0.5">Localise your Habino experience</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-10 space-y-4">

        {/* ── Language ─────────────────────────────────────────────── */}
        <Section title="Display Language" subtitle="Controls all text within the app">
          {LANGUAGES.map(l => (
            <RadioCard key={l.code} selected={lang === l.code} onSelect={() => setLang(l.code)}>
              <span className="text-xl">{l.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                <p className="text-xs text-slate-400">{l.native}</p>
              </div>
              {l.beta && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                  Beta
                </span>
              )}
            </RadioCard>
          ))}
          {amhara && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mt-1">
              <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
              <p className="text-xs text-amber-700">Amharic is in beta — some pages may still display in English.</p>
            </div>
          )}
        </Section>

        {/* ── Currency ─────────────────────────────────────────────── */}
        <Section title="Default Currency" subtitle="Used for price display throughout the app">
          {CURRENCIES.map(c => (
            <RadioCard key={c.code} selected={currency === c.code} onSelect={() => setCurrency(c.code)}>
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{c.code} <span className="font-normal text-slate-400">({c.symbol})</span></p>
                <p className="text-xs text-slate-400">{c.label}</p>
              </div>
            </RadioCard>
          ))}
          {currency !== "ETB" && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 mt-1">
              <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
              <p className="text-xs text-blue-700">Prices are approximate conversions. Listings are priced in ETB.</p>
            </div>
          )}
        </Section>

        {/* ── Date format ─────────────────────────────────────────── */}
        <Section title="Date Format">
          {DATE_FORMATS.map(f => (
            <RadioCard key={f.code} selected={dateFormat === f.code} onSelect={() => setDateFormat(f.code)}>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{f.label}</p>
                <span className="text-xs text-slate-400 font-mono">{f.example}</span>
              </div>
            </RadioCard>
          ))}
        </Section>

        {/* ── Units ───────────────────────────────────────────────── */}
        <Section title="Measurement Units">
          {UNITS.map(u => (
            <RadioCard key={u.code} selected={unit === u.code} onSelect={() => setUnit(u.code)}>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{u.label}</p>
                <span className="text-xs text-slate-400">{u.example}</span>
              </div>
            </RadioCard>
          ))}
        </Section>

        {/* ── Timezone ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden"
          style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time Zone</p>
            <p className="text-xs text-slate-400 mt-0.5">Used for quiet hours and notification timing</p>
          </div>
          <div className="p-4">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none"
              style={{ borderColor: "var(--color-border, #e2e8f0)" }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.code} value={tz.code}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Save button ──────────────────────────────────────────── */}
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
