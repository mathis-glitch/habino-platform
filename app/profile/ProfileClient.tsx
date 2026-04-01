"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Light-mode design tokens — forest green CI
const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#F0F2F0",
  border:   "rgba(0,0,0,0.07)",
  border2:  "rgba(0,0,0,0.11)",
  text1:    "#1A1A2E",
  text2:    "#6B7280",
  text3:    "#9CA3AF",
  primary:  "#2D6A4F",
  primaryD: "#1B4332",
  primaryL: "rgba(45,106,79,0.09)",
  ok:       "#34C759",
  warn:     "#FF9F0A",
  err:      "#FF453A",
  font:     "'Inter',-apple-system,sans-serif",
};

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

const CURRENCIES = [
  { key: "ETB", label: "ETB — Ethiopian Birr", symbol: "Br" },
  { key: "USD", label: "USD — US Dollar",      symbol: "$" },
  { key: "EUR", label: "EUR — Euro",           symbol: "€" },
];

const LANG_LABELS: Record<string, string> = {
  "en-US": "English (US)", "en-GB": "English (UK)",
  "fr-FR": "Français",     "ar-SA": "العربية",
};

function SectionCard({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "0 18px" }}>{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  const has = !!value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: has ? T.primaryL : T.bgSoft2,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: has ? T.primary : T.text3,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: has ? T.text1 : T.text3, fontStyle: has ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "Not set"}
        </div>
      </div>
    </div>
  );
}

// Simple SVG icons
const IcoUser     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoMail     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoPhone    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.5 2 2 0 013.6 1.3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 8.96a16 16 0 006.13 6.13l1.02-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IcoMap      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoLock     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IcoShield   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoCurrency = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;

export function ProfileClient() {
  const [profile,  setProfile]  = useState<Profile>({});
  const [loading,  setLoading]  = useState(true);
  const [twofa,    setTwofa]    = useState(false);
  const [currency, setCurrencyState] = useState("ETB");

  useEffect(() => {
    // Load currency preference
    try { setCurrencyState(localStorage.getItem("habino_currency") || "ETB"); } catch { /* ok */ }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setCurrency(c: string) {
    setCurrencyState(c);
    try { localStorage.setItem("habino_currency", c); } catch { /* ok */ }
  }

  const FIELDS: (keyof Profile)[] = ["full_name", "email", "phone", "city", "id_number", "avatar_url"];
  const completedCount = FIELDS.filter((f) => !!profile[f]).length;
  const completionPct  = Math.round((completedCount / FIELDS.length) * 100);

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (loading) {
    return (
      <div style={{ flex: 1, background: T.bgSoft, padding: "52px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[80, 160, 140, 120].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 18, background: T.bgSoft2 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: T.bgSoft, overflowY: "auto", fontFamily: T.font }}>

      {/* ── Header ── */}
      <div style={{ background: T.bg, padding: "52px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill={T.primary} />
              <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.primary, letterSpacing: -0.5 }}>habino</span>
          </div>
          <Link href="/?wizard=profile" style={{
            padding: "8px 14px", borderRadius: 10,
            background: T.primaryL, color: T.primary,
            fontSize: 12, fontWeight: 700, textDecoration: "none",
          }}>
            ✨ Edit with AI
          </Link>
        </div>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${T.primary} 0%, #40916C 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: -0.5 }}>
              {profile.full_name || "Your Name"}
            </div>
            <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>
              {profile.email || "No email set"}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <span style={{ padding: "2px 9px", borderRadius: 20, background: T.primaryL, color: T.primary, fontSize: 11, fontWeight: 600 }}>
                Member
              </span>
              <span style={{ padding: "2px 9px", borderRadius: 20, background: T.bgSoft2, color: T.text3, fontSize: 11, fontWeight: 600 }}>
                {completionPct}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 4, background: T.bgSoft2, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${completionPct}%`, height: "100%", background: T.primary, borderRadius: 2, transition: "width 0.6s" }} />
        </div>
      </div>

      {/* ── Cards ── */}
      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Personal Info */}
        <SectionCard title="Personal Information" action={
          <Link href="/?wizard=profile" style={{ fontSize: 12, fontWeight: 600, color: T.primary, textDecoration: "none" }}>Edit</Link>
        }>
          <Row icon={<IcoUser />} label="Full Name" value={profile.full_name} />
          <Row icon={<IcoMail />} label="Email"     value={profile.email} />
          <Row icon={<IcoPhone />} label="Phone"    value={profile.phone} />
          <div style={{ padding: "13px 0" }}>
            <Row icon={<IcoMap />} label="City" value={profile.city} />
          </div>
        </SectionCard>

        {/* Currency Settings */}
        <SectionCard title="Display Currency">
          <div style={{ paddingTop: 14, paddingBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
                <IcoCurrency />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>Preferred Currency</div>
                <div style={{ fontSize: 11, color: T.text3 }}>Applied to all price displays in the app</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CURRENCIES.map((c) => (
                <button key={c.key} onClick={() => setCurrency(c.key)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  border: `1.5px solid ${currency === c.key ? T.primary : T.border2}`,
                  background: currency === c.key ? T.primaryL : T.bg,
                  cursor: "pointer", textAlign: "left", fontFamily: T.font,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: currency === c.key ? T.primary : T.bgSoft2,
                    color: currency === c.key ? "#fff" : T.text2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {c.symbol}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: currency === c.key ? 700 : 500, color: currency === c.key ? T.primary : T.text1 }}>
                    {c.label}
                  </span>
                  {currency === c.key && (
                    <svg style={{ marginLeft: "auto" }} width="16" height="16" fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.text3, marginTop: 10 }}>
              * EUR/USD rates are indicative and updated daily
            </p>
          </div>
        </SectionCard>

        {/* Identity & Preferences */}
        <SectionCard title="Identity & Preferences">
          <Row icon={<IcoMail />} label="ID / Passport"
            value={profile.id_number ? `•••• ${profile.id_number.slice(-4)}` : undefined}
          />
          <div style={{ padding: "13px 0" }}>
            <Row icon={<IcoMap />} label="Language"
              value={profile.preferred_lang ? LANG_LABELS[profile.preferred_lang] ?? profile.preferred_lang : "English (US)"}
            />
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security">
          {/* Password */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
              <IcoLock />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Password</div>
              <div style={{ fontSize: 13, color: T.text1, letterSpacing: "0.18em" }}>••••••••</div>
            </div>
            <Link href="/?wizard=profile" style={{ fontSize: 12, fontWeight: 600, color: T.primary, textDecoration: "none" }}>Change</Link>
          </div>

          {/* 2FA */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: twofa ? T.primaryL : T.bgSoft2, display: "flex", alignItems: "center", justifyContent: "center", color: twofa ? T.primary : T.text3, flexShrink: 0 }}>
              <IcoShield />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Two-Factor Auth</div>
              <div style={{ fontSize: 13, color: T.text2 }}>{twofa ? "Enabled" : "Disabled — recommended"}</div>
            </div>
            <button onClick={() => setTwofa(v => !v)} role="switch" aria-checked={twofa} style={{
              position: "relative", width: 44, height: 26, borderRadius: 13,
              background: twofa ? T.primary : T.bgSoft2,
              border: `1px solid ${twofa ? "transparent" : T.border2}`,
              cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
            }}>
              <span style={{
                position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", left: twofa ? "calc(100% - 20px)" : 4,
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        </SectionCard>

        {/* Completeness nudge */}
        {completionPct < 100 && (
          <div style={{ background: "rgba(255,159,10,0.07)", border: "1px solid rgba(255,159,10,0.2)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.warn, marginBottom: 4 }}>
              {FIELDS.length - completedCount} fields missing
            </div>
            <div style={{ fontSize: 12, color: T.text2, marginBottom: 12, lineHeight: 1.5 }}>
              A complete profile speeds up contract generation and agent matching.
            </div>
            <Link href="/?wizard=profile" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10,
              background: T.warn, color: "#fff",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              Complete profile →
            </Link>
          </div>
        )}

        {/* Danger zone */}
        <div style={{ border: "1px solid rgba(255,69,58,0.2)", background: "rgba(255,69,58,0.04)", borderRadius: 16, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.err, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Danger Zone</div>
          {[
            { label: "Download my data", desc: "Export all data as a ZIP file.", action: "Export", danger: false },
            { label: "Delete account",   desc: "Permanently delete all your data.", action: "Delete", danger: true },
          ].map(({ label, desc, action, danger }, i) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              padding: "12px 0", borderBottom: i === 0 ? `1px solid rgba(255,69,58,0.1)` : "none",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: danger ? T.err : T.text1 }}>{label}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{desc}</div>
              </div>
              <button style={{
                padding: "7px 14px", borderRadius: 9,
                background: "transparent",
                border: `1px solid ${danger ? "rgba(255,69,58,0.3)" : T.border2}`,
                color: danger ? T.err : T.text2,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}>
                {action}
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: T.text3, textAlign: "center" }}>Habino v2.0 · Addis Abeba</p>
      </div>
    </div>
  );
}
