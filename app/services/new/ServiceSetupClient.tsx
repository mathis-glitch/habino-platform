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

const CATEGORIES = [
  { key: "cleaning",  label: "Cleaning",       emoji: "🧹" },
  { key: "garden",    label: "Gardening",       emoji: "🌿" },
  { key: "household", label: "Household Help",  emoji: "🏠" },
  { key: "plumbing",  label: "Plumbing",        emoji: "🔧" },
  { key: "electric",  label: "Electrical",      emoji: "⚡" },
  { key: "moving",    label: "Moving",          emoji: "📦" },
  { key: "security",  label: "Security",        emoji: "🔒" },
  { key: "painting",  label: "Painting",        emoji: "🎨" },
  { key: "ac",        label: "AC & Appliances", emoji: "❄️" },
  { key: "petcare",   label: "Pet Care",        emoji: "🐾" },
];

const DISTRICT_OPTIONS = [
  "Bole","CMC","CMC Michael","Kazanchis","Sarbet","Piassa","Megenagna",
  "Yeka","Gullele","Kotebe","Lafto","Kirkos","Arada","Lideta","Nifas Silk","Kolfe","Akaki",
  "Gerji","Summit","Ayat","Jemo","All districts",
];

interface ServiceDraft {
  name: string;
  category: string;
  description: string;
  tags: string[];
  districts: string[];
  price: string;
  phone: string;
  working_hours: string;
  response_time: string;
  staff: string;
  languages: string[];
  founded: string;
  highlights: string[];
}

const EMPTY: ServiceDraft = {
  name: "", category: "", description: "", tags: [], districts: [],
  price: "", phone: "", working_hours: "", response_time: "",
  staff: "", languages: [], founded: "", highlights: [],
};

type Step = "describe" | "review" | "saving" | "done";

export default function ServiceSetupClient() {
  const [step,  setStep]  = useState<Step>("describe");
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function update(d: Partial<ServiceDraft>) { setDraft(prev => ({ ...prev, ...d })); }
  function toggleDistrict(d: string) {
    update({ districts: draft.districts.includes(d) ? draft.districts.filter(x => x !== d) : [...draft.districts, d] });
  }
  function addTag(t: string) {
    const tag = t.trim();
    if (tag && !draft.tags.includes(tag)) update({ tags: [...draft.tags, tag] });
    setTagInput("");
  }
  function removeTag(t: string) { update({ tags: draft.tags.filter(x => x !== t) }); }

  async function save() {
    if (!draft.name || !draft.category) { setError("Name and category are required."); return; }
    setStep("saving");
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: err } = await supabase.from("service_providers").insert({
        name:         draft.name,
        category:     draft.category,
        description:  draft.description,
        tags:         draft.tags,
        districts:    draft.districts,
        price:        draft.price || null,
        phone:        draft.phone || null,
        working_hours: draft.working_hours || null,
        response_time: draft.response_time || null,
        staff:        draft.staff || null,
        languages:    draft.languages,
        founded:      draft.founded || null,
        highlights:   draft.highlights,
        verified:     false,
        rating:       null,
        reviews:      0,
      });
      if (err) { setError(err.message); setStep("review"); return; }
      setStep("done");
    } catch (e) { setError(String(e)); setStep("review"); }
  }

  if (step === "done") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", fontFamily: T.font }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text1, marginBottom: 8 }}>Service Listed!</div>
        <div style={{ fontSize: 15, color: T.text2, lineHeight: 1.6, marginBottom: 28, maxWidth: 300 }}>
          Your service is now visible in the Services directory.
        </div>
        <a href="/services" style={{ padding: "16px 32px", borderRadius: 14, background: T.primary, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          View in Services →
        </a>
        <a href="/services/new" style={{ fontSize: 13, color: T.primary, fontWeight: 600, marginTop: 16 }}>+ List another service</a>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <a href="/services" style={{ width: 34, height: 34, borderRadius: 10, background: T.bgSoft, border: `1px solid ${T.border2}`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke={T.text2} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text1 }}>List a Service</div>
            <div style={{ fontSize: 12, color: T.text3 }}>
              {step === "describe" ? "🎤 Step 1: Describe your service" : "📋 Step 2: Review & publish"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {["Describe", "Review", "Publish"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= (step === "describe" ? 0 : 1) ? T.primary : T.bgSoft2, transition: "background 0.3s" }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>

        {/* Step 1: AI Describe */}
        {step === "describe" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <AIDescribeInput
              type="service"
              onDraft={d => {
                update({
                  name:          String(d.name || ""),
                  category:      String(d.category || ""),
                  description:   String(d.description || ""),
                  tags:          Array.isArray(d.tags) ? d.tags as string[] : [],
                  districts:     Array.isArray(d.districts) ? d.districts as string[] : [],
                  price:         String(d.price || ""),
                  phone:         String(d.phone || ""),
                  working_hours: String(d.working_hours || ""),
                  response_time: String(d.response_time || ""),
                  staff:         String(d.staff || ""),
                  languages:     Array.isArray(d.languages) ? d.languages as string[] : [],
                  founded:       String(d.founded || ""),
                  highlights:    Array.isArray(d.highlights) ? d.highlights as string[] : [],
                });
                setStep("review");
              }}
            />
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep("review")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.text3, fontFamily: T.font, textDecoration: "underline" }}>
                Skip and fill in manually →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review / Edit */}
        {(step === "review" || step === "saving") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.2)", fontSize: 13, color: T.err }}>{error}</div>
            )}

            {/* Name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Service / Company Name *</label>
              <input value={draft.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Selam Clean Pro"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.name ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Category */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Category *</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map(c => {
                  const on = draft.category === c.key;
                  return (
                    <button key={c.key} onClick={() => update({ category: c.key })} style={{
                      padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${on ? T.primary : T.border2}`,
                      background: on ? T.primaryL : T.bg,
                      color: on ? T.primary : T.text2, fontSize: 13, fontWeight: on ? 700 : 500,
                    }}>
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={draft.description} onChange={e => update({ description: e.target.value })} rows={3}
                placeholder="Describe your services, team, and what makes you stand out…"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.description ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {draft.tags.map(t => (
                  <span key={t} style={{ padding: "5px 10px", borderRadius: 20, background: T.primaryL, color: T.primary, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    {t}
                    <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }}}
                  placeholder="Add tag (Enter to add)"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, outline: "none" }} />
                <button onClick={() => addTag(tagInput)} style={{ padding: "10px 16px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: T.font }}>+</button>
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
                    <button key={d} onClick={() => toggleDistrict(d)} style={{
                      padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${on ? T.primary : T.border2}`,
                      background: on ? T.primaryL : T.bg,
                      color: on ? T.primary : T.text2, fontSize: 12, fontWeight: on ? 700 : 500,
                    }}>{on ? "✓ " : ""}{d}</button>
                  );
                })}
              </div>
            </div>

            {/* Price + Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Pricing</label>
                <input value={draft.price} onChange={e => update({ price: e.target.value })} placeholder="e.g. From ETB 800/session"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.price ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Phone</label>
                <input value={draft.phone} onChange={e => update({ phone: e.target.value })} placeholder="+251 9…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.phone ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* Working hours + response time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Working Hours</label>
                <input value={draft.working_hours} onChange={e => update({ working_hours: e.target.value })} placeholder="e.g. Mon–Sat 7:00–18:00"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.working_hours ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Response Time</label>
                <input value={draft.response_time} onChange={e => update({ response_time: e.target.value })} placeholder="e.g. < 1 hour"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.response_time ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* Staff */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Team / Staff</label>
              <input value={draft.staff} onChange={e => update({ staff: e.target.value })} placeholder="e.g. 8 trained cleaners"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${draft.staff ? T.primary : T.border2}`, fontSize: 14, color: T.text1, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* CTA */}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep("describe")} style={{ flex: 1, padding: "14px", borderRadius: 14, background: T.bgSoft, color: T.text2, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font }}>
                ← Back
              </button>
              <button
                onClick={save}
                disabled={step === "saving" || !draft.name || !draft.category}
                style={{
                  flex: 2, padding: "14px", borderRadius: 14,
                  background: (step === "saving" || !draft.name || !draft.category) ? T.bgSoft2 : T.primary,
                  color: (step === "saving" || !draft.name || !draft.category) ? T.text3 : "#fff",
                  fontSize: 14, fontWeight: 700, border: "none",
                  cursor: (step === "saving" || !draft.name || !draft.category) ? "not-allowed" : "pointer", fontFamily: T.font,
                }}
              >
                {step === "saving" ? "Saving…" : "🚀 Publish Service"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
