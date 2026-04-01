"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { useSavedListings } from "@/app/hooks/useSavedListings";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHeroImage(images?: Property["images"]): string | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

function fmtPrice(price: number, currency: string, listingType: string) {
  const formatted = price >= 1_000_000
    ? `${(price / 1_000_000).toFixed(1)}M`
    : price >= 1_000
    ? `${(price / 1_000).toFixed(0)}K`
    : String(price);
  return `${currency} ${formatted}${listingType === "rent" ? "/mo" : ""}`;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment", house: "House", villa: "Villa",
  commercial: "Commercial", office: "Office", land: "Land",
  hall: "Hall", production: "Production", plot: "Plot",
};

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
];

const TYPES = [
  { key: "", label: "Any Type" },
  { key: "apartment", label: "Apartment" },
  { key: "house", label: "House" },
  { key: "villa", label: "Villa" },
  { key: "land", label: "Land" },
  { key: "commercial", label: "Commercial" },
];

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onSave, isSaved }: {
  property: Property;
  onSave: (id: string) => void;
  isSaved: boolean;
}) {
  const hero = getHeroImage(property.images);
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/properties/${property.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
        position: "relative",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)";
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 220, background: "#f0f0f5", overflow: "hidden" }}>
          {hero && !imgError ? (
            <Image
              src={hero}
              alt={property.title}
              fill
              style={{ objectFit: "cover" }}
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #e8e6fb 0%, #d4d0f7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="48" height="48" fill="none" stroke="#9b8bf5" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}

          {/* Listing type badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            padding: "4px 10px", borderRadius: 20,
            background: property.listing_type === "buy" ? "rgba(124,110,242,0.9)" : "rgba(52,199,89,0.9)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            backdropFilter: "blur(8px)",
          }}>
            {property.listing_type === "buy" ? "For Sale" : "For Rent"}
          </div>

          {/* Save button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(property.id); }}
            style={{
              position: "absolute", top: 10, right: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
              transition: "transform 0.15s",
            }}
          >
            <svg width="18" height="18"
              fill={isSaved ? "#FF453A" : "none"}
              stroke={isSaved ? "#FF453A" : "#333"}
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>

          {/* Photo count */}
          {(property.images?.length ?? 0) > 1 && (
            <div style={{
              position: "absolute", bottom: 10, right: 12,
              padding: "3px 8px", borderRadius: 12,
              background: "rgba(0,0,0,0.5)", color: "#fff",
              fontSize: 11, fontWeight: 600,
              backdropFilter: "blur(4px)",
            }}>
              {property.images!.length} photos
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "14px 16px 16px" }}>
          {/* Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>
              {fmtPrice(property.price, property.currency, property.listing_type)}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#7C6EF2",
              background: "rgba(124,110,242,0.08)", padding: "3px 8px", borderRadius: 8,
            }}>
              {PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}
            </span>
          </div>

          {/* Title */}
          <p style={{
            fontSize: 14, fontWeight: 600, color: "#1a1a2e",
            marginBottom: 6, lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {property.title}
          </p>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
            <svg width="12" height="12" fill="none" stroke="#8a8a9c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: 13, color: "#8a8a9c" }}>
              {property.neighbourhood ? `${property.neighbourhood}, ` : ""}{property.city}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 14, borderTop: "1px solid #f0f0f5", paddingTop: 10 }}>
            {property.bedrooms > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" fill="none" stroke="#8a8a9c" strokeWidth={1.8} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M3 12v7M21 12v7M3 19h18M3 12a9 9 0 0118 0M9 12V9a3 3 0 016 0v3" />
                </svg>
                <span style={{ fontSize: 13, color: "#4a4a5e", fontWeight: 500 }}>{property.bedrooms} bd</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" fill="none" stroke="#8a8a9c" strokeWidth={1.8} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M9 6L9 2M15 6V2M4 6h16v5a8 8 0 01-16 0V6zM4 11s0 7 8 7 8-7 8-7" />
                </svg>
                <span style={{ fontSize: 13, color: "#4a4a5e", fontWeight: 500 }}>{property.bathrooms} ba</span>
              </div>
            )}
            {property.area_sqm && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" fill="none" stroke="#8a8a9c" strokeWidth={1.8} strokeLinecap="round" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
                <span style={{ fontSize: 13, color: "#4a4a5e", fontWeight: 500 }}>{property.area_sqm} m²</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <div style={{ height: 220, background: "linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ height: 20, width: "60%", borderRadius: 6, background: "#f0f0f5", marginBottom: 8 }} />
        <div style={{ height: 16, width: "80%", borderRadius: 6, background: "#f0f0f5", marginBottom: 10 }} />
        <div style={{ height: 14, width: "50%", borderRadius: 6, background: "#f0f0f5" }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ExploreClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [listingType, setListingType]   = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [total, setTotal]               = useState(0);
  const { toggle, isSaved }             = useSavedListings();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (listingType)  params.set("type", listingType);
    if (propertyType) params.set("property_type", propertyType);
    if (activeSearch) params.set("city", activeSearch);
    params.set("limit", "20");
    params.set("sort", "newest");

    try {
      const res  = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [listingType, propertyType, activeSearch]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearch(search.trim());
  }

  return (
    <div style={{
      minHeight: "100%",
      background: "#fafafa",
      overflowY: "auto",
      overflowX: "hidden",
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "#fff",
        padding: "16px 16px 0",
        borderBottom: "1px solid #f0f0f5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <svg width="16" height="16" fill="none" stroke="#7C6EF2" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0f" }}>Addis Abeba</span>
          <svg width="14" height="14" fill="none" stroke="#8a8a9c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#f4f4f8", borderRadius: 14,
            padding: "10px 14px",
            border: "1.5px solid transparent",
            transition: "border-color 0.15s",
          }}
            onFocus={() => {}}
          >
            <svg width="16" height="16" fill="none" stroke="#8a8a9c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search district, city, keyword…"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 14, color: "#0a0a0f",
              }}
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setActiveSearch(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8a9c", padding: 0 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Buy / Rent tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setListingType(cat.key)} style={{
              flex: 1, padding: "10px 4px", border: "none", background: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: listingType === cat.key ? "#7C6EF2" : "#8a8a9c",
              borderBottom: listingType === cat.key ? "2px solid #7C6EF2" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Property type filter chips ── */}
      <div style={{
        display: "flex", gap: 8, padding: "12px 16px",
        overflowX: "auto", background: "#fff",
        borderBottom: "1px solid #f0f0f5",
      }}>
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => setPropertyType(t.key === propertyType ? "" : t.key)} style={{
            flexShrink: 0,
            padding: "6px 14px", borderRadius: 20,
            border: `1.5px solid ${propertyType === t.key ? "#7C6EF2" : "#e8e8f0"}`,
            background: propertyType === t.key ? "#7C6EF2" : "#fff",
            color: propertyType === t.key ? "#fff" : "#4a4a5e",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Results count ── */}
      <div style={{ padding: "12px 16px 4px" }}>
        <p style={{ fontSize: 13, color: "#8a8a9c", fontWeight: 500 }}>
          {loading ? "Loading…" : `${total} propert${total !== 1 ? "ies" : "y"} found`}
          {activeSearch ? ` for "${activeSearch}"` : " in Addis Abeba"}
        </p>
      </div>

      {/* ── Property grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
        gap: 16,
        padding: "8px 16px 96px",
      }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : properties.length === 0
          ? (
            <div style={{
              gridColumn: "1 / -1",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "64px 24px", textAlign: "center",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: "rgba(124,110,242,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <svg width="28" height="28" fill="none" stroke="#7C6EF2" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>No properties found</h3>
              <p style={{ fontSize: 14, color: "#8a8a9c", maxWidth: 260, lineHeight: 1.6 }}>
                Try adjusting your filters or search for a different area.
              </p>
              <button onClick={() => { setListingType(""); setPropertyType(""); setSearch(""); setActiveSearch(""); }}
                style={{
                  marginTop: 16, padding: "10px 20px", borderRadius: 12,
                  background: "#7C6EF2", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                Clear filters
              </button>
            </div>
          )
          : properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onSave={toggle}
              isSaved={isSaved(p.id)}
            />
          ))
        }
      </div>
    </div>
  );
}
