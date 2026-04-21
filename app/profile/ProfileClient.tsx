"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#EDEDED",
  border:   "rgba(0,0,0,0.07)",
  border2:  "rgba(0,0,0,0.12)",
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

// ── Verification score definition ────────────────────────────────────────────
// Each field has a label, weight, and description
const SCORE_FIELDS = [
  { key: "full_name",    label: "Full Name",       weight: 10, required: true,  hint: "Your legal full name" },
  { key: "email",        label: "Email Address",   weight: 10, required: true,  hint: "Used for login & notifications" },
  { key: "phone",        label: "Phone Number",    weight: 10, required: true,  hint: "For agent & platform contact" },
  { key: "city",         label: "City",            weight: 5,  required: true,  hint: "Your current city of residence" },
  { key: "avatar_url",   label: "Profile Photo",   weight: 10, required: false, hint: "Builds trust with agents & sellers" },
  { key: "bio",          label: "About Me",        weight: 5,  required: false, hint: "Short description of yourself" },
  { key: "date_of_birth",label: "Date of Birth",   weight: 5,  required: false, hint: "Required for contract generation" },
  { key: "usage_type",   label: "I want to…",      weight: 5,  required: false, hint: "Buy, rent, invest or sell?" },
  { key: "account_type", label: "Account Type",    weight: 5,  required: false, hint: "Private person or business?" },
  { key: "whatsapp",     label: "WhatsApp",        weight: 5,  required: false, hint: "Direct contact for agents" },
  { key: "address",      label: "Home Address",    weight: 5,  required: false, hint: "For contract auto-fill" },
  { key: "country_code", label: "Country",         weight: 5,  required: false, hint: "Your country of residence" },
  { key: "id_number",    label: "ID / Passport",   weight: 15, required: false, hint: "Highest trust level — fully verified" },
] as const;

type FieldKey = typeof SCORE_FIELDS[number]["key"];

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
  date_of_birth?: string;
  usage_type?: string;
  account_type?: string;
  business_name?: string;
  is_agent?: boolean;
}

function computeScore(profile: Profile): number {
  return SCORE_FIELDS.reduce((sum, f) => {
    const val = profile[f.key as FieldKey];
    return sum + (val && String(val).trim() ? f.weight : 0);
  }, 0);
}

const USAGE_LABELS: Record<string, string> = {
  buyer:    "Buy property",
  renter:   "Rent property",
  investor: "Invest in real estate",
  seller:   "Sell / list property",
  agent:    "Work as an agent",
  other:    "Other",
};

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ profile, onSave, onClose }: {
  profile: Profile;
  onSave: (p: Profile) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Profile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const score = computeScore(form);

  function set(key: FieldKey, val: string) {
    setForm(prev => ({ ...prev, [key]: val || undefined }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSave(form); onClose(); }
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", fontFamily: T.font }}>
      <div style={{ background: T.bg, borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text1 }}>Edit Profile</div>
            <div style={{ fontSize: 12, color: T.text3 }}>Score: <strong style={{ color: score >= 100 ? T.ok : score >= 60 ? T.warn : T.err }}>{score}%</strong></div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: T.bgSoft, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke={T.text1} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {/* Personal */}
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Personal Information</div>
          {(["full_name","email","phone","city","country_code","address","whatsapp"] as FieldKey[]).map(key => {
            const f = SCORE_FIELDS.find(x => x.key === key)!;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>
                  {f.label} {f.required && <span style={{ color: T.err }}>*</span>}
                  <span style={{ fontSize: 10, fontWeight: 400, color: T.text3, marginLeft: 6 }}>+{f.weight}%</span>
                </label>
                <input
                  value={form[key] ?? ""}
                  onChange={e => set(key, e.target.value)}
                  placeholder={f.hint}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${form[key] ? T.primary : T.border2}`, fontSize: 14, color: T.text1, background: T.bg, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
                />
              </div>
            );
          })}

          {/* About */}
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, marginTop: 20 }}>About & Preferences</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>
              About Me <span style={{ fontSize: 10, fontWeight: 400, color: T.text3 }}>+5%</span>
            </label>
            <textarea
              value={form.bio ?? ""}
              onChange={e => set("bio" as FieldKey, e.target.value)}
              rows={3}
              placeholder="Short description of yourself..."
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${form.bio ? T.primary : T.border2}`, fontSize: 14, color: T.text1, background: T.bg, fontFamily: T.font, resize: "none", boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>
              Date of Birth <span style={{ fontSize: 10, fontWeight: 400, color: T.text3 }}>+5%</span>
            </label>
            <input type="date"
              value={form.date_of_birth ?? ""}
              onChange={e => set("date_of_birth" as FieldKey, e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${form.date_of_birth ? T.primary : T.border2}`, fontSize: 14, color: T.text1, background: T.bg, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>
              I want to… <span style={{ fontSize: 10, fontWeight: 400, color: T.text3 }}>+5%</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(USAGE_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => set("usage_type" as FieldKey, k)} style={{
                  padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                  border: `1.5px solid ${form.usage_type === k ? T.primary : T.border2}`,
                  background: form.usage_type === k ? T.primaryL : T.bg,
                  color: form.usage_type === k ? T.primary : T.text2,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>
              Account Type <span style={{ fontSize: 10, fontWeight: 400, color: T.text3 }}>+5%</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ k:"private",v:"👤 Private" },{ k:"business",v:"🏢 Business" }].map(({ k, v }) => (
                <button key={k} onClick={() => set("account_type" as FieldKey, k)} style={{
                  flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", fontFamily: T.font,
                  border: `1.5px solid ${form.account_type === k ? T.primary : T.border2}`,
                  background: form.account_type === k ? T.primaryL : T.bg,
                  color: form.account_type === k ? T.primary : T.text2,
                  fontSize: 14, fontWeight: 600,
                }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          {form.account_type === "business" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>Business Name</label>
              <input value={form.business_name ?? ""} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))}
                placeholder="Your company or agency name"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${T.border2}`, fontSize: 14, color: T.text1, background: T.bg, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
            </div>
          )}

          {/* Verification */}
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, marginTop: 20 }}>Identity Verification (+15%)</div>
          <div style={{ background: "rgba(255,159,10,0.07)", border: "1px solid rgba(255,159,10,0.2)", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
              Providing your ID number earns you the highest trust level and unlocks all platform features including contract generation.
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "block", marginBottom: 4 }}>ID / Passport Number</label>
            <input value={form.id_number ?? ""} onChange={e => set("id_number" as FieldKey, e.target.value)}
              placeholder="National ID or passport number"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${form.id_number ? T.primary : T.border2}`, fontSize: 14, color: T.text1, background: T.bg, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 32px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: saving ? T.bgSoft2 : T.primary, color: saving ? T.text3 : "#fff",
            fontSize: 15, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer",
            fontFamily: T.font,
          }}>
            {saving ? "Saving…" : `Save Profile · ${score}% Complete`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r   = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 100 ? T.ok : pct >= 60 ? T.primary : T.warn;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.bgSoft2} strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 0.6s" }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize={pct >= 100 ? 13 : 15} fontWeight="800" fontFamily="Inter,sans-serif">
        {pct >= 100 ? "✓" : `${pct}%`}
      </text>
    </svg>
  );
}

// ── Score breakdown card ─────────────────────────────────────────────────────
function ScoreCard({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const score = computeScore(profile);
  const missing = SCORE_FIELDS.filter(f => !profile[f.key as FieldKey] || !String(profile[f.key as FieldKey]).trim());
  const is100 = score >= 100;

  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {/* Top section */}
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 16 }}>
        <ScoreRing pct={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 3 }}>
            {is100 ? "🏅 Fully Verified" : score >= 60 ? "Trusted Member" : "Basic Profile"}
          </div>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
            {is100
              ? "All profile fields complete. You have maximum trust on Habino."
              : `${100 - score}% remaining to reach Fully Verified status.`}
          </div>
          {is100 && (
            <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "rgba(52,199,89,0.12)", border: "1px solid rgba(52,199,89,0.25)" }}>
              <svg width="10" height="10" fill={T.ok} viewBox="0 0 24 24"><path d="M12 2L14.4 9H22L16 13.8L18.2 21L12 16.5L5.8 21L8 13.8L2 9H9.6L12 2Z"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.ok }}>100% Badge Earned</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ padding: "0 18px 4px", borderTop: `1px solid ${T.border}` }}>
        {SCORE_FIELDS.map(f => {
          const filled = !!(profile[f.key as FieldKey] && String(profile[f.key as FieldKey]).trim());
          return (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: filled ? "rgba(52,199,89,0.15)" : T.bgSoft2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {filled
                  ? <svg width="10" height="10" fill="none" stroke={T.ok} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  : <svg width="8" height="8" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: filled ? T.text2 : T.text2, fontWeight: filled ? 500 : 400 }}>{f.label}</span>
                {f.required && !filled && <span style={{ fontSize: 10, color: T.err, marginLeft: 4, fontWeight: 600 }}>required</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: filled ? T.ok : T.text3 }}>+{f.weight}%</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "12px 18px" }}>
        <button onClick={onEdit} style={{
          width: "100%", padding: "13px", borderRadius: 12,
          background: is100 ? T.bgSoft : T.primary, color: is100 ? T.text2 : "#fff",
          fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font,
        }}>
          {is100 ? "Update Profile" : `Complete Profile → ${100 - score}% remaining`}
        </button>
      </div>
    </div>
  );
}

// ── Create listing / service entry points ─────────────────────────────────────
function CreateCard() {
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Create & Manage</span>
      </div>
      <div style={{ padding: "8px 0" }}>
        <Link href="/listings/new" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", textDecoration: "none", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>List a Property</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 1 }}>Sell or rent your property — AI-assisted in minutes</div>
          </div>
          <svg width="16" height="16" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
        </Link>
        <Link href="/services/new" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", textDecoration: "none" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,159,10,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke={T.warn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>Offer a Service</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 1 }}>List your home services, agency or consultancy</div>
          </div>
          <svg width="16" height="16" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
        </Link>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProfileClient() {
  const [profile,  setProfile]  = useState<Profile>({});
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [currency, setCurrencyState] = useState("ETB");

  useEffect(() => {
    try { setCurrencyState(localStorage.getItem("habino_currency") || "ETB"); } catch { /* ok */ }
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => setProfile(d.profile ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setCurrency(c: string) {
    setCurrencyState(c);
    try { localStorage.setItem("habino_currency", c); } catch { /* ok */ }
  }

  const score    = computeScore(profile);
  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const CURRENCIES = [
    { key: "ETB", label: "ETB — Ethiopian Birr", symbol: "Br" },
    { key: "USD", label: "USD — US Dollar",      symbol: "$" },
    { key: "EUR", label: "EUR — Euro",           symbol: "€" },
  ];

  if (loading) {
    return (
      <div style={{ flex: 1, background: T.bgSoft, padding: "52px 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[90, 320, 140, 160].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 20, background: T.bgSoft2 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: T.bgSoft, overflowY: "auto", fontFamily: T.font }}>

      {/* ── Header ── */}
      <div style={{ background: T.bg, padding: "52px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill={T.primary} />
              <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, letterSpacing: -0.5 }}>habino</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{ padding: "9px 16px", borderRadius: 10, background: T.primaryL, color: T.primary, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}
          >
            Edit Profile
          </button>
        </div>

        {/* Avatar + info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name ?? ""} style={{ width: 68, height: 68, borderRadius: 20, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: 20, background: `linear-gradient(135deg, ${T.primary} 0%, #40916C 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                {initials}
              </div>
            )}
            {score >= 100 && (
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: T.ok, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" fill="#fff" viewBox="0 0 24 24"><path d="M12 2L14.4 9H22L16 13.8L18.2 21L12 16.5L5.8 21L8 13.8L2 9H9.6L12 2Z"/></svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: -0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.full_name || "Your Name"}
            </div>
            <div style={{ fontSize: 13, color: T.text2, marginTop: 1 }}>{profile.email || "No email set"}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {profile.usage_type && (
                <span style={{ padding: "2px 9px", borderRadius: 20, background: T.primaryL, color: T.primary, fontSize: 11, fontWeight: 600 }}>
                  {USAGE_LABELS[profile.usage_type] ?? profile.usage_type}
                </span>
              )}
              <span style={{ padding: "2px 9px", borderRadius: 20, background: score >= 100 ? "rgba(52,199,89,0.12)" : T.bgSoft2, color: score >= 100 ? T.ok : T.text3, fontSize: 11, fontWeight: 700 }}>
                {score >= 100 ? "🏅 Fully Verified" : `${score}% verified`}
              </span>
              {profile.account_type === "business" && profile.business_name && (
                <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(255,159,10,0.1)", color: T.warn, fontSize: 11, fontWeight: 600 }}>
                  🏢 {profile.business_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Create / manage */}
        <CreateCard />

        {/* Score card */}
        <ScoreCard profile={profile} onEdit={() => setEditing(true)} />

        {/* Currency */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Display Currency</span>
          </div>
          <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {CURRENCIES.map(c => (
              <button key={c.key} onClick={() => setCurrency(c.key)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                border: `1.5px solid ${currency === c.key ? T.primary : T.border2}`,
                background: currency === c.key ? T.primaryL : T.bg,
                cursor: "pointer", textAlign: "left", fontFamily: T.font,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: currency === c.key ? T.primary : T.bgSoft2, color: currency === c.key ? "#fff" : T.text2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                  {c.symbol}
                </div>
                <span style={{ fontSize: 14, fontWeight: currency === c.key ? 700 : 500, color: currency === c.key ? T.primary : T.text1, flex: 1 }}>{c.label}</span>
                {currency === c.key && <svg width="16" height="16" fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>}
              </button>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Account</span>
          </div>
          {[
            { label: "Privacy & Data", icon: "🔒", href: "/privacy" },
            { label: "Terms of Service", icon: "📄", href: "/terms" },
            { label: "Help & Support",  icon: "💬", href: "/help" },
          ].map(({ label, icon, href }) => (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${T.border}`, textDecoration: "none" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: T.text1, fontWeight: 500 }}>{label}</span>
              <svg width="14" height="14" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
          <div style={{ padding: "14px 18px" }}>
            <button style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(255,69,58,0.07)", color: T.err, fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,69,58,0.2)", cursor: "pointer", fontFamily: T.font }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Privacy & Data Rights (GDPR / Kenya DPA / UAE PDPL) ── */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Privacy & Your Rights</span>
          </div>
          {[
            { label: "Access my data",          icon: "🔍", href: "/privacy/data-rights?type=access" },
            { label: "Export my data (GDPR)",    icon: "📦", href: "/privacy/data-rights?type=export" },
            { label: "Manage cookie consent",    icon: "🍪", href: null, action: () => { localStorage.removeItem("habino_cookie_consent"); window.location.reload(); } },
            { label: "Your Data Rights portal",  icon: "⚖️", href: "/privacy/data-rights" },
          ].map(({ label, icon, href, action }) =>
            href ? (
              <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: `1px solid ${T.border}`, textDecoration: "none" }}>
                <span style={{ fontSize: 17 }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: T.text1, fontWeight: 500 }}>{label}</span>
                <svg width="13" height="13" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
              </Link>
            ) : (
              <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", background: "none", border: "none", borderBottom: `1px solid ${T.border}`, width: "100%", cursor: "pointer", fontFamily: T.font, textAlign: "left" as const }}>
                <span style={{ fontSize: 17 }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: T.text1, fontWeight: 500 }}>{label}</span>
                <svg width="13" height="13" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
              </button>
            )
          )}
          {/* Delete account — prominent, destructive */}
          <div style={{ padding: "14px 18px" }}>
            <Link href="/privacy/data-rights?type=delete" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 12,
              background: "rgba(255,69,58,0.07)",
              border: "1px solid rgba(255,69,58,0.18)",
              textDecoration: "none",
            }}>
              <span style={{ fontSize: 17 }}>🗑️</span>
              <span style={{ flex: 1, fontSize: 13, color: T.err, fontWeight: 700 }}>Delete my account & data</span>
              <svg width="13" height="13" fill="none" stroke={T.err} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
            </Link>
            <p style={{ fontSize: 10, color: T.text3, marginTop: 8, lineHeight: 1.6, textAlign: "center" }}>
              GDPR Art. 17 · Kenya DPA s.35 · UAE PDPL Art. 17 — Your right to erasure
            </p>
          </div>
        </div>

        <p style={{ fontSize: 11, color: T.text3, textAlign: "center" }}>Habino v2.0 · East Africa</p>
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <EditModal
          profile={profile}
          onSave={setProfile}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
