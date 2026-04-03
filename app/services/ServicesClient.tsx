"use client";

import { useState } from "react";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#F0F0F0",
  border:   "rgba(0,0,0,0.07)",
  text1:    "#1A1A2E",
  text2:    "#6B7280",
  text3:    "#9CA3AF",
  primary:  "#2D6A4F",
  primaryL: "rgba(45,106,79,0.10)",
  primaryM: "rgba(45,106,79,0.18)",
  font:     "'Inter',-apple-system,sans-serif",
};

// ── Categories ────────────────────────────────────────────────────────────────
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

// ── Mock providers ────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: "1", name: "Selam Clean Pro", category: "cleaning",
    rating: 4.9, reviews: 128, price: "From ETB 800/session",
    description: "Professional home & office cleaning with eco-friendly products. Available 7 days.",
    tags: ["Deep clean", "Office", "Move-in/out"],
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
  },
  {
    id: "2", name: "Green Thumb Ethiopia", category: "garden",
    rating: 4.8, reviews: 64, price: "From ETB 600/visit",
    description: "Expert garden design, regular maintenance, and landscaping across Addis Ababa.",
    tags: ["Lawn care", "Planting", "Design"],
    photo: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
  },
  {
    id: "3", name: "Abeba Home Services", category: "household",
    rating: 4.7, reviews: 203, price: "From ETB 1,200/day",
    description: "Trusted household helpers for daily chores, cooking, and childcare assistance.",
    tags: ["Cooking", "Childcare", "Daily help"],
    photo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 3 hours",
  },
  {
    id: "4", name: "Addis Fix Plumbing", category: "plumbing",
    rating: 4.6, reviews: 87, price: "From ETB 500/job",
    description: "Licensed plumbers for repairs, installations, and emergency call-outs.",
    tags: ["Emergency", "Installation", "Repairs"],
    photo: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
  },
  {
    id: "5", name: "Volta Electric Solutions", category: "electric",
    rating: 4.8, reviews: 112, price: "From ETB 450/job",
    description: "Certified electricians for wiring, installation, and safety inspections.",
    tags: ["Wiring", "Safety check", "Generator"],
    photo: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
  },
  {
    id: "6", name: "Move It Addis", category: "moving",
    rating: 4.5, reviews: 56, price: "From ETB 2,000/move",
    description: "Professional moving & delivery services across all districts of Addis Ababa.",
    tags: ["Furniture", "Packing", "Same-day"],
    photo: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=80&h=80&fit=crop&auto=format",
    verified: false, responseTime: "< 4 hours",
  },
  {
    id: "7", name: "Shield Guard Security", category: "security",
    rating: 4.9, reviews: 44, price: "From ETB 3,500/mo",
    description: "Trained security personnel and CCTV installation for homes and compounds.",
    tags: ["CCTV", "Guards", "24/7"],
    photo: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 1 hour",
  },
  {
    id: "8", name: "Color Masters Ethiopia", category: "painting",
    rating: 4.7, reviews: 78, price: "From ETB 1,500/room",
    description: "Interior and exterior painting with premium paints. Free color consultation.",
    tags: ["Interior", "Exterior", "Consultation"],
    photo: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 3 hours",
  },
  {
    id: "9", name: "CoolTech AC Services", category: "ac",
    rating: 4.6, reviews: 95, price: "From ETB 800/service",
    description: "AC installation, servicing, and repair. All brands. Home and office.",
    tags: ["Installation", "Repair", "All brands"],
    photo: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=80&h=80&fit=crop&auto=format",
    verified: false, responseTime: "< 2 hours",
  },
  {
    id: "10", name: "Paws & Care Ethiopia", category: "petcare",
    rating: 4.8, reviews: 31, price: "From ETB 400/visit",
    description: "Dog walking, pet sitting, and home visits while you're away. Insured.",
    tags: ["Dog walking", "Pet sitting", "Insured"],
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop&auto=format",
    verified: true, responseTime: "< 2 hours",
  },
];

// ── AI Suggestions ─────────────────────────────────────────────────────────────
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
      fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      ✓ Verified
    </span>
  );
}

// ── Provider Card ─────────────────────────────────────────────────────────────
function ProviderCard({ provider, onContact }: { provider: typeof PROVIDERS[0]; onContact: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: `1px solid ${T.border}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      overflow: "hidden",
      marginBottom: 14,
    }}>
      {/* Header */}
      <div
        style={{ padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={provider.photo}
          alt={provider.name}
          style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{provider.name}</span>
            {provider.verified && <VerifiedBadge />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <StarRating rating={provider.rating} />
            <span style={{ fontSize: 11, color: T.text3 }}>({provider.reviews} reviews)</span>
            <span style={{ fontSize: 11, color: T.text3 }}>·</span>
            <span style={{ fontSize: 11, color: T.text3 }}>⚡ {provider.responseTime}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.primary }}>{provider.price}</div>
        </div>
        <div style={{ fontSize: 18, color: T.text3, flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
          ›
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: "12px 0 10px" }}>
            {provider.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {provider.tags.map(tag => (
              <span key={tag} style={{
                padding: "4px 10px", borderRadius: 7,
                background: T.bgSoft, color: T.text2,
                fontSize: 11, fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
          <button
            onClick={onContact}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
              background: T.primary, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(45,106,79,0.3)",
            }}
          >
            Request service
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ServicesClient() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [aiQuery, setAiQuery]               = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [authGate, setAuthGate]             = useState(false);

  const filtered = activeCategory === "all"
    ? PROVIDERS
    : PROVIDERS.filter(p => p.category === activeCategory);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font, overflowY: "auto" }}>

      {/* Header */}
      <div style={{ padding: "52px 20px 16px", background: T.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill={T.primary} />
            <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: T.primary, letterSpacing: -0.5 }}>habino</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text1, letterSpacing: -0.6, marginBottom: 2 }}>Services</h1>
        <p style={{ fontSize: 13, color: T.text3 }}>Household services in Addis Ababa</p>
      </div>

      {/* AI Panel */}
      <div style={{ margin: "0 16px 16px", background: `linear-gradient(135deg, ${T.primary} 0%, #1B4332 100%)`, borderRadius: 18, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
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
              boxSizing: "border-box",
            }}
          />
          <button onClick={() => setAuthGate(true)} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            width: 30, height: 30, borderRadius: "50%",
            background: T.primary, border: "none", cursor: "pointer",
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
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              overflow: "hidden", zIndex: 10,
            }}>
              {AI_SUGGESTIONS.map((s) => (
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
      <div style={{ overflowX: "auto", padding: "0 16px 14px", display: "flex", gap: 8 }}>
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 9999,
                border: "none", cursor: "pointer",
                background: active ? T.primary : T.bgSoft,
                color: active ? "#fff" : T.text2,
                fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.15s",
              }}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Provider list */}
      <div style={{ padding: "0 16px 100px" }}>
        <div style={{ fontSize: 12, color: T.text3, marginBottom: 12 }}>
          {filtered.length} provider{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "all" ? ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}` : " available"}
        </div>

        {filtered.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onContact={() => setAuthGate(true)}
          />
        ))}

        {/* Register your business CTA */}
        <div style={{
          marginTop: 8, padding: 20, borderRadius: 18,
          background: T.primaryL, border: `1px solid rgba(45,106,79,0.15)`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>🏢</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 6 }}>
            List your business
          </div>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 14 }}>
            Offer your household services to hundreds of Habino users across Addis Ababa.
          </p>
          <button
            onClick={() => setAuthGate(true)}
            style={{
              padding: "10px 24px", borderRadius: 12,
              background: T.primary, color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Register as a provider
          </button>
        </div>
      </div>

      <AuthGateModal
        open={authGate}
        onClose={() => setAuthGate(false)}
        reason="Sign up to contact service providers and book household services."
      />
    </div>
  );
}
