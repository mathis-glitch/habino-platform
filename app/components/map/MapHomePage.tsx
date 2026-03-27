"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords, NeighbourhoodLabel } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load Leaflet map client-side only (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => null,
});

// ── Addis Ababa default center ────────────────────────────────────────────────
export const ADDIS_CENTER: [number, number] = [9.0192, 38.7525];
export const ADDIS_ZOOM = 13;

// ── Demo pins shown on the map before any search ──────────────────────────────
// One pin per major property type, spread across Addis Ababa neighbourhoods.
const IDLE_PINS: PropertyWithCoords[] = [
  { id:"demo-1", tenant_id:"", title:"3-bedroom apartment in Bole",          description:null, listing_type:"rent",   property_type:"apartment",  price:45000,    currency:"ETB", bedrooms:3, bathrooms:2, area_sqm:120, city:"Addis Ababa", neighbourhood:"Bole",             address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:8.9945, lng:38.7975 },
  { id:"demo-2", tenant_id:"", title:"Office space in Kazanchis",            description:null, listing_type:"rent",   property_type:"office",     price:85000,    currency:"ETB", bedrooms:0, bathrooms:0, area_sqm:250, city:"Addis Ababa", neighbourhood:"Kazanchis",        address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0205, lng:38.7562 },
  { id:"demo-3", tenant_id:"", title:"Family home in CMC",                   description:null, listing_type:"buy",    property_type:"house",      price:9500000,  currency:"ETB", bedrooms:4, bathrooms:3, area_sqm:280, city:"Addis Ababa", neighbourhood:"CMC",              address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0555, lng:38.7868 },
  { id:"demo-4", tenant_id:"", title:"Luxury villa in Ayat",                 description:null, listing_type:"buy",    property_type:"villa",      price:28000000, currency:"ETB", bedrooms:5, bathrooms:4, area_sqm:520, city:"Addis Ababa", neighbourhood:"Ayat",             address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0415, lng:38.8355 },
  { id:"demo-5", tenant_id:"", title:"Commercial unit in Merkato",           description:null, listing_type:"rent",   property_type:"commercial", price:55000,    currency:"ETB", bedrooms:0, bathrooms:0, area_sqm:180, city:"Addis Ababa", neighbourhood:"Merkato",          address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0275, lng:38.7358 },
  { id:"demo-6", tenant_id:"", title:"Land plot in Yeka",                    description:null, listing_type:"buy",    property_type:"land",       price:6500000,  currency:"ETB", bedrooms:0, bathrooms:0, area_sqm:800, city:"Addis Ababa", neighbourhood:"Yeka",             address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0598, lng:38.8102 },
  { id:"demo-7", tenant_id:"", title:"2-bedroom apartment in Megenagna",     description:null, listing_type:"rent",   property_type:"apartment",  price:32000,    currency:"ETB", bedrooms:2, bathrooms:1, area_sqm:85,  city:"Addis Ababa", neighbourhood:"Megenagna",        address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0300, lng:38.7872 },
  { id:"demo-8", tenant_id:"", title:"Event hall in Piassa",                 description:null, listing_type:"rent",   property_type:"hall",       price:120000,   currency:"ETB", bedrooms:0, bathrooms:4, area_sqm:600, city:"Addis Ababa", neighbourhood:"Piassa",           address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0360, lng:38.7545 },
  { id:"demo-9", tenant_id:"", title:"Warehouse in Akaki Kaliti",            description:null, listing_type:"rent",   property_type:"production", price:75000,    currency:"ETB", bedrooms:0, bathrooms:0, area_sqm:900, city:"Addis Ababa", neighbourhood:"Akaki Kaliti",     address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:8.8905, lng:38.7898 },
  { id:"demo-10",tenant_id:"", title:"Residential plot in Sarbet",           description:null, listing_type:"buy",    property_type:"plot",       price:3200000,  currency:"ETB", bedrooms:0, bathrooms:0, area_sqm:350, city:"Addis Ababa", neighbourhood:"Sarbet",           address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:8.9970, lng:38.7558 },
  { id:"demo-11",tenant_id:"", title:"Studio apartment in Lideta",           description:null, listing_type:"rent",   property_type:"apartment",  price:18000,    currency:"ETB", bedrooms:1, bathrooms:1, area_sqm:45,  city:"Addis Ababa", neighbourhood:"Lideta",           address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0120, lng:38.7392 },
  { id:"demo-12",tenant_id:"", title:"4-bedroom house in Kolfe Keranio",     description:null, listing_type:"buy",    property_type:"house",      price:7800000,  currency:"ETB", bedrooms:4, bathrooms:3, area_sqm:220, city:"Addis Ababa", neighbourhood:"Kolfe Keranio",    address:null, agent_name:null, agent_phone:null, agent_email:null, status:"active", created_at:"", updated_at:"", lat:9.0198, lng:38.6905 },
];

// ── Neighbourhood coordinates — Addis Ababa only ──────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // City centre fallback
  "Addis Ababa":      [ 9.0192,  38.7525],
  "Addis":            [ 9.0192,  38.7525],

  // ── Addis Ababa neighbourhoods ────────────────────────────────────────────
  // Core / central
  "Kazanchis":        [ 9.0200,  38.7557],
  "Kirkos":           [ 9.0050,  38.7700],
  "Arada":            [ 9.0368,  38.7480],
  "Addis Ketema":     [ 9.0310,  38.7300],
  "Mexico":           [ 9.0155,  38.7486],
  "Stadium":          [ 9.0230,  38.7560],
  "Hayahulet":        [ 9.0130,  38.7520],
  "Kera":             [ 9.0030,  38.7480],
  "Tor Hailoch":      [ 9.0010,  38.7350],

  // Bole / south-east
  "Bole":             [ 8.9935,  38.7986],
  "Bole Atlas":       [ 9.0010,  38.7870],
  "Bole Medhanialem": [ 9.0070,  38.7790],
  "Bole Arabsa":      [ 8.9700,  38.8100],
  "Old Airport":      [ 8.9895,  38.7795],
  "Summit":           [ 9.0050,  38.8010],
  "Urael":            [ 9.0150,  38.7750],
  "Gerji":            [ 9.0107,  38.8200],
  "Saris":            [ 8.9780,  38.7750],

  // North / north-east
  "Piassa":           [ 9.0355,  38.7543],
  "Arat Kilo":        [ 9.0414,  38.7542],
  "Sidist Kilo":      [ 9.0486,  38.7634],
  "Megenagna":        [ 9.0296,  38.7869],
  "Aware":            [ 9.0380,  38.7980],
  "Lamberet":         [ 9.0680,  38.7950],
  "CMC":              [ 9.0562,  38.7864],
  "CMC Michael":      [ 9.0500,  38.7900],
  "Ayat":             [ 9.0411,  38.8352],
  "Yeka":             [ 9.0600,  38.8100],

  // North-west
  "Merkato":          [ 9.0271,  38.7352],
  "Gulele":           [ 9.0780,  38.7400],
  "Gullele":          [ 9.0780,  38.7400],

  // West
  "Lideta":           [ 9.0117,  38.7394],
  "Kolfe":            [ 9.0200,  38.6900],
  "Kolfe Keranio":    [ 9.0200,  38.6900],

  // South / south-west
  "Sarbet":           [ 8.9973,  38.7561],
  "Sar Bet":          [ 8.9973,  38.7561],
  "Nifas Silk":       [ 8.9720,  38.7400],
  "Nifas Silk-Lafto": [ 8.9720,  38.7400],
  "Lafto":            [ 8.9600,  38.7300],
  "Gofa":             [ 8.9780,  38.7150],
  "Jemo":             [ 8.9620,  38.7050],
  "Lebu":             [ 8.9500,  38.7200],

  // Far south (Akaki)
  "Akaki":            [ 8.8900,  38.7900],
  "Akaki Kaliti":     [ 8.8900,  38.7900],
  "Akaki Kality":     [ 8.8900,  38.7900],
  "Kality":           [ 8.8780,  38.7750],

  // Legacy fallback for any non-Addis data still in DB
  "Nairobi":          [-1.2921,  36.8219],

};

// ── Neighbourhood labels shown on the map ────────────────────────────────────
// Major districts only — shown as text overlays between zoom 11–15.
const NEIGHBOURHOOD_LABELS: NeighbourhoodLabel[] = [
  { name: "Bole",         lat:  8.9935, lng: 38.7986 },
  { name: "Kazanchis",    lat:  9.0200, lng: 38.7557 },
  { name: "CMC",          lat:  9.0562, lng: 38.7864 },
  { name: "Megenagna",    lat:  9.0296, lng: 38.7869 },
  { name: "Piassa",       lat:  9.0355, lng: 38.7543 },
  { name: "Merkato",      lat:  9.0271, lng: 38.7352 },
  { name: "Arada",        lat:  9.0368, lng: 38.7480 },
  { name: "Sarbet",       lat:  8.9973, lng: 38.7561 },
  { name: "Ayat",         lat:  9.0411, lng: 38.8352 },
  { name: "Gerji",        lat:  9.0107, lng: 38.8200 },
  { name: "Yeka",         lat:  9.0600, lng: 38.8100 },
  { name: "Lafto",        lat:  8.9600, lng: 38.7300 },
  { name: "Akaki Kaliti", lat:  8.8900, lng: 38.7900 },
  { name: "Gullele",      lat:  9.0780, lng: 38.7400 },
  { name: "Kolfe",        lat:  9.0200, lng: 38.6900 },
  { name: "Lideta",       lat:  9.0117, lng: 38.7394 },
  { name: "Kirkos",       lat:  9.0050, lng: 38.7700 },
  { name: "Addis Ketema", lat:  9.0310, lng: 38.7300 },
];

// ── Deterministic hash helper ─────────────────────────────────────────────────
function hashDeg(seed: string, range: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xfffff;
  return ((h % 10000) / 10000 - 0.5) * 2 * range;
}

// ── Haversine distance in metres ──────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Coordinate assignment ──────────────────────────────────────────────────────
// Uses actual lat/lng stored in the DB. Falls back to CITY_COORDS + hash jitter
// for legacy rows that predate the coordinates migration.
//
// MIN_DIST: only block truly co-incident pins (< 80 m).  The seed script now
// spreads listings via a ring layout so aggressive dedup is no longer needed.
// Micro-jitter for truly co-located pins (same building) so they don't stack
function jitterCoords(lat: number, lng: number, id: string, index: number): [number, number] {
  const angle = (index * 137.508) * Math.PI / 180; // golden angle spread
  const r = 0.00003 * index; // ~3m per step
  return [lat + r * Math.cos(angle), lng + r * Math.sin(angle)];
}

function withCoords(
  props: Property[],
  _placed: Array<[number, number]>,
): PropertyWithCoords[] {
  const result: PropertyWithCoords[] = [];
  // Track exact coordinates to detect co-location
  const seen = new Map<string, number>(); // "lat,lng" → count

  for (const p of props) {
    let lat: number;
    let lng: number;

    if (p.lat != null && p.lng != null) {
      lat = p.lat;
      lng = p.lng;
    } else {
      const base = CITY_COORDS[p.city];
      if (!base) continue;
      const nb = p.neighbourhood || p.city;
      lat = base[0] + hashDeg(nb + "_lat", 0.045) + hashDeg(p.id + "_lat", 0.006);
      lng = base[1] + hashDeg(nb + "_lng", 0.060) + hashDeg(p.id + "_lng", 0.006);
    }

    // If two properties share exact same coords (same building), jitter slightly
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const count = seen.get(key) ?? 0;
    if (count > 0) {
      [lat, lng] = jitterCoords(lat, lng, p.id, count);
    }
    seen.set(key, count + 1);

    result.push({ ...p, lat, lng });
  }
  return result;
}

function fmtFull(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// ── Placeholder images per property type (Unsplash, consistent per listing ID) ─
import { TYPE_COLORS, TYPE_LABELS } from "./LeafletMap";

const PROPERTY_IMAGES: Record<string, string[]> = {
  apartment:  [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&fit=crop&auto=format",
  ],
  house: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1449844908441-8d1a1ee1f31b?w=800&q=80&fit=crop&auto=format",
  ],
  villa: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&fit=crop&auto=format",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1524758631624-e2822132143c?w=800&q=80&fit=crop&auto=format",
  ],
  commercial: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80&fit=crop&auto=format",
  ],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fit=crop&auto=format",
  ],
  plot: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop&auto=format",
  ],
  hall: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&fit=crop&auto=format",
  ],
  production: [
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&fit=crop&auto=format",
  ],
};

/** Returns up to 3 deterministic placeholder images for this property (for carousel). */
function getPropertyImages(property: PropertyWithCoords): string[] {
  const realImgs = (property as Property & { images?: { url: string }[] }).images
    ?.map(i => i.url).filter(Boolean) ?? [];
  if (realImgs.length >= 1) return realImgs.slice(0, 3);
  const pool = PROPERTY_IMAGES[property.property_type] ?? PROPERTY_IMAGES.apartment;
  let h = 0;
  for (const c of property.id) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  const start = Math.abs(h) % pool.length;
  const count = Math.min(3, pool.length);
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

function getPropertyImage(property: PropertyWithCoords): string {
  return getPropertyImages(property)[0];
}

function getAgentAvatar(agentName: string): string {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(agentName)}`;
}

// ── Property detail panel ─────────────────────────────────────────────────────
function PropertyDetailPanel({
  property,
  onClose,
  allProperties,
}: {
  property: PropertyWithCoords;
  onClose: () => void;
  allProperties: PropertyWithCoords[];
}) {
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [imgErr,    setImgErr]    = useState(false);

  const color     = TYPE_COLORS[property.property_type] || "#6B7280";
  const typeLabel = TYPE_LABELS[property.property_type] || property.property_type;
  const priceFmt  = fmtFull(property.price, property.currency);
  const isRent    = property.listing_type === "rent";
  const ppm       = property.area_sqm && property.area_sqm > 0
    ? fmtFull(Math.round(property.price / property.area_sqm), property.currency) + "/m²"
    : null;
  const isResidential = ["apartment","house","villa"].includes(property.property_type);

  // ── Carousel images ───────────────────────────────────────────────────────
  const photos = getPropertyImages(property);

  // Reset on property change
  useEffect(() => { setPhotoIdx(0); setImgErr(false); }, [property.id]);

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const waMsg = `Hi! I'm interested in: "${property.title}" in ${property.neighbourhood || property.city}. Is it still available?`;
  const waUrl = property.agent_phone
    ? `https://wa.me/${property.agent_phone.replace(/\D/g,"")}?text=${encodeURIComponent(waMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

  // ── Market comparison (price/m² vs. other listings with area data) ────────
  const marketProps = allProperties.filter(
    p => p.area_sqm && p.area_sqm > 0 && p.listing_type === property.listing_type && p.id !== property.id
  );
  const avgMarketPpm = marketProps.length > 0
    ? marketProps.reduce((s, p) => s + p.price / p.area_sqm!, 0) / marketProps.length
    : null;
  const thisPpm     = property.area_sqm && property.area_sqm > 0 ? property.price / property.area_sqm : null;
  const pctVsMkt    = avgMarketPpm && thisPpm ? ((thisPpm - avgMarketPpm) / avgMarketPpm) * 100 : null;

  const mktColor  = pctVsMkt == null ? "#64748b" : pctVsMkt < -10 ? "#16a34a" : pctVsMkt > 10 ? "#ea580c" : "#8b5cf6";
  const mktBg     = pctVsMkt == null ? "#f8fafc" : pctVsMkt < -10 ? "#f0fdf4" : pctVsMkt > 10 ? "#fff7ed" : "#faf5ff";
  const mktBorder = pctVsMkt == null ? "#e2e8f0" : pctVsMkt < -10 ? "#bbf7d0" : pctVsMkt > 10 ? "#fed7aa" : "#e9d5ff";
  const mktLabel  = pctVsMkt == null ? "No market data" : pctVsMkt < -10 ? "✓ Below Market" : pctVsMkt > 10 ? "↑ Above Market" : "≈ At Market";

  // Emoji fallback per type
  const typeEmoji =
    property.property_type === "apartment" ? "🏢" : property.property_type === "house" ? "🏠"
    : property.property_type === "villa" ? "🏡" : property.property_type === "office" ? "🏗️"
    : property.property_type === "hall" ? "🎪" : property.property_type === "production" ? "🏭" : "🌿";

  const navBtn = (dir: "prev" | "next") => (
    <button
      onClick={e => { e.stopPropagation(); setPhotoIdx(i => dir === "prev" ? (i - 1 + photos.length) % photos.length : (i + 1) % photos.length); setImgErr(false); }}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: 10,
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "white",
        zIndex: 5,
      }}>
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col overflow-hidden h-full bg-white" style={{ borderRadius: 20 }}>

      {/* ── Hero / carousel ── */}
      <div className="relative w-full shrink-0" style={{ height: 210 }}>

        {/* Image or fallback */}
        {!imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photos[photoIdx]}
            src={photos[photoIdx]}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}15` }}>
            <span style={{ fontSize: 52 }}>{typeEmoji}</span>
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 55%)" }} />

        {/* Prev / Next arrows (only if multiple photos) */}
        {photos.length > 1 && !imgErr && navBtn("prev")}
        {photos.length > 1 && !imgErr && navBtn("next")}

        {/* Dot indicators */}
        {photos.length > 1 && !imgErr && (
          <div style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 5 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setPhotoIdx(i); setImgErr(false); }}
                style={{ width: 6, height: 6, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                  background: i === photoIdx % photos.length ? "white" : "rgba(255,255,255,0.45)", transition: "background .2s" }} />
            ))}
          </div>
        )}

        {/* Type badge (top-left) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: color }}>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{typeLabel}</span>
          <span className="text-[10px] text-white/80">{isRent ? "· Rent" : "· Sale"}</span>
        </div>

        {/* Close button (top-right) */}
        <button onClick={onClose}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "white",
          }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Price (bottom-left) */}
        <div className="absolute bottom-3 left-4">
          <span className="text-2xl font-extrabold text-white drop-shadow">{priceFmt}</span>
          {isRent && <span className="text-sm text-white/80 ml-1">/mo</span>}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-2">

          <p className="text-sm font-semibold text-slate-800 leading-snug mb-0.5">{property.title}</p>
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
          </p>

          {/* ── Market comparison badge ── */}
          {pctVsMkt !== null && (
            <div className="mb-3 p-2.5 rounded-xl border" style={{ background: mktBg, borderColor: mktBorder }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: mktColor }}>{mktLabel}</span>
                <span className="text-[10px] font-semibold" style={{ color: mktColor }}>
                  {pctVsMkt > 0 ? "+" : ""}{Math.round(pctVsMkt)}% vs avg/m²
                </span>
              </div>
              {/* Progress bar */}
              <div className="relative rounded-full overflow-hidden" style={{ height: 6, background: "#e2e8f0" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 999,
                  width: `${Math.min(100, Math.max(4, 50 + pctVsMkt * 1.5))}%`,
                  background: mktColor, transition: "width .3s",
                }} />
                <div style={{ position: "absolute", top: 0, left: "50%", height: "100%", width: 2, background: "rgba(0,0,0,0.18)" }} />
              </div>
              <p className="text-[9px] mt-1" style={{ color: "#94a3b8" }}>vs. avg. price/m² · {marketProps.length} comparable listings</p>
            </div>
          )}

          {/* ── Specs ── */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {isResidential && property.bedrooms > 0 && (
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-slate-800">{property.bedrooms}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Beds</p>
              </div>
            )}
            {isResidential && property.bathrooms > 0 && (
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-slate-800">{property.bathrooms}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Baths</p>
              </div>
            )}
            {property.area_sqm && (
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-slate-800">{property.area_sqm}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">m²</p>
              </div>
            )}
            {ppm && (
              <div className="rounded-xl p-2 text-center" style={{ background: `${color}12` }}>
                <p className="text-[11px] font-bold leading-tight" style={{ color }}>{ppm}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">per m²</p>
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">{property.description}</p>
          )}

          {/* ── Agent ── */}
          {property.agent_name && (
            <div className="border border-slate-100 rounded-xl p-3 mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getAgentAvatar(property.agent_name)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{property.agent_name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Broker · Habino</p>
              </div>
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#25D366" }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.117 1.533 5.845L.054 23.5l5.805-1.524A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.67-.52-5.183-1.424l-.371-.22-3.443.904.921-3.36-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Action button ── */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-100">
        <Link href={`/properties/${property.id}`}
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}>
          View full listing
        </Link>
      </div>
    </div>
  );
}

// ── Habino control-centre panel ───────────────────────────────────────────────
function HabinoPanel({ onClose }: { onClose: () => void }) {
  const items = [
    { href: "/profile",  icon: "👤", label: "My Profile" },
    { href: "/home",     icon: "📄", label: "My Contracts" },
    { href: "/saved",    icon: "🔖", label: "Saved Listings" },
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

// ── Compact property listing card ─────────────────────────────────────────────
function PropertyListingCard({
  property, onSelect, highlighted,
}: {
  property: PropertyWithCoords;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const color  = TYPE_COLORS[property.property_type] || "#6B7280";
  const label  = TYPE_LABELS[property.property_type] || property.property_type;
  const isRent = property.listing_type === "rent";
  const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency", currency: property.currency, maximumFractionDigits: 0,
  }).format(property.price);
  const isResidential = ["apartment", "house", "villa"].includes(property.property_type);
  const imgSrc = getPropertyImage(property);
  const p = property as Property;

  const typeEmoji =
    p.property_type === "apartment" ? "🏢" : p.property_type === "house" ? "🏠"
    : p.property_type === "villa" ? "🏡" : p.property_type === "office" ? "🏗️"
    : p.property_type === "hall" ? "🎪" : p.property_type === "production" ? "🏭" : "🌿";

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group"
      style={highlighted ? { borderRadius: 12, outline: `2px solid ${color}`, outlineOffset: 2 } : {}}
    >
      {/* ── Image ── */}
      <div className="relative rounded-xl overflow-hidden bg-slate-100" style={{ aspectRatio: "16/9" }}>
        {!imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}15` }}>
            <span style={{ fontSize: 32 }}>{typeEmoji}</span>
          </div>
        )}

        {/* Gradient overlay */}
        {!imgErr && <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 55%)" }} />}

        {/* Type badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="bg-white/95 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{label}</span>
        </div>

        {/* Rent / Sale pill */}
        <div className="absolute top-1.5 right-1.5">
          <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isRent ? "#F59E0B" : color }}>
            {isRent ? "Rent" : "Sale"}
          </span>
        </div>

        {/* Price bottom */}
        {!imgErr && (
          <div className="absolute bottom-1.5 left-2">
            <span className="text-[11px] font-bold text-white drop-shadow">{priceFmt}</span>
            {isRent && <span className="text-[9px] text-white/75 ml-0.5">/mo</span>}
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="mt-1.5 px-0.5 pb-1">
        {imgErr && (
          <p className="text-[10px] font-semibold text-slate-700 mb-0.5">{priceFmt}{isRent && <span className="text-slate-400 font-normal">/mo</span>}</p>
        )}
        <p className="text-[10px] font-semibold text-slate-900 leading-tight line-clamp-1">{p.title}</p>
        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{[p.neighbourhood, p.city].filter(Boolean).join(", ")}</p>

        {/* Specs */}
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {isResidential && p.bedrooms  > 0 && <span className="text-[9px] text-slate-500">{p.bedrooms} bd</span>}
          {isResidential && p.bathrooms > 0 && <span className="text-[9px] text-slate-400">· {p.bathrooms} ba</span>}
          {p.area_sqm && <span className="text-[9px] text-slate-400">· {p.area_sqm.toLocaleString()} m²</span>}
        </div>

        {/* Agent */}
        {p.agent_name && (
          <div className="flex items-center gap-1 mt-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAgentAvatar(p.agent_name)} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" onError={() => {}} />
            <span className="text-[9px] text-slate-400 truncate">{p.agent_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Deterministic city hash for simulated market data ─────────────────────────
function cityHash(s: string): number {
  let h = 5381;
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return h;
}

// ── Market Data Dashboard ─────────────────────────────────────────────────────
function MarketDataDashboard({
  context,
  properties,
}: {
  context: { city: string; country: string; currency: string } | null;
  properties: PropertyWithCoords[];
}) {
  if (!context) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", padding: 32 }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>📊</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8, textAlign: "center" }}>Ask about a market</p>
        <p style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
          Search for properties in the AI chat and the Data panel will show you market analytics for that city or neighbourhood.
        </p>
      </div>
    );
  }

  const { city, country, currency } = context;
  const h = cityHash(city + country);

  // ── Derive real stats from actual search results ──────────────────────────
  const rentProps  = properties.filter(p => p.listing_type === "rent");
  const saleProps  = properties.filter(p => p.listing_type !== "rent");
  const avgPrice   = properties.length
    ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length)
    : null;
  const avgRent    = rentProps.length
    ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length)
    : null;
  const propsWithArea = properties.filter(p => p.area_sqm && p.area_sqm > 0);
  const avgPpm = propsWithArea.length
    ? Math.round(propsWithArea.reduce((s, p) => s + p.price / p.area_sqm!, 0) / propsWithArea.length)
    : null;

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  for (const p of properties) typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxTypeCount = topTypes[0]?.[1] ?? 1;

  // ── Simulated 12-month price trend (deterministic from city hash) ─────────
  const basePrice = avgPrice ?? (50000 + (h % 200000));
  const months    = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const trend: number[] = months.map((_, i) => {
    const wave = Math.sin((i / 11) * Math.PI * 2 + (h % 100) / 50) * 0.06;
    const drift = (i / 11) * ((h % 3 === 0) ? 0.12 : -0.04);
    const noise = (((h >> i) & 0xf) / 15 - 0.5) * 0.05;
    return Math.round(basePrice * (1 + wave + drift + noise));
  });
  const tMin = Math.min(...trend) * 0.96;
  const tMax = Math.max(...trend) * 1.02;
  const tRange = tMax - tMin;

  // SVG dimensions
  const SW = 280, SH = 88, PAD_X = 8, PAD_Y = 10;
  const pts = trend.map((v, i) => {
    const x = PAD_X + (i / 11) * (SW - PAD_X * 2);
    const y = SH - PAD_Y - ((v - tMin) / tRange) * (SH - PAD_Y * 2);
    return `${x},${y}`;
  }).join(" ");

  // Fill path
  const firstPt = pts.split(" ")[0].split(",");
  const lastPt  = pts.split(" ")[11].split(",");
  const fillPath = `M ${firstPt[0]},${SH - PAD_Y} L ${pts.split(" ").map(p => p).join(" L ")} L ${lastPt[0]},${SH - PAD_Y} Z`;

  // YoY change (last vs first month)
  const yoy = ((trend[11] - trend[0]) / trend[0] * 100).toFixed(1);
  const yoyUp = parseFloat(yoy) >= 0;

  // Market sentiment (derived from hash + trend)
  const sentimentScore = (h % 5);
  const sentiments = ["Buyer's Market", "Slightly Buyer's", "Balanced", "Slightly Seller's", "Seller's Market"];
  const sentimentColors = ["#2563eb", "#0891b2", "#8b5cf6", "#d97706", "#dc2626"];
  const sentiment = sentiments[sentimentScore];
  const sentimentColor = sentimentColors[sentimentScore];

  // Days on market (simulated)
  const dom = 18 + (h % 42);

  // Format currency
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0, notation: n >= 1_000_000 ? "compact" : "standard" }).format(n);

  const CARD = { background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
  const LABEL = { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em" };
  const VALUE = { fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4, letterSpacing: "-0.02em" };
  const SUB = { fontSize: 11, color: "#64748b", marginTop: 2 };

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: "#f8fafc" }}>
      <div style={{ padding: "20px 20px 32px" }}>

        {/* City header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>{city}</h2>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{country}</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            Real estate market overview · {properties.length > 0 ? `${properties.length} listings analysed` : "Simulated market data"}
          </p>
        </div>

        {/* ── Key metric cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={CARD}>
            <div style={LABEL}>Avg. Price</div>
            <div style={VALUE}>{avgPrice ? fmt(avgPrice) : fmt(basePrice)}</div>
            <div style={SUB}>{saleProps.length > 0 ? `${saleProps.length} for sale` : "for sale"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Avg. Rent / mo</div>
            <div style={VALUE}>{avgRent ? fmt(avgRent) : fmt(Math.round(basePrice * 0.005))}</div>
            <div style={SUB}>{rentProps.length > 0 ? `${rentProps.length} rentals` : "rentals"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Price / m²</div>
            <div style={VALUE}>{avgPpm ? fmt(avgPpm) : fmt(Math.round(basePrice / (40 + h % 60)))}</div>
            <div style={SUB}>{propsWithArea.length > 0 ? `from ${propsWithArea.length} listings` : "estimated"}</div>
          </div>
          <div style={CARD}>
            <div style={LABEL}>Days on Market</div>
            <div style={VALUE}>{dom}</div>
            <div style={SUB}>avg. time to close</div>
          </div>
        </div>

        {/* ── Price trend chart ── */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={LABEL}>12-Month Price Trend</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: yoyUp ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                {yoyUp ? "▲" : "▼"} {Math.abs(parseFloat(yoy))}% YoY
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Peak</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmt(Math.max(...trend))}</div>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${SW} ${SH}`} style={{ display: "block" }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={yoyUp ? "#16a34a" : "#dc2626"} stopOpacity="0.15" />
                <stop offset="100%" stopColor={yoyUp ? "#16a34a" : "#dc2626"} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Fill area */}
            <path d={fillPath} fill="url(#trendGrad)" />
            {/* Line */}
            <polyline
              points={pts}
              fill="none"
              stroke={yoyUp ? "#16a34a" : "#dc2626"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Month labels */}
            {months.map((m, i) => (
              <text key={m + i} x={PAD_X + (i / 11) * (SW - PAD_X * 2)} y={SH - 1} textAnchor="middle" fontSize="7" fill="#94a3b8">{m}</text>
            ))}
          </svg>
        </div>

        {/* ── Property type breakdown ── */}
        {topTypes.length > 0 && (
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ ...LABEL, marginBottom: 12 }}>Property Types</div>
            {topTypes.map(([type, count]) => {
              const color = TYPE_COLORS[type] || "#6B7280";
              const label = TYPE_LABELS[type] || type;
              const pct   = Math.round((count / properties.length) * 100);
              return (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxTypeCount) * 100}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rent vs Sale split ── */}
        {(rentProps.length > 0 || saleProps.length > 0) && (
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ ...LABEL, marginBottom: 12 }}>Listing Type Split</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "For Rent", count: rentProps.length, color: "#2563eb" },
                { label: "For Sale", count: saleProps.length, color: "#2E7D46" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Market health ── */}
        <div style={CARD}>
          <div style={{ ...LABEL, marginBottom: 12 }}>Market Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
              background: `${sentimentColor}18`, border: `2px solid ${sentimentColor}40`,
              fontSize: 20,
            }}>
              {sentimentScore <= 1 ? "🐂" : sentimentScore === 2 ? "⚖️" : sentimentScore === 3 ? "🔥" : "🚀"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: sentimentColor }}>{sentiment}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {sentimentScore <= 1 ? "More supply than demand — good time to buy." : sentimentScore === 2 ? "Supply and demand are roughly balanced." : "High demand, low supply — competitive market."}
              </div>
            </div>
          </div>
          {/* Sentiment bar */}
          <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: "linear-gradient(to right, #2563eb, #8b5cf6, #dc2626)", position: "relative" }}>
            <div style={{
              position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
              left: `${(sentimentScore / 4) * 100}%`,
              width: 12, height: 12, borderRadius: 99, background: "white",
              border: `2.5px solid ${sentimentColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 600 }}>BUYER'S</span>
            <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 600 }}>SELLER'S</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Rotating market ticker for Map+Data combined view ─────────────────────────
function MarketTicker({ properties, context }: {
  properties: PropertyWithCoords[];
  context: { city: string; country: string; currency: string } | null;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  if (!context || properties.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12 }}>
        Search for properties to see market stats
      </div>
    );
  }

  const { city, currency } = context;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const propsWithArea = properties.filter(p => p.area_sqm && p.area_sqm > 0);
  const avgPricePerM2 = propsWithArea.length > 0
    ? Math.round(propsWithArea.reduce((s, p) => s + p.price / p.area_sqm!, 0) / propsWithArea.length) : 0;
  const avgPrice = Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length);
  const minPrice = Math.min(...properties.map(p => p.price));
  const maxPrice = Math.max(...properties.map(p => p.price));
  const rentCount = properties.filter(p => p.listing_type === "rent").length;
  const buyCount  = properties.filter(p => p.listing_type === "buy").length;
  const avgArea   = propsWithArea.length > 0
    ? Math.round(propsWithArea.reduce((s, p) => s + p.area_sqm!, 0) / propsWithArea.length) : 0;

  const stats = [
    { label: "Ø Price/m²", value: avgPricePerM2 > 0 ? fmt(avgPricePerM2) : "—", sub: city, icon: "📐" },
    { label: "Average Price", value: fmt(avgPrice), sub: `${properties.length} listings`, icon: "💰" },
    { label: "Price Range", value: `${fmt(minPrice)} – ${fmt(maxPrice)}`, sub: city, icon: "📊" },
    { label: "Ø Area", value: avgArea > 0 ? `${avgArea.toLocaleString()} m²` : "—", sub: "per listing", icon: "📏" },
    { label: "For Rent", value: String(rentCount), sub: `${buyCount} for sale`, icon: "🏠" },
  ].filter(s => s.value !== "—");

  const stat = stats[tick % stats.length];

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "white" }}>
      <div style={{ textAlign: "center", transition: "opacity .4s" }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>{stat.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{stat.label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{stat.value}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{stat.sub}</div>
      </div>
      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
        {stats.map((_, i) => (
          <div key={i} style={{ width: 4, height: 4, borderRadius: 99, background: i === tick % stats.length ? "#0f172a" : "#e2e8f0", transition: "background .4s" }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MapHomePage() {
  const [properties,     setProperties]     = useState<PropertyWithCoords[]>(IDLE_PINS);
  const [selected,       setSelected]       = useState<PropertyWithCoords | null>(null);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [habinoOpen,     setHabinoOpen]     = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [outputMode,     setOutputMode]     = useState<"listings" | "map">("map");
  const [isIdleState,    setIsIdleState]    = useState(true);   // true until first real search
  const [marketContext,  setMarketContext]  = useState<{ city: string; country: string; currency: string } | null>(null);
  const [mapCenter,      setMapCenter]      = useState<[number, number]>(ADDIS_CENTER);
  const [mapZoom,        setMapZoom]        = useState(ADDIS_ZOOM);

  // Called by AIChatPage when Claude returns matching properties
  const handlePropertiesFound = useCallback((ids: string[], props?: Property[]) => {
    setHighlightedIds(ids);
    if (props && props.length > 0) {
      setIsIdleState(false);
      const withC = withCoords(props, []);
      setProperties(withC);
      const first = props[0];
      if (first) {
        setMarketContext({
          city: first.city || "Unknown",
          country: (first as Property & { country?: string }).country || "",
          currency: first.currency || "USD",
        });
      }
      const withLatLng = props.filter(p => p.lat != null && p.lng != null);
      if (withLatLng.length > 0) {
        const avgLat = withLatLng.reduce((s, p) => s + p.lat!, 0) / withLatLng.length;
        const avgLng = withLatLng.reduce((s, p) => s + p.lng!, 0) / withLatLng.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(13);
      }
    }
  }, []);

  // Called by AIChatPage to auto-switch the output panel
  const handleViewSuggested = useCallback((view: "listings" | "map" | "data") => {
    setOutputMode(view === "listings" ? "listings" : "map");
  }, []);

  // Close any selected property when switching to listings (avoids overlay persisting)
  useEffect(() => {
    if (outputMode === "listings") setSelected(null);
  }, [outputMode]);

  // ── Shared style constants ────────────────────────────────────────────────
  const HEADER_H = 56;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ── Mode label for right panel header ────────────────────────────────────
  const MODE_META: Record<"listings" | "map", { label: string; icon: string }> = {
    listings: { label: !isIdleState && properties.length > 0 ? `${properties.length} properties found` : "Listings", icon: "⊞" },
    map:      { label: marketContext ? `${marketContext.city}` : "Addis Ababa", icon: "🗺" },
  };

  // ── Subtle mode-switch pills ──────────────────────────────────────────────
  function ModePill({ mode, label }: { mode: "listings" | "map"; label: string }) {
    const active = outputMode === mode;
    return (
      <button onClick={() => setOutputMode(mode)} style={{
        padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
        border: `1px solid ${active ? "#0f172a" : "#e2e8f0"}`,
        background: active ? "#0f172a" : "transparent",
        color: active ? "white" : "#94a3b8",
        cursor: "pointer", transition: "all .12s",
      }}>{label}</button>
    );
  }

  // ── MOBILE: full-screen chat overlay ─────────────────────────────────────
  if (isMobile && chatOpen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setChatOpen(false)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Property Search</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <AIChatPage sidebarMode onPropertiesFound={handlePropertiesFound} onViewSuggested={handleViewSuggested} />
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP: 50 / 50 split ────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, display: "flex", background: "white" }}>

      {/* ═══════════════════════════════════════════════════
          LEFT — AI Chat (1/3)
      ═══════════════════════════════════════════════════ */}
      <div style={{
        width: isMobile ? "100%" : "33.333%",
        height: "100%",
        display: isMobile ? "none" : "flex",
        flexDirection: "column",
        borderRight: "1px solid #e2e8f0",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <Link href="/" style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", textDecoration: "none" }}>Habino</Link>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setHabinoOpen(o => !o)}
            style={{
              padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              color: "white", border: "none", cursor: "pointer",
              backgroundColor: habinoOpen ? "var(--color-secondary)" : "var(--color-primary)",
            }}>
            Menu
          </button>
        </div>
        {/* Chat */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <AIChatPage sidebarMode onPropertiesFound={handlePropertiesFound} onViewSuggested={handleViewSuggested} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT — Dynamic Output Panel (2/3)
      ═══════════════════════════════════════════════════ */}
      <div style={{ width: isMobile ? "100%" : "66.667%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 8, flexShrink: 0, position: "relative", zIndex: 10, background: "white" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {MODE_META[outputMode].icon} {MODE_META[outputMode].label}
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            <ModePill mode="map"      label="Map" />
            <ModePill mode="listings" label="Listings" />
          </div>
        </div>

        {/* Content area — position: relative so PropertyDetailPanel can be contained */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* ── MAP — always in DOM so Leaflet stays alive ── */}
          <div style={{
            position: "absolute", inset: 0,
            visibility: outputMode === "map" ? "visible" : "hidden",
            pointerEvents: outputMode === "map" ? "auto" : "none",
          }}>
            {/* Idle hint — floats over map when no real search yet */}
            {isIdleState && (
              <div style={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                zIndex: 500, pointerEvents: "none",
                background: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)",
                borderRadius: 12, padding: "8px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.09)",
                border: "1px solid rgba(226,232,240,0.8)",
                display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>
                  Describe a property on the left — results appear here
                </span>
              </div>
            )}
            <LeafletMap
              center={mapCenter}
              zoom={mapZoom}
              properties={properties}
              selectedId={selected?.id ?? null}
              highlightedIds={highlightedIds}
              onSelect={(p) => { setSelected(p); setMapCenter([p.lat, p.lng]); setMapZoom(15); }}
              onBoundsChange={() => {}}
              cityClusters={[]}
              currentZoom={mapZoom}
              onCityClick={() => {}}
              neighbourhoodLabels={NEIGHBOURHOOD_LABELS}
            />
          </div>

          {/* LISTINGS */}
          <div style={{
            position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", background: "white",
            visibility: outputMode === "listings" ? "visible" : "hidden",
            pointerEvents: outputMode === "listings" ? "auto" : "none",
          }}>
            <div style={{ padding: "16px 16px 24px", boxSizing: "border-box", width: "100%" }}>
              {!isIdleState && properties.length > 0 && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{properties.length} results</span>
                  {marketContext && <span style={{ fontSize: 12, color: "#94a3b8" }}>in {marketContext.city}</span>}
                  <button onClick={() => setOutputMode("map")} style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#8b5cf6",
                    background: "#f5f3ff", border: "none", borderRadius: 8,
                    padding: "4px 10px", cursor: "pointer",
                  }}>
                    Show on map →
                  </button>
                </div>
              )}
              {isIdleState && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>⊞</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No listings yet</p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>Start a search on the left — results appear here.</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {properties.map(p => (
                  <PropertyListingCard
                    key={p.id}
                    property={p}
                    highlighted={highlightedIds.includes(p.id)}
                    onSelect={() => {
                      setSelected(p);
                      setMapCenter([p.lat, p.lng]);
                      setMapZoom(15);
                      setOutputMode("map");
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PropertyDetailPanel — contained within right panel (no full-screen takeover) */}
          {selected && (
            <>
              {/* Backdrop — only covers right panel content area */}
              <div style={{ position: "absolute", inset: 0, zIndex: 40 }} onClick={() => setSelected(null)} />
              {/* Panel card — centered in this area */}
              <div style={{
                position: "absolute", inset: 0, zIndex: 41,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{
                  pointerEvents: "auto",
                  width: "clamp(300px, 80%, 440px)",
                  maxHeight: "90%",
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 20,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  <PropertyDetailPanel property={selected} onClose={() => setSelected(null)} allProperties={properties} />
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* MOBILE — floating AI button */}
      {isMobile && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed", bottom: 72, right: 16, zIndex: 100,
            width: 48, height: 48, borderRadius: 14,
            background: "var(--color-primary)", color: "white",
            border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>
          AI
        </button>
      )}

      {/* Habino menu panel */}
      {habinoOpen && <HabinoPanel onClose={() => setHabinoOpen(false)} />}
    </div>
  );
}
