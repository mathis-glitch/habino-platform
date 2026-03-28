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

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-200 hover:-translate-y-1" style={{ boxShadow: "var(--shadow-sm)" }} onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)"; }} onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}>

      {/* Save button */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(property.id); }}
        aria-label={saved ? "Remove from saved" : "Save listing"}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
      >
        <svg
          className="w-4 h-4 transition-colors"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: saved ? "#ef4444" : "#94a3b8" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link href={`/properties/${property.id}`} className="block">

        {/* Image */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {hero ? (
            <Image
              src={hero}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #e8f5ed 0%, #f0faf4 50%, #e2f0e8 100%)",
              }}
            >
              <svg className="w-10 h-10" fill="none" stroke="#4a7c59" strokeWidth={1.2} viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#4a7c59", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {property.property_type}
              </span>
            </div>
          )}

          {/* Listing type badge */}
          <div className="absolute top-3 left-3">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}
            >
              {property.listing_type === "buy" ? "Buy" : "Rent"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xl font-bold text-slate-900">
            {formatPrice(property.price, property.currency)}
            {property.listing_type === "rent" && (
              <span className="text-sm font-normal text-slate-400 ml-1">/mo</span>
            )}
          </p>

          <p className="font-medium text-slate-700 mt-1 line-clamp-1 text-sm">{property.title}</p>

          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.neighbourhood ? `${property.neighbourhood}, ${property.city}` : property.city}
          </p>

          <div className="border-t border-slate-100 mt-3 pt-3 flex items-center gap-3 text-xs text-slate-500">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M3 10V7a1 1 0 011-1h16a1 1 0 011 1v3M3 10v7a1 1 0 001 1h16a1 1 0 001-1v-7M8 10V8m8 2V8" />
                </svg>
                {property.bedrooms} bd
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h3m13 7a2 2 0 01-2 2H4m16 0v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
                </svg>
                {property.bathrooms} ba
              </span>
            )}
            {property.area_sqm && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
