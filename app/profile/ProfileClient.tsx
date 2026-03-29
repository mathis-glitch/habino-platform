"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Profile {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country_code?: string;
  id_number?: string;
  bio?: string;
  preferred_lang?: string;
  avatar_url?: string;
}

const COUNTRY_LABELS: Record<string, string> = {
  KE: "Kenya", NG: "Nigeria", GH: "Ghana", ZA: "South Africa",
  AE: "UAE", DE: "Germany", GB: "United Kingdom", FR: "France",
  ES: "Spain", US: "United States", BR: "Brazil", IN: "India",
  ET: "Ethiopia", TZ: "Tanzania",
};

const LANG_LABELS: Record<string, string> = {
  "en-US": "English (US)", "en-GB": "English (UK)", "de-DE": "Deutsch",
  "fr-FR": "Français", "es-ES": "Español", "ar-SA": "العربية",
  "sw-KE": "Kiswahili", "pt-BR": "Português (BR)",
};

// ── Completion ring (SVG) ─────────────────────────────────────
function CompletionRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
      {/* track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
      {/* fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? "var(--color-primary)" : "#4ADE80"}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </svg>
  );
}

// ── Field row ─────────────────────────────────────────────────
function FieldRow({
  icon, label, value, empty, action,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  empty?: string;
  action?: React.ReactNode;
}) {
  const hasValue = !!value;
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 last:border-0 group">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: hasValue ? "var(--color-primary-light)" : "#F8FAFC" }}
      >
        <span style={{ color: hasValue ? "var(--color-primary)" : "#94A3B8" }}>{icon}</span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-0.5">{label}</p>
        <p className={`text-[14px] leading-snug truncate ${hasValue ? "font-medium text-slate-900" : "text-slate-300 italic"}`}>
          {value || empty || "Not set"}
        </p>
      </div>
      {/* Action */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Chevron icon ──────────────────────────────────────────────
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

// ── Icons ─────────────────────────────────────────────────────
const IconUser    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMap     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconID      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconGlobe   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconShield  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCheck   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>;

// ── Card wrapper ──────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

function CardHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--color-primary)" }}>
        {label}
      </span>
      {action}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export function ProfileClient() {
  const [profile,  setProfile]  = useState<Profile>({});
  const [loading,  setLoading]  = useState(true);
  const [twofa,    setTwofa]    = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Completion calculation
  const FIELDS: (keyof Profile)[] = ["full_name", "email", "phone", "city", "id_number", "avatar_url"];
  const completedCount = FIELDS.filter((f) => !!profile[f]).length;
  const completionPct  = Math.round((completedCount / FIELDS.length) * 100);

  const hasProfile = completedCount > 0;

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Skeleton loading
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="px-5 pt-7 pb-20" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }} />
        <div className="max-w-lg mx-auto px-4 -mt-10 pb-24 flex flex-col gap-3">
          {[96, 200, 180, 140].map((h, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ height: h }}>
              <div className="h-full animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F8FAFC" }}>

      {/* ═══════════════════════════════════════════════
          HERO — dark gradient, taller, identity inside
      ═══════════════════════════════════════════════ */}
      <div
        className="relative px-5 pt-8 pb-24 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e293b 0%, #0f172a 60%, #0d1927 100%)" }}
      >
        {/* Decorative circle — subtle, top-right */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)" }}
        />
        <div
          className="absolute bottom-4 -left-8 w-32 h-32 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
        />

        <div className="max-w-lg mx-auto">
          {/* Top bar: title + edit */}
          <div className="flex items-center justify-between mb-7">
            <h1 className="text-[13px] font-semibold text-white/50 uppercase tracking-[0.12em]">My Profile</h1>
            <Link
              href="/?wizard=profile"
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12px] font-semibold text-white/80 hover:text-white bg-white/8 hover:bg-white/14 border border-white/10 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              ✨ {hasProfile ? "Edit with AI" : "Set up"}
            </Link>
          </div>

          {/* Identity row: avatar + name + completion */}
          <div className="flex items-center gap-5">
            {/* Avatar with completion ring */}
            <div className="relative shrink-0 w-[88px] h-[88px]">
              <CompletionRing pct={completionPct} size={88} />
              <div
                className="absolute inset-[7px] rounded-full flex items-center justify-center text-white text-[22px] font-bold"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #235f35 100%)" }}
              >
                {initials}
              </div>
              {/* Verified dot */}
              {completionPct === 100 && (
                <div
                  className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full border-2 border-[#0f172a] flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <IconCheck />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-bold text-white leading-tight truncate">
                {profile.full_name || "Your Name"}
              </h2>
              <p className="text-[13px] text-white/50 mt-0.5 truncate">
                {profile.email || "No email set"}
              </p>

              {/* Completion pill */}
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: "rgba(46,125,70,0.15)",
                    borderColor: "rgba(46,125,70,0.3)",
                    color: "#4ade80",
                  }}
                >
                  Tenant
                </span>
                {completionPct < 100 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/40">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: completionPct >= 50 ? "#4ade80" : "#fbbf24" }}
                    />
                    {completionPct}% complete
                  </span>
                )}
                {profile.city && (
                  <span className="text-[11px] text-white/30">· {profile.city}</span>
                )}
              </div>
            </div>
          </div>

          {/* Completion nudge — shows when profile incomplete */}
          {completionPct < 100 && (
            <div
              className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3 border"
              style={{
                backgroundColor: "rgba(251,191,36,0.06)",
                borderColor: "rgba(251,191,36,0.18)",
              }}
            >
              <div className="w-1.5 rounded-full self-stretch" style={{ backgroundColor: "#fbbf24", minHeight: "100%" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-amber-400 leading-tight">
                  {FIELDS.length - completedCount} field{FIELDS.length - completedCount !== 1 ? "s" : ""} missing
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Complete your profile to pre-fill contracts faster.
                </p>
              </div>
              <Link
                href="/?wizard=profile"
                className="shrink-0 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                Complete →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CONTENT CARDS — overlap hero
      ═══════════════════════════════════════════════ */}
      <div className="max-w-lg mx-auto px-4 -mt-10 pb-28 flex flex-col gap-3">

        {!hasProfile ? (
          /* ── Empty state ───────────────────────── */
          <Card>
            <div className="p-8 flex flex-col items-center text-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-light)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-slate-900">No profile set up yet</h3>
                <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed max-w-[260px] mx-auto">
                  The AI interviews you in ~60 seconds and fills everything in.
                </p>
              </div>
              <Link
                href="/?wizard=profile"
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-white text-[14px] font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 4px 14px rgba(46,125,70,0.35)" }}
              >
                ✨ Set up with AI
              </Link>
              <p className="text-[11px] text-slate-300">Voice input supported</p>
            </div>
          </Card>
        ) : (
          <>
            {/* ── Personal Information ─────────────── */}
            <Card>
              <CardHeader
                label="Personal Information"
                action={
                  <Link
                    href="/?wizard=profile"
                    className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </Link>
                }
              />
              <div className="px-5 py-1">
                <FieldRow
                  icon={<IconUser />}
                  label="Full Name"
                  value={profile.full_name}
                />
                <FieldRow
                  icon={<IconMail />}
                  label="Email"
                  value={profile.email}
                  action={
                    profile.email ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        style={{ backgroundColor: "var(--color-primary-light)", borderColor: "#bbddc9", color: "var(--color-primary)" }}
                      >
                        <IconCheck /> Verified
                      </span>
                    ) : undefined
                  }
                />
                <FieldRow icon={<IconPhone />} label="Phone" value={profile.phone} />
                <FieldRow icon={<IconPhone />} label="WhatsApp" value={profile.whatsapp} />
              </div>
            </Card>

            {/* ── Location ─────────────────────────── */}
            <Card>
              <CardHeader
                label="Location"
                action={
                  <Link href="/?wizard=profile" className="text-[12px] font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>
                    Edit
                  </Link>
                }
              />
              <div className="px-5 py-1">
                <FieldRow icon={<IconMap />} label="City" value={profile.city} />
                <FieldRow
                  icon={<IconGlobe />}
                  label="Country"
                  value={profile.country_code ? COUNTRY_LABELS[profile.country_code] ?? profile.country_code : undefined}
                />
                <FieldRow icon={<IconMap />} label="Address" value={profile.address} />
              </div>
            </Card>

            {/* ── Identity & Preferences ───────────── */}
            <Card>
              <CardHeader label="Identity & Preferences" />
              <div className="px-4 py-2">
                <div
                  className="flex items-start gap-3 p-3 rounded-xl mb-3"
                  style={{ backgroundColor: "var(--color-primary-light)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-primary)" }}>
                    Your ID and language preferences are used to pre-fill rental contracts.
                  </p>
                </div>
              </div>
              <div className="px-5 pb-1">
                <FieldRow
                  icon={<IconID />}
                  label="ID / Passport"
                  value={profile.id_number ? `••••  ••••  ${profile.id_number.slice(-4)}` : undefined}
                  action={<ChevronRight />}
                />
                <FieldRow
                  icon={<IconGlobe />}
                  label="Preferred Language"
                  value={profile.preferred_lang ? LANG_LABELS[profile.preferred_lang] ?? profile.preferred_lang : "English (US)"}
                />
                {profile.bio && (
                  <FieldRow icon={<IconUser />} label="Bio" value={profile.bio} />
                )}
              </div>
            </Card>

            {/* ── Security ─────────────────────────── */}
            <Card>
              <CardHeader label="Security" />
              <div className="px-5 py-1">
                {/* Password row */}
                <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                  >
                    <span style={{ color: "var(--color-primary)" }}><IconLock /></span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-0.5">Password</p>
                    <p className="text-[14px] font-medium text-slate-900 tracking-[0.2em]">••••••••••</p>
                  </div>
                  <Link
                    href="/?wizard=profile"
                    className="text-[12px] font-semibold transition-colors"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Change
                  </Link>
                </div>

                {/* 2FA row */}
                <div className="flex items-center gap-3.5 py-3.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: twofa ? "var(--color-primary-light)" : "#F8FAFC" }}
                  >
                    <span style={{ color: twofa ? "var(--color-primary)" : "#94A3B8" }}><IconShield /></span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-0.5">Two-Factor Auth</p>
                    <p className="text-[13px] text-slate-400">{twofa ? "Enabled" : "Disabled — recommended"}</p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => setTwofa((v) => !v)}
                    className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 ring-offset-1"
                    style={{
                      backgroundColor: twofa ? "var(--color-primary)" : "#E2E8F0",
                      boxShadow: twofa ? "0 0 0 3px rgba(46,125,70,0.12)" : "none",
                    }}
                    role="switch"
                    aria-checked={twofa}
                    aria-label="Two-factor authentication"
                  >
                    <span
                      className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200"
                      style={{ left: twofa ? "calc(100% - 21px)" : "3px" }}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* ── Profile completeness card ─────────── */}
            {completionPct < 100 && (
              <Card>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-slate-900">Profile completeness</p>
                    <span className="text-[13px] font-bold" style={{ color: "var(--color-primary)" }}>
                      {completionPct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${completionPct}%`,
                        background: "linear-gradient(90deg, var(--color-primary), #4ade80)",
                      }}
                    />
                  </div>
                  {/* Missing fields */}
                  <div className="flex flex-col gap-2">
                    {FIELDS.filter((f) => !profile[f]).map((f) => {
                      const labels: Record<string, string> = {
                        full_name: "Add your full name",
                        email: "Verify your email",
                        phone: "Add a phone number",
                        city: "Set your city",
                        id_number: "Add ID / passport number",
                        avatar_url: "Upload a profile photo",
                      };
                      return (
                        <Link
                          key={f}
                          href="/?wizard=profile"
                          className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 hover:border-slate-300 transition-colors group"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors flex-1">
                            {labels[f] ?? f}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-slate-400 transition-colors">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── Danger Zone ──────────────────────────── */}
        <div
          className="rounded-2xl border px-5 py-4 mt-1"
          style={{ borderColor: "#fee2e2", backgroundColor: "#fff5f5", boxShadow: "var(--shadow-xs)" }}
        >
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.1em] mb-4">Danger Zone</p>
          <div className="flex flex-col gap-0 divide-y divide-red-100/80">
            {/* Download */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Download My Data</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Export everything as a ZIP archive.</p>
              </div>
              <button className="shrink-0 h-8 px-3.5 rounded-xl text-[12px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                Download
              </button>
            </div>
            {/* Delete */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-[14px] font-semibold text-red-600">Delete Account</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Permanently deletes all your data.</p>
              </div>
              <button className="shrink-0 h-8 px-3.5 rounded-xl text-[12px] font-semibold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
