"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import dynamic from "next/dynamic";
import type { Property } from "@/lib/types";
import { useSavedListings } from "@/app/hooks/useSavedListings";
import { analytics } from "@/lib/analytics";
import { useCity } from "@/lib/cityContext";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F7" }}>
    <div style={{ fontSize: 14, color: "#AFAFAF" }}>Loading map…</div>
  </div>
) });

// ── Design tokens — forest green CI ──────────────────────────────────────────
const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#EDEDED",
  border:   "rgba(0,0,0,0.07)",
  borderMd: "rgba(0,0,0,0.12)",
  text1:    "#1A1A2E",
  text2:    "#717171",
  text3:    "#AFAFAF",
  primary:  "#2D6A4F",
  primaryD: "#1B4332",
  primaryL: "rgba(45,106,79,0.09)",
  primaryM: "rgba(45,106,79,0.18)",
  ok:       "#34C759",
  warn:     "#FF9F0A",
  err:      "#FF453A",
  shadowXs: "0 1px 3px rgba(0,0,0,0.07)",
  shadowSm: "0 2px 10px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04)",
  shadowMd: "0 6px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.05)",
  shadowLg: "0 14px 48px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.07)",
  font:     "'Inter',-apple-system,sans-serif",
  r2xl:     28,
  rXl:      20,
  rLg:      16,
  rMd:      12,
  rFull:    9999,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHero(images?: Property["images"]): string | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

function fmtPrice(price: number, currency: string, type: string) {
  const n = price >= 1_000_000
    ? `${(price / 1_000_000).toFixed(1)}M`
    : price >= 1_000
    ? `${(price / 1_000).toFixed(0)}K`
    : String(price);
  return { main: `${currency} ${n}`, suffix: type === "rent" ? "/ month" : "" };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const LISTING_TYPE_CHIPS = [
  { key: "rent", label: "Rent" },
  { key: "buy",  label: "Buy"  },
];

// District chips loaded dynamically from city context (see component)

const PROPERTY_TYPE_CHIPS = [
  { key: "apartment",  label: "Apartment" },
  { key: "house",      label: "House"     },
  { key: "villa",      label: "Villa"     },
  { key: "commercial", label: "Commercial"},
  { key: "land",       label: "Land"      },
];

// AI suggestions — fallback values, overridden in component with dynamic districts
let AI_SUGGESTIONS = ["Apartments for rent", "Villa for sale", "Commercial space", "Budget flat", "Land for sale"];

// Deterministic broker portrait photos (Unsplash faces)
const BROKER_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces&auto=format",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces&auto=format",
];

// Realistic fallback broker names (used when DB agent_name is null)
const BROKER_NAMES = [
  "Yonas Kebede","Abel Zegeye","Eyob Alemu","Henok Tadesse","Meron Tadesse",
  "Ahmed Al-Rashid","Grace Amoah","Liya Habtamu","Ermias Asfaw","Selamawit Berhane",
  "Natnael Girma","Makda Tesfaye","Eden Haile","Robel Mengistu","Mihret Bekele",
];

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h;
}

function brokerName(p: Property): string {
  if (p.agent_name) return p.agent_name;
  return BROKER_NAMES[idHash(p.id) % BROKER_NAMES.length];
}

function brokerPhoto(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return BROKER_PHOTOS[hash % BROKER_PHOTOS.length];
}

function maskName(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

async function lookupBrokerId(name: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/brokers?name=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.id ?? null;
  } catch { return null; }
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropCard({ p, saved, onSave, isLoggedIn }: { p: Property; saved: boolean; onSave: () => void; isLoggedIn: boolean }) {
  const { main, suffix } = fmtPrice(p.price, p.currency, p.listing_type);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = useRef(0);
  const didSwipe    = useRef(false);
  const isRent = p.listing_type === "rent";

  const sortedImages = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const currentImg = sortedImages[imgIdx]?.url ?? null;

  const subtitleParts = [
    p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1),
    p.bedrooms  > 0 ? `${p.bedrooms} bd` : null,
    p.bathrooms > 0 ? `${p.bathrooms} ba` : null,
  ].filter(Boolean).join(" · ");

  const tags = [
    p.area_sqm ? `${p.area_sqm} m²` : null,
    p.bedrooms > 0 ? `${p.bedrooms} rooms` : null,
  ].filter(Boolean) as string[];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40 || sortedImages.length < 2) return;
    didSwipe.current = true;
    if (dx < 0) setImgIdx(i => Math.min(i + 1, sortedImages.length - 1));
    else         setImgIdx(i => Math.max(i - 1, 0));
  }

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => { if (!didSwipe.current) window.location.assign(`/properties/${p.id}`); }}
    >
      {/* Image */}
      <div
        style={{ position: "relative", height: 230, background: T.bgSoft2, borderRadius: T.r2xl, overflow: "hidden" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentImg && !imgErrors.has(currentImg) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImg} alt={p.title}
            onError={() => setImgErrors(prev => new Set([...prev, currentImg]))}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${T.primaryL} 0%, rgba(64,145,108,0.12) 100%)`,
          }}>
            <svg width="48" height="48" fill="none" stroke={T.primary} strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Listing badge */}
        <div style={{
          position: "absolute", top: 14, left: 14,
          padding: "5px 11px", borderRadius: T.rFull,
          fontSize: 11, fontWeight: 700,
          backdropFilter: "blur(12px)",
          background: isRent ? "rgba(45,106,79,.88)" : "rgba(52,199,89,.88)",
          color: "#fff",
        }}>
          {isRent ? "Rent" : "Buy"}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 34, height: 34, borderRadius: "50%",
            background: saved ? "rgba(255,69,58,.15)" : "rgba(255,255,255,.92)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "none", boxShadow: T.shadowSm,
          }}
        >
          <svg width="15" height="15"
            fill={saved ? T.err : "none"}
            stroke={saved ? T.err : T.text1}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        {/* Image counter + dots */}
        {sortedImages.length > 1 && (
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {sortedImages.slice(0, 5).map((_, i) => (
              <div key={i} style={{
                width: i === imgIdx ? 14 : 5, height: 5, borderRadius: i === imgIdx ? 3 : "50%",
                background: i === imgIdx ? "#fff" : "rgba(255,255,255,.6)",
                transition: "all 0.2s",
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 2px 0" }}>
        {/* Row 1: Location + New badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>
            {p.neighbourhood ? `${p.neighbourhood}, ` : ""}{p.city}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: T.text1 }}>
            <svg width="11" height="11" fill={T.text1} viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            New
          </div>
        </div>

        {/* Row 2: Broker photo + name */}
        {(() => {
          const name = brokerName(p);
          const displayName = isLoggedIn ? name : maskName(name);
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brokerPhoto(name)}
                    alt={displayName}
                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", display: "block", border: "1.5px solid rgba(0,0,0,0.07)" }}
                  />
                  <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: T.primary, border: "1.5px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="5" height="5" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{displayName}</span>
              </div>
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = await lookupBrokerId(name);
                  if (id) window.location.href = `/brokers/${id}`;
                }}
                style={{ fontSize: 11, fontWeight: 600, color: T.primary, textDecoration: "none" }}
              >
                Broker →
              </a>
            </div>
          );
        })()}

        <div style={{ fontSize: 13, color: T.text2, marginBottom: 4 }}>{subtitleParts}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>
          <strong>{main}</strong>{" "}
          {suffix && <span style={{ fontWeight: 400, color: T.text2 }}>{suffix}</span>}
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <span key={t} style={{
                padding: "3px 9px", borderRadius: 6,
                fontSize: 11, fontWeight: 500, color: T.text2, background: T.bgSoft,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <div style={{
        height: 230, borderRadius: T.r2xl, overflow: "hidden",
        background: `linear-gradient(90deg, ${T.bgSoft} 25%, ${T.bgSoft2} 50%, ${T.bgSoft} 75%)`,
        backgroundSize: "400% 100%",
        animation: "shimmer 1.4s infinite",
      }} />
      <div style={{ padding: "12px 2px 0" }}>
        <div style={{ height: 16, width: "60%", borderRadius: 6, background: T.bgSoft, marginBottom: 8 }} />
        <div style={{ height: 13, width: "80%", borderRadius: 6, background: T.bgSoft, marginBottom: 8 }} />
        <div style={{ height: 15, width: "40%", borderRadius: 6, background: T.bgSoft }} />
      </div>
    </div>
  );
}

// ── AI Search Bar ─────────────────────────────────────────────────────────────
function AISearchBar({ value, onChange, onSubmit, onSuggestion, aiLoading, aiSuggestion }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSuggestion: (s: string) => void;
  aiLoading?: boolean;
  aiSuggestion?: string | null;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showSuggestions = focused && !value;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: T.bg, borderRadius: 18, padding: "12px 14px",
          boxShadow: focused ? `0 0 0 4px ${T.primaryL},${T.shadowMd}` : T.shadowMd,
          border: `1.5px solid ${focused ? T.primary : "transparent"}`,
          cursor: "text", transition: "all .2s",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Habino logo + search icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: T.primaryL,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="18" height="18" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => { setFocused(true); e.currentTarget.select(); }}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="What are you looking for?"
            style={{
              display: "block", width: "100%",
              fontSize: 15, fontWeight: value ? 600 : 400,
              color: value ? T.text1 : T.text3,
              border: "none", outline: "none", background: "transparent",
              fontFamily: T.font,
            }}
          />
          <div style={{ fontSize: 12, color: aiLoading ? T.primary : T.text3, marginTop: 2, fontWeight: aiLoading ? 500 : 400 }}>
            {aiLoading ? "✦ AI is analysing listings…" : value ? "Press Enter for AI search" : "District · Type · Budget"}
          </div>
        </div>

        {/* Mic button */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: T.bgSoft,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" stroke={focused ? T.primary : T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
          </svg>
        </div>
      </div>

      {/* AI suggestion tip */}
      {aiSuggestion && !aiLoading && (
        <div style={{
          marginTop: 8, padding: "8px 14px", borderRadius: 12,
          background: T.primaryL, border: `1px solid rgba(45,106,79,0.15)`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>💡</span>
          <span style={{ fontSize: 12, color: T.primary, fontWeight: 500 }}>{aiSuggestion}</span>
        </div>
      )}

      {/* AI Prompt suggestions */}
      {showSuggestions && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: T.bg, borderRadius: 16, boxShadow: T.shadowLg,
          border: `1px solid ${T.border}`, overflow: "hidden", zIndex: 100,
        }}>
          <div style={{ padding: "10px 16px 6px", fontSize: 11, fontWeight: 600, color: T.text3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Suggested searches
          </div>
          {AI_SUGGESTIONS.map((s) => (
            <button key={s} onMouseDown={() => { onSuggestion(s); onSubmit(); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 16px",
              background: "transparent", border: "none", cursor: "pointer",
              textAlign: "left", fontFamily: T.font,
            }}>
              <svg width="14" height="14" fill="none" stroke={T.primary} strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span style={{ fontSize: 14, color: T.text1 }}>{s}</span>
            </button>
          ))}
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  );
}

// ── Filter Panel ──────────────────────────────────────────────────────────────
type Filters = {
  minPrice: number | null;
  maxPrice: number | null;
  propertyType: string;
  bedrooms: number | null;
};

function FilterPanel({ filters, onChange, onClose }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);

  const PROP_TYPES = [
    { key: "", label: "All" },
    { key: "apartment", label: "Apartment" },
    { key: "house",     label: "House" },
    { key: "villa",     label: "Villa" },
    { key: "commercial",label: "Commercial" },
    { key: "land",      label: "Land" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div
        style={{
          background: T.bg, borderRadius: "24px 24px 0 0",
          padding: "8px 20px 40px",
          width: "100%", boxShadow: T.shadowLg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text1 }}>Filters</div>
          <button onClick={() => setLocal({ minPrice: null, maxPrice: null, propertyType: "", bedrooms: null })}
            style={{ fontSize: 13, fontWeight: 600, color: T.primary, background: "none", border: "none", cursor: "pointer" }}>
            Reset all
          </button>
        </div>

        {/* Property type */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Property Type</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PROP_TYPES.map((pt) => (
              <button key={pt.key} onClick={() => setLocal({ ...local, propertyType: pt.key })} style={{
                padding: "7px 14px", borderRadius: T.rFull,
                border: `1.5px solid ${local.propertyType === pt.key ? T.primary : T.borderMd}`,
                background: local.propertyType === pt.key ? T.primaryL : T.bg,
                color: local.propertyType === pt.key ? T.primary : T.text1,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Bedrooms</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[null, 1, 2, 3, 4, 5].map((n) => (
              <button key={String(n)} onClick={() => setLocal({ ...local, bedrooms: n })} style={{
                flex: 1, padding: "9px 0", borderRadius: 12,
                border: `1.5px solid ${local.bedrooms === n ? T.primary : T.borderMd}`,
                background: local.bedrooms === n ? T.primaryL : T.bg,
                color: local.bedrooms === n ? T.primary : T.text1,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}>
                {n === null ? "Any" : n === 5 ? "5+" : String(n)}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text2, marginBottom: 10 }}>Price Range (ETB)</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { placeholder: "Min price", val: local.minPrice, key: "minPrice" as const },
              { placeholder: "Max price", val: local.maxPrice, key: "maxPrice" as const },
            ].map(({ placeholder, val, key }) => (
              <input key={key}
                type="number"
                placeholder={placeholder}
                value={val ?? ""}
                onChange={(e) => setLocal({ ...local, [key]: e.target.value ? parseInt(e.target.value) : null })}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 12,
                  border: `1.5px solid ${T.borderMd}`, fontSize: 13, color: T.text1,
                  outline: "none", fontFamily: T.font, background: T.bg,
                }}
              />
            ))}
          </div>
        </div>

        {/* Apply */}
        <button onClick={() => { onChange(local); onClose(); }} style={{
          width: "100%", padding: "16px", borderRadius: 16,
          background: T.primary, color: "#fff",
          fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font,
        }}>
          Show results
        </button>
      </div>
    </div>
  );
}

// ── Saved Panel ───────────────────────────────────────────────────────────────
function SavedPanel({
  savedIds, onClose, onUnsave, isLoggedIn,
}: {
  savedIds: string[];
  onClose: () => void;
  onUnsave: (id: string) => void;
  isLoggedIn: boolean;
}) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (savedIds.length === 0) { setItems([]); return; }
    setLoading(true);
    // Fetch each saved property — batch via ids param
    fetch(`/api/properties?ids=${savedIds.join(",")}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setItems(data?.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [savedIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute", top: "5%", left: 0, right: 0, bottom: 0,
          background: T.bg, borderRadius: "24px 24px 0 0",
          display: "flex", flexDirection: "column",
          boxShadow: T.shadowLg,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.bgSoft2, margin: "12px auto 0" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text1 }}>Saved</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 1 }}>
              {savedIds.length === 0 ? "No saved listings yet" : `${savedIds.length} listing${savedIds.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: T.bgSoft, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="14" height="14" fill="none" stroke={T.text1} strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px" }}>
          {savedIds.length === 0 ? (
            <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 6 }}>Nothing saved yet</div>
              <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>Tap the heart on any listing to save it here</div>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
              {Array.from({ length: Math.min(savedIds.length, 3) }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: T.text2, fontSize: 13 }}>
              Could not load saved listings. Please try again.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {items.map(p => (
                <div key={p.id} style={{ position: "relative" }}>
                  <PropCard p={p} saved={true} onSave={() => onUnsave(p.id)} isLoggedIn={isLoggedIn} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NLP property query parser ─────────────────────────────────────────────────
const NLP_DISTRICTS = [
  "bole","cmc","kazanchis","sarbet","megenagna","piassa","yeka","lideta","arada",
  "kirkos","kolfe","gulele","nifas silk","summit","gerji","ayat","jemo","saris",
  "lebu","gofa","akaki","kality","lafto","ferensay",
];

function parsePropertyQuery(raw: string) {
  const q = raw.toLowerCase().trim();

  // listing_type
  let listingType = "";
  if (/\brent\b|\bfor\s+rent\b|\bto\s+rent\b|\bmiete\b/.test(q))      listingType = "rent";
  else if (/\bbuy\b|\bfor\s+sale\b|\bpurchase\b|\bkauf\b/.test(q))    listingType = "buy";

  // property_type
  let propertyType = "";
  if (/\bvilla\b/.test(q))                                             propertyType = "villa";
  else if (/\bcommercial\b|\bshop\b|\bstore\b|\bretail\b|\bwarehouse\b/.test(q)) propertyType = "commercial";
  else if (/\boffice\b|\bbuero\b/.test(q))                             propertyType = "office";
  else if (/\bapartment\b|\bflat\b|\bwohnung\b|\bapt\b/.test(q))      propertyType = "apartment";
  else if (/\bhouse\b|\bhome\b|\bdetached\b/.test(q))                  propertyType = "house";
  else if (/\bland\b|\bplot\b|\bsite\b|\bgrundstück\b/.test(q))       propertyType = "land";
  else if (/\bhall\b|\bwarehouse\b/.test(q))                           propertyType = "hall";

  // neighbourhood — first match wins
  const neighbourhood = NLP_DISTRICTS.find(d => q.includes(d)) ?? "";

  // bedrooms
  const bedroomM = q.match(/(\d+)\s*(?:bed(?:room)?s?|br\b|zimmer)/);
  const bedrooms = bedroomM ? parseInt(bedroomM[1]) : null;

  // price ceiling — handles "under 20K", "under 20,000", "below 1.5M"
  const maxPriceM = q.match(/(?:under|below|max(?:imum)?|bis|unter)\s*([\d,.]+)\s*([km])?/i);
  let maxPrice: number | null = null;
  if (maxPriceM) {
    let num = parseFloat(maxPriceM[1].replace(/,/g, ""));
    const sfx = (maxPriceM[2] ?? "").toLowerCase();
    if (sfx === "k") num *= 1_000;
    else if (sfx === "m") num *= 1_000_000;
    maxPrice = Math.round(num);
  }

  return { listingType, propertyType, neighbourhood, bedrooms, maxPrice };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExploreClient() {
  const { currentCity, districts } = useCity();
  const DISTRICT_CHIPS = districts.filter(d => d.is_major).map(d => d.name);
  const cityName = currentCity?.name ?? "Addis Ababa";
  const cityCurrency = currentCity?.currency ?? "ETB";
  // Update module-level AI_SUGGESTIONS with dynamic city data
  AI_SUGGESTIONS = DISTRICT_CHIPS.length > 0
    ? [
        `3-bedroom apartment in ${DISTRICT_CHIPS[0]}`,
        `Villa for rent in ${DISTRICT_CHIPS[1] ?? cityName}`,
        `Commercial space ${DISTRICT_CHIPS[2] ?? ""}`,
        `Budget flat under 20K ${cityCurrency}`,
        `Land for sale in ${DISTRICT_CHIPS[3] ?? cityName}`,
      ]
    : [`Apartments in ${cityName}`, `Villa for rent`, `Commercial space`, `Budget flat`, `Land for sale`];

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [chipListingType, setChipListingType]         = useState<""|"rent"|"buy">("");
  const [chipNeighbourhoods, setChipNeighbourhoods]   = useState<string[]>([]);
  const [chipPropertyTypes, setChipPropertyTypes]     = useState<string[]>([]);
  const [total, setTotal]           = useState(0);
  const [propAiIds,       setPropAiIds]       = useState<string[] | null>(null);
  const [propAiLoading,   setPropAiLoading]   = useState(false);
  const [propAiSuggestion,setPropAiSuggestion] = useState<string | null>(null);
  const [view, setView]             = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved]   = useState(false);
  const [filters, setFilters]       = useState<Filters>({ minPrice: null, maxPrice: null, propertyType: "", bedrooms: null });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { saved, toggle, isSaved }  = useSavedListings();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (chipListingType)                params.set("type", chipListingType);
    if (chipNeighbourhoods.length > 0)  params.set("neighbourhoods", chipNeighbourhoods.join(","));
    if (chipPropertyTypes.length > 0)   params.set("property_types", chipPropertyTypes.join(","));

    // NLP parse: extract structured filters from free-text query
    if (search.trim()) {
      const nlp = parsePropertyQuery(search);
      if (nlp.listingType  && !chipListingType)              params.set("type",          nlp.listingType);
      if (nlp.propertyType && !chipPropertyTypes.length && !filters.propertyType)
                                                             params.set("property_type", nlp.propertyType);
      if (nlp.neighbourhood && !chipNeighbourhoods.length)   params.set("neighbourhood", nlp.neighbourhood);
      if (nlp.bedrooms     && !filters.bedrooms)             params.set("bedrooms",      String(nlp.bedrooms));
      if (nlp.maxPrice     && !filters.maxPrice)             params.set("max_price",     String(nlp.maxPrice));
    }

    if (filters.propertyType && !chipPropertyTypes.length) params.set("property_type", filters.propertyType);
    if (filters.minPrice)       params.set("min_price", String(filters.minPrice));
    if (filters.maxPrice)       params.set("max_price", String(filters.maxPrice));
    if (filters.bedrooms)       params.set("bedrooms", String(filters.bedrooms));
    params.set("limit", "20");
    params.set("sort", "newest");
    try {
      const res  = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.data ?? []);
        setTotal(data.total ?? 0);
        analytics.search({
          query: search || undefined,
          listing_type: chipListingType || filters.propertyType || undefined,
          city: "Addis Ababa",
          neighbourhood: chipNeighbourhoods[0] || undefined,
          result_count: data.total ?? 0,
          source: "filter",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [chipListingType, chipNeighbourhoods, chipPropertyTypes, search, filters]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.propertyType || filters.bedrooms;

  // If AI returned ranked IDs, reorder properties by those IDs (best matches first)
  const displayProperties = propAiIds
    ? [
        ...propAiIds
          .map(id => properties.find(p => p.id === id))
          .filter((p): p is Property => !!p),
        ...properties.filter(p => !propAiIds.includes(p.id)),
      ]
    : properties;

  async function handlePropertyAISearch(query: string) {
    if (!query.trim() || properties.length === 0) return;
    setPropAiLoading(true);
    setPropAiIds(null);
    setPropAiSuggestion(null);
    try {
      // Pre-filter client-side using NLP constraints before sending to AI
      // This ensures price/type constraints are respected even if chips weren't set
      const nlp = parsePropertyQuery(query);
      const candidatePool = properties.filter(p => {
        if (nlp.maxPrice && (p.price ?? 0) > nlp.maxPrice) return false;
        if (nlp.listingType && p.listing_type !== nlp.listingType) return false;
        if (nlp.propertyType && p.property_type !== nlp.propertyType) return false;
        return true;
      });
      // If all candidates filtered out (e.g. price mismatch), fall back to full list
      const pool = candidatePool.length > 0 ? candidatePool : properties;

      const items = pool.map(p => ({
        id:            p.id,
        title:         p.title,
        listing_type:  p.listing_type,
        property_type: p.property_type,
        neighbourhood: p.neighbourhood,
        city:          p.city,
        price:         p.price,
        currency:      p.currency,
        bedrooms:      p.bedrooms,
        area_sqm:      p.area_sqm,
        description:   p.description,
      }));
      const res  = await fetch("/api/ai-search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query, type: "property", items }),
      });
      const data = await res.json();
      if (data.matchIds?.length > 0) setPropAiIds(data.matchIds);
      if (data.suggestion)           setPropAiSuggestion(data.suggestion);
    } catch { /* silent fallback */ }
    finally  { setPropAiLoading(false); }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, fontFamily: T.font, position: "relative" }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── Top area ── */}
      <div style={{ padding: "52px 20px 14px", background: T.bg }}>
        {/* Habino logo + greeting */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              {/* Habino wordmark */}
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill={T.primary} />
                <path d="M8 24V8h4v6.5h8V8h4v16h-4v-7h-8v7z" fill="#fff" />
              </svg>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, letterSpacing: -0.5, fontFamily: T.font }}>habino</span>
            </div>
            <div style={{ fontSize: 12, color: T.text3 }}>{greeting()} 👋</div>
          </div>
          {/* Right buttons: Saved + Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Saved button */}
            <button
              onClick={() => setShowSaved(true)}
              style={{
                position: "relative",
                width: 40, height: 40, borderRadius: 12,
                border: `1.5px solid ${saved.length > 0 ? T.err : T.borderMd}`,
                background: saved.length > 0 ? "rgba(255,69,58,0.07)" : T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16"
                fill={saved.length > 0 ? T.err : "none"}
                stroke={saved.length > 0 ? T.err : T.text2}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {saved.length > 0 && (
                <div style={{
                  position: "absolute", top: -5, right: -5,
                  minWidth: 17, height: 17, borderRadius: 9,
                  background: T.err, border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff", padding: "0 3px",
                }}>
                  {saved.length > 9 ? "9+" : saved.length}
                </div>
              )}
            </button>

            {/* Filter button */}
            <button onClick={() => setShowFilters(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 12,
              border: `1.5px solid ${hasActiveFilters ? T.primary : T.borderMd}`,
              background: hasActiveFilters ? T.primaryL : T.bg,
              color: hasActiveFilters ? T.primary : T.text1,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              Filter{hasActiveFilters ? " ●" : ""}
            </button>

            {/* Reset all — shown when any filter/search/chip is active */}
            {(chipListingType || chipNeighbourhoods.length > 0 || chipPropertyTypes.length > 0 || search || hasActiveFilters || propAiIds) && (
              <button onClick={() => {
                setChipListingType(""); setChipNeighbourhoods([]); setChipPropertyTypes([]);
                setSearch(""); setPropAiIds(null); setPropAiSuggestion(null);
                setFilters({ minPrice: null, maxPrice: null, propertyType: "", bedrooms: null });
              }} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "9px 12px", borderRadius: 12,
                border: `1.5px solid rgba(255,69,58,0.25)`,
                background: "rgba(255,69,58,0.06)",
                color: T.err, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
              }}>
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        <AISearchBar
          value={search}
          onChange={(v) => { setSearch(v); if (!v) { setPropAiIds(null); setPropAiSuggestion(null); } }}
          onSubmit={async () => { await fetchProperties(); handlePropertyAISearch(search); }}
          onSuggestion={(s) => { setSearch(s); setTimeout(() => handlePropertyAISearch(s), 300); }}
          aiLoading={propAiLoading}
          aiSuggestion={propAiSuggestion}
        />
      </div>

      {/* ── Toggle + count row ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px 14px",
      }}>
        <div style={{ display: "flex", background: T.bgSoft, borderRadius: 14, padding: 3, gap: 2 }}>
          {(["Listing", "Map"] as const).map((label) => {
            const isActive = label === "Listing" ? view === "list" : view === "map";
            return (
              <button key={label} onClick={() => setView(label === "Listing" ? "list" : "map")} style={{
                padding: "8px 22px", borderRadius: 11,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                color: isActive ? T.text1 : T.text2,
                border: "none",
                background: isActive ? T.bg : "transparent",
                boxShadow: isActive ? T.shadowSm : "none",
                transition: "all .18s",
                fontFamily: T.font,
              }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>
          {loading ? "…" : `${total.toLocaleString()} results`}
        </div>
      </div>

      {/* ── Filter chips — all mixed in one wrapping row, colour-coded by category ── */}
      <div style={{ padding: "0 20px 14px" }}>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>

          {/* Listing type — dark charcoal */}
          {LISTING_TYPE_CHIPS.map((chip) => {
            const active = chipListingType === chip.key;
            return (
              <button key={chip.key} onClick={() => setChipListingType(active ? "" : chip.key as "rent"|"buy")} style={{
                padding: "7px 14px", borderRadius: T.rFull,
                border: `1.5px solid ${active ? "#1A1A2E" : "rgba(26,26,46,0.18)"}`,
                background: active ? "#1A1A2E" : "rgba(26,26,46,0.06)",
                fontSize: 12, fontWeight: 700,
                color: active ? "#fff" : "#1A1A2E",
                whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s", fontFamily: T.font,
              }}>
                {chip.label}
              </button>
            );
          })}

          {/* Property types — amber */}
          {PROPERTY_TYPE_CHIPS.map((chip) => {
            const active = chipPropertyTypes.includes(chip.key);
            return (
              <button key={chip.key} onClick={() => setChipPropertyTypes(prev =>
                active ? prev.filter(t => t !== chip.key) : [...prev, chip.key]
              )} style={{
                padding: "7px 14px", borderRadius: T.rFull,
                border: `1.5px solid ${active ? "#B45309" : "rgba(180,83,9,0.22)"}`,
                background: active ? "#B45309" : "rgba(180,83,9,0.07)",
                fontSize: 12, fontWeight: 600,
                color: active ? "#fff" : "#B45309",
                whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s", fontFamily: T.font,
              }}>
                {chip.label}
              </button>
            );
          })}

          {/* Districts — green */}
          {DISTRICT_CHIPS.map((district) => {
            const active = chipNeighbourhoods.includes(district);
            return (
              <button key={district} onClick={() => setChipNeighbourhoods(prev =>
                active ? prev.filter(d => d !== district) : [...prev, district]
              )} style={{
                padding: "7px 13px", borderRadius: T.rFull,
                border: `1.5px solid ${active ? T.primary : "rgba(45,106,79,0.22)"}`,
                background: active ? T.primary : "rgba(45,106,79,0.07)",
                fontSize: 12, fontWeight: 500,
                color: active ? "#fff" : T.primary,
                whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s", fontFamily: T.font,
              }}>
                {district}
              </button>
            );
          })}

          {/* Clear all */}
          {(chipListingType || chipNeighbourhoods.length > 0 || chipPropertyTypes.length > 0) && (
            <button onClick={() => { setChipListingType(""); setChipNeighbourhoods([]); setChipPropertyTypes([]); }} style={{
              padding: "7px 13px", borderRadius: T.rFull,
              border: `1.5px solid ${T.borderMd}`,
              background: "rgba(255,69,58,0.06)",
              fontSize: 12, fontWeight: 600, color: T.err,
              whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s", fontFamily: T.font,
            }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Map view ── */}
      {view === "map" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 480, position: "relative" }}>
          {/* Habib hint banner */}
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            margin: "0 16px 10px",
            padding: "10px 14px", borderRadius: 14,
            background: T.primaryL, border: `1px solid rgba(45,106,79,0.2)`,
            textDecoration: "none",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: T.primary,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>Chat with Habib to search</div>
              <div style={{ fontSize: 11, color: T.text2 }}>Tell me what you're looking for and I'll find it on the map</div>
            </div>
            <svg width="14" height="14" fill="none" stroke={T.primary} strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M9 18l6-6-6-6" />
            </svg>
          </a>
          <MapView properties={properties} />
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 14px" }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: T.text1, letterSpacing: -0.3 }}>
              Top picks for you
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, cursor: "pointer" }}>See all</div>
          </div>

          {/* Subtle loading bar while re-fetching (keeps old results visible) */}
          {loading && properties.length > 0 && (
            <div style={{ height: 2, background: T.primaryL, margin: "0 20px 4px", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: T.primary, borderRadius: 2, animation: "loading-bar 1.4s ease-in-out infinite" }} />
            </div>
          )}
          <style>{`@keyframes loading-bar { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }`}</style>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "0 20px", paddingBottom: 120 }}>
            {loading && properties.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
              : !loading && displayProperties.length === 0
              ? (
                <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 24,
                    background: T.bgSoft, border: `1.5px dashed ${T.borderMd}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, marginBottom: 20,
                  }}>🏠</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.text1, letterSpacing: -0.3, marginBottom: 8 }}>
                    No properties found
                  </div>
                  <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, maxWidth: 240, marginBottom: 24 }}>
                    Try adjusting your filters or search for a different area.
                  </div>
                  <button onClick={() => { setChipListingType(""); setChipNeighbourhoods([]); setChipPropertyTypes([]); setSearch(""); setPropAiIds(null); setPropAiSuggestion(null); setFilters({ minPrice: null, maxPrice: null, propertyType: "", bedrooms: null }); }} style={{
                    padding: "14px 32px", borderRadius: 14,
                    background: T.text1, color: "#fff",
                    fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: T.font,
                  }}>
                    Clear all filters
                  </button>
                </div>
              )
              : displayProperties.map((p) => (
                <PropCard key={p.id} p={p} saved={isSaved(p.id)} onSave={() => toggle(p.id)} isLoggedIn={isLoggedIn} />
              ))
            }
          </div>
        </>
      )}

      {/* ── Filter panel overlay ── */}
      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {/* ── Saved panel overlay ── */}
      {showSaved && (
        <SavedPanel
          savedIds={saved}
          onClose={() => setShowSaved(false)}
          onUnsave={(id) => toggle(id)}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
