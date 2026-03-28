"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Property } from "@/lib/types";
import { getHeroImage } from "@/lib/utils";
import { useSavedListings } from "@/app/hooks/useSavedListings";

function formatPrice(price: number, currency: string, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(price);
}

interface PropertyCardProps {
  property: Property;
  /** Show as a horizontal compact row (for list view) */
  compact?: boolean;
}

export function PropertyCard({ property: p, compact = false }: PropertyCardProps) {
  const hero             = getHeroImage(p.images);
  const { isSaved, toggle } = useSavedListings();
  const saved            = isSaved(p.id);
  const [imgError, setImgError] = useState(false);

  const price    = formatPrice(p.price, p.currency);
  const location = p.neighbourhood ? `${p.neighbourhood}, ${p.city}` : p.city;
  const badge    = p.listing_type === "buy" ? "For Sale" : "For Rent";
  const badgeBg  = p.listing_type === "buy"
    ? "bg-blue-500/85"
    : "bg-emerald-600/85";

  if (compact) {
    // ── Horizontal list card ────────────────────────────────────────────────
    return (
      <Link href={`/properties/${p.id}`}
        className="group flex items-center bg-white rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Thumbnail */}
        <div className="relative w-28 h-24 shrink-0 bg-slate-100">
          {hero && !imgError ? (
            <Image src={hero} alt={p.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="112px" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🏠</div>
          )}
          <div className={`absolute top-1.5 left-1.5 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badgeBg} backdrop-blur-sm`}>
            {badge}
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 py-3 px-3.5">
          <p className="font-semibold text-slate-800 text-sm truncate">{p.title}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-base" style={{ color: "var(--color-primary)" }}>
              {formatPrice(p.price, p.currency, true)}
              {p.listing_type === "rent" && <span className="text-slate-400 font-normal text-xs ml-1">/mo</span>}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {p.bedrooms > 0 && <span>{p.bedrooms} Zi.</span>}
              {p.area_sqm && <span>{p.area_sqm} m²</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Standard grid card ────────────────────────────────────────────────────
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100/80 overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms var(--ease-spring), transform 200ms var(--ease-spring)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
    >
      {/* Save button */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(p.id); }}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.12)" }}
        title={saved ? "Remove from saved" : "Save listing"}
      >
        <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: saved ? "var(--color-primary)" : "#94a3b8" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link href={`/properties/${p.id}`} className="block">
        {/* Image */}
        <div className="relative h-52 bg-slate-100 overflow-hidden">
          {hero && !imgError ? (
            <Image src={hero} alt={p.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200 text-5xl">🏠</div>
          )}

          {/* Subtle gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* For Rent / For Sale badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-white backdrop-blur-sm ${badgeBg}`}>
              {badge}
            </span>
          </div>

          {/* Property type chip */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium capitalize tracking-wide">
              {p.property_type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>
              {price}
            </span>
            {p.listing_type === "rent" && (
              <span className="text-xs text-slate-400 font-normal">/mo</span>
            )}
          </div>

          {/* Title */}
          <p className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1 leading-snug">{p.title}</p>

          {/* Location */}
          <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
            <svg className="w-3 h-3 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location}
          </p>

          {/* Specs row */}
          <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
            {p.bedrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {p.bedrooms} bd
              </span>
            )}
            {p.bathrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
                {p.bathrooms} ba
              </span>
            )}
            {p.area_sqm && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {p.area_sqm} m²
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
