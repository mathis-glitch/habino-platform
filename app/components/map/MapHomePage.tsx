"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords, MapBounds } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load Leaflet map client-side only (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => null,
});

// ── City coordinates (150+ cities worldwide) ─────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // East Africa
  "Nairobi":          [-1.2921,  36.8219], "Nairobi CBD":     [-1.2921,  36.8219],
  "Mombasa":          [-4.0435,  39.6682], "Kisumu":          [-0.0917,  34.7679],
  "Nakuru":           [-0.3031,  36.0800], "Dar es Salaam":   [-6.7924,  39.2083],
  "Arusha":           [-3.3869,  36.6829], "Kampala":         [ 0.3476,  32.5825],
  "Entebbe":          [ 0.0512,  32.4633], "Kigali":          [-1.9441,  30.0619],
  "Addis Ababa":      [ 9.1450,  38.7251], "Maputo":          [-25.9653, 32.5892],
  "Windhoek":         [-22.5597, 17.0832],
  // West Africa
  "Lagos":            [ 6.5244,   3.3792], "Abuja":           [ 9.0765,   7.3986],
  "Port Harcourt":    [ 4.8156,   7.0498], "Kano":            [12.0022,   8.5920],
  "Ibadan":           [ 7.3775,   3.9470], "Accra":           [ 5.6037,  -0.1870],
  "Accra East":       [ 5.6500,  -0.1500], "Kumasi":          [ 6.6885,  -1.6244],
  "Abidjan":          [ 5.3600,  -4.0083], "Dakar":           [14.7167, -17.4677],
  "Douala":           [ 4.0483,   9.7043], "Yaoundé":         [ 3.8480,  11.5021],
  "Lomé":             [ 6.1375,   1.2123], "Bamako":          [12.6392,  -8.0029],
  "Conakry":          [ 9.6412, -13.5784], "Freetown":        [ 8.4657, -13.2317],
  // North Africa
  "Cairo":            [30.0444,  31.2357], "Alexandria":      [31.2001,  29.9187],
  "Casablanca":       [33.5731,  -7.5898], "Marrakech":       [31.6295,  -7.9811],
  "Rabat":            [33.9716,  -6.8498], "Tunis":           [36.8190,  10.1658],
  "Algiers":          [36.7538,   3.0588],
  // Southern Africa
  "Cape Town":        [-33.9249, 18.4241], "Johannesburg":    [-26.2041, 28.0473],
  "Durban":           [-29.8587, 31.0218], "Pretoria":        [-25.7479, 28.2293],
  "Lusaka":           [-15.3875, 28.3228], "Harare":          [-17.8252, 31.0335],
  // Central Africa
  "Kinshasa":         [-4.3317,  15.3323], "Antananarivo":    [-18.9137, 47.5361],
  // Gulf & Middle East
  "Dubai":            [25.2048,  55.2708], "Abu Dhabi":       [24.4539,  54.3773],
  "Sharjah":          [25.3462,  55.4212], "Riyadh":          [24.7136,  46.6753],
  "Jeddah":           [21.4858,  39.1925], "Doha":            [25.2854,  51.5310],
  "Kuwait City":      [29.3759,  47.9774], "Muscat":          [23.5880,  58.3829],
  "Manama":           [26.2235,  50.5876],
  // Asia
  "Mumbai":           [19.0760,  72.8777], "Bangalore":       [12.9716,  77.5946],
  "Delhi":            [28.6139,  77.2090], "Hyderabad":       [17.3850,  78.4867],
  "Bangkok":          [13.7563, 100.5018], "Phuket":          [ 7.8804,  98.3923],
  "Jakarta":          [-6.2088, 106.8456], "Bali":            [-8.4095, 115.1889],
  "Kuala Lumpur":     [ 3.1390, 101.6869], "Ho Chi Minh":     [10.8231, 106.6297],
  "Singapore":        [ 1.3521, 103.8198], "Manila":          [14.5995, 120.9842],
  "Colombo":          [ 6.9271,  79.8612], "Karachi":         [24.8607,  67.0011],
  "Lahore":           [31.5204,  74.3587],
  // Europe
  "London":           [51.5074,  -0.1278], "Berlin":          [52.5200,  13.4050],
  "Munich":           [48.1351,  11.5820], "Paris":           [48.8566,   2.3522],
  "Barcelona":        [41.3851,   2.1734], "Madrid":          [40.4168,  -3.7038],
  "Amsterdam":        [52.3676,   4.9041], "Vienna":          [48.2082,  16.3738],
  "Zurich":           [47.3769,   8.5417], "Lisbon":          [38.7223,  -9.1393],
  "Warsaw":           [52.2297,  21.0122], "Prague":          [50.0755,  14.4378],
  "Budapest":         [47.4979,  19.0402], "Istanbul":        [41.0082,  28.9784],
  "Athens":           [37.9838,  23.7275], "Rome":            [41.9028,  12.4964],
  "Milan":            [45.4642,   9.1900], "Stockholm":       [59.3293,  18.0686],
  "Copenhagen":       [55.6761,  12.5683], "Dublin":          [53.3498,  -6.2603],
  "Brussels":         [50.8503,   4.3517],
  // Americas
  "New York":         [40.7128, -74.0060], "Miami":           [25.7617, -80.1918],
  "Los Angeles":      [34.0522,-118.2437], "Chicago":         [41.8781, -87.6298],
  "Toronto":          [43.6532, -79.3832], "Vancouver":       [49.2827,-123.1207],
  "São Paulo":        [-23.5505,-46.6333], "Rio de Janeiro":  [-22.9068,-43.1729],
  "Buenos Aires":     [-34.6037,-58.3816], "Bogotá":          [ 4.7110, -74.0721],
  "Lima":             [-12.0464,-77.0428], "Mexico City":     [19.4326, -99.1332],
  "Santiago":         [-33.4489,-70.6693],
  // Oceania
  "Sydney":           [-33.8688, 151.2093], "Melbourne":      [-37.8136, 144.9631],
  "Brisbane":         [-27.4698, 153.0251], "Auckland":       [-36.8485, 174.7633],
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
              {property.bedrooms > 0  && <span>{property.bedrooms} bd.</span>}
              {property.bathrooms > 0 && <><span>·</span><span>{property.bathrooms} ba.</span></>}
              {property.area_sqm      && <><span>·</span><span>{property.area_sqm} m²</span></>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-3 pt-1">
          <Link href={`/properties/${property.id}`}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white text-center"
            style={{ backgroundColor: "var(--color-primary)" }}>
            View details
          </Link>
          <Link href={`/?chat=1&q=${encodeURIComponent(`Book a viewing for "${property.title}"`)}`}
            className="px-4 py-3 rounded-2xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            Ask AI
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Habino control-centre panel ───────────────────────────────────────────────
function HabinoPanel({ onClose }: { onClose: () => void }) {
  const items = [
    { href: "/profile",  icon: "👤", label: "Profile" },
    { href: "/home",     icon: "📄", label: "Contracts" },
    { href: "/saved",    icon: "🔖", label: "Saved Properties" },
    { href: "/listings", icon: "🏠", label: "My Listings" },
  ];
  return (
    <div
      className="fixed z-[200] overflow-hidden"
      style={{
        left: "16px",
        top: "16px",
        width: "clamp(220px, 18vw, 280px)",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        borderRadius: "20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
        border: "1px solid rgba(255,255,255,0.55)",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60">
        <span className="text-sm font-bold text-slate-800">Habino</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Nav items */}
      <nav className="p-2 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-slate-900 transition-all">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MapHomePage() {
  const [properties,   setProperties]   = useState<PropertyWithCoords[]>([]);
  const [selected,     setSelected]     = useState<PropertyWithCoords | null>(null);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [habinoOpen,   setHabinoOpen]   = useState(false);

  // Track which city names have already been fetched so we don't re-fetch on every pan
  const loadedCities = useRef<Set<string>>(new Set());

  // Called by LeafletMap whenever the viewport changes (pan / zoom)
  const handleBoundsChange = useCallback(async (bounds: MapBounds) => {
    // Find all known cities whose centre falls inside the current viewport
    // Expand bounds slightly so pins near edges appear before the city center scrolls in
    const pad = 0.5;
    const visibleCities = Object.entries(CITY_COORDS)
      .filter(([, [lat, lng]]) =>
        lat >= bounds.south - pad && lat <= bounds.north + pad &&
        lng >= bounds.west  - pad && lng <= bounds.east  + pad
      )
      .map(([city]) => city)
      .filter(city => !loadedCities.current.has(city));

    if (!visibleCities.length) return;

    // Mark as loading immediately to prevent duplicate requests
    visibleCities.forEach(c => loadedCities.current.add(c));

    // Fetch up to 15 cities in parallel, 60 listings each
    const chunks = visibleCities.slice(0, 15);
    const results = await Promise.all(
      chunks.map(city =>
        fetch(`/api/properties?city=${encodeURIComponent(city)}&limit=60&sort=newest`)
          .then(r => r.ok ? r.json() : { data: [] })
          .then(d => withCoords(d.data ?? []))
          .catch(() => [] as PropertyWithCoords[])
      )
    );

    const fresh = results.flat();
    if (!fresh.length) return;

    setProperties(prev => {
      const seen = new Set(prev.map(p => p.id));
      const added = fresh.filter(p => !seen.has(p.id));
      // Cap total pins at 800 for performance — keep the newest additions
      const merged = [...prev, ...added];
      return merged.length > 800 ? merged.slice(merged.length - 800) : merged;
    });
  }, []);

  // Start centered on Africa/Middle East at zoom 4 to show global spread immediately
  const mapCenter: [number, number] = [15, 30];

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
            Map
          </button>
          <span className="text-sm font-semibold text-slate-800">AI Search</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatPage sidebarMode />
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
        zoom={4}
        properties={properties}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        onBoundsChange={handleBoundsChange}
      />

      {/* ── LAYER 1: All UI overlays (z-index above map's 0) ── */}

      {/* Mobile: floating KI button */}
      <button
        onClick={() => setChatOpen(true)}
        className="md:hidden fixed z-[100] bottom-[72px] right-4 w-12 h-12 rounded-2xl text-white shadow-lg flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--color-primary)" }}>
        AI
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
        {/* Panel top bar with Habino button */}
        <div className="shrink-0 flex items-center justify-end px-4 pt-3 pb-0">
          <button
            onClick={() => setHabinoOpen((o) => !o)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: habinoOpen ? "var(--color-secondary)" : "var(--color-primary)" }}>
            Habino
          </button>
        </div>
        <AIChatPage sidebarMode />
      </div>

      {/* ── Habino control-centre panel (desktop) ── */}
      {habinoOpen && (
        <div className="hidden md:block">
          <HabinoPanel onClose={() => setHabinoOpen(false)} />
        </div>
      )}

      {/* Property sheet */}
      {selected && <PropertySheet property={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
