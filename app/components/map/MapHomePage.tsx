"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
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

// ── Property detail panel ─────────────────────────────────────────────────────
import { TYPE_COLORS, TYPE_LABELS } from "./LeafletMap";

function PropertyDetailPanel({ property, onClose }: { property: PropertyWithCoords; onClose: () => void }) {
  const img      = property.images?.[0]?.url;
  const color    = TYPE_COLORS[property.property_type] || "#6B7280";
  const typeLabel = TYPE_LABELS[property.property_type] || property.property_type;
  const priceFmt = fmtFull(property.price, property.currency);
  const isRent   = property.listing_type === "rent";
  const ppm      = property.area_sqm && property.area_sqm > 0
    ? fmtFull(Math.round(property.price / property.area_sqm), property.currency) + "/m²"
    : null;
  const isResidential = ["apartment","house","villa"].includes(property.property_type);
  const initials = (property.agent_name || "HA").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="flex flex-col overflow-hidden h-full" style={{ borderRadius: 20 }}>

        {/* Colour header stripe */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3"
          style={{ background: `${color}18`, borderBottom: `2px solid ${color}30` }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{typeLabel}</span>
            <span className="text-xs text-slate-400 ml-1">{isRent ? "· For Rent" : "· For Sale"}</span>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Image */}
          {img && (
            <div className="relative w-full h-40 bg-slate-100">
              <Image src={img} alt={property.title} fill className="object-cover" />
            </div>
          )}
          {!img && (
            <div className="w-full h-28 flex items-center justify-center text-5xl"
              style={{ background: `${color}10` }}>
              {property.property_type === "apartment" ? "🏢"
                : property.property_type === "house" ? "🏠"
                : property.property_type === "villa" ? "🏡"
                : property.property_type === "office" ? "🏗️"
                : property.property_type === "land" || property.property_type === "plot" ? "🌿"
                : property.property_type === "hall" ? "🎪"
                : property.property_type === "production" ? "🏭"
                : "🏢"}
            </div>
          )}

          <div className="px-4 pt-4 pb-2">
            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-2xl font-extrabold text-slate-900">{priceFmt}</span>
              {isRent && <span className="text-sm text-slate-400 font-medium">/mo</span>}
            </div>
            <p className="text-sm font-medium text-slate-700 mb-0.5">{property.title}</p>
            <p className="text-xs text-slate-400 mb-3">
              {[property.neighbourhood, property.city].filter(Boolean).join(" · ")}
            </p>

            {/* Specs grid */}
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
                  <p className="text-[11px] font-bold" style={{ color }}>{ppm}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">per m²</p>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                {property.description}
              </p>
            )}

            {/* Agent */}
            {property.agent_name && (
              <div className="border border-slate-100 rounded-xl p-3 mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Agent</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: color }}>{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{property.agent_name}</p>
                    {property.agent_email && (
                      <a href={`mailto:${property.agent_email}`}
                        className="text-xs text-slate-400 hover:underline truncate block">{property.agent_email}</a>
                    )}
                    {property.agent_phone && (
                      <a href={`tel:${property.agent_phone}`}
                        className="text-xs text-slate-400 hover:underline block">{property.agent_phone}</a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100/60">
          <Link href={`/properties/${property.id}`}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}>
            View listing
          </Link>
          <Link href={`/?chat=1&q=${encodeURIComponent(`Book a viewing for "${property.title}"`)}`}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            Ask AI
          </Link>
        </div>
    </div>
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

// ── Deterministic "rating" from property ID (avoids hydration mismatch) ───────
function pseudoRating(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return (4.5 + (h % 50) / 100).toFixed(2);
}

// ── Airbnb-style property listing card ────────────────────────────────────────
function PropertyListingCard({
  property, onSelect, highlighted,
}: {
  property: PropertyWithCoords;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const img   = (property as Property & { images?: { url: string }[] }).images?.[0]?.url;
  const color = TYPE_COLORS[property.property_type] || "#6B7280";
  const label = TYPE_LABELS[property.property_type] || property.property_type;
  const isRent = property.listing_type === "rent";
  const priceFmt = new Intl.NumberFormat("en-US", {
    style: "currency", currency: property.currency, maximumFractionDigits: 0,
  }).format(property.price);
  const isResidential = ["apartment", "house", "villa"].includes(property.property_type);
  const propEmoji =
    property.property_type === "apartment" ? "🏢"
    : property.property_type === "house"     ? "🏠"
    : property.property_type === "villa"     ? "🏡"
    : property.property_type === "office"    ? "🏗️"
    : (property.property_type === "land" || property.property_type === "plot") ? "🌿"
    : property.property_type === "hall"      ? "🎪"
    : property.property_type === "production"? "🏭"
    : "🏢";
  const p = property as Property;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group"
      style={highlighted ? { borderRadius: 18, outline: `2px solid ${color}`, outlineOffset: 2 } : {}}
    >
      {/* ── Image ── */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: "4/3" }}>
        {img ? (
          <Image src={img} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ background: `${color}12` }}>
            {propEmoji}
          </div>
        )}

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {label}
          </span>
        </div>

        {/* Heart — top right */}
        <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <svg className="w-5 h-5 drop-shadow" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Rent / Sale — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: isRent ? "#F59E0B" : color }}>
            {isRent ? "For Rent" : "For Sale"}
          </span>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="mt-2.5 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
            {label} in {p.city}
          </p>
          <div className="flex items-center gap-0.5 shrink-0 mt-px">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="#1e293b">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-medium text-slate-800">{pseudoRating(p.id)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.neighbourhood}</p>

        {/* Specs: beds/baths for residential + m² for all + price/m² */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {isResidential && p.bedrooms  > 0 && <span className="text-xs text-slate-500">{p.bedrooms} bed</span>}
          {isResidential && p.bathrooms > 0 && <span className="text-xs text-slate-400">· {p.bathrooms} bath</span>}
          {p.area_sqm && (
            <span className="text-xs font-medium text-slate-600">{isResidential ? "·" : ""} {p.area_sqm.toLocaleString()} m²</span>
          )}
          {p.area_sqm && p.area_sqm > 0 && (
            <span className="text-xs font-semibold" style={{ color }}>
              · {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(Math.round(p.price / p.area_sqm))}/m²
            </span>
          )}
        </div>

        <p className="text-sm mt-1.5 font-semibold text-slate-900">
          {priceFmt}{isRent && <span className="text-slate-400 text-xs font-normal"> / month</span>}
        </p>

        {/* Agent / broker badge */}
        {p.agent_name && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
              style={{ background: color }}>
              {p.agent_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <span className="text-[10px] text-slate-400 truncate">{p.agent_name}</span>
            <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Broker</span>
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

  // ── Shared style constants ────────────────────────────────────────────────
  const HEADER_H = 56;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ── Mode label for right panel header ────────────────────────────────────
  const MODE_META: Record<"listings" | "map", { label: string; icon: string }> = {
    listings: { label: !isIdleState && properties.length > 0 ? `${properties.length} Listings` : "Listings", icon: "⊞" },
    map:      { label: marketContext ? `Map · ${marketContext.city}` : "Map",          icon: "🗺" },
  };

  // ── Subtle mode-switch pills ──────────────────────────────────────────────
  function ModePill({ mode, label }: { mode: "listings" | "map"; label: string }) {
    const active = outputMode === mode;
    return (
      <button onClick={() => setOutputMode(mode)} style={{
        padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
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
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>AI Search</span>
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
          LEFT — AI Chat (50 %)
      ═══════════════════════════════════════════════════ */}
      <div style={{
        width: isMobile ? "100%" : "50%",
        height: "100%",
        display: isMobile ? "none" : "flex",
        flexDirection: "column",
        borderRight: "1px solid #e2e8f0",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <Link href="/" style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", textDecoration: "none" }}>habino</Link>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setHabinoOpen(o => !o)}
            style={{
              padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              color: "white", border: "none", cursor: "pointer",
              backgroundColor: habinoOpen ? "var(--color-secondary)" : "var(--color-primary)",
            }}>
            ☰ Menu
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
          RIGHT — Dynamic Output Panel (50 %)
      ═══════════════════════════════════════════════════ */}
      <div style={{ width: isMobile ? "100%" : "50%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>

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
                  Ask the AI on the left to search for properties
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
            position: "absolute", inset: 0, overflowY: "auto", background: "white",
            visibility: outputMode === "listings" ? "visible" : "hidden",
            pointerEvents: outputMode === "listings" ? "auto" : "none",
          }}>
            <div style={{ padding: 20 }}>
              {!isIdleState && properties.length > 0 && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{properties.length} results</span>
                  {marketContext && <span style={{ fontSize: 12, color: "#94a3b8" }}>in {marketContext.city}</span>}
                  <button onClick={() => setOutputMode("map")} style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#8b5cf6",
                    background: "#f5f3ff", border: "none", borderRadius: 8,
                    padding: "4px 10px", cursor: "pointer",
                  }}>
                    🗺 Map →
                  </button>
                </div>
              )}
              {isIdleState && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>⊞</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No results yet</p>
                  <p style={{ fontSize: 13 }}>Ask the AI to search — listings appear here.</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
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
                  <PropertyDetailPanel property={selected} onClose={() => setSelected(null)} />
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
