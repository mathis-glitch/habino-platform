"use client";

import { useState } from "react";
import Link from "next/link";

const G = "#2D6A4F";
const T = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7",
  border: "rgba(0,0,0,0.08)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  font: "'Inter',-apple-system,sans-serif",
  err: "#FF453A", ok: "#34C759",
};

type RequestType = "access" | "delete" | "export" | "rectification" | "restriction" | "object" | "withdraw";

const RIGHTS: { key: RequestType; icon: string; label: string; desc: string; time: string }[] = [
  {
    key: "access",
    icon: "🔍",
    label: "Access My Data",
    desc: "Request a full report of all personal data Habino holds about you.",
    time: "30 days (GDPR) / 21 days (Kenya DPA)",
  },
  {
    key: "export",
    icon: "📦",
    label: "Export My Data",
    desc: "Download all your data in a portable JSON format (GDPR Art. 20).",
    time: "30 days",
  },
  {
    key: "delete",
    icon: "🗑️",
    label: "Delete My Account",
    desc: "Permanently delete your account and all associated data. This cannot be undone.",
    time: "30 days (anonymised within 30 days of confirmation)",
  },
  {
    key: "rectification",
    icon: "✏️",
    label: "Correct My Data",
    desc: "Request correction of inaccurate or incomplete personal data we hold.",
    time: "30 days",
  },
  {
    key: "restriction",
    icon: "⏸️",
    label: "Restrict Processing",
    desc: "Ask us to limit how we process your data in certain circumstances.",
    time: "30 days",
  },
  {
    key: "object",
    icon: "🚫",
    label: "Object to Processing",
    desc: "Object to processing based on legitimate interests or for direct marketing.",
    time: "30 days",
  },
  {
    key: "withdraw",
    icon: "↩️",
    label: "Withdraw Consent",
    desc: "Withdraw any consent you previously gave (e.g. analytics cookies, marketing).",
    time: "Immediate",
  },
];

type Status = "idle" | "submitting" | "success" | "error";

export default function DataRightsPage() {
  const [selected,  setSelected]  = useState<RequestType | null>(null);
  const [email,     setEmail]     = useState("");
  const [name,      setName]      = useState("");
  const [details,   setDetails]   = useState("");
  const [status,    setStatus]    = useState<Status>("idle");
  const [errMsg,    setErrMsg]    = useState("");

  const right = RIGHTS.find(r => r.key === selected);

  async function handleSubmit() {
    if (!email.trim() || !selected) return;
    setStatus("submitting");
    setErrMsg("");

    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selected, email, name, details }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong. Please try again or email privacy@habino.app");
      setStatus("error");
    }
  }

  function reset() {
    setSelected(null);
    setEmail("");
    setName("");
    setDetails("");
    setStatus("idle");
    setErrMsg("");
  }

  // ── Success screen ──
  if (status === "success") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", fontFamily: T.font, background: T.bg }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 8 }}>Request received</h2>
        <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.7, maxWidth: 300, marginBottom: 8 }}>
          We&apos;ve received your <strong>{right?.label}</strong> request and will process it within <strong>{right?.time}</strong>.
        </p>
        <p style={{ fontSize: 13, color: T.text3, marginBottom: 32 }}>
          A confirmation has been sent to <strong>{email}</strong>.
        </p>
        <button onClick={reset} style={{
          padding: "13px 32px", borderRadius: 14, border: "none",
          background: G, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, fontFamily: T.font }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`, padding: "52px 24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Link href="/privacy" style={{ marginRight: 4 }}>
            <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.2)" />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: -0.4 }}>Your Data Rights</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
          Under GDPR, Kenya DPA 2019, UAE PDPL, and international standards, you have the right to access, correct, export, or delete your personal data.
        </p>
      </div>

      <div style={{ padding: "24px 20px 80px" }}>

        {/* Step 1: Choose right */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>1. Choose your request</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RIGHTS.map(r => {
              const active = selected === r.key;
              return (
                <div key={r.key} onClick={() => { setSelected(r.key); setStatus("idle"); }} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "13px 14px", borderRadius: 14,
                  border: active ? `2px solid ${G}` : `1.5px solid ${T.border}`,
                  background: active ? "rgba(45,106,79,0.06)" : T.bg,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? G : T.text1, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.5 }}>{r.desc}</div>
                    {active && (
                      <div style={{ fontSize: 11, color: G, marginTop: 5, fontWeight: 600 }}>⏱ Response: {r.time}</div>
                    )}
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    border: `2px solid ${active ? G : T.border}`,
                    background: active ? G : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Fill form */}
        {selected && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>2. Your contact details</p>

            {selected === "delete" && (
              <div style={{
                background: "rgba(255,69,58,0.08)", border: "1.5px solid rgba(255,69,58,0.25)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 16,
                fontSize: 13, color: "#CC2400", lineHeight: 1.6,
              }}>
                ⚠️ <strong>Account deletion is permanent.</strong> All your listings, messages, and profile data will be irreversibly deleted within 30 days. This action cannot be undone.
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: `1.5px solid ${T.border}`, outline: "none",
                  fontSize: 14, color: T.text1, background: T.bgSoft,
                  boxSizing: "border-box", fontFamily: T.font,
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email address *</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="The email used for your Habino account"
                type="email"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: `1.5px solid ${T.border}`, outline: "none",
                  fontSize: 14, color: T.text1, background: T.bgSoft,
                  boxSizing: "border-box", fontFamily: T.font,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Additional details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Any additional context for your request…"
                rows={3}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: `1.5px solid ${T.border}`, outline: "none",
                  fontSize: 13, color: T.text1, background: T.bgSoft,
                  boxSizing: "border-box", fontFamily: T.font, resize: "none", lineHeight: 1.6,
                }}
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(255,69,58,0.08)", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 12, color: T.err }}>
                {errMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!email.trim() || status === "submitting"}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: email.trim() ? G : T.border,
                color: email.trim() ? "#fff" : T.text3,
                fontSize: 15, fontWeight: 700,
                cursor: email.trim() && status !== "submitting" ? "pointer" : "not-allowed",
                opacity: status === "submitting" ? 0.7 : 1,
                boxShadow: email.trim() ? "0 4px 16px rgba(45,106,79,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              {status === "submitting" ? "Submitting…" : `Submit — ${right?.label}`}
            </button>

            <p style={{ fontSize: 11, color: T.text3, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              We will verify your identity before processing sensitive requests. You may also email{" "}
              <a href="mailto:privacy@habino.app" style={{ color: G }}>privacy@habino.app</a> directly.
            </p>
          </div>
        )}

        {/* Info boxes */}
        <div style={{ marginTop: 32, borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Supervisory Authorities</p>
          {[
            { flag: "🇩🇪🇪🇺", name: "EU / Germany — BfDI", url: "https://www.bfdi.bund.de" },
            { flag: "🇰🇪", name: "Kenya — ODPC", url: "https://www.odpc.go.ke" },
            { flag: "🇦🇪", name: "UAE — UAE Data Office", url: "https://www.uaedataoffice.ae" },
            { flag: "🇪🇹", name: "Ethiopia — Contact us directly", url: null },
          ].map(a => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 20 }}>{a.flag}</span>
              <span style={{ flex: 1, fontSize: 13, color: T.text1, fontWeight: 500 }}>{a.name}</span>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontWeight: 600 }}>Visit →</a>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
          <Link href="/privacy" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Privacy Policy →</Link>
          <Link href="/terms" style={{ fontSize: 13, color: G, fontWeight: 600 }}>Terms of Service →</Link>
        </div>

      </div>
    </div>
  );
}
