"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  border:   "rgba(0,0,0,0.07)",
  text1:    "#1A1A2E",
  text2:    "#6B7280",
  text3:    "#9CA3AF",
  primary:  "#2D6A4F",
  primaryL: "rgba(45,106,79,0.10)",
  font:     "'Inter',-apple-system,sans-serif",
};

const G = "#2D6A4F";

const CATEGORIES = [
  { key: "all",       label: "All",            emoji: "✨" },
  { key: "cleaning",  label: "Cleaning",       emoji: "🧹" },
  { key: "garden",    label: "Gardening",      emoji: "🌿" },
  { key: "household", label: "Household Help", emoji: "🏠" },
  { key: "plumbing",  label: "Plumbing",       emoji: "🔧" },
  { key: "electric",  label: "Electrical",     emoji: "⚡" },
  { key: "moving",    label: "Moving",         emoji: "📦" },
  { key: "security",  label: "Security",       emoji: "🔒" },
  { key: "painting",  label: "Painting",       emoji: "🎨" },
  { key: "ac",        label: "AC & Appliances",emoji: "❄️" },
  { key: "petcare",   label: "Pet Care",       emoji: "🐾" },
];

const PROVIDERS = [
  {
    id: "1", name: "Selam Clean Pro", category: "cleaning",
    rating: 4.9, reviews: 128, price: "From ETB 800/session", priceNum: 800,
    description: "Professional home & office cleaning with eco-friendly products. Available 7 days a week.",
    tags: ["Deep clean", "Office", "Move-in/out"],
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
    districts: ["Bole", "CMC", "Kazanchis", "Sarbet", "Megenagna"],
    workingHours: "Mon–Sat 7:00–18:00",
    phone: "+251 91 234 5678",
    founded: "2019",
    staff: "12 trained cleaners",
    languages: ["Amharic", "English"],
    highlights: ["Insured & bonded", "Eco-friendly products", "Background-checked staff", "Free first consultation"],
  },
  {
    id: "2", name: "Green Thumb Ethiopia", category: "garden",
    rating: 4.8, reviews: 64, price: "From ETB 600/visit", priceNum: 600,
    description: "Expert garden design, regular maintenance, and landscaping across Addis Ababa.",
    tags: ["Lawn care", "Planting", "Design"],
    photo: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
    districts: ["Yeka", "CMC", "Bole", "Gullele"],
    workingHours: "Mon–Fri 8:00–17:00, Sat 8:00–13:00",
    phone: "+251 92 345 6789",
    founded: "2021",
    staff: "8 gardeners",
    languages: ["Amharic"],
    highlights: ["Free garden assessment", "Monthly contracts available", "Local plants expertise", "Water-efficient design"],
  },
  {
    id: "3", name: "Abeba Home Services", category: "household",
    rating: 4.7, reviews: 203, price: "From ETB 1,200/day", priceNum: 1200,
    description: "Trusted household helpers for daily chores, cooking, and childcare assistance. All staff vetted.",
    tags: ["Cooking", "Childcare", "Daily help"],
    photo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 3 hours",
    districts: ["All districts", "Addis Ababa-wide"],
    workingHours: "Mon–Sun 6:00–20:00",
    phone: "+251 93 456 7890",
    founded: "2016",
    staff: "45+ household staff",
    languages: ["Amharic", "English", "Oromo"],
    highlights: ["Background checks", "Trial period available", "Flexible hours", "Live-in options"],
  },
  {
    id: "4", name: "Addis Fix Plumbing", category: "plumbing",
    rating: 4.6, reviews: 87, price: "From ETB 500/job", priceNum: 500,
    description: "Licensed plumbers for repairs, installations, and emergency call-outs city-wide.",
    tags: ["Emergency", "Installation", "Repairs"],
    photo: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
    districts: ["Bole", "Kazanchis", "Kirkos", "Arada", "Lideta"],
    workingHours: "24/7 emergency, regular Mon–Sat 8:00–18:00",
    phone: "+251 91 567 8901",
    founded: "2018",
    staff: "6 licensed plumbers",
    languages: ["Amharic"],
    highlights: ["24/7 emergency", "Licensed & certified", "1-year warranty on work", "Free quote"],
  },
  {
    id: "5", name: "Volta Electric Solutions", category: "electric",
    rating: 4.8, reviews: 112, price: "From ETB 450/job", priceNum: 450,
    description: "Certified electricians for wiring, installation, and safety inspections.",
    tags: ["Wiring", "Safety check", "Generator"],
    photo: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
    districts: ["Bole", "CMC", "Megenagna", "Yeka", "Kazanchis"],
    workingHours: "Mon–Sat 8:00–18:00",
    phone: "+251 92 678 9012",
    founded: "2017",
    staff: "10 certified electricians",
    languages: ["Amharic", "English"],
    highlights: ["Safety certified", "Generator install", "Free safety inspection", "Insurance covered"],
  },
  {
    id: "6", name: "Move It Addis", category: "moving",
    rating: 4.5, reviews: 56, price: "From ETB 2,000/move", priceNum: 2000,
    description: "Professional moving & delivery services across all districts of Addis Ababa.",
    tags: ["Furniture", "Packing", "Same-day"],
    photo: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=80&h=80&fit=crop&auto=format",
    verified: false, responseTime: "< 4 hours",
    districts: ["All districts", "Addis Ababa-wide"],
    workingHours: "Mon–Sat 7:00–20:00",
    phone: "+251 93 789 0123",
    founded: "2020",
    staff: "8 movers + 2 trucks",
    languages: ["Amharic"],
    highlights: ["2 trucks available", "Packing service", "Same-day booking", "Fragile item care"],
  },
  {
    id: "7", name: "Shield Guard Security", category: "security",
    rating: 4.9, reviews: 44, price: "From ETB 3,500/mo", priceNum: 3500,
    description: "Trained security personnel and CCTV installation for homes and compounds.",
    tags: ["CCTV", "Guards", "24/7"],
    photo: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
    districts: ["Bole", "CMC", "Yeka", "Megenagna"],
    workingHours: "24/7",
    phone: "+251 91 890 1234",
    founded: "2015",
    staff: "30+ trained guards",
    languages: ["Amharic", "English"],
    highlights: ["24/7 monitoring", "CCTV install", "Armed & unarmed", "Monthly contracts"],
  },
  {
    id: "8", name: "Color Masters Ethiopia", category: "painting",
    rating: 4.7, reviews: 78, price: "From ETB 1,500/room", priceNum: 1500,
    description: "Interior and exterior painting with premium paints. Free color consultation.",
    tags: ["Interior", "Exterior", "Consultation"],
    photo: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 3 hours",
    districts: ["All districts"],
    workingHours: "Mon–Sat 8:00–17:00",
    phone: "+251 92 901 2345",
    founded: "2018",
    staff: "15 painters",
    languages: ["Amharic"],
    highlights: ["Free colour consult", "Premium paints", "2-year warranty", "Surface prep included"],
  },
  {
    id: "9", name: "CoolTech AC Services", category: "ac",
    rating: 4.6, reviews: 95, price: "From ETB 800/service", priceNum: 800,
    description: "AC installation, servicing, and repair. All brands. Home and office.",
    tags: ["Installation", "Repair", "All brands"],
    photo: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=80&h=80&fit=crop&auto=format",
    verified: false, responseTime: "< 2 hours",
    districts: ["Bole", "Kazanchis", "CMC", "Sarbet"],
    workingHours: "Mon–Sat 8:00–18:00",
    phone: "+251 93 012 3456",
    founded: "2019",
    staff: "8 AC technicians",
    languages: ["Amharic"],
    highlights: ["All AC brands", "Spare parts stock", "Annual maintenance", "Free diagnosis"],
  },
  {
    id: "10", name: "Paws & Care Ethiopia", category: "petcare",
    rating: 4.8, reviews: 31, price: "From ETB 400/visit", priceNum: 400,
    description: "Dog walking, pet sitting, and home visits while you're away. Insured.",
    tags: ["Dog walking", "Pet sitting", "Insured"],
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
    districts: ["Bole", "CMC", "Yeka"],
    workingHours: "Mon–Sun 7:00–19:00",
    phone: "+251 91 123 4567",
    founded: "2022",
    staff: "5 pet carers",
    languages: ["Amharic", "English"],
    highlights: ["Insured & bonded", "Photo updates", "Vet-partnered", "First visit free"],
  },
];

type Provider = typeof PROVIDERS[0];

const AI_SUGGESTIONS = [
  "Deep cleaning before moving in",
  "Weekly garden maintenance",
  "Electrician for socket installation",
  "Move furniture to new apartment",
  "Security guard for villa compound",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF9F0A">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 6px", borderRadius: 5,
      background: T.primaryL, color: T.primary,
      fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const,
    }}>
      ✓ Verified
    </span>
  );
}

// ── Provider Detail Modal ─────────────────────────────────────────────────────
function ProviderDetail({ provider, onClose, onContact }: { provider: Provider; onClose: () => void; onContact: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 8001,
        background: "#fff", borderRadius: "22px 22px 0 0",
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        fontFamily: T.font,
      }}>
        {/* Handle + close */}
        <div style={{ position: "sticky", top: 0, background: "#fff", padding: "14px 16px 10px", zIndex: 1, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 10px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>{provider.name}</span>
            <button onClick={onClose} style={{ background: T.bgSoft, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: T.text3 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "16px 18px 32px" }}>
          {/* Header row */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={provider.photo} alt={provider.name} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>{provider.name}</span>
                {provider.verified && <VerifiedBadge />}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <StarRating rating={provider.rating} />
                <span style={{ fontSize: 11, color: T.text3 }}>({provider.reviews} reviews)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: G }}>{provider.price}</div>
            </div>
          </div>

          {/* About */}
          <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.7, marginBottom: 18 }}>{provider.description}</p>

          {/* Details table */}
          <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 18 }}>
            {[
              { label: "📍 Service areas",    value: provider.districts.join(", ") },
              { label: "🕐 Working hours",    value: provider.workingHours },
              { label: "⚡ Response time",    value: provider.responseTime },
              { label: "👥 Team size",        value: provider.staff },
              { label: "📅 Since",            value: provider.founded },
              { label: "🗣 Languages",        value: provider.languages.join(", ") },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                padding: "10px 12px",
                background: i % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: T.text3, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text1, textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {provider.tags.map(tag => (
              <span key={tag} style={{ padding: "5px 11px", borderRadius: 8, background: T.bgSoft, color: T.text2, fontSize: 12, fontWeight: 500 }}>{tag}</span>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ background: T.primaryL, borderRadius: 14, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 10 }}>Why choose {provider.name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {provider.highlights.map(h => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: T.text1, fontWeight: 500 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={onContact} style={{
            width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: G, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(45,106,79,0.35)", marginBottom: 10,
          }}>
            Request service
          </button>
          <a href={`tel:${provider.phone}`} onClick={(e) => { e.preventDefault(); onContact(); }} style={{
            display: "block", width: "100%", padding: "12px 0", borderRadius: 14,
            background: T.primaryL, color: G, fontSize: 14, fontWeight: 600,
            textDecoration: "none", textAlign: "center",
            boxSizing: "border-box",
          }}>
            📞 {provider.phone}
          </a>
        </div>
      </div>
    </>
  );
}

// ── Provider Card (list item) ─────────────────────────────────────────────────
function ProviderCard({ provider, onOpen }: { provider: Provider; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        padding: "14px 16px", cursor: "pointer",
        display: "flex", gap: 12, alignItems: "flex-start",
        marginBottom: 12,
        transition: "box-shadow 0.15s",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={provider.photo} alt={provider.name}
        style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{provider.name}</span>
          {provider.verified && <VerifiedBadge />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <StarRating rating={provider.rating} />
          <span style={{ fontSize: 11, color: T.text3 }}>({provider.reviews})</span>
          <span style={{ fontSize: 11, color: T.text3 }}>·</span>
          <span style={{ fontSize: 11, color: T.text3 }}>⚡ {provider.responseTime}</span>
        </div>
        <div style={{ fontSize: 11, color: T.text2, marginBottom: 4 }}>
          📍 {provider.districts[0]}{provider.districts.length > 1 ? ` +${provider.districts.length - 1} areas` : ""}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: G }}>{provider.price}</div>
      </div>
      <svg width="16" height="16" fill="none" stroke={T.text3} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 4 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ServicesClient() {
  const router = useRouter();
  const [activeCategory,   setActiveCategory]   = useState("all");
  const [aiQuery,          setAiQuery]           = useState("");
  const [showSuggestions,  setShowSuggestions]   = useState(false);
  const [authGate,         setAuthGate]           = useState(false);
  const [selectedProvider, setSelectedProvider]  = useState<Provider | null>(null);

  const filtered = activeCategory === "all"
    ? PROVIDERS
    : PROVIDERS.filter(p => p.category === activeCategory);

  return (
    <>
      {/* Main scrollable content — no overflowY here, parent layout handles it */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font }}>

        {/* Header */}
        <div style={{ padding: "52px 20px 16px", background: T.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill={G} />
              <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: G, letterSpacing: -0.5 }}>habino</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text1, letterSpacing: -0.6, marginBottom: 2 }}>Services</h1>
          <p style={{ fontSize: 13, color: T.text3 }}>Household services in Addis Ababa</p>
        </div>

        {/* AI Panel */}
        <div style={{ margin: "0 16px 16px", background: `linear-gradient(135deg, ${G} 0%, #1B4332 100%)`, borderRadius: 18, padding: 18, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Habib — Service Assistant</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Describe what you need — I&apos;ll find the right provider</div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <input
              value={aiQuery}
              onChange={e => { setAiQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. deep cleaning for 3-bedroom apartment…"
              style={{
                width: "100%", padding: "11px 44px 11px 14px",
                borderRadius: 12, border: "none", outline: "none",
                fontSize: 13, color: T.text1, background: "#fff",
                boxSizing: "border-box" as const,
              }}
            />
            <button onClick={() => setAuthGate(true)} style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%",
              background: G, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>

            {showSuggestions && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 10,
              }}>
                {AI_SUGGESTIONS.map(s => (
                  <button key={s} onMouseDown={() => { setAiQuery(s); setShowSuggestions(false); }} style={{
                    width: "100%", padding: "11px 14px", textAlign: "left",
                    background: "none", border: "none", borderBottom: `1px solid ${T.border}`,
                    fontSize: 13, color: T.text1, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: T.text3 }}>✦</span> {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div style={{ overflowX: "auto", padding: "0 16px 14px", display: "flex", gap: 8, flexShrink: 0 }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 9999,
                border: "none", cursor: "pointer",
                background: active ? G : T.bgSoft,
                color: active ? "#fff" : T.text2,
                fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.15s",
              }}>
                <span>{cat.emoji}</span> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Provider list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
          <div style={{ fontSize: 12, color: T.text3, marginBottom: 12 }}>
            {filtered.length} provider{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "all" ? ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}` : " available"}
          </div>

          {filtered.map(provider => (
            <ProviderCard key={provider.id} provider={provider} onOpen={() => setSelectedProvider(provider)} />
          ))}

          {/* Register CTA */}
          <div style={{ marginTop: 8, padding: 20, borderRadius: 18, background: T.primaryL, border: `1px solid rgba(45,106,79,0.15)`, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🏢</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 6 }}>List your business</div>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 14 }}>
              Offer your services to hundreds of Habino users across Addis Ababa.
            </p>
            <button onClick={() => router.push("/services/new")} style={{
              padding: "10px 24px", borderRadius: 12,
              background: G, color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              Register as a provider
            </button>
          </div>
        </div>
      </div>

      {/* Provider detail modal */}
      {selectedProvider && (
        <ProviderDetail
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onContact={() => { setSelectedProvider(null); setAuthGate(true); }}
        />
      )}

      <AuthGateModal
        open={authGate}
        onClose={() => setAuthGate(false)}
        reason="Sign up to contact service providers and book household services."
      />
    </>
  );
}
