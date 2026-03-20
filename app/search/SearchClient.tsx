"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property, ListingType } from "@/lib/types";

// Lazily import the map to avoid SSR issues with Leaflet
const PropertyMap = dynamic(
  () => import("@/components/properties/PropertyMap"),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm text-slate-400">Loading map…</p>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "list" | "map";

interface SearchClientProps {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  listingType?: ListingType;
  sort: string;
  activeFilters: { label: string; removeUrl: string }[];
  buildUrl: (overrides: Record<string, string | undefined>) => string;
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export function SearchClient({
  properties, total, page, totalPages,
  query, sort, activeFilters, buildUrl,
}: SearchClientProps) {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <>
      {/* ── Results header ── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-bold text-slate-900 text-lg">
            {query ? `"${query}"` : "All Properties"}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">{total} {total === 1 ? "result" : "results"}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort — desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value, page: "1" })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? "text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                style={sort === opt.value ? { backgroundColor: "var(--color-primary)" } : {}}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
            {([
              { mode: "grid" as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                </svg>
              )},
              { mode: "list" as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )},
              { mode: "map" as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
              )},
            ] as { mode: ViewMode; icon: React.ReactNode }[]).map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`p-1.5 rounded-lg transition-all ${
                  view === mode
                    ? "text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                style={view === mode ? { backgroundColor: "var(--color-primary)" } : {}}
                title={`${mode} view`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeFilters.map((f) => (
            <Link
              key={f.label}
              href={f.removeUrl}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              {f.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          ))}
          <Link href="/search" className="text-xs text-slate-300 hover:text-red-400 px-2 py-1 transition-colors">
            Clear all
          </Link>
        </div>
      )}

      {/* ── Content ── */}
      {properties.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-3">
          <div className="text-5xl">🔍</div>
          <p className="font-semibold text-slate-700">No properties found</p>
          <p className="text-slate-400 text-sm">Try adjusting your filters or search term</p>
          <Link href="/search"
            className="mt-2 px-5 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Show all listings
          </Link>
        </div>
      ) : view === "map" ? (
        /* ── Map view ── */
        <div className="h-[70vh] min-h-[400px] w-full">
          <PropertyMap properties={properties} />
        </div>
      ) : view === "list" ? (
        /* ── List view ── */
        <div className="flex flex-col gap-2">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} compact />
          ))}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && view !== "map" && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-colors">
              ← Previous
            </Link>
          )}
          <span className="text-sm text-slate-400 px-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })}
              className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
