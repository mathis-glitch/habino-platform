"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const G = "#2D6A4F";
const T = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7",
  border: "rgba(0,0,0,0.08)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  font: "'Inter',-apple-system,sans-serif",
};

export type ConsentLevel = "essential" | "analytics" | "all";

export interface ConsentRecord {
  level: ConsentLevel;
  timestamp: string;
  version: string;
}

const CONSENT_KEY    = "habino_cookie_consent";
const CONSENT_VER   = "1.0";

export function getStoredConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasConsented(): boolean {
  return getStoredConsent() !== null;
}

function storeConsent(level: ConsentLevel) {
  const record: ConsentRecord = {
    level,
    timestamp: new Date().toISOString(),
    version: CONSENT_VER,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

// ── Detailed settings panel ───────────────────────────────────────────────────
function ConsentSettings({ onSave, onBack }: { onSave: (level: ConsentLevel) => void; onBack: () => void }) {
  const [analytics,  setAnalytics]  = useState(false);
  const [marketing,  setMarketing]  = useState(false);

  function save() {
    const level: ConsentLevel = marketing ? "all" : analytics ? "analytics" : "essential";
    onSave(level);
  }

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 }}>Manage preferences</h3>
      <p style={{ fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.6 }}>
        You can choose which categories of cookies you allow. Essential cookies cannot be disabled — they are required for the app to function.
      </p>

      {[
        {
          key: "essential",
          label: "Essential",
          desc: "Authentication, session management, security. Always active.",
          value: true,
          fixed: true,
          set: () => {},
        },
        {
          key: "analytics",
          label: "Analytics",
          desc: "Anonymous usage statistics that help us improve the app (Vercel Analytics). No personal data is shared.",
          value: analytics,
          fixed: false,
          set: setAnalytics,
        },
        {
          key: "marketing",
          label: "Marketing",
          desc: "Personalised content and service recommendations based on your activity within the app.",
          value: marketing,
          fixed: false,
          set: setMarketing,
        },
      ].map(item => (
        <div key={item.key} style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "13px 0",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.6 }}>{item.desc}</div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => !item.fixed && item.set(!item.value)}
            disabled={item.fixed}
            style={{
              flexShrink: 0,
              width: 44, height: 26, borderRadius: 13,
              border: "none", cursor: item.fixed ? "not-allowed" : "pointer",
              background: item.value ? G : "#D1D5DB",
              position: "relative", transition: "background 0.2s",
              opacity: item.fixed ? 0.6 : 1,
            }}
          >
            <div style={{
              position: "absolute", top: 3,
              left: item.value ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: "11px 0", borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: T.bg,
          color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>Back</button>
        <button onClick={save} style={{
          flex: 2, padding: "11px 0", borderRadius: 12, border: "none",
          background: G, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>Save preferences</button>
      </div>
    </div>
  );
}

// ── Main banner ───────────────────────────────────────────────────────────────
export default function CookieBanner() {
  const [visible,      setVisible]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!hasConsented()) setVisible(true);
  }, []);

  function accept(level: ConsentLevel) {
    storeConsent(level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop — light, non-blocking */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9900,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
      }} />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 9901,
        background: T.bg,
        borderRadius: showSettings ? "22px 22px 0 0" : "22px 22px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        fontFamily: T.font,
        overflow: "hidden",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)" }} />
        </div>

        {showSettings ? (
          <ConsentSettings onSave={accept} onBack={() => setShowSettings(false)} />
        ) : (
          <div style={{ padding: "8px 20px 28px" }}>
            {/* Icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: "rgba(45,106,79,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>🍪</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text1 }}>We value your privacy</div>
                <div style={{ fontSize: 11, color: T.text3 }}>habino.app</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, marginBottom: 16 }}>
              We use cookies and similar technologies to provide our services, remember your preferences, and improve your experience.
              By accepting, you consent to our use of cookies in accordance with the{" "}
              <Link href="/privacy" style={{ color: G, fontWeight: 600 }}>Privacy Policy</Link>{" "}
              and{" "}
              <Link href="/terms" style={{ color: G, fontWeight: 600 }}>Terms of Service</Link>.
            </p>

            {/* Jurisdiction note */}
            <div style={{
              background: "rgba(45,106,79,0.06)", borderRadius: 10,
              padding: "9px 12px", marginBottom: 16,
              fontSize: 11, color: T.text2, lineHeight: 1.6,
            }}>
              🌍 Our data practices comply with <strong>GDPR</strong> (EU/Germany), the <strong>Kenya Data Protection Act 2019</strong>, <strong>UAE PDPL</strong>, and applicable Ethiopian data protection regulations.
            </div>

            {/* Buttons */}
            <button onClick={() => accept("all")} style={{
              width: "100%", padding: "13px 0", borderRadius: 13, border: "none",
              background: G, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", marginBottom: 10,
              boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
            }}>
              Accept all
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => accept("essential")} style={{
                flex: 1, padding: "11px 0", borderRadius: 12,
                border: `1.5px solid ${T.border}`, background: T.bg,
                color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Essential only
              </button>
              <button onClick={() => setShowSettings(true)} style={{
                flex: 1, padding: "11px 0", borderRadius: 12,
                border: `1.5px solid ${T.border}`, background: T.bg,
                color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Manage
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
