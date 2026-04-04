"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { AIDescribeInput } from "@/components/AIDescribeInput";

const T = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7", bgSoft2: "#EDEDED",
  border: "rgba(0,0,0,0.07)", border2: "rgba(0,0,0,0.12)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  primary: "#2D6A4F", primaryL: "rgba(45,106,79,0.09)",
  ok: "#34C759", err: "#FF453A",
  font: "'Inter',-apple-system,sans-serif",
};

const SPECIALITY_OPTIONS = [
  "Luxury Residential","Commercial Properties","Land & Plots","Expat Relocation",
  "Rental Management","Off-Plan Investment","NGO & Embassy Housing",
  "Short-Term Rentals","Property Management","Industrial & Warehousing",
];

const DISTRICT_OPTIONS = [
  "Bole","CMC","CMC Michael","Kazanchis","Sarbet","Piassa","Megenagna",
  "Yeka","Gullele","Kotebe","Lafto","Kirkos","Arada","Lideta","Nifas Silk","Kolfe","Akaki",
  "Gerji","Summit","Ayat","Jemo","Saris",
];

const LANGUAGE_OPTIONS = ["Amharic","English","Oromo","Somali","Tigrinya","German","French","Arabic","Italian"];

interface BrokerDraft {
  full_name: string;
  agency: string;
  bio: string;
  speciality: string[];
  districts: string[];
  years_exp: string;
  languages: string[];
  phone: string;
  whatsapp: string;
  certifications: string;
  services_offered: string[];
  avg_deal_size: string;
  response_time: string;
}

const EMPTY: BrokerDraft = {
  full_name: "", agency: "", bio: "", speciality: [], districts: [],
  years_exp: "", languages: [], phone: "", whatsapp: "",
  certifications: "", services_offered: [], avg_deal_size: "", response_time: "",
};

type Step = "describe" | "review" | "saving" | "done";

export default function BrokerSetupClient() {
  const [step,  setStep]  = useState<Step>("describe");
  const [draft, setDraft] = useState<BrokerDraft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function update(d: Partial<BrokerDraft>) { setDraft(prev => ({ ...prev, ...d })); }
  function toggle<K extends keyof BrokerDraft>(key: K, val: string) {
    const cur = draft[key] as string[];
    update({ [key]: cur.includes(val) ? cur.filter((x: string) => x !== val) : [...cur, val] } as Partial<BrokerDraft>);
  }

  async function save(status: "draft" | "active") {
    setStep("saving");
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in."); setStep("review"); return; }

      const { error: err } = await supabase
        .from("broker_profiles")
        .upsert({
          user_id:    user.id,
          full_name:  draft.full_name || user.email?.split("@")[0],
          agency:     draft.agency || null,
          bio:        draft.bio || null,
          speciality: draft.speciality,
          districts:  draft.districts,
          years_exp:  parseInt(draft.years_exp) || null,
          languages:  draft.languages,
          phone:      draft.phone || null,
          whatsapp:   draft.whatsapp || null,
          verified:   false,
        }, { onConflict: "user_id" });

      if (err) { setError(err.message); setStep("review"); return; }
      setStep("done");
    } catch (e) {
      setError(String(e));
      setStep("review");
    }
  }

  if (step === "done") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", fontFamily: T.font }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text1, marginBottom: 8 }}>Profile Created!</div>
        <div style={{ fontSize: 15, color: T.text2, lineHeight: 1.6, marginBottom: 28, maxWidth: 300 }}>
          Your broker profile is live. Clients can now find you in the Broker directory.
        </div>
        <a href="/markt" style={{ padding: "16px 32px", borderRadius: 14, background: T.primary, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          View in Directory →
        </a>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: 10, background: T.bgSoft, border: `1px solid ${T.border2}`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke={T.text2} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text1 }}>Create Broker Profile</div>
            <div style={{ fontSize: 12, color: T.text3 }}>
              {step === "describe" ? "🎤 Step 1: Describe yourself" : "📋 Step 2: Review & edit"}
            </div>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {["Describe", "Review & Edit", "Publish"].map((s, i) => {
            const idx = step === "describe" ? 0 : 1;
            return (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? T.primary : T.bgSoft2, transition: "background 0.3s" }} />
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>

        {/* ── Step 1: AI Describe ── */}
        {step === "describe" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <AIDescribeInput
              type="broker"
              onDraft={d => {
                update({
                  full_name:        String(d.full_name || ""),
                  agency:           String(d.agency || ""),
                  bio:              String(d.bio || ""),
                  speciality:       Array.isArray(d.speciality) ? d.speciality as string[] : [],
                  districts:        Array.isArray(d.districts) ? d.districts as string[] : [],
                  years_exp:        d.years_exp != null ? String(d.years_exp) : "",
                  languages:        Array.isArray(d.languages) ? d.languages as string[] : [],
                  phone:            String(d.phone || ""),
                  whatsapp:         String(d.whatsapp || ""),
                  services_offered: Array.isArray(d.services_offered) ? d.services_offered as string[] : [],
                  avg_deal_size:    String(d.avg_deal_size || ""),
                  response_time:    String(d.response_time || ""),
                });
                setStep("review");
              }}
            />
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep("review")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: T.text3, fontFamily: T.font, textDecoration: "underline",
              }}>
                Skip and fill in manually →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review / Edit ── */}
        {(step === "review" || step === "saving") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.2)", fontSize: 13, color: T.err }}>
                {error}
              </div>
            )}

            {/* Name + Agency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                { key: "full_name" as const, label: "Full Name", placeholder: "Your full name" },
                { key: "agency"    as const, label: "Agency / Company", placeholder: "Independent if blank" },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>
                  <input value={draft[key]} onChange={e => update({ [key]: e.target.value })} placeholder={placeholder}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft[key] ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
                </div>
              ))}
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Professional Bio</label>
              <textarea value={draft.bio} onChange={e => update({ bio: e.target.value })} rows={4}
                placeholder="Tell clients about your experience, specialisations, and what makes you different…"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.bio ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Years experience + response time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Years Experience</label>
                <input type="number" min="0" max="50" value={draft.years_exp} onChange={e => update({ years_exp: e.target.value })} placeholder="e.g. 8"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.years_exp ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Avg Response Time</label>
                <input value={draft.response_time} onChange={e => update({ response_time: e.target.value })} placeholder="e.g. Within 2 hours"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.response_time ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* Speciality chips */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Specialisations ({draft.speciality.length} selected)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SPECIALITY_OPTIONS.map(s => {
                  const on = draft.speciality.includes(s);
                  return (
                    <button key={s} onClick={() => toggle("speciality", s)} style={{
                      padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${on ? T.primary : T.border2}`,
                      background: on ? T.primaryL : T.bg,
                      color: on ? T.primary : T.text2,
                      fontSize: 12, fontWeight: on ? 700 : 500,
                    }}>{on ? "✓ " : ""}{s}</button>
                  );
                })}
              </div>
            </div>

            {/* Districts */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Districts Served ({draft.districts.length} selected)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DISTRICT_OPTIONS.map(d => {
                  const on = draft.districts.includes(d);
                  return (
                    <button key={d} onClick={() => toggle("districts", d)} style={{
                      padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${on ? T.primary : T.border2}`,
                      background: on ? T.primaryL : T.bg,
                      color: on ? T.primary : T.text2,
                      fontSize: 12, fontWeight: on ? 700 : 500,
                    }}>{on ? "✓ " : ""}{d}</button>
                  );
                })}
              </div>
            </div>

            {/* Languages */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Languages
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {LANGUAGE_OPTIONS.map(l => {
                  const on = draft.languages.includes(l);
                  return (
                    <button key={l} onClick={() => toggle("languages", l)} style={{
                      padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${on ? T.primary : T.border2}`,
                      background: on ? T.primaryL : T.bg,
                      color: on ? T.primary : T.text2,
                      fontSize: 12, fontWeight: on ? 700 : 500,
                    }}>{on ? "✓ " : ""}{l}</button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Phone</label>
                <input value={draft.phone} onChange={e => update({ phone: e.target.value })} placeholder="+251 9…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.phone ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>WhatsApp</label>
                <input value={draft.whatsapp} onChange={e => update({ whatsapp: e.target.value })} placeholder="+251 9…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.whatsapp ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep("describe")} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
                ← Back
              </button>
              <button
                onClick={() => save("active")}
                disabled={step === "saving" || !draft.full_name}
                style={{
                  flex: 2, padding: "14px", borderRadius: 14,
                  background: (step === "saving" || !draft.full_name) ? T.bgSoft2 : T.primary,
                  color: (step === "saving" || !draft.full_name) ? T.text3 : "#fff",
                  fontSize: 14, fontWeight: 700, border: "none",
                  cursor: (step === "saving" || !draft.full_name) ? "not-allowed" : "pointer", fontFamily: T.font,
                }}
              >
                {step === "saving" ? "Saving…" : "🚀 Create Broker Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
