"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load Leaflet map client-side only (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => null,
});

// ── City coordinates ──────────────────────────────────────────────────────────
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
};


function hashNum(s: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xfffff;
  return ((h % 200) - 100) / 4000;
}

function withCoords(props: Property[]): PropertyWithCoords[] {
  return props.flatMap((p) => {
    const base = CITY_COORDS[p.city];
    if (!base) return [];
    return [{ ...p, lat: base[0] + hashNum(p.id, 1), lng: base[1] + hashNum(p.id, 2) }];
  });
}

function fmtFull(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// ── Property bottom sheet ─────────────────────────────────────────────────────
function PropertySheet({ property, onClose }: { property: PropertyWithCoords; onClose: () => void }) {
  const img = property.images?.[0]?.url;
  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/10" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[410] bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-250"
        style={{ paddingBottom: "calc(52px + env(safe-area-inset-bottom))" }}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>
        <div className="flex gap-4 px-5 pb-2">
          <Link href={`/properties/${property.id}`}
            className="relative w-24 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            {img ? <Image src={img} alt={property.title} fill className="object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center text-2xl text-slate-300">🏠</div>}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">
                  {fmtFull(property.price, property.currency)}
                  {property.listing_type === "rent" && <span className="text-sm font-normal text-slate-400 ml-0.5">/mo</span>}
                </p>
                <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{property.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
                </p>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2.5 mt-2 text-xs text-slate-400">
              {property.bedrooms > 0  && <span>{property.bedrooms} Zi.</span>}
              {property.bathrooms > 0 && <><span>·</span><span>{property.bathrooms} Bad</span></>}
              {property.area_sqm      && <><span>·</span><span>{property.area_sqm} m²</span></>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-3 pt-1">
          <Link href={`/properties/${property.id}`}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white text-center"
            style={{ backgroundColor: "var(--color-primary)" }}>
            Details ansehen
          </Link>
          <Link href={`/?chat=1&q=${encodeURIComponent(`Besichtigung für "${property.title}"`)}`}
            className="px-4 py-3 rounded-2xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            KI fragen
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MapHomePage() {
  const [properties, setProperties] = useState<PropertyWithCoords[]>([]);
  const [selected,   setSelected]   = useState<PropertyWithCoords | null>(null);
  const [activeCity] = useState("Nairobi");
  const [chatOpen,   setChatOpen]   = useState(false);

  // Fetch properties for active city
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties?city=${encodeURIComponent(activeCity)}&limit=100&sort=newest`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        setProperties(withCoords(json.data || []));
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [activeCity]);

  const mapCenter: [number, number] = CITY_COORDS[activeCity] ?? [-1.2921, 36.8219];

  // Mobile: full-screen chat overlay
  if (chatOpen) {
    return (
      <div className="fixed inset-0 z-[500] bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 shrink-0">
          <button onClick={() => setChatOpen(false)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
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
    // Transparent root — the map sits behind everything via z-index: 0
    <div className="fixed inset-0" style={{ zIndex: 1 }}>

      {/* ── LAYER 0: Full-screen map (fixed, always fills viewport) ── */}
      <LeafletMap
        center={mapCenter}
        zoom={mapZoom}
        properties={properties}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      {/* ── LAYER 1: All UI overlays (z-index above map's 0) ── */}

      {/* Mobile: floating KI button */}
      <button
        onClick={() => setChatOpen(true)}
        className="md:hidden fixed z-[100] bottom-[72px] right-4 w-12 h-12 rounded-2xl text-white shadow-lg flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--color-primary)" }}>
        KI
      </button>

      {/* ── AI Chat panel — floating glass box, desktop only, ≤25vw ── */}
      <div
        className="hidden md:flex flex-col z-[100] fixed overflow-hidden"
        style={{
          right: "16px",
          top: "16px",
          bottom: "calc(52px + env(safe-area-inset-bottom) + 16px)",
          width: "clamp(300px, 25vw, 420px)",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
          border: "1px solid rgba(255,255,255,0.55)",
        }}>
        <AIChatPage sidebarMode />
      </div>

      {/* Property sheet */}
      {selected && <PropertySheet property={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
