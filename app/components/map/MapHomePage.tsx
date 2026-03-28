"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { PropertyWithCoords, NeighbourhoodLabel, PinClickPosition, CityBounds } from "./LeafletMap";
import { AIChatPage } from "@/app/components/chat/AIChatPage";

// Load Leaflet map client-side only (no SSR)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => null,
});

// ── Addis Ababa default center ────────────────────────────────────────────────
export const ADDIS_CENTER: [number, number] = [9.0192, 38.7525];
export const ADDIS_ZOOM = 13;

// ── Per-city map config — add a new entry as the platform expands ─────────────
// bounds format: [[southLat, westLng], [northLat, eastLng]]
export const CITY_CONFIG: Record<string, {
  center:  [number, number];
  zoom:    number;
  bounds:  CityBounds;
  minZoom: number;
}> = {
  "Addis Ababa": {
    center:  [9.0192, 38.7525],
    zoom:    13,
    bounds:  [[8.82, 38.60], [9.15, 38.95]],
    minZoom: 11,
  },
  // Add more cities here, e.g.:
  // "Nairobi": { center: [-1.2921, 36.8219], zoom: 13, bounds: [[-1.45, 36.65], [-1.13, 37.00]], minZoom: 11 },
};

// ── Demo pins — ~100 listings spread across all Addis Ababa neighbourhoods ────
// type DemoRow = [id, title, listing_type, property_type, price, bdr, bath, sqm, neighbourhood, lat, lng]
type DemoRow = [string, string, "rent"|"buy", string, number, number, number, number, string, number, number];
const DEMO_ROWS: DemoRow[] = [
  // ── Bole ──────────────────────────────────────────────────────────────────
  ["d1",  "2-bed apartment in Bole",              "rent","apartment", 35000,2,1, 80,"Bole",        8.9935,38.7986],
  ["d2",  "3-bed apartment in Bole",              "rent","apartment", 48000,3,2,115,"Bole",        8.9920,38.8005],
  ["d3",  "Studio apartment in Bole",             "rent","apartment", 20000,1,1, 45,"Bole",        8.9950,38.7970],
  ["d4",  "Luxury villa for sale in Bole",        "buy", "villa",   32000000,5,4,620,"Bole",        8.9910,38.8020],
  ["d5",  "Office space in Bole",                 "rent","office",   92000,0,0,280,"Bole",        8.9940,38.8010],
  ["d6",  "4-bed apartment for sale in Bole",     "buy", "apartment",18500000,4,3,195,"Bole",        8.9960,38.7960],
  ["d7",  "Retail unit in Bole",                  "rent","commercial",68000,0,0,160,"Bole",        8.9925,38.7995],
  ["d8",  "Modern penthouse in Bole",             "buy", "apartment",25000000,3,3,210,"Bole",        8.9945,38.7975],
  // ── Kazanchis ─────────────────────────────────────────────────────────────
  ["d9",  "Office in Kazanchis",                  "rent","office",   85000,0,0,250,"Kazanchis",   9.0200,38.7557],
  ["d10", "2-bed apartment in Kazanchis",         "rent","apartment", 30000,2,1, 80,"Kazanchis",   9.0190,38.7570],
  ["d11", "1-bed studio in Kazanchis",            "rent","apartment", 22000,1,1, 50,"Kazanchis",   9.0215,38.7545],
  ["d12", "Commercial space in Kazanchis",        "rent","commercial",75000,0,0,200,"Kazanchis",   9.0205,38.7565],
  ["d13", "Office suite for sale in Kazanchis",   "buy", "office",  14000000,0,0,310,"Kazanchis",   9.0195,38.7548],
  // ── CMC ───────────────────────────────────────────────────────────────────
  ["d14", "Family home in CMC",                   "buy", "house",   9500000,4,3,280,"CMC",         9.0562,38.7864],
  ["d15", "3-bed apartment in CMC",               "rent","apartment", 42000,3,2,110,"CMC",         9.0550,38.7880],
  ["d16", "Residential plot in CMC",              "buy", "plot",    4200000,0,0,450,"CMC",         9.0575,38.7850],
  ["d17", "5-bed house for sale in CMC",          "buy", "house",  13500000,5,4,380,"CMC",         9.0545,38.7870],
  ["d18", "2-bed apartment in CMC",               "buy", "apartment",8800000,2,2,105,"CMC",         9.0568,38.7858],
  // ── Megenagna ─────────────────────────────────────────────────────────────
  ["d19", "2-bed apartment in Megenagna",         "rent","apartment", 32000,2,1, 85,"Megenagna",   9.0296,38.7869],
  ["d20", "Office in Megenagna",                  "rent","office",   70000,0,0,200,"Megenagna",   9.0285,38.7880],
  ["d21", "3-bed family house in Megenagna",      "rent","house",    55000,3,2,180,"Megenagna",   9.0310,38.7855],
  ["d22", "Apartment for sale in Megenagna",      "buy", "apartment",9200000,2,2, 95,"Megenagna",   9.0302,38.7875],
  ["d23", "Villa in Megenagna",                   "buy", "villa",   22000000,4,3,420,"Megenagna",   9.0288,38.7890],
  // ── Piassa ────────────────────────────────────────────────────────────────
  ["d24", "Retail shop in Piassa",                "rent","commercial",58000,0,0,140,"Piassa",       9.0355,38.7543],
  ["d25", "Apartment in Piassa",                  "rent","apartment", 25000,2,1, 75,"Piassa",       9.0345,38.7555],
  ["d26", "Office in Piassa",                     "rent","office",   65000,0,0,190,"Piassa",       9.0362,38.7535],
  ["d27", "Event hall in Piassa",                 "rent","hall",    120000,0,4,600,"Piassa",       9.0350,38.7548],
  ["d28", "Apartment for sale in Piassa",         "buy", "apartment",7500000,2,1, 80,"Piassa",       9.0368,38.7530],
  // ── Merkato ───────────────────────────────────────────────────────────────
  ["d29", "Retail unit in Merkato",               "rent","commercial",55000,0,0,180,"Merkato",      9.0271,38.7352],
  ["d30", "Warehouse in Merkato",                 "rent","production",65000,0,0,700,"Merkato",      9.0260,38.7365],
  ["d31", "Commercial space for sale in Merkato", "buy", "commercial",12000000,0,0,280,"Merkato",      9.0280,38.7340],
  ["d32", "Plot in Merkato area",                 "buy", "plot",    3800000,0,0,320,"Merkato",      9.0265,38.7358],
  ["d33", "Large showroom in Merkato",            "rent","commercial",95000,0,2,450,"Merkato",      9.0275,38.7345],
  // ── Ayat ──────────────────────────────────────────────────────────────────
  ["d34", "Luxury villa in Ayat",                 "buy", "villa",   28000000,5,4,520,"Ayat",         9.0411,38.8352],
  ["d35", "4-bed house in Ayat",                  "buy", "house",  11500000,4,3,320,"Ayat",         9.0400,38.8365],
  ["d36", "Villa with pool in Ayat",              "buy", "villa",   35000000,6,5,680,"Ayat",         9.0425,38.8340],
  ["d37", "Land for sale in Ayat",                "buy", "land",    8200000,0,0,900,"Ayat",         9.0395,38.8370],
  ["d38", "3-bed house in Ayat",                  "buy", "house",   8900000,3,2,240,"Ayat",         9.0418,38.8358],
  ["d39", "Modern apartment in Ayat",             "buy", "apartment",11000000,3,2,130,"Ayat",         9.0405,38.8345],
  // ── Gerji ─────────────────────────────────────────────────────────────────
  ["d40", "2-bed apartment in Gerji",             "rent","apartment", 28000,2,1, 80,"Gerji",        9.0107,38.8200],
  ["d41", "House for sale in Gerji",              "buy", "house",   8200000,3,2,230,"Gerji",        9.0095,38.8215],
  ["d42", "Plot in Gerji",                        "buy", "plot",    3500000,0,0,400,"Gerji",        9.0120,38.8190],
  ["d43", "Villa in Gerji",                       "buy", "villa",   20000000,4,3,450,"Gerji",        9.0112,38.8208],
  ["d44", "Apartment for sale in Gerji",          "buy", "apartment",9800000,2,2,100,"Gerji",        9.0100,38.8195],
  ["d45", "Office in Gerji",                      "rent","office",   58000,0,0,180,"Gerji",        9.0115,38.8212],
  // ── Yeka ──────────────────────────────────────────────────────────────────
  ["d46", "Land for sale in Yeka",                "buy", "land",    6500000,0,0,800,"Yeka",         9.0600,38.8100],
  ["d47", "House for sale in Yeka",               "buy", "house",  10500000,4,3,290,"Yeka",         9.0588,38.8115],
  ["d48", "3-bed apartment in Yeka",              "rent","apartment", 38000,3,2,110,"Yeka",         9.0612,38.8090],
  ["d49", "Villa in Yeka",                        "buy", "villa",   24000000,5,4,500,"Yeka",         9.0595,38.8108],
  ["d50", "Residential plot in Yeka",             "buy", "plot",    5200000,0,0,500,"Yeka",         9.0608,38.8095],
  // ── Sarbet ────────────────────────────────────────────────────────────────
  ["d51", "2-bed apartment in Sarbet",            "rent","apartment", 30000,2,1, 90,"Sarbet",       8.9973,38.7561],
  ["d52", "Commercial unit in Sarbet",            "rent","commercial",50000,0,0,160,"Sarbet",       8.9960,38.7575],
  ["d53", "Plot in Sarbet",                       "buy", "plot",    3200000,0,0,350,"Sarbet",       8.9985,38.7548],
  ["d54", "4-bed house in Sarbet",                "buy", "house",   9200000,4,3,260,"Sarbet",       8.9968,38.7568],
  // ── Kolfe ─────────────────────────────────────────────────────────────────
  ["d55", "House for sale in Kolfe",              "buy", "house",   7200000,4,2,220,"Kolfe Keranio",9.0200,38.6900],
  ["d56", "2-bed apartment in Kolfe",             "rent","apartment", 22000,2,1, 75,"Kolfe Keranio",9.0188,38.6912],
  ["d57", "Land for sale in Kolfe",               "buy", "land",    4800000,0,0,700,"Kolfe Keranio",9.0215,38.6888],
  ["d58", "3-bed house in Kolfe",                 "rent","house",    45000,3,2,190,"Kolfe Keranio",9.0192,38.6905],
  // ── Lideta ────────────────────────────────────────────────────────────────
  ["d59", "Studio apartment in Lideta",           "rent","apartment", 18000,1,1, 45,"Lideta",       9.0117,38.7394],
  ["d60", "2-bed apartment in Lideta",            "rent","apartment", 27000,2,1, 80,"Lideta",       9.0105,38.7408],
  ["d61", "Retail unit in Lideta",                "rent","commercial",45000,0,0,130,"Lideta",       9.0130,38.7382],
  ["d62", "Apartment for sale in Lideta",         "buy", "apartment",7800000,2,2, 90,"Lideta",       9.0112,38.7400],
  // ── Kirkos ────────────────────────────────────────────────────────────────
  ["d63", "Apartment in Kirkos",                  "rent","apartment", 26000,2,1, 82,"Kirkos",       9.0050,38.7700],
  ["d64", "Office in Kirkos",                     "rent","office",   62000,0,0,185,"Kirkos",       9.0038,38.7712],
  ["d65", "Apartment for sale in Kirkos",         "buy", "apartment",8500000,2,2, 95,"Kirkos",       9.0062,38.7688],
  ["d66", "Commercial unit in Kirkos",            "rent","commercial",52000,0,0,155,"Kirkos",       9.0044,38.7706],
  // ── Arada ─────────────────────────────────────────────────────────────────
  ["d67", "2-bed apartment in Arada",             "rent","apartment", 28000,2,1, 80,"Arada",        9.0368,38.7480],
  ["d68", "Office suite in Arada",                "rent","office",   68000,0,0,200,"Arada",        9.0356,38.7492],
  ["d69", "Apartment for sale in Arada",          "buy", "apartment",9000000,3,2,105,"Arada",        9.0380,38.7468],
  // ── Gullele ───────────────────────────────────────────────────────────────
  ["d70", "House for sale in Gullele",            "buy", "house",   7800000,4,2,230,"Gullele",      9.0780,38.7400],
  ["d71", "Large land in Gullele",                "buy", "land",    9500000,0,0,1200,"Gullele",      9.0768,38.7415],
  ["d72", "Family house to rent in Gullele",      "rent","house",    48000,3,2,190,"Gullele",      9.0792,38.7388],
  // ── Lafto ─────────────────────────────────────────────────────────────────
  ["d73", "Land for sale in Lafto",               "buy", "land",    5500000,0,0,750,"Lafto",        8.9600,38.7300],
  ["d74", "House for sale in Lafto",              "buy", "house",   8500000,4,3,260,"Lafto",        8.9588,38.7315],
  ["d75", "2-bed apartment in Lafto",             "rent","apartment", 24000,2,1, 78,"Lafto",        8.9612,38.7288],
  // ── Summit ────────────────────────────────────────────────────────────────
  ["d76", "Apartment for sale in Summit",         "buy", "apartment",12000000,3,2,140,"Summit",       9.0050,38.8010],
  ["d77", "Villa for sale in Summit",             "buy", "villa",   26000000,4,4,480,"Summit",       9.0038,38.8022],
  ["d78", "Office in Summit",                     "rent","office",   78000,0,0,220,"Summit",       9.0062,38.7998],
  // ── Addis Ketema ──────────────────────────────────────────────────────────
  ["d79", "Commercial shop in Addis Ketema",      "rent","commercial",44000,0,0,120,"Addis Ketema", 9.0310,38.7300],
  ["d80", "Apartment in Addis Ketema",            "rent","apartment", 20000,1,1, 55,"Addis Ketema", 9.0298,38.7312],
  ["d81", "Plot in Addis Ketema",                 "buy", "plot",    2800000,0,0,280,"Addis Ketema", 9.0322,38.7288],
  // ── Mexico ────────────────────────────────────────────────────────────────
  ["d82", "Office in Mexico",                     "rent","office",   72000,0,0,210,"Mexico",        9.0155,38.7486],
  ["d83", "2-bed apartment in Mexico",            "rent","apartment", 32000,2,1, 88,"Mexico",        9.0143,38.7498],
  ["d84", "Apartment for sale in Mexico",         "buy", "apartment",9500000,2,2,100,"Mexico",        9.0167,38.7474],
  // ── Akaki Kaliti ──────────────────────────────────────────────────────────
  ["d85", "Warehouse in Akaki Kaliti",            "rent","production",75000,0,0,900,"Akaki Kaliti", 8.8900,38.7900],
  ["d86", "Industrial unit in Akaki Kaliti",      "rent","production",58000,0,0,600,"Akaki Kaliti", 8.8888,38.7912],
  ["d87", "Land for sale in Akaki Kaliti",        "buy", "land",    6800000,0,0,1500,"Akaki Kaliti", 8.8912,38.7888],
  // ── Sidist Kilo ───────────────────────────────────────────────────────────
  ["d88", "2-bed apartment in Sidist Kilo",       "rent","apartment", 34000,2,1, 88,"Sidist Kilo",  9.0486,38.7634],
  ["d89", "House for sale in Sidist Kilo",        "buy", "house",  10800000,4,3,290,"Sidist Kilo",  9.0474,38.7646],
  // ── Arat Kilo ─────────────────────────────────────────────────────────────
  ["d90", "Apartment in Arat Kilo",               "rent","apartment", 30000,2,1, 82,"Arat Kilo",    9.0414,38.7542],
  ["d91", "Office in Arat Kilo",                  "rent","office",   65000,0,0,190,"Arat Kilo",    9.0402,38.7554],
  // ── Urael ─────────────────────────────────────────────────────────────────
  ["d92", "Apartment for sale in Urael",          "buy", "apartment",11500000,3,2,135,"Urael",        9.0150,38.7750],
  ["d93", "Villa for sale in Urael",              "buy", "villa",   29000000,5,4,560,"Urael",        9.0138,38.7762],
  // ── Old Airport ───────────────────────────────────────────────────────────
  ["d94", "2-bed apartment in Old Airport",       "rent","apartment", 28000,2,1, 78,"Old Airport",  8.9895,38.7795],
  ["d95", "Commercial unit near Old Airport",     "rent","commercial",48000,0,0,140,"Old Airport",  8.9883,38.7807],
  // ── Nifas Silk ────────────────────────────────────────────────────────────
  ["d96", "House for sale in Nifas Silk",         "buy", "house",   9200000,4,2,250,"Nifas Silk",   8.9720,38.7400],
  ["d97", "Land for sale in Nifas Silk",          "buy", "land",    5800000,0,0,700,"Nifas Silk",   8.9708,38.7412],
  // ── Jemo ──────────────────────────────────────────────────────────────────
  ["d98", "House for sale in Jemo",               "buy", "house",   7900000,3,2,220,"Jemo",         8.9620,38.7050],
  ["d99", "Land plot in Jemo",                    "buy", "land",    4500000,0,0,600,"Jemo",         8.9608,38.7062],
  // ── Saris / Bole Arabsa ───────────────────────────────────────────────────
  ["d100","Studio apartment in Saris",            "rent","apartment", 16000,1,1, 40,"Saris",        8.9780,38.7750],
];

// ── Demo agent roster ─────────────────────────────────────────────────────────
const DEMO_AGENTS = [
  "Dawit Bekele", "Sara Haile", "Abel Girma", "Hana Tesfaye",
  "Yonas Alemu",  "Meron Tadesse", "Selam Worku", "Biniam Desta",
];
function getDemoAgent(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return DEMO_AGENTS[Math.abs(h) % DEMO_AGENTS.length];
}

const IDLE_PINS: PropertyWithCoords[] = DEMO_ROWS.map(
  ([id, title, listing_type, property_type, price, bedrooms, bathrooms, area_sqm, neighbourhood, lat, lng]) => ({
    id, tenant_id: "", title, description: null,
    listing_type: listing_type as "rent" | "buy",
    property_type: property_type as import("@/lib/types").PropertyType,
    price, currency: "ETB",
    bedrooms, bathrooms, area_sqm,
    city: "Addis Ababa", neighbourhood,
    address: null,
    agent_name: getDemoAgent(id),
    agent_phone: null, agent_email: null,
    status: "active" as const, created_at: "", updated_at: "",
    lat, lng,
  })
);

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

// ── Generate 200 additional demo pins deterministically ───────────────────────
// Uses a fast integer hash so every run produces the same results.
// Called AFTER CITY_COORDS so we can reference its keys.
function makeDemoPin(idx: number): PropertyWithCoords {
  const TYPES = [
    "apartment","house","villa","office","commercial","land","plot","production",
  ] as const;
  const NBS = Object.keys(CITY_COORDS).filter(
    k => !["Addis Ababa","Addis","Nairobi"].includes(k)
  );
  // Three independent hash passes
  const h  = ((idx * 2654435769) + 1013904223) >>> 0;
  const h2 = ((h   * 1664525)    + 1013904223) >>> 0;
  const h3 = ((h2  * 22695477)   + 1)          >>> 0;

  const type = TYPES[h % TYPES.length];
  const lt: "rent" | "buy" = (h2 & 1) ? "rent" : "buy";
  const nb   = NBS[h3 % NBS.length];
  const base = CITY_COORDS[nb] ?? [9.0192, 38.7525];

  // Small deterministic jitter so pins don't stack exactly on top of each other
  const lat = base[0] + ((h  >> 8) & 0x7f) * 0.00012 * ((h  & 2) ? 1 : -1);
  const lng = base[1] + ((h2 >> 8) & 0x7f) * 0.00012 * ((h2 & 2) ? 1 : -1);

  const isRes  = ["apartment","house","villa"].includes(type);
  const bdr    = isRes ? 1 + (h  % 5) : 0;
  const bath   = isRes ? 1 + (h2 % 3) : 0;
  const area   = 35 + (h3 % 600);
  const price  = lt === "rent"
    ? 12000  + (h  % 90000)
    : 2500000 + (h  % 30000000);

  const id = `x${idx}`;
  const label = (type.charAt(0).toUpperCase() + type.slice(1));
  return {
    id, tenant_id: "", title: `${label} in ${nb}`, description: null,
    listing_type: lt,
    property_type: type as import("@/lib/types").PropertyType,
    price, currency: "ETB",
    bedrooms: bdr, bathrooms: bath, area_sqm: area,
    city: "Addis Ababa", neighbourhood: nb,
    address: null, agent_name: getDemoAgent(id),
    agent_phone: null, agent_email: null,
    status: "active" as const, created_at: "", updated_at: "",
    lat, lng,
  };
}

const EXTRA_PINS  = Array.from({ length: 200 }, (_, i) => makeDemoPin(i + 101));
// Full 300-listing pool used as the default idle state
const ALL_DEMO_PINS: PropertyWithCoords[] = [...IDLE_PINS, ...EXTRA_PINS];

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

// ── Currency conversion ────────────────────────────────────────────────────────
// Approximate indicative rates (demo). In production, fetch from a live FX feed.
// 1 USD ≈ 130 ETB  |  1 EUR ≈ 140 ETB
export const SUPPORTED_CURRENCIES = ["ETB", "USD", "EUR"] as const;
export type DisplayCurrency = typeof SUPPORTED_CURRENCIES[number];

const FX: Record<string, Record<string, number>> = {
  ETB: { ETB: 1,       USD: 1 / 130,  EUR: 1 / 140  },
  USD: { ETB: 130,     USD: 1,        EUR: 130 / 140 },
  EUR: { ETB: 140,     USD: 140 / 130, EUR: 1        },
};

function convertPrice(price: number, from: string, to: string): number {
  const rate = FX[from]?.[to] ?? 1;
  return Math.round(price * rate);
}

/** Convert + format a price into the chosen display currency. */
function fmtConverted(price: number, fromCurrency: string, displayCurrency: string): string {
  const converted = convertPrice(price, fromCurrency, displayCurrency);
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: displayCurrency, maximumFractionDigits: 0,
  }).format(converted);
}

// ── Placeholder images — Lorem Picsum (deterministic, 100 % reliable) ─────────
// picsum.photos/seed/{n}/800/500 always resolves, never rate-limits, never 404s.
// We use three independent hash offsets so each property gets three distinct photos.
import { TYPE_COLORS, TYPE_LABELS } from "./LeafletMap";

/** Always returns exactly 3 deterministic placeholder URLs for this property. */
function getPropertyImages(property: PropertyWithCoords): string[] {
  // Prefer real images from the database if present
  const realImgs = (property as Property & { images?: { url: string }[] }).images
    ?.map(i => i.url).filter(Boolean) ?? [];
  if (realImgs.length >= 1) return realImgs.slice(0, 3);

  // Derive a stable integer hash from the property ID
  let h = 5381;
  for (const c of property.id) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;

  // Three independent seeds → three distinct Picsum photos, always available
  const seed1 = (Math.abs(h)              % 1000) + 1;
  const seed2 = (Math.abs(h * 6364136223) % 1000) + 1;
  const seed3 = (Math.abs(h * 1664525)    % 1000) + 1;

  return [
    `https://picsum.photos/seed/${seed1}/800/500`,
    `https://picsum.photos/seed/${seed2}/800/500`,
    `https://picsum.photos/seed/${seed3}/800/500`,
  ];
}

function getPropertyImage(property: PropertyWithCoords): string {
  return getPropertyImages(property)[0];
}

function getAgentAvatar(agentName: string): string {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(agentName)}`;
}

/** Pseudo-random verified flag — uses property id hash so it's stable across renders */
function isVerified(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 5 !== 0; // ~80% of listings show verified
}

/** Inline verified badge component */
function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      title="Verified listing"
      style={{
        display: "inline-flex", alignItems: "center", gap: 2,
        background: "#eff6ff", color: "#1d4ed8",
        borderRadius: 99, padding: small ? "1px 5px" : "2px 7px",
        fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: "0.01em",
        border: "1px solid #bfdbfe", flexShrink: 0,
      }}
    >
      <svg width={small ? 8 : 9} height={small ? 8 : 9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  );
}

// ── Property detail panel ─────────────────────────────────────────────────────
function PropertyDetailPanel({
  property,
  onClose,
  allProperties,
  displayCurrency = "ETB",
}: {
  property: PropertyWithCoords;
  onClose: () => void;
  allProperties: PropertyWithCoords[];
  displayCurrency?: string;
}) {
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [imgErr,    setImgErr]    = useState(false);

  const color     = TYPE_COLORS[property.property_type] || "#6B7280";
  const typeLabel = TYPE_LABELS[property.property_type] || property.property_type;
  const priceFmt  = fmtConverted(property.price, property.currency, displayCurrency);
  const isRent    = property.listing_type === "rent";
  const ppm       = property.area_sqm && property.area_sqm > 0
    ? fmtConverted(Math.round(property.price / property.area_sqm), property.currency, displayCurrency) + "/m²"
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
    <div className="flex flex-col overflow-hidden h-full bg-white">

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

          {/* ── Agent ── always shown; falls back to "Habino Team" */}
          {(() => {
            const agentName = property.agent_name || "Habino Team";
            return (
              <div className="border border-slate-100 rounded-xl p-3 mb-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getAgentAvatar(agentName)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white shadow-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{agentName}</p>
                    {isVerified(property.id) && <VerifiedBadge small />}
                  </div>
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
            );
          })()}
        </div>
      </div>

    </div>
  );
}

// ── Habino control-centre panel ───────────────────────────────────────────────
function HabinoPanel({ onClose }: { onClose: () => void }) {
  const sections: Array<{
    title: string;
    items: Array<{ href: string; icon: string; label: string; badge?: string }>;
  }> = [
    {
      title: "My Account",
      items: [
        { href: "/profile",  icon: "👤", label: "My Profile" },
        { href: "/home",     icon: "📄", label: "My Contracts" },
        { href: "/saved",    icon: "🔖", label: "Saved Listings" },
        { href: "/listings", icon: "🏠", label: "My Listings" },
      ],
    },
    {
      title: "Settings",
      items: [
        { href: "/settings",               icon: "⚙️",  label: "Account Settings" },
        { href: "/settings/notifications",  icon: "🔔",  label: "Notifications" },
        { href: "/settings/language",       icon: "🌐",  label: "Language & Region" },
      ],
    },
    {
      title: "Help & Legal",
      items: [
        { href: "/help",     icon: "💬", label: "Help Center" },
        { href: "/privacy",  icon: "🔒", label: "Privacy Policy" },
        { href: "/security", icon: "🛡️", label: "Data Security" },
        { href: "/terms",    icon: "📋", label: "Terms of Use" },
        { href: "/imprint",  icon: "ℹ️",  label: "Imprint" },
      ],
    },
    {
      title: "About",
      items: [
        { href: "/about",    icon: "✦",  label: "About Habino" },
      ],
    },
  ];

  const menuRow = (icon: string, label: string, chevron = true, color = "#1e293b") => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 12, cursor: "pointer", transition: "background .1s", color }}>
      <span style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: color === "#ef4444" ? "#fef2f2" : "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
      {chevron && (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: "#cbd5e1", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      {/* Drawer — slides in from right */}
      <div className="detail-panel-enter" style={{
        position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 201,
        width: 340, background: "white",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.14)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>

        {/* ── Top: logo + close ── */}
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>Habino</span>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 99, background: "#f1f5f9",
                border: "none", cursor: "pointer", fontSize: 14, color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* Guest / user card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 14,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>👤</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Guest User</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Sign in to unlock all features</p>
            </div>
            <Link href="/auth/login" style={{
              padding: "7px 13px", borderRadius: 9, fontSize: 11, fontWeight: 700,
              background: "var(--color-primary)", color: "white", textDecoration: "none",
              flexShrink: 0, whiteSpace: "nowrap",
            }}>Sign in</Link>
          </div>
        </div>

        {/* ── Sections ── */}
        <div style={{ flex: 1, padding: "8px 10px" }}>
          {sections.map((section, si) => (
            <div key={section.title} style={{ marginBottom: si < sections.length - 1 ? 4 : 0 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: "#cbd5e1",
                textTransform: "uppercase", letterSpacing: "0.08em",
                margin: "14px 0 4px 10px",
              }}>{section.title}</p>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {menuRow(item.icon, item.label)}
                </Link>
              ))}
            </div>
          ))}

          {/* ── Divider ── */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0 4px" }} />

          {/* ── Sign out ── */}
          <button
            style={{ width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.borderRadius = "12px"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {menuRow("🚪", "Sign out", false, "#ef4444")}
          </button>
        </div>

        {/* ── Footer: copyright + legal links ── */}
        <div style={{
          padding: "14px 18px 22px",
          borderTop: "1px solid #f1f5f9", flexShrink: 0,
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, color: "#cbd5e1", fontWeight: 500 }}>
            © {new Date().getFullYear()} Habino · All rights reserved
          </p>
          <p style={{ margin: 0, fontSize: 10, color: "#cbd5e1" }}>
            {[
              { href: "/about",   label: "About" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms",   label: "Terms" },
              { href: "/imprint", label: "Imprint" },
            ].map((l, i, arr) => (
              <span key={l.href}>
                <Link href={l.href} style={{ color: "#94a3b8", textDecoration: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#475569"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                >{l.label}</Link>
                {i < arr.length - 1 && <span style={{ margin: "0 5px", color: "#e2e8f0" }}>·</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Property listing card (Airbnb-style: gallery, heart, emoji specs) ─────────
function PropertyListingCard({
  property, onSelect, highlighted, displayCurrency = "ETB",
}: {
  property: PropertyWithCoords;
  onSelect: () => void;
  highlighted: boolean;
  displayCurrency?: string;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgErr,   setImgErr]   = useState(false);
  const [liked,    setLiked]    = useState(false);

  const color  = TYPE_COLORS[property.property_type] || "#6B7280";
  const isRent = property.listing_type === "rent";
  const photos = getPropertyImages(property);
  const p = property as Property;
  const isResidential = ["apartment", "house", "villa"].includes(p.property_type);

  const typeEmoji =
    p.property_type === "apartment" ? "🏢" : p.property_type === "house"  ? "🏠"
    : p.property_type === "villa"   ? "🏡" : p.property_type === "office"  ? "💼"
    : p.property_type === "commercial" ? "🏪" : p.property_type === "land"  ? "🌿"
    : p.property_type === "plot"    ? "📍" : p.property_type === "hall"   ? "🎪"
    : p.property_type === "production" ? "🏭" : "🏗️";

  const listingEmoji = isRent ? "🔑" : "🏷️";

  const priceFmt = fmtConverted(p.price, p.currency, displayCurrency);

  function prevPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setPhotoIdx(i => (i - 1 + photos.length) % photos.length);
    setImgErr(false);
  }
  function nextPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setPhotoIdx(i => (i + 1) % photos.length);
    setImgErr(false);
  }

  // ── Fixed card dimensions ─────────────────────────────────────────────────
  // Target: 3 wide × 2 rows visible without scrolling (≈ 900 px viewport).
  // Available height ≈ 900 - 56 header - 44 sub-header - 16 pad-top - 40 pad-bottom
  //                  = ~744 px  →  2 rows + 10 px gap = (744-10)/2 = 367 px max.
  // We use 280 px so the first 2 rows show clearly and the 3rd peeks ~10 px,
  // giving a natural scroll hint.
  const IMAGE_H   = 172;   // comfortable 16:9-ish photo crop
  const DETAILS_H = 108;   // enough room for title, location, specs, agent
  const CARD_H    = IMAGE_H + DETAILS_H; // 280 px

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group"
      style={{
        height: CARD_H,
        width: "100%",
        minWidth: 0,          // prevent grid blowout
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        border: highlighted ? `2px solid ${color}` : "1px solid #f1f5f9",
        boxShadow: highlighted
          ? `0 0 0 2px ${color}40`
          : "0 1px 4px rgba(0,0,0,0.06)",
        background: "white",
        transition: "box-shadow .15s, border-color .15s",
        cursor: "pointer",
      }}
    >
      {/* ── Image — fixed IMAGE_H px, 100% wide, inline styles only ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: IMAGE_H,
        flexShrink: 0,
        overflow: "hidden",
        background: "#f1f5f9",
      }}>
        {!imgErr ? (
          // key forces a fresh <img> element on every photo change so that
          // a previously-fired onError can never bleed into the next photo.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photos[photoIdx]}
            src={photos[photoIdx] ?? photos[0]}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color}22`,
          }}>
            <span style={{ fontSize: 36 }}>{typeEmoji}</span>
          </div>
        )}

        {/* Gradient */}
        {!imgErr && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 52%)",
            pointerEvents: "none",
          }} />
        )}

        {/* Gallery arrows — always rendered (CSS hover via className) */}
        {photos.length > 1 && !imgErr && (
          <>
            <button onClick={prevPhoto} style={{
              position: "absolute", left: 5, top: "50%", transform: "translateY(-50%)",
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: "#1e293b", lineHeight: 1,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              zIndex: 4,
            }}>‹</button>
            <button onClick={nextPhoto} style={{
              position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)",
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: "#1e293b", lineHeight: 1,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              zIndex: 4,
            }}>›</button>
            {/* Photo dots */}
            <div style={{
              position: "absolute", bottom: 24, left: 0, right: 0,
              display: "flex", justifyContent: "center", gap: 4,
              pointerEvents: "none", zIndex: 4,
            }}>
              {photos.map((_, i) => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: 99,
                  background: i === photoIdx ? "white" : "rgba(255,255,255,0.5)",
                }} />
              ))}
            </div>
          </>
        )}

        {/* Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
          style={{
            position: "absolute", top: 6, right: 6,
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            zIndex: 4,
          }}
        >
          {liked ? "❤️" : "🤍"}
        </button>

        {/* Type + listing type + verified badges */}
        <div style={{
          position: "absolute", top: 6, left: 6,
          display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", zIndex: 4,
        }}>
          <span style={{
            background: "rgba(255,255,255,0.95)", color: "#1e293b",
            fontSize: 8, fontWeight: 700,
            padding: "2px 6px", borderRadius: 99,
            lineHeight: 1.4, boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}>
            {typeEmoji} {TYPE_LABELS[p.property_type] || p.property_type}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 700,
            padding: "2px 6px", borderRadius: 99,
            color: "white", lineHeight: 1.4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            backgroundColor: isRent ? "#F59E0B" : color,
          }}>
            {listingEmoji} {isRent ? "Rent" : "Sale"}
          </span>
          {isVerified(p.id) && <VerifiedBadge small />}
        </div>

        {/* Price */}
        {!imgErr && (
          <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              {priceFmt}
            </span>
            {isRent && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", marginLeft: 2 }}>/mo</span>}
          </div>
        )}
      </div>

      {/* ── Details — fixed DETAILS_H px, no overflow ── */}
      <div style={{
        height: DETAILS_H, flexShrink: 0,
        padding: "8px 10px 8px",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        background: "white",
      }}>
        {/* Price row (shown when image errors) */}
        {imgErr && (
          <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", marginBottom: 2, lineHeight: 1 }}>
            {priceFmt}{isRent && <span style={{ color: "#94a3b8", fontWeight: 400 }}>/mo</span>}
          </p>
        )}

        {/* Title */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", lineHeight: 1.35, margin: 0,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {p.title}
        </p>

        {/* Location */}
        <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.2,
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          📍 {[p.neighbourhood, p.city].filter(Boolean).join(", ")}
        </p>

        {/* Specs */}
        <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap", overflow: "hidden" }}>
          {isResidential && p.bedrooms  > 0 && <span style={{ fontSize: 10, color: "#475569" }}>🛏 {p.bedrooms} Bd</span>}
          {isResidential && p.bathrooms > 0 && <span style={{ fontSize: 10, color: "#475569" }}>🚿 {p.bathrooms} Ba</span>}
          {p.area_sqm                         && <span style={{ fontSize: 10, color: "#475569" }}>📐 {p.area_sqm} m²</span>}
        </div>

        {/* Agent — pushed to bottom */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: "auto", paddingTop: 4,
          borderTop: "1px solid #f1f5f9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAgentAvatar(p.agent_name || "Habino Team")}
            alt=""
            style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid #e2e8f0" }}
            onError={() => {}}
          />
          <span style={{ fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
            {p.agent_name || "Habino Team"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Compact popup card anchored to pin click position ────────────────────────
// Appears above/beside the clicked pin. All dimensions are fixed so it never
// pushes layout. Position is clamped so it stays inside the map container.
const POPUP_W = 240;
const POPUP_H = 260; // approximate max height

function MapPinPopup({
  property, pos, allProperties, onClose, onViewDetail, displayCurrency = "ETB",
}: {
  property: PropertyWithCoords;
  pos: PinClickPosition;
  allProperties: PropertyWithCoords[];
  onClose: () => void;
  onViewDetail?: (p: PropertyWithCoords) => void;
  displayCurrency?: string;
}) {
  const color     = TYPE_COLORS[property.property_type] || "#6B7280";
  const typeLabel = TYPE_LABELS[property.property_type]  || property.property_type;
  const isRent    = property.listing_type === "rent";
  const priceFmt  = fmtConverted(property.price, property.currency, displayCurrency);
  const agentName = property.agent_name || "Habino Team";

  const [imgErr,    setImgErr]    = useState(false);
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const photos = getPropertyImages(property);
  // Reset carousel when property changes
  useEffect(() => { setPhotoIdx(0); setImgErr(false); }, [property.id]);

  // Market comparison (quick, same logic as full panel)
  const marketProps = allProperties.filter(
    p => p.area_sqm && p.area_sqm > 0 && p.listing_type === property.listing_type && p.id !== property.id
  );
  const avgPpm = marketProps.length > 0
    ? marketProps.reduce((s, p) => s + p.price / p.area_sqm!, 0) / marketProps.length
    : null;
  const thisPpm = property.area_sqm ? property.price / property.area_sqm : null;
  const pct     = avgPpm && thisPpm ? ((thisPpm - avgPpm) / avgPpm) * 100 : null;
  const mktTag  = pct == null ? null : pct < -10 ? "✓ Below Market" : pct > 10 ? "↑ Above Market" : "≈ At Market";
  const mktCol  = pct == null ? "#64748b" : pct < -10 ? "#16a34a" : pct > 10 ? "#ea580c" : "#8b5cf6";

  const waMsg = `Hi! I'm interested in: "${property.title}" — is it still available?`;
  const waUrl = property.agent_phone
    ? `https://wa.me/${property.agent_phone.replace(/\D/g,"")}?text=${encodeURIComponent(waMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

  // ── Position: above the pin, centred horizontally. Clamp to stay visible. ─
  // pos.x / pos.y are pixels relative to the map container.
  // If pos is the sentinel 9999/9999 (clicked from listing card), centre it.
  const isSentinel = pos.x > 5000;
  // We rely on CSS clamp in the inline style — the parent is position:relative
  // so absolute coords work directly.
  const rawLeft = isSentinel ? "50%" : `${pos.x - POPUP_W / 2}px`;
  const rawTop  = isSentinel ? "50%" : `${pos.y - POPUP_H - 18}px`;
  const transform = isSentinel ? "translate(-50%, -50%)" : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: rawLeft,
        top: rawTop,
        transform,
        width: POPUP_W,
        zIndex: 500,
        borderRadius: 14,
        overflow: "hidden",
        background: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        border: "1px solid rgba(0,0,0,0.07)",
        // Clamp so it never goes off screen
        maxWidth: "calc(100% - 12px)",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Image with carousel */}
      <div style={{ position: "relative", height: 120, background: `${color}18`, flexShrink: 0, overflow: "hidden" }}>
        {!imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photos[photoIdx]}
            src={photos[photoIdx]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {property.property_type === "apartment" ? "🏢" : property.property_type === "house" ? "🏠" : property.property_type === "villa" ? "🏡" : "🏗️"}
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)", pointerEvents: "none" }} />

        {/* Carousel prev/next — always visible (popup is small, hover unreliable) */}
        {photos.length > 1 && !imgErr && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); setImgErr(false); }}
              style={{
                position: "absolute", left: 5, top: "50%", transform: "translateY(-50%)",
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.88)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: "#1e293b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", zIndex: 5,
              }}>‹</button>
            <button
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); setImgErr(false); }}
              style={{
                position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)",
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.88)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: "#1e293b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", zIndex: 5,
              }}>›</button>
            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 3, zIndex: 5, pointerEvents: "none" }}>
              {photos.map((_, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: 99, background: i === photoIdx ? "white" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </>
        )}
        {/* Type badge */}
        <div style={{ position: "absolute", top: 7, left: 7, background: color, borderRadius: 99, padding: "2px 8px" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {typeLabel} · {isRent ? "Rent" : "Sale"}
          </span>
        </div>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 7, right: 7,
            width: 24, height: 24, borderRadius: "50%",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            border: "none", cursor: "pointer", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Price */}
        <div style={{ position: "absolute", bottom: 7, left: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {priceFmt}
          </span>
          {isRent && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginLeft: 2 }}>/mo</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {property.title}
        </p>
        <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          📍 {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
        </p>

        {/* Specs row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {property.bedrooms  > 0 && <span style={{ fontSize: 9, color: "#475569" }}>🛏 {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span style={{ fontSize: 9, color: "#475569" }}>🚿 {property.bathrooms}</span>}
          {(property.area_sqm ?? 0) > 0 && <span style={{ fontSize: 9, color: "#475569" }}>📐 {property.area_sqm} m²</span>}
          {mktTag && (
            <span style={{ fontSize: 9, fontWeight: 600, color: mktCol, marginLeft: "auto" }}>{mktTag}</span>
          )}
        </div>

        {/* Agent row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getAgentAvatar(agentName)} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #e2e8f0" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agentName}</span>
          {isVerified(property.id) && <VerifiedBadge small />}
          <div style={{ flex: 1 }} />
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 9, fontWeight: 700, color: "white", background: "#25D366", borderRadius: 99, padding: "3px 8px", textDecoration: "none", flexShrink: 0 }}>
            WhatsApp
          </a>
        </div>

        {/* CTA */}
        <button
          onClick={() => { onViewDetail?.(property); onClose(); }}
          style={{
            display: "block", width: "100%", textAlign: "center",
            padding: "7px 0", borderRadius: 8,
            fontSize: 11, fontWeight: 700, color: "white",
            background: color, border: "none", cursor: "pointer",
          }}
        >
          View full listing →
        </button>
      </div>

      {/* Triangle tail pointing down toward pin (only when not sentinel) */}
      {!isSentinel && (
        <div style={{
          position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid white",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.12))",
        }} />
      )}
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
  const [properties,     setProperties]     = useState<PropertyWithCoords[]>(ALL_DEMO_PINS);
  const [selected,       setSelected]       = useState<PropertyWithCoords | null>(null);
  const [selectedPos,    setSelectedPos]    = useState<PinClickPosition | null>(null);
  const [aiDrawerOpen,   setAiDrawerOpen]   = useState(false);
  const [habinoOpen,     setHabinoOpen]     = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isIdleState,    setIsIdleState]    = useState(true);
  const [marketContext,    setMarketContext]    = useState<{ city: string; country: string; currency: string } | null>(null);
  const [mapCenter,        setMapCenter]        = useState<[number, number]>(ADDIS_CENTER);
  const [mapZoom,          setMapZoom]          = useState(ADDIS_ZOOM);
  const [hoveredId,        setHoveredId]        = useState<string | null>(null);
  const [displayCurrency,  setDisplayCurrency]  = useState<DisplayCurrency>("ETB");
  const [detailProperty,   setDetailProperty]   = useState<PropertyWithCoords | null>(null);

  const HEADER_H = 56;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

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
      setAiDrawerOpen(false); // auto-close drawer when results arrive
    }
  }, []);

  const handleViewSuggested = useCallback((_view: "listings" | "map" | "data") => {
    setAiDrawerOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    setProperties(ALL_DEMO_PINS);
    setIsIdleState(true);
    setHighlightedIds([]);
    setMarketContext(null);
    setSelected(null);
    setSelectedPos(null);
    setMapCenter(ADDIS_CENTER);
    setMapZoom(ADDIS_ZOOM);
  }, []);

  // ── MOBILE: full-screen AI overlay ────────────────────────────────────────
  if (isMobile && aiDrawerOpen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ height: HEADER_H, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setAiDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
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

  // ── DESKTOP: Airbnb-style — Listings left | Map right ─────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, display: "flex", flexDirection: "column", background: "white" }}>

      {/* ══════════════════════════════════════════════════════
          TOP HEADER — full width
      ══════════════════════════════════════════════════════ */}
      <div style={{
        height: HEADER_H, borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 14,
        flexShrink: 0, background: "white", zIndex: 20,
      }}>
        {/* Logo */}
        <Link href="/explore" style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", textDecoration: "none", flexShrink: 0 }}>
          Habino
        </Link>

        {/* AI Search trigger pill — mimics Airbnb's center search bar */}
        <button
          onClick={() => setAiDrawerOpen(true)}
          style={{
            flex: 1, maxWidth: 520, height: 40,
            display: "flex", alignItems: "center", gap: 10,
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 99,
            padding: "0 6px 0 16px", cursor: "pointer", textAlign: "left",
            transition: "all .14s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          <svg style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span style={{ fontSize: 13, color: isIdleState ? "#94a3b8" : "#1e293b", fontWeight: isIdleState ? 400 : 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isIdleState
              ? "Search properties — e.g. 2-bed apartment in Bole…"
              : `${properties.length} properties found${marketContext ? ` · ${marketContext.city}` : ""}`}
          </span>
          <div style={{
            padding: "4px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: "var(--color-primary)", color: "white", flexShrink: 0,
          }}>✦ Ask Habino</div>
        </button>

        <div style={{ flex: 1 }} />

        {/* Menu */}
        <button
          onClick={() => setHabinoOpen(o => !o)}
          style={{
            padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            color: "white", border: "none", cursor: "pointer", flexShrink: 0,
            backgroundColor: habinoOpen ? "var(--color-secondary)" : "var(--color-primary)",
          }}>
          Menu
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          BODY — Listings (left) | Map (right)
      ══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Scrollable listings ─────────────────────────── */}
        <div style={{
          width: isMobile ? "100%" : "54%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e2e8f0",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {/* Sub-header: result count + filters */}
          <div style={{
            height: 44, borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
            flexShrink: 0, background: "white",
          }}>
            {!isIdleState && properties.length > 0 ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {properties.length} properties
                </span>
                {marketContext && (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>in {marketContext.city}</span>
                )}
                {/* Reset button — returns to default idle view */}
                <button
                  onClick={handleReset}
                  title="Reset to default view"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "3px 10px 3px 7px", borderRadius: 99,
                    border: "1px solid #e2e8f0", background: "white",
                    fontSize: 11, fontWeight: 600, color: "#64748b",
                    cursor: "pointer", transition: "all .12s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#fef2f2";
                    (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5";
                    (e.currentTarget as HTMLElement).style.color = "#ef4444";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "white";
                    (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset
                </button>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Browse properties in Addis Ababa</span>
            )}

            {/* ── Currency switcher ── */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2, background: "#f1f5f9", borderRadius: 8, padding: 2 }}>
              {SUPPORTED_CURRENCIES.map(cur => (
                <button
                  key={cur}
                  onClick={() => setDisplayCurrency(cur)}
                  style={{
                    padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: "none", cursor: "pointer", transition: "all .12s",
                    background: displayCurrency === cur ? "white" : "transparent",
                    color: displayCurrency === cur ? "#0f172a" : "#94a3b8",
                    boxShadow: displayCurrency === cur ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* ── Inline detail view — slides in when 'View full listing' is clicked ── */}
          {detailProperty && (
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%", background: "white" }}>
              <PropertyDetailPanel
                property={detailProperty}
                allProperties={properties}
                displayCurrency={displayCurrency}
                onClose={() => setDetailProperty(null)}
              />
            </div>
          )}

          {/* Grid */}
          {!detailProperty && <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
            <div style={{ padding: "16px 16px 40px", boxSizing: "border-box", width: "100%" }}>
              {properties.length === 0 && !isIdleState ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No results</p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>Try different criteria — click Ask AI to refine your search.</p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  /* minmax(0,1fr) forces columns to shrink to exactly 1/3 regardless
                     of content minimum size — the key fix for "2 per row" bug */
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  width: "100%",
                  minWidth: 0,
                }}>
                  {properties.map(p => (
                    <div
                      key={p.id}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ minWidth: 0, overflow: "hidden" }}
                    >
                      <PropertyListingCard
                        property={p}
                        highlighted={highlightedIds.includes(p.id) || hoveredId === p.id}
                        displayCurrency={displayCurrency}
                        onSelect={() => {
                          setSelected(p);
                          // For list-card clicks, anchor popup to map center-right
                          setSelectedPos({ x: 9999, y: 9999 }); // sentinel → clamped to center
                          setMapCenter([p.lat, p.lng]);
                          setMapZoom(15);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>}
        </div>

        {/* ── RIGHT: Sticky map ─────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            height: "100%",
            position: "relative",
            display: isMobile ? "none" : "block",
          }}
          onClick={() => { if (selected) { setSelected(null); setSelectedPos(null); } }}
        >
          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            properties={properties}
            selectedId={selected?.id ?? null}
            highlightedIds={hoveredId ? [...highlightedIds, hoveredId] : highlightedIds}
            onSelect={(p, pos) => { setSelected(p); setSelectedPos(pos); setMapCenter([p.lat, p.lng]); setMapZoom(15); }}
            onBoundsChange={() => {}}
            cityClusters={[]}
            currentZoom={mapZoom}
            onCityClick={() => {}}
            neighbourhoodLabels={NEIGHBOURHOOD_LABELS}
            cityBounds={CITY_CONFIG["Addis Ababa"]?.bounds}
            cityMinZoom={CITY_CONFIG["Addis Ababa"]?.minZoom}
          />

          {/* ── Compact popup — appears next to the clicked pin ── */}
          {selected && selectedPos && (
            <MapPinPopup
              property={selected}
              pos={selectedPos}
              allProperties={properties}
              onClose={() => { setSelected(null); setSelectedPos(null); }}
              onViewDetail={(p) => { setDetailProperty(p); setSelected(null); setSelectedPos(null); }}
              displayCurrency={displayCurrency}
            />
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          AI CHAT DRAWER — slides in from left
      ══════════════════════════════════════════════════════ */}
      {aiDrawerOpen && (
        <>
          {/* Backdrop — light tint so map stays visible */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.12)" }}
            onClick={() => setAiDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="ai-drawer-enter" style={{
            position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 201,
            width: isMobile ? "100%" : 420,
            background: "white",
            boxShadow: "8px 0 48px rgba(0,0,0,0.14)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Drawer header */}
            <div style={{
              height: HEADER_H, borderBottom: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "white", fontWeight: 700,
              }}>✦</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Ask Habino, I&apos;m here to assist you</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setAiDrawerOpen(false)}
                style={{
                  width: 30, height: 30, borderRadius: 99, background: "#f1f5f9",
                  border: "none", cursor: "pointer", fontSize: 15, color: "#64748b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              >✕</button>
            </div>
            {/* AI Chat */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <AIChatPage sidebarMode onPropertiesFound={handlePropertiesFound} onViewSuggested={handleViewSuggested} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile: floating AI button */}
      {isMobile && !aiDrawerOpen && (
        <button
          onClick={() => setAiDrawerOpen(true)}
          style={{
            position: "fixed", bottom: 72, right: 16, zIndex: 100,
            width: 52, height: 52, borderRadius: 14,
            background: "var(--color-primary)", color: "white",
            border: "none", cursor: "pointer", fontSize: 11, fontWeight: 800,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
          ✦ AI
        </button>
      )}

      {/* ── Habino menu — slides in from right ── */}
      {habinoOpen && <HabinoPanel onClose={() => setHabinoOpen(false)} />}
    </div>
  );
}
