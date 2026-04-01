"use client";

import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { formatPrice, getHeroImage } from "@/lib/utils";
import { useSavedListings } from "@/app/hooks/useSavedListings";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const hero = getHeroImage(property.images);
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(property.id);
  const isRent = property.listing_type === "rent";

  return (
    <div
      className="group relative overflow-hidden transition-all duration-200"
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "var(--border2)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "var(--border)";
        el.style.transform = "";
        el.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Save button */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(property.id); }}
        aria-label={saved ? "Aus Gespeichert entfernen" : "Inserat speichern"}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 30, height: 30, borderRadius: 8,
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", backdropFilter: "blur(6px)",
          transition: "all 0.12s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = saved
            ? "rgba(255,69,58,0.3)"
            : "rgba(255,255,255,0.15)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.45)";
        }}
      >
        <svg
          width="13" height="13"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          viewBox="0 0 24 24"
          style={{ color: saved ? "var(--err)" : "rgba(255,255,255,0.7)" }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      <Link href={`/properties/${property.id}`} style={{ display: "block", textDecoration: "none" }}>

        {/* Image */}
        <div style={{ position: "relative", height: 168, overflow: "hidden" }}>
          {hero ? (
            <Image
              src={hero}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #1A1A2E 0%, #2A2040 50%, #1F1A35 100%)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="32" height="32" fill="none" stroke="var(--color-primary)" strokeWidth={1.5} viewBox="0 0 24 24" style={{ opacity: 0.4 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {property.property_type}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, background: "linear-gradient(transparent, rgba(0,0,0,0.45))" }} />

          {/* Listing type badge */}
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 6,
              fontSize: 11, fontWeight: 600,
              background: isRent ? "var(--color-primary-light)" : "rgba(48,209,88,0.12)",
              color: isRent ? "var(--color-primary)" : "var(--ok)",
              border: `1px solid ${isRent ? "rgba(124,110,242,0.25)" : "rgba(48,209,88,0.2)"}`,
              backdropFilter: "blur(8px)",
            }}>
              {isRent ? "Miete" : "Kauf"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {formatPrice(property.price, property.currency)}
            {isRent && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-2)", marginLeft: 3 }}>/Mo</span>}
          </p>

          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginTop: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
            {property.title}
          </p>

          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, color: "var(--text-3)" }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {property.neighbourhood ? `${property.neighbourhood}, ${property.city}` : property.city}
          </p>

          <div style={{
            borderTop: "1px solid var(--border)",
            marginTop: 12, paddingTop: 12,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {property.bedrooms > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 10V7a1 1 0 011-1h16a1 1 0 011 1v3M3 10v7a1 1 0 001 1h16a1 1 0 001-1v-7M8 10V8m8 2V8" />
                </svg>
                {property.bedrooms} Zi
              </span>
            )}
            {property.bathrooms > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h3m13 7a2 2 0 01-2 2H4m16 0v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
                </svg>
                {property.bathrooms} Bad
              </span>
            )}
            {property.area_sqm && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.area_sqm} m²
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
