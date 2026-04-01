"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  DE: "Germany", AT: "Austria", CH: "Switzerland",
  KE: "Kenya", NG: "Nigeria", GH: "Ghana", ZA: "South Africa",
  AE: "UAE", GB: "United Kingdom", FR: "France",
  ES: "Spain", US: "USA", BR: "Brazil", IN: "India",
};

const LANG_LABELS: Record<string, string> = {
  "de-DE": "Deutsch", "en-US": "English (US)", "en-GB": "English (UK)",
  "fr-FR": "Français", "es-ES": "Español", "ar-SA": "العربية",
};

// ── Completion ring ───────────────────────────────────────────────────────────
function CompletionRing({ pct, size = 88 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? "var(--color-primary)" : "var(--ok)"}
        strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </svg>
  );
}

// ── Field Row ─────────────────────────────────────────────────────────────────
function FieldRow({ icon, label, value, action }: {
  icon: React.ReactNode; label: string; value?: string; action?: React.ReactNode;
}) {
  const has = !!value;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: has ? "var(--color-primary-light)" : "var(--surface3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: has ? "var(--color-primary)" : "var(--text-3)",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {label}
        </p>
        <p style={{
          fontSize: 13, lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: has ? "var(--text-1)" : "var(--text-3)", fontStyle: has ? "normal" : "italic", fontWeight: has ? 500 : 400,
        }}>
          {value || "Not set"}
        </p>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUser   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMap    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconID     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconGlobe  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconShield = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCheck  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>;

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function CardHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px 12px", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)" }}>
        {label}
      </span>
      {action}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProfileClient() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [twofa,   setTwofa]   = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FIELDS: (keyof Profile)[] = ["full_name", "email", "phone", "city", "id_number", "avatar_url"];
  const completedCount = FIELDS.filter((f) => !!profile[f]).length;
  const completionPct  = Math.round((completedCount / FIELDS.length) * 100);
  const hasProfile     = completedCount > 0;

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ height: 220, background: "var(--surface)" }} />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 80px", marginTop: -40, display: "flex", flexDirection: "column", gap: 12 }}>
          {[96, 200, 180, 140].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 14, background: "var(--surface2)",
              border: "1px solid var(--border)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Hero */}
      <div style={{
        position: "relative", padding: "32px 20px 80px", overflow: "hidden",
        background: "linear-gradient(145deg, #1A1829 0%, #111119 60%, #0E0E16 100%)",
        borderBottom: "1px solid var(--border)",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 240, height: 240,
          borderRadius: "50%", opacity: 0.06, pointerEvents: "none",
          background: "radial-gradient(circle, var(--color-primary), transparent 70%)",
        }} />

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <h1 style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              My Profile
            </h1>
            <Link href="/?wizard=profile" style={{
              display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px",
              borderRadius: 9, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.75)", textDecoration: "none", transition: "all 0.12s",
            }}>
              ✨ {hasProfile ? "Edit with AI" : "Set up"}
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0, width: 88, height: 88 }}>
              <CompletionRing pct={completionPct} size={88} />
              <div style={{
                position: "absolute", inset: 7, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary) 0%, #5A4FCC 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: "white",
              }}>
                {initials}
              </div>
              {completionPct === 100 && (
                <div style={{
                  position: "absolute", bottom: 0, right: 0, width: 22, height: 22,
                  borderRadius: "50%", background: "var(--color-primary)",
                  border: "2px solid var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white",
                }}>
                  <IconCheck />
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.full_name || "Your Name"}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.email || "No email set"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.2)", color: "var(--ok)",
                }}>
                  Nutzer
                </span>
                {completionPct < 100 && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                      background: completionPct >= 50 ? "var(--ok)" : "var(--warn)",
                    }} />
                    {completionPct}% complete
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completion nudge */}
          {completionPct < 100 && (
            <div style={{
              marginTop: 20, borderRadius: 10, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,159,10,0.07)", border: "1px solid rgba(255,159,10,0.15)",
            }}>
              <div style={{ width: 3, borderRadius: 2, alignSelf: "stretch", background: "var(--warn)", minHeight: 36 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--warn)", lineHeight: 1.3 }}>
                  {FIELDS.length - completedCount} fields missing
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  A complete profile speeds up contract creation.
                </p>
              </div>
              <Link href="/?wizard=profile" style={{ fontSize: 11, fontWeight: 600, color: "var(--warn)", textDecoration: "none", flexShrink: 0 }}>
                Vercompleteen →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px", marginTop: -36, display: "flex", flexDirection: "column", gap: 12 }}>

        {!hasProfile ? (
          <Card>
            <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "var(--color-primary-light)", border: "1px solid rgba(124,110,242,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)" }}>No profile set up yet</h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.6, maxWidth: 260 }}>
                  The AI agent interviews you in ~60 seconds and fills everything in automatically.
                </p>
              </div>
              <Link href="/?wizard=profile" style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 42, padding: "0 24px", borderRadius: 10,
                background: "var(--color-primary)", color: "white",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                boxShadow: "0 0 0 1px rgba(124,110,242,0.3), 0 4px 16px rgba(124,110,242,0.2)",
              }}>
                ✨ Mit KI einrichten
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Persönliche Daten */}
            <Card>
              <CardHeader label="Personal Information" action={
                <Link href="/?wizard=profile" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </Link>
              } />
              <div style={{ padding: "0 20px" }}>
                <FieldRow icon={<IconUser />} label="Full Name" value={profile.full_name} />
                <FieldRow icon={<IconMail />} label="Email" value={profile.email}
                  action={profile.email ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                      background: "var(--color-primary-light)", border: "1px solid rgba(124,110,242,0.2)",
                      color: "var(--color-primary)",
                    }}>
                      <IconCheck /> Verifiziert
                    </span>
                  ) : undefined}
                />
                <FieldRow icon={<IconPhone />} label="Phone" value={profile.phone} />
                <FieldRow icon={<IconPhone />} label="WhatsApp" value={profile.whatsapp} />
              </div>
            </Card>

            {/* Standort */}
            <Card>
              <CardHeader label="Location" action={
                <Link href="/?wizard=profile" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>Edit</Link>
              } />
              <div style={{ padding: "0 20px" }}>
                <FieldRow icon={<IconMap />} label="City" value={profile.city} />
                <FieldRow icon={<IconGlobe />} label="Country"
                  value={profile.country_code ? COUNTRY_LABELS[profile.country_code] ?? profile.country_code : undefined}
                />
                <FieldRow icon={<IconMap />} label="Address" value={profile.address} />
              </div>
            </Card>

            {/* Identität & Einstellungen */}
            <Card>
              <CardHeader label="Identity & Preferences" />
              <div style={{ padding: "12px 20px 0" }}>
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 9, marginBottom: 4,
                  background: "var(--color-primary-light)", border: "1px solid rgba(124,110,242,0.15)",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: 12, color: "var(--color-primary)", lineHeight: 1.5 }}>
                    ID and language settings are used for contract generation.
                  </p>
                </div>
              </div>
              <div style={{ padding: "0 20px" }}>
                <FieldRow icon={<IconID />} label="ID / Passport"
                  value={profile.id_number ? `••••  ••••  ${profile.id_number.slice(-4)}` : undefined}
                />
                <FieldRow icon={<IconGlobe />} label="Preferred Language"
                  value={profile.preferred_lang ? LANG_LABELS[profile.preferred_lang] ?? profile.preferred_lang : "English (US)"}
                />
                {profile.bio && <FieldRow icon={<IconUser />} label="About me" value={profile.bio} />}
              </div>
            </Card>

            {/* Sicherheit */}
            <Card>
              <CardHeader label="Security" />
              <div style={{ padding: "0 20px" }}>
                {/* Passwort */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "var(--color-primary-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-primary)",
                  }}>
                    <IconLock />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Password</p>
                    <p style={{ fontSize: 13, color: "var(--text-1)", letterSpacing: "0.18em" }}>••••••••••</p>
                  </div>
                  <Link href="/?wizard=profile" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                    Ändern
                  </Link>
                </div>

                {/* 2FA */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: twofa ? "var(--color-primary-light)" : "var(--surface3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: twofa ? "var(--color-primary)" : "var(--text-3)",
                  }}>
                    <IconShield />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Two-Factor Auth</p>
                    <p style={{ fontSize: 13, color: "var(--text-2)" }}>{twofa ? "Enabled" : "Disabled — recommended"}</p>
                  </div>
                  <button
                    onClick={() => setTwofa((v) => !v)}
                    role="switch" aria-checked={twofa}
                    aria-label="Two-factor authentication"
                    style={{
                      position: "relative", flexShrink: 0, width: 42, height: 24, borderRadius: 12,
                      background: twofa ? "var(--color-primary)" : "var(--surface3)",
                      border: `1px solid ${twofa ? "transparent" : "var(--border2)"}`,
                      cursor: "pointer", transition: "background 0.2s",
                    }}>
                    <span style={{
                      position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "white",
                      transition: "left 0.2s",
                      left: twofa ? "calc(100% - 19px)" : 3,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }} />
                  </button>
                </div>
              </div>
            </Card>

            {/* Vollständigkeit */}
            {completionPct < 100 && (
              <Card>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Profile completeness</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--surface3)", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 0.7s ease",
                      width: `${completionPct}%`,
                      background: "linear-gradient(90deg, var(--color-primary), var(--ok))",
                    }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FIELDS.filter((f) => !profile[f]).map((f) => {
                      const labels: Record<string, string> = {
                        full_name: "Add full name",
                        email: "Verify email",
                        phone: "Add phone number",
                        city: "Set city",
                        id_number: "Add ID / passport number",
                        avatar_url: "Upload profile photo",
                      };
                      return (
                        <Link key={f} href="/?wizard=profile" style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          borderRadius: 9, border: "1px dashed var(--border2)",
                          textDecoration: "none", transition: "border-color 0.12s",
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warn)", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1 }}>{labels[f] ?? f}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Danger Zone */}
        <div style={{
          borderRadius: 14, border: "1px solid rgba(255,69,58,0.2)",
          background: "rgba(255,69,58,0.05)", padding: "16px 20px", marginTop: 4,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--err)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Danger Zone
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Download my data", desc: "Download all your data as a ZIP.", action: "Export", danger: false },
              { label: "Delete account", desc: "Permanently deletes all your data.", action: "Delete", danger: true },
            ].map(({ label, desc, action, danger }, i) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                padding: "14px 0",
                borderBottom: i === 0 ? "1px solid rgba(255,69,58,0.1)" : "none",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: danger ? "var(--err)" : "var(--text-1)" }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{desc}</p>
                </div>
                <button style={{
                  flexShrink: 0, height: 32, padding: "0 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.12s",
                  background: "transparent",
                  border: `1px solid ${danger ? "rgba(255,69,58,0.3)" : "var(--border2)"}`,
                  color: danger ? "var(--err)" : "var(--text-2)",
                }}>
                  {action}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
