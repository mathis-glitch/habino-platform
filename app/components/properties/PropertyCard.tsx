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
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* Save button */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(property.id); }}
        aria-label={saved ? "Aus Merkliste entfernen" : "Merken"}
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
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}

          {/* Listing type badge */}
          <div className="absolute top-3 left-3">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: property.listing_type === "buy" ? "#3B82F6" : "var(--color-primary)" }}
            >
              {property.listing_type === "buy" ? "Kaufen" : "Mieten"}
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

          <div className="border-t border-slate-100 mt-3 pt-3 flex items-center gap-3 text-xs text-slate-400">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} Zi.
              </span>
            )}
            {property.bathrooms > 0 && (
              <span>{property.bathrooms} Bad</span>
            )}
            {property.area_sqm && (
              <span>{property.area_sqm} m²</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
