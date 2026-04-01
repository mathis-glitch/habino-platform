"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Property } from "@/lib/types";
import { useSavedListings } from "@/app/hooks/useSavedListings";

// ── Design tokens (1:1 from mockup) ──────────────────────────────────────────
const T = {
  bg:       "#FFFFFF",
  bgSoft:   "#F7F7F7",
  bgSoft2:  "#EDEDED",
  border:   "rgba(0,0,0,0.07)",
  borderMd: "rgba(0,0,0,0.12)",
  text1:    "#1A1A2E",
  text2:    "#717171",
  text3:    "#AFAFAF",
  primary:  "#7C6EF2",
  primaryD: "#6459D4",
  primaryL: "rgba(124,110,242,0.10)",
  primaryM: "rgba(124,110,242,0.18)",
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

const CHIPS = [
  { key: "",     label: "All" },
  { key: "rent", label: "Rent" },
  { key: "buy",  label: "Buy" },
  { key: "Bole",        label: "Bole" },
  { key: "Kazanchis",   label: "Kazanchis" },
  { key: "Sarbet",      label: "Sarbet" },
  { key: "CMC",         label: "CMC" },
  { key: "Megenagna",   label: "Megenagna" },
  { key: "Piassa",      label: "Piassa" },
];

// ── Property Card — exact mockup layout ──────────────────────────────────────
function PropCard({ p, saved, onSave }: { p: Property; saved: boolean; onSave: () => void }) {
  const hero = getHero(p.images);
  const { main, suffix } = fmtPrice(p.price, p.currency, p.listing_type);
  const [imgErr, setImgErr] = useState(false);
  const isRent = p.listing_type === "rent";

  const subtitleParts = [
    p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1),
    p.bedrooms  > 0 ? `${p.bedrooms} bd` : null,
    p.bathrooms > 0 ? `${p.bathrooms} ba` : null,
  ].filter(Boolean).join(" · ");

  const tags = [
    p.area_sqm ? `${p.area_sqm} m²` : null,
    p.bedrooms > 0 ? `${p.bedrooms} rooms` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => window.location.assign(`/properties/${p.id}`)}
    >
      {/* Image */}
      <div style={{
        position: "relative", height: 230,
        background: T.bgSoft2, borderRadius: T.r2xl, overflow: "hidden",
      }}>
        {hero && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero} alt={p.title}
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, rgba(124,110,242,0.18) 0%, rgba(192,132,252,0.12) 100%)",
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
          background: isRent ? "rgba(124,110,242,.88)" : "rgba(52,199,89,.88)",
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
            cursor: "pointer", border: "none",
            boxShadow: T.shadowSm,
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

        {/* Photo dots */}
        {(p.images?.length ?? 0) > 1 && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 4,
          }}>
            {p.images!.slice(0, 4).map((_, i) => (
              <div key={i} style={{
                width: i === 0 ? 14 : 5, height: 5,
                borderRadius: i === 0 ? 3 : "50%",
                background: i === 0 ? "#fff" : "rgba(255,255,255,.6)",
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Info — exact mockup layout */}
      <div style={{ padding: "12px 2px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>
            {p.neighbourhood ? `${p.neighbourhood}, ` : ""}{p.city}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, color: T.text1 }}>
            <svg width="12" height="12" fill={T.text1} viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            New
          </div>
        </div>
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
                fontSize: 11, fontWeight: 500, color: T.text2,
                background: T.bgSoft,
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
function AISearchBar({ value, onChange, onSubmit }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: T.bg, borderRadius: 18, padding: "12px 14px",
        boxShadow: focused
          ? `0 0 0 4px ${T.primaryL},${T.shadowMd}`
          : T.shadowMd,
        border: `1.5px solid ${focused ? T.primary : "transparent"}`,
        cursor: "text",
        transition: "all .2s",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* AI icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: T.primaryL,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="18" height="18" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          {focused && <path d="M11 8v6M8 11h6" strokeWidth="2.5" />}
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
        <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
          {value ? "Tap search or press Enter" : "District · Type · Budget"}
        </div>
      </div>

      {/* Mic */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: T.bgSoft,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="14" height="14" fill="none" stroke={focused ? T.primary : T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
        </svg>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExploreClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeChip, setActiveChip] = useState("");
  const [total, setTotal]           = useState(0);
  const { toggle, isSaved }         = useSavedListings();

  // Derive listing_type / neighbourhood from chip
  const chipListingType  = activeChip === "rent" || activeChip === "buy" ? activeChip : "";
  const chipNeighbourhood = !chipListingType ? activeChip : "";

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (chipListingType)   params.set("type", chipListingType);
    if (chipNeighbourhood) params.set("neighbourhood", chipNeighbourhood);
    if (search.trim())     params.set("city", search.trim());
    params.set("limit", "20");
    params.set("sort", "newest");
    try {
      const res  = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      if (res.ok) { setProperties(data.properties ?? []); setTotal(data.total ?? 0); }
    } finally {
      setLoading(false);
    }
  }, [chipListingType, chipNeighbourhood, search]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  function handleSearch() {
    fetchProperties();
  }

  return (
    <div style={{
      flex: 1,
      background: T.bg, fontFamily: T.font,
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── Top area ── */}
      <div style={{ padding: "62px 20px 14px", background: T.bg }}>
        <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
          {greeting()}, Addis Abeba 👋
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text1, letterSpacing: -0.6, marginBottom: 18 }}>
          Find your next home.
        </div>
        <AISearchBar value={search} onChange={setSearch} onSubmit={handleSearch} />
      </div>

      {/* ── Toggle row ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 14px",
      }}>
        <div style={{
          display: "flex", background: T.bgSoft, borderRadius: 14, padding: 3, gap: 2,
        }}>
          {["Listing", "Map"].map((label) => (
            <button key={label} style={{
              padding: "8px 22px", borderRadius: 11,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              color: label === "Listing" ? T.text1 : T.text2,
              border: "none",
              background: label === "Listing" ? T.bg : "transparent",
              boxShadow: label === "Listing" ? T.shadowSm : "none",
              transition: "all .18s",
              fontFamily: T.font,
            }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text2, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          {loading ? "…" : `${total} results`}
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div style={{
        display: "flex", gap: 8, padding: "0 20px 18px",
        overflowX: "auto",
      }}>
        {CHIPS.map((chip) => (
          <button key={chip.key} onClick={() => setActiveChip(chip.key === activeChip ? "" : chip.key)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 14px", borderRadius: T.rFull,
            border: `1.5px solid ${activeChip === chip.key ? T.text1 : T.borderMd}`,
            background: activeChip === chip.key ? T.text1 : T.bg,
            fontSize: 13, fontWeight: 500,
            color: activeChip === chip.key ? "#fff" : T.text1,
            whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s",
            fontFamily: T.font,
            flexShrink: 0,
          }}>
            {activeChip === chip.key && chip.key !== "" && chip.key !== "rent" && chip.key !== "buy" && (
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.primary }} />
            )}
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Section header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px 14px",
      }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: T.text1, letterSpacing: -0.3 }}>
          Top picks for you
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, cursor: "pointer" }}>
          See all
        </div>
      </div>

      {/* ── Property list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "0 20px", paddingBottom: 120 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
          : properties.length === 0
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
              <button onClick={() => { setActiveChip(""); setSearch(""); }} style={{
                padding: "14px 32px", borderRadius: 14,
                background: T.text1, color: "#fff",
                fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                fontFamily: T.font,
              }}>
                Clear filters
              </button>
            </div>
          )
          : properties.map((p) => (
            <PropCard
              key={p.id}
              p={p}
              saved={isSaved(p.id)}
              onSave={() => toggle(p.id)}
            />
          ))
        }
      </div>
    </div>
  );
}
