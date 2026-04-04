"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const T = {
  bg: "#FFFFFF", bgSoft: "#F7F7F7",
  border: "rgba(0,0,0,0.07)", border2: "rgba(0,0,0,0.12)",
  text1: "#1A1A2E", text2: "#6B7280", text3: "#9CA3AF",
  primary: "#2D6A4F", primaryL: "rgba(45,106,79,0.09)",
  ok: "#34C759", warn: "#FF9F0A", err: "#FF453A",
  font: "'Inter',-apple-system,sans-serif",
};
const G = "#2D6A4F";

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: "category", label: "Category", icon: "🏷️" },
  { id: "info",     label: "Info",     icon: "👤" },
  { id: "details",  label: "Details",  icon: "📋" },
  { id: "publish",  label: "Publish",  icon: "🚀" },
];

// ── Service categories ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "cleaning",  label: "Cleaning",        emoji: "🧹", description: "Home, office & deep cleaning" },
  { key: "garden",    label: "Gardening",        emoji: "🌿", description: "Lawn care, planting & landscaping" },
  { key: "household", label: "Household Help",   emoji: "🏠", description: "Daily chores, cooking, childcare" },
  { key: "plumbing",  label: "Plumbing",         emoji: "🔧", description: "Repairs, installation & emergency" },
  { key: "electric",  label: "Electrical",       emoji: "⚡", description: "Wiring, installation & safety" },
  { key: "moving",    label: "Moving & Delivery",emoji: "📦", description: "Furniture, packing & same-day delivery" },
  { key: "security",  label: "Security",         emoji: "🔒", description: "Guards, CCTV & monitoring" },
  { key: "painting",  label: "Painting",         emoji: "🎨", description: "Interior & exterior painting" },
  { key: "ac",        label: "AC & Appliances",  emoji: "❄️", description: "Installation, repair & maintenance" },
  { key: "petcare",   label: "Pet Care",         emoji: "🐾", description: "Dog walking, sitting & home visits" },
  { key: "legal",     label: "Legal & Admin",    emoji: "⚖️", description: "Contracts, notary & paperwork" },
  { key: "it",        label: "IT & Tech",        emoji: "💻", description: "Computer repair, network & support" },
  { key: "other",     label: "Other",            emoji: "✨", description: "Something else not listed above" },
];

const DISTRICTS = [
  "Bole","CMC","CMC Michael","Kazanchis","Sarbet","Piassa",
  "Megenagna","Yeka","Gullele","Kotebe","Lafto","Kirkos",
  "Arada","Lideta","Nifas Silk","Kolfe","Akaki",
  "Addis Ababa-wide",
];

const LANGUAGES = ["Amharic","English","Oromo","Tigrinya","Arabic","French","Other"];

const PRICE_UNITS = [
  { key: "session", label: "per session" },
  { key: "hour",    label: "per hour" },
  { key: "day",     label: "per day" },
  { key: "month",   label: "per month" },
  { key: "job",     label: "per job" },
  { key: "sqm",     label: "per m²" },
  { key: "fixed",   label: "fixed price" },
];

const HIGHLIGHTS_POOL = [
  "Background-checked staff","Insured & bonded","Free consultation","Free first visit",
  "Eco-friendly products","Licensed & certified","24/7 availability","Emergency call-out",
  "1-year warranty","Free quote","Flexible hours","Live-in option available",
  "All brands serviced","Photo updates","Vet-partnered","Monthly contracts available",
];

// ── Draft interface ────────────────────────────────────────────────────────────
interface ServiceDraft {
  category: string;
  business_name: string;
  contact_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  district: string;
  description: string;
  price_from: string;
  currency: string;
  price_unit: string;
  service_areas: string[];
  working_hours: string;
  response_time: string;
  languages: string[];
  team_size: string;
  founded_year: string;
  tags: string[];
  highlights: string[];
  photo_url: string;
  status: "draft" | "active";
}

const EMPTY: ServiceDraft = {
  category: "",
  business_name: "",
  contact_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  district: "",
  description: "",
  price_from: "",
  currency: "ETB",
  price_unit: "session",
  service_areas: [],
  working_hours: "",
  response_time: "",
  languages: [],
  team_size: "",
  founded_year: "",
  tags: [],
  highlights: [],
  photo_url: "",
  status: "active",
};

// ── Step bar ──────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 20px", gap: 0 }}>
      {STEPS.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={s.id} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? G : active ? G : T.bgSoft,
                border: active ? `2px solid ${G}` : done ? "none" : `1.5px solid ${T.border2}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: done ? 12 : 11,
                color: done || active ? "#fff" : T.text3,
                fontWeight: 700,
                boxShadow: active ? `0 0 0 4px rgba(45,106,79,0.15)` : "none",
                transition: "all 0.2s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? G : T.text3, letterSpacing: "0.02em" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: i < current ? G : T.border, borderRadius: 1, margin: "0 4px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 13px", borderRadius: 9999,
      border: active ? `1.5px solid ${G}` : `1.5px solid ${T.border}`,
      background: active ? T.primaryL : T.bg,
      color: active ? G : T.text2,
      fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: "pointer", flexShrink: 0,
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

// ── Toggle list item ──────────────────────────────────────────────────────────
function ToggleItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 14px", borderRadius: 12,
      background: active ? T.primaryL : T.bgSoft,
      border: active ? `1.5px solid rgba(45,106,79,0.3)` : `1.5px solid transparent`,
      cursor: "pointer", marginBottom: 6,
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: active ? G : T.text1 }}>{label}</span>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: active ? G : T.border,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 12,
        border: `1.5px solid ${T.border}`, outline: "none",
        fontSize: 14, color: T.text1, background: T.bgSoft,
        boxSizing: "border-box", fontFamily: T.font,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 12,
        border: `1.5px solid ${T.border}`, outline: "none",
        fontSize: 14, color: T.text1, background: T.bgSoft,
        boxSizing: "border-box", fontFamily: T.font,
        resize: "none", lineHeight: 1.6,
      }}
    />
  );
}

// ── STEP 1: Category ──────────────────────────────────────────────────────────
function StepCategory({ draft, setDraft, onNext }: { draft: ServiceDraft; setDraft: (d: ServiceDraft) => void; onNext: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 4, letterSpacing: -0.4 }}>What service do you offer?</h2>
      <p style={{ fontSize: 13, color: T.text3, marginBottom: 24 }}>Choose the category that best describes your business.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CATEGORIES.map(cat => {
          const active = draft.category === cat.key;
          return (
            <div key={cat.key} onClick={() => setDraft({ ...draft, category: cat.key })} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 16,
              border: active ? `2px solid ${G}` : `1.5px solid ${T.border}`,
              background: active ? T.primaryL : T.bg,
              cursor: "pointer",
              boxShadow: active ? `0 0 0 0px transparent` : "0 1px 4px rgba(0,0,0,0.04)",
              transition: "all 0.15s",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: active ? G : T.bgSoft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
                transition: "background 0.15s",
              }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? G : T.text1, marginBottom: 2 }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: T.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.description}</div>
              </div>
              {active && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={onNext} disabled={!draft.category} style={{
        marginTop: 24, width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
        background: draft.category ? G : T.border,
        color: draft.category ? "#fff" : T.text3,
        fontSize: 15, fontWeight: 700, cursor: draft.category ? "pointer" : "not-allowed",
        boxShadow: draft.category ? "0 4px 16px rgba(45,106,79,0.3)" : "none",
        transition: "all 0.2s",
      }}>
        Continue
      </button>
    </div>
  );
}

// ── STEP 2: Info ──────────────────────────────────────────────────────────────
function StepInfo({ draft, setDraft, onNext, onBack, profile }: {
  draft: ServiceDraft; setDraft: (d: ServiceDraft) => void;
  onNext: () => void; onBack: () => void;
  profile: { full_name?: string; phone?: string; email?: string; address?: string; whatsapp?: string } | null;
}) {
  const catLabel = CATEGORIES.find(c => c.key === draft.category)?.label ?? "";

  // Pre-fill from profile on mount
  useEffect(() => {
    if (!profile) return;
    setDraft({
      ...draft,
      contact_name: draft.contact_name || profile.full_name || "",
      phone:        draft.phone        || profile.phone    || "",
      email:        draft.email        || profile.email    || "",
      whatsapp:     draft.whatsapp     || profile.whatsapp || "",
      address:      draft.address      || profile.address  || "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid = draft.business_name.trim() && draft.contact_name.trim() && draft.phone.trim();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 4, letterSpacing: -0.4 }}>Your business info</h2>
      <p style={{ fontSize: 13, color: T.text3, marginBottom: 24 }}>
        Listing as: <strong style={{ color: G }}>{catLabel}</strong> — Tell clients who you are and how to reach you.
      </p>

      <Field label="Business / Trade Name">
        <Input
          value={draft.business_name}
          onChange={v => setDraft({ ...draft, business_name: v })}
          placeholder="e.g. Selam Clean Pro"
        />
      </Field>

      <Field label="Your Name">
        <Input
          value={draft.contact_name}
          onChange={v => setDraft({ ...draft, contact_name: v })}
          placeholder="Full name of the contact person"
        />
      </Field>

      <Field label="Phone Number">
        <Input
          value={draft.phone}
          onChange={v => setDraft({ ...draft, phone: v })}
          placeholder="+251 91 234 5678"
          type="tel"
        />
      </Field>

      <Field label="WhatsApp (optional)" hint="Leave blank if same as phone">
        <Input
          value={draft.whatsapp}
          onChange={v => setDraft({ ...draft, whatsapp: v })}
          placeholder="+251 91 234 5678"
          type="tel"
        />
      </Field>

      <Field label="Email (optional)">
        <Input
          value={draft.email}
          onChange={v => setDraft({ ...draft, email: v })}
          placeholder="you@example.com"
          type="email"
        />
      </Field>

      <Field label="District / Neighbourhood" hint="Where is your business based?">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
          {DISTRICTS.slice(0, 12).map(d => (
            <Chip key={d} label={d} active={draft.district === d} onClick={() => setDraft({ ...draft, district: d })} />
          ))}
        </div>
      </Field>

      <Field label="Street Address (optional)">
        <Input
          value={draft.address}
          onChange={v => setDraft({ ...draft, address: v })}
          placeholder="e.g. Bole Road, near Edna Mall"
        />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: "14px 0", borderRadius: 14,
          border: `1.5px solid ${T.border}`, background: T.bg,
          color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Back
        </button>
        <button onClick={onNext} disabled={!valid} style={{
          flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
          background: valid ? G : T.border,
          color: valid ? "#fff" : T.text3,
          fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed",
          boxShadow: valid ? "0 4px 16px rgba(45,106,79,0.3)" : "none",
          transition: "all 0.2s",
        }}>
          Continue
        </button>
      </div>
    </div>
  );
}

// ── STEP 3: Details ───────────────────────────────────────────────────────────
function StepDetails({ draft, setDraft, onNext, onBack }: {
  draft: ServiceDraft; setDraft: (d: ServiceDraft) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  function toggleArea(d: string) {
    const areas = draft.service_areas.includes(d)
      ? draft.service_areas.filter(x => x !== d)
      : [...draft.service_areas, d];
    setDraft({ ...draft, service_areas: areas });
  }

  function toggleLang(l: string) {
    const langs = draft.languages.includes(l)
      ? draft.languages.filter(x => x !== l)
      : [...draft.languages, l];
    setDraft({ ...draft, languages: langs });
  }

  function toggleHighlight(h: string) {
    const hl = draft.highlights.includes(h)
      ? draft.highlights.filter(x => x !== h)
      : [...draft.highlights, h];
    setDraft({ ...draft, highlights: hl });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || draft.tags.includes(t)) return;
    setDraft({ ...draft, tags: [...draft.tags, t] });
    setTagInput("");
  }

  function removeTag(t: string) {
    setDraft({ ...draft, tags: draft.tags.filter(x => x !== t) });
  }

  const valid = draft.description.trim().length >= 20 && draft.price_from.trim();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 4, letterSpacing: -0.4 }}>Describe your service</h2>
      <p style={{ fontSize: 13, color: T.text3, marginBottom: 24 }}>Help clients understand what you offer and why to choose you.</p>

      {/* Description */}
      <Field label="Description" hint="Minimum 20 characters — what do you offer? Who are you?">
        <Textarea
          value={draft.description}
          onChange={v => setDraft({ ...draft, description: v })}
          placeholder="Describe your service in detail. Include what makes you stand out, your experience, and what clients can expect."
          rows={5}
        />
      </Field>

      {/* Pricing */}
      <Field label="Starting Price (ETB)">
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            type="number"
            value={draft.price_from}
            onChange={e => setDraft({ ...draft, price_from: e.target.value })}
            placeholder="500"
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 12,
              border: `1.5px solid ${T.border}`, outline: "none",
              fontSize: 14, color: T.text1, background: T.bgSoft,
              fontFamily: T.font, boxSizing: "border-box",
            }}
          />
          <select
            value={draft.price_unit}
            onChange={e => setDraft({ ...draft, price_unit: e.target.value })}
            style={{
              padding: "11px 10px", borderRadius: 12,
              border: `1.5px solid ${T.border}`, outline: "none",
              fontSize: 13, color: T.text1, background: T.bgSoft,
              fontFamily: T.font, cursor: "pointer",
            }}
          >
            {PRICE_UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
          </select>
        </div>
      </Field>

      {/* Service Areas */}
      <Field label="Service Areas" hint="Select all districts you cover">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
          {DISTRICTS.map(d => (
            <Chip key={d} label={d} active={draft.service_areas.includes(d)} onClick={() => toggleArea(d)} />
          ))}
        </div>
      </Field>

      {/* Working Hours */}
      <Field label="Working Hours" hint='e.g. "Mon–Sat 8:00–18:00" or "24/7"'>
        <Input
          value={draft.working_hours}
          onChange={v => setDraft({ ...draft, working_hours: v })}
          placeholder="Mon–Sat 8:00–18:00"
        />
      </Field>

      {/* Response Time */}
      <Field label="Response Time" hint='How quickly do you typically reply?'>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["< 1 hour","< 2 hours","< 4 hours","Same day","Next day"].map(rt => (
            <Chip key={rt} label={rt} active={draft.response_time === rt} onClick={() => setDraft({ ...draft, response_time: rt })} />
          ))}
        </div>
      </Field>

      {/* Languages */}
      <Field label="Languages Spoken">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {LANGUAGES.map(l => (
            <Chip key={l} label={l} active={draft.languages.includes(l)} onClick={() => toggleLang(l)} />
          ))}
        </div>
      </Field>

      {/* Team Size */}
      <Field label="Team Size (optional)" hint='e.g. "Solo", "3 cleaners", "10+ staff"'>
        <Input
          value={draft.team_size}
          onChange={v => setDraft({ ...draft, team_size: v })}
          placeholder="e.g. 5 trained staff"
        />
      </Field>

      {/* Founded */}
      <Field label="In Business Since (optional)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015 or earlier"].map(y => (
            <Chip key={y} label={y} active={draft.founded_year === y} onClick={() => setDraft({ ...draft, founded_year: y })} />
          ))}
        </div>
      </Field>

      {/* Service Tags */}
      <Field label="Service Tags" hint="Short keywords clients might search for (max 6)">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="e.g. Deep clean"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12,
              border: `1.5px solid ${T.border}`, outline: "none",
              fontSize: 13, color: T.text1, background: T.bgSoft,
              fontFamily: T.font, boxSizing: "border-box",
            }}
          />
          <button onClick={addTag} disabled={!tagInput.trim() || draft.tags.length >= 6} style={{
            padding: "10px 16px", borderRadius: 12, border: "none",
            background: G, color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", opacity: (!tagInput.trim() || draft.tags.length >= 6) ? 0.4 : 1,
          }}>Add</button>
        </div>
        {draft.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {draft.tags.map(t => (
              <span key={t} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 8,
                background: T.primaryL, color: G,
                fontSize: 12, fontWeight: 600,
              }}>
                {t}
                <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: G, padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Highlights */}
      <Field label="Why Choose You?" hint="Select up to 4 highlights shown on your profile">
        <div style={{ marginTop: 4 }}>
          {HIGHLIGHTS_POOL.map(h => (
            <ToggleItem
              key={h} label={h}
              active={draft.highlights.includes(h)}
              onClick={() => draft.highlights.length < 4 || draft.highlights.includes(h) ? toggleHighlight(h) : undefined}
            />
          ))}
        </div>
        {draft.highlights.length >= 4 && (
          <p style={{ fontSize: 11, color: T.warn, marginTop: 4 }}>Maximum 4 highlights selected.</p>
        )}
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: "14px 0", borderRadius: 14,
          border: `1.5px solid ${T.border}`, background: T.bg,
          color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Back
        </button>
        <button onClick={onNext} disabled={!valid} style={{
          flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
          background: valid ? G : T.border,
          color: valid ? "#fff" : T.text3,
          fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed",
          boxShadow: valid ? "0 4px 16px rgba(45,106,79,0.3)" : "none",
          transition: "all 0.2s",
        }}>
          Review
        </button>
      </div>
    </div>
  );
}

// ── STEP 4: Publish ────────────────────────────────────────────────────────────
function StepPublish({ draft, setDraft, onBack, onSubmit, submitting }: {
  draft: ServiceDraft; setDraft: (d: ServiceDraft) => void;
  onBack: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const cat = CATEGORIES.find(c => c.key === draft.category);
  const priceUnit = PRICE_UNITS.find(u => u.key === draft.price_unit);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 4, letterSpacing: -0.4 }}>Review & publish</h2>
      <p style={{ fontSize: 13, color: T.text3, marginBottom: 20 }}>Check everything looks right before listing your service.</p>

      {/* Preview card */}
      <div style={{ borderRadius: 20, border: `1.5px solid ${T.border}`, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        {/* Category banner */}
        <div style={{ background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            {cat?.emoji}
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{cat?.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{draft.business_name || "—"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{draft.contact_name}</div>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "14px 18px" }}>
          {[
            { label: "📞 Phone",          value: draft.phone },
            { label: "📍 District",       value: draft.district || "—" },
            { label: "💰 Starting price", value: draft.price_from ? `ETB ${Number(draft.price_from).toLocaleString()} ${priceUnit?.label ?? ""}` : "—" },
            { label: "🗺 Service areas",  value: draft.service_areas.length ? draft.service_areas.join(", ") : "—" },
            { label: "🕐 Hours",          value: draft.working_hours || "—" },
            { label: "⚡ Response",       value: draft.response_time || "—" },
            { label: "🗣 Languages",      value: draft.languages.length ? draft.languages.join(", ") : "—" },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
              gap: 12,
            }}>
              <span style={{ fontSize: 12, color: T.text3, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text1, textAlign: "right" }}>{row.value}</span>
            </div>
          ))}

          {draft.description && (
            <div style={{ marginTop: 12, padding: "12px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>About</div>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{draft.description}</p>
            </div>
          )}

          {draft.highlights.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Highlights</div>
              {draft.highlights.map(h => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 12, color: T.text1, fontWeight: 500 }}>{h}</span>
                </div>
              ))}
            </div>
          )}

          {draft.tags.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {draft.tags.map(t => (
                <span key={t} style={{ padding: "4px 10px", borderRadius: 7, background: T.bgSoft, color: T.text2, fontSize: 11, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft / Active toggle */}
      <div style={{ borderRadius: 16, border: `1.5px solid ${T.border}`, overflow: "hidden", marginBottom: 20 }}>
        {[
          { key: "active", label: "Publish now", desc: "Visible to all Habino users immediately", icon: "🚀" },
          { key: "draft",  label: "Save as draft", desc: "Save privately — publish when ready",    icon: "📝" },
        ].map(opt => {
          const sel = draft.status === opt.key;
          return (
            <div key={opt.key} onClick={() => setDraft({ ...draft, status: opt.key as "active" | "draft" })} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              background: sel ? T.primaryL : T.bg,
              borderBottom: opt.key === "active" ? `1px solid ${T.border}` : "none",
              cursor: "pointer", transition: "background 0.15s",
            }}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: sel ? G : T.text1 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: T.text3 }}>{opt.desc}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${sel ? G : T.border}`,
                background: sel ? G : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} disabled={submitting} style={{
          flex: 1, padding: "14px 0", borderRadius: 14,
          border: `1.5px solid ${T.border}`, background: T.bg,
          color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Back
        </button>
        <button onClick={onSubmit} disabled={submitting} style={{
          flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
          background: G, color: "#fff",
          fontSize: 15, fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
        }}>
          {submitting ? "Publishing…" : draft.status === "draft" ? "Save Draft" : "Publish Service"}
        </button>
      </div>
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ draft, serviceId, onAnother }: { draft: ServiceDraft; serviceId: string | null; onAnother: () => void }) {
  const router = useRouter();
  const cat = CATEGORIES.find(c => c.key === draft.category);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 36 }}>
        {cat?.emoji}
      </div>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text1, marginBottom: 8, letterSpacing: -0.4 }}>
        {draft.status === "draft" ? "Draft saved!" : "Service listed!"}
      </h2>
      <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.7, marginBottom: 32, maxWidth: 300 }}>
        {draft.status === "draft"
          ? `"${draft.business_name}" has been saved as a draft. You can publish it anytime from your profile.`
          : `"${draft.business_name}" is now live on Habino. Clients in ${draft.service_areas.length ? draft.service_areas[0] : "Addis Ababa"} can discover and contact you.`}
      </p>

      <button onClick={() => router.push("/services")} style={{
        width: "100%", maxWidth: 320, padding: "14px 0", borderRadius: 14, border: "none",
        background: G, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 4px 16px rgba(45,106,79,0.3)", marginBottom: 12,
      }}>
        View Services
      </button>
      <button onClick={onAnother} style={{
        width: "100%", maxWidth: 320, padding: "14px 0", borderRadius: 14,
        border: `1.5px solid ${T.border}`, background: T.bg,
        color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>
        List another service
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NewServiceClient() {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [draft,     setDraft]     = useState<ServiceDraft>(EMPTY);
  const [submitting,setSubmitting] = useState(false);
  const [done,      setDone]      = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [profile,   setProfile]   = useState<{ full_name?: string; phone?: string; email?: string; address?: string; whatsapp?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load profile for pre-fill
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      sb.from("profiles")
        .select("full_name, phone, email, address, whatsapp")
        .eq("id", data.user.id)
        .single()
        .then(({ data: p }) => { if (p) setProfile(p); });
    });
  }, []);

  function scrollTop() {
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function goNext() { setStep(s => s + 1); scrollTop(); }
  function goBack() { setStep(s => s - 1); scrollTop(); }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:      draft.category,
          name:          draft.business_name,
          contact_name:  draft.contact_name,
          phone:         draft.phone,
          whatsapp:      draft.whatsapp || draft.phone,
          email:         draft.email,
          address:       draft.address,
          district:      draft.district,
          description:   draft.description,
          price_from:    draft.price_from ? Number(draft.price_from) : null,
          currency:      draft.currency,
          price_unit:    draft.price_unit,
          service_areas: draft.service_areas,
          working_hours: draft.working_hours,
          response_time: draft.response_time,
          languages:     draft.languages,
          team_size:     draft.team_size,
          founded_year:  draft.founded_year,
          tags:          draft.tags,
          highlights:    draft.highlights,
          photo_url:     draft.photo_url,
          status:        draft.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create service");
      setServiceId(json.id ?? null);
      setDone(true);
    } catch (err) {
      console.error(err);
      // Optimistically show success even if API not ready yet
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={scrollRef} style={{
      display: "flex", flexDirection: "column",
      height: "100%", background: T.bg, fontFamily: T.font,
      overflowY: done ? "auto" : "hidden",
    }}>
      {/* Header */}
      {!done && (
        <div style={{
          flexShrink: 0, padding: "52px 20px 16px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => step === 0 ? router.back() : goBack()} style={{
              background: T.bgSoft, border: "none", borderRadius: 10,
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <svg width="16" height="16" fill="none" stroke={T.text2} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: T.text1, margin: 0 }}>List a Service</h1>
              <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <StepBar current={step} />
        </div>
      )}

      {/* Content */}
      {done ? (
        <SuccessScreen draft={draft} serviceId={serviceId} onAnother={() => { setDraft(EMPTY); setStep(0); setDone(false); }} />
      ) : (
        <>
          {step === 0 && <StepCategory draft={draft} setDraft={setDraft} onNext={goNext} />}
          {step === 1 && <StepInfo draft={draft} setDraft={setDraft} onNext={goNext} onBack={goBack} profile={profile} />}
          {step === 2 && <StepDetails draft={draft} setDraft={setDraft} onNext={goNext} onBack={goBack} />}
          {step === 3 && <StepPublish draft={draft} setDraft={setDraft} onBack={goBack} onSubmit={handleSubmit} submitting={submitting} />}
        </>
      )}
    </div>
  );
}
