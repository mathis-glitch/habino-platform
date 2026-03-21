"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load map client-side only (Leaflet is not SSR-safe)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#f0ede8] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    </div>
  ),
});

// ── City centre coordinates ───────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "Nairobi":       [-1.2921,  36.8219],
  "Mombasa":       [-4.0435,  39.6682],
  "Addis Ababa":   [ 9.1450,  38.7251],
  "Lagos":         [ 6.5244,   3.3792],
  "Abuja":         [ 9.0765,   7.3986],
  "Cape Town":     [-33.9249, 18.4241],
  "Johannesburg":  [-26.2041, 28.0473],
  "Durban":        [-29.8587, 31.0218],
  "Accra":         [ 5.6037,  -0.1870],
  "Dar es Salaam": [-6.7924,  39.2083],
  "Casablanca":    [33.5731,  -7.5898],
  "Cairo":         [30.0444,  31.2357],
  "Abidjan":       [ 5.3600,  -4.0083],
  "Kampala":       [ 0.3476,  32.5825],
  "Kigali":        [-1.9441,  30.0619],
  "Maputo":        [-25.9653, 32.5892],
  "Dakar":         [14.7167, -17.4677],
  "Harare":        [-17.8252, 31.0335],
  "Lusaka":        [-15.3875, 28.3228],
  "Dubai":         [25.2048,  55.2708],
  "Marrakech":     [31.6295,  -7.9811],
  "Tunis":         [36.8190,  10.1658],
  "Rabat":         [33.9716,  -6.8498],
  "Bamako":        [12.6392,  -8.0029],
  "Kinshasa":      [-4.3317,  15.3323],
  "Lomé":          [ 6.1375,   1.2123],
  "Antananarivo":  [-18.8792, 47.5079],
};

const QUICK_CITIES = ["Nairobi", "Lagos", "Addis Ababa", "Cape Town", "Dubai", "Accra", "Casablanca"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashNum(s: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xfffff;
  return ((h % 200) - 100) / 4000; // ±0.025°
}

function withCoords(props: Property[]): PropertyWithCoords[] {
  return props.flatMap((p) => {
    const base = CITY_COORDS[p.city];
    if (!base) return [];
    return [{ ...p, lat: base[0] + hashNum(p.id, 1), lng: base[1] + hashNum(p.id, 2) }];
  });
}

function fmtFull(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

// ── Property bottom sheet ─────────────────────────────────────────────────────
function PropertySheet({
  property,
  onClose,
}: {
  property: PropertyWithCoords;
  onClose: () => void;
}) {
  const img = property.images?.[0]?.url;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/10"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[210] bg-white rounded-t-3xl shadow-2xl
        animate-in slide-in-from-bottom duration-250"
        style={{ paddingBottom: "calc(52px + env(safe-area-inset-bottom))" }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex gap-4 px-5 pb-2">
          {/* Thumbnail */}
          <Link href={`/properties/${property.id}`}
            className="relative w-24 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            {img
              ? <Image src={img} alt={property.title} fill className="object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center text-2xl text-slate-300">🏠</div>
            }
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {fmtFull(property.price, property.currency)}
                  {property.listing_type === "rent" && (
                    <span className="text-sm font-normal text-slate-400 ml-0.5">/mo</span>
                  )}
                </p>
                <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{property.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2.5 mt-2 text-xs text-slate-400">
              {property.bedrooms  > 0 && <span>{property.bedrooms} Zi.</span>}
              {property.bathrooms > 0 && <><span>·</span><span>{property.bathrooms} Bad</span></>}
              {property.area_sqm       && <><span>·</span><span>{property.area_sqm} m²</span></>}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 px-5 pb-3 pt-1">
          <Link
            href={`/properties/${property.id}`}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Details ansehen
          </Link>
          <Link
            href={`/?chat=1&q=${encodeURIComponent(`Besichtigung für "${property.title}"`)}`}
            className="px-4 py-3 rounded-2xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            KI fragen
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Zoom controls ─────────────────────────────────────────────────────────────
function ZoomControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="flex flex-col gap-0.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 overflow-hidden">
      <button
        onClick={onZoomIn}
        className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors text-lg font-light">
        +
      </button>
      <div className="h-px bg-slate-100 mx-2" />
      <button
        onClick={onZoomOut}
        className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors text-lg font-light">
        −
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MapHomePage() {
  const [properties, setProperties]   = useState<PropertyWithCoords[]>([]);
  const [selected,   setSelected]     = useState<PropertyWithCoords | null>(null);
  const [activeCity, setActiveCity]   = useState("Nairobi");
  const [mapZoom,    setMapZoom]       = useState(12);
  const [query,      setQuery]         = useState("");
  const [chatOpen,   setChatOpen]      = useState(false);
  const [loading,    setLoading]       = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch properties for active city
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/properties?city=${encodeURIComponent(activeCity)}&limit=100&sort=newest`
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        setProperties(withCoords(json.data || []));
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [activeCity]);

  // Handle AI search
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // Detect city in query → fly map there
    const matchedCity = Object.keys(CITY_COORDS).find((c) =>
      q.toLowerCase().includes(c.toLowerCase())
    );
    if (matchedCity && matchedCity !== activeCity) {
      setActiveCity(matchedCity);
      return; // let the useEffect re-fetch
    }

    // Otherwise open AI chat with pre-filled query
    setChatOpen(true);
  }

  const mapCenter: [number, number] = CITY_COORDS[activeCity] ?? [-1.2921, 36.8219];

  // Mobile: full-screen chat overlay
  if (chatOpen) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setChatOpen(false)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Karte
          </button>
          <span className="text-sm font-semibold text-slate-800">KI-Suche</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatPage initialQuery={query} sidebarMode />
        </div>
      </div>
    );
  }

  return (
    /* ── Root: fixed full-screen, split into map + sidebar ── */
    <div className="fixed inset-0 flex overflow-hidden">

      {/* ══════════════ LEFT — Map area ══════════════ */}
      <div className="relative flex-1 h-full">

        {/* Map canvas */}
        <div className="absolute inset-0">
          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            properties={properties}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* ── Top overlay (search + city pills) ── */}
        <div className="absolute top-0 left-0 right-0 z-[100] pointer-events-none"
          style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="px-4 pt-4 pointer-events-auto">

            {/* Search pill */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-white/92 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/70 px-4 py-3">

              <span className="text-sm font-black tracking-tight shrink-0"
                style={{ color: "var(--color-primary)" }}>
                habino
              </span>
              <div className="w-px h-4 bg-slate-200 shrink-0" />

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Stadt, Stadtteil…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
              />

              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin shrink-0" />
              ) : (
                <>
                  {/* KI button — mobile only (desktop has permanent sidebar) */}
                  <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="md:hidden shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    KI
                  </button>
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </>
              )}
            </form>

            {/* City pills */}
            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {QUICK_CITIES.map((city) => {
                const active = city === activeCity;
                return (
                  <button
                    key={city}
                    onClick={() => { setActiveCity(city); setSelected(null); }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? "text-white border-transparent shadow-sm"
                        : "bg-white/85 backdrop-blur-xl text-slate-600 border-white/60 hover:bg-white shadow-sm"
                    }`}
                    style={active ? { backgroundColor: "var(--color-primary)" } : {}}>
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Zoom controls ── */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[100]">
          <ZoomControls
            onZoomIn={() => setMapZoom((z) => Math.min(z + 1, 19))}
            onZoomOut={() => setMapZoom((z) => Math.max(z - 1, 2))}
          />
        </div>

        {/* ── Listing count badge ── */}
        {properties.length > 0 && !selected && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[100]
            bg-white/92 backdrop-blur-xl rounded-full px-4 py-2 shadow-md border border-white/60
            text-xs font-semibold text-slate-700 whitespace-nowrap"
            style={{ bottom: "calc(52px + env(safe-area-inset-bottom) + 12px)" }}>
            {properties.length} Inserate
          </div>
        )}

        {/* ── Property detail sheet ── */}
        {selected && (
          <PropertySheet
            property={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* ══════════════ RIGHT — AI chat sidebar (desktop only) ══════════════ */}
      <div className="hidden md:flex flex-col w-[380px] border-l border-slate-100 bg-white overflow-hidden shrink-0">
        <AIChatPage sidebarMode />
      </div>
    </div>
  );
}
