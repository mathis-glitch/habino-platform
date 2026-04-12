/**
 * import-addis-poi.ts
 * ────────────────────
 * Imports Points of Interest from OpenStreetMap's Overpass API
 * for Addis Ababa, Ethiopia into the Supabase `points_of_interest` table.
 *
 * Coverage area:  bbox 8.85,38.65,9.15,38.95  (lat_min,lng_min,lat_max,lng_max)
 * Categories:     education, health, transport, leisure, food, services, shopping
 *
 * Usage:
 *   npx tsx scripts/import-addis-poi.ts
 *
 * Run AFTER migration 005_poi.sql has been applied.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// ── Load .env.local ────────────────────────────────────────────────────────────
dotenv.config({
  path: path.join(__dirname, "../.env.local"),
});

// ── Supabase client ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Constants ──────────────────────────────────────────────────────────────────
// Use mirror instances as fallback when primary is overloaded
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const ADDIS_BBOX   = "8.85,38.65,9.15,38.95"; // lat_min,lng_min,lat_max,lng_max
const CITY         = "Addis Ababa";
const COUNTRY      = "ET";
const DELAY_MS     = 8000; // polite delay between Overpass requests (avoid 429)

// ── POI query definitions ──────────────────────────────────────────────────────
// Each entry defines one Overpass query run.
// tags: array of OSM tag strings ("key=value") — each generates node+way lines.
// label: used in progress logging.
// mapping: maps "key=value" → { type, category } for row classification.
interface QueryDef {
  label: string;
  tags: Array<{ key: string; value: string; type: string; category: string }>;
}

const QUERY_DEFS: QueryDef[] = [
  {
    label: "education",
    tags: [
      { key: "amenity", value: "school",       type: "school",       category: "education" },
      { key: "amenity", value: "university",   type: "university",   category: "education" },
      { key: "amenity", value: "college",      type: "college",      category: "education" },
      { key: "amenity", value: "kindergarten", type: "kindergarten", category: "education" },
    ],
  },
  {
    label: "health",
    tags: [
      { key: "amenity", value: "hospital", type: "hospital", category: "health" },
      { key: "amenity", value: "clinic",   type: "clinic",   category: "health" },
      { key: "amenity", value: "pharmacy", type: "pharmacy", category: "health" },
    ],
  },
  {
    label: "transport",
    tags: [
      { key: "amenity",  value: "bus_station", type: "bus_station",   category: "transport" },
      { key: "railway",  value: "station",     type: "train_station", category: "transport" },
      { key: "aeroway",  value: "aerodrome",   type: "airport",       category: "transport" },
    ],
  },
  {
    label: "leisure",
    tags: [
      { key: "leisure", value: "park",         type: "park",         category: "leisure" },
      { key: "leisure", value: "stadium",      type: "stadium",      category: "leisure" },
      { key: "leisure", value: "sports_centre",type: "sports_centre",category: "leisure" },
    ],
  },
  {
    label: "food",
    tags: [
      { key: "shop", value: "supermarket", type: "supermarket", category: "food" },
      { key: "amenity", value: "marketplace", type: "market",  category: "food" },
    ],
  },
  {
    label: "services",
    tags: [
      { key: "amenity", value: "bank",        type: "bank",        category: "services" },
      { key: "amenity", value: "post_office", type: "post_office", category: "services" },
      { key: "amenity", value: "embassy",     type: "embassy",     category: "services" },
      { key: "amenity", value: "townhall",    type: "government",  category: "services" },
      { key: "office",  value: "government",  type: "government",  category: "services" },
    ],
  },
  {
    label: "shopping",
    tags: [
      { key: "shop",    value: "mall",       type: "mall",            category: "shopping" },
      { key: "landuse", value: "commercial", type: "commercial_centre",category: "shopping" },
    ],
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────
interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  tags?: Record<string, string>;
}

interface PoiRow {
  osm_id:      number;
  osm_type:    string;
  name:        string | null;
  type:        string;
  category:    string;
  lat:         number;
  lng:         number;
  country:     string;
  city:        string;
  metadata:    Record<string, unknown> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resolve lat/lng from a node, way centre, or bounding-box centroid. */
function resolveLatLng(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  if (el.bounds) {
    return {
      lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
      lng: (el.bounds.minlon + el.bounds.maxlon) / 2,
    };
  }
  return null;
}

/** Prefer English name, fall back to any name tag. */
function resolveName(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  return tags["name:en"] ?? tags["name"] ?? null;
}

// ── Overpass query builder ─────────────────────────────────────────────────────
function buildQuery(queryDef: QueryDef): string {
  const lines = queryDef.tags.flatMap(({ key, value }) => [
    `  node["${key}"="${value}"](${ADDIS_BBOX});`,
    `  way["${key}"="${value}"](${ADDIS_BBOX});`,
  ]);

  return [
    `[out:json][timeout:60];`,
    `(`,
    ...lines,
    `);`,
    `out center;`,
  ].join("\n");
}

// ── Overpass fetcher ───────────────────────────────────────────────────────────
async function fetchOverpass(queryDef: QueryDef): Promise<OverpassElement[]> {
  const query = buildQuery(queryDef);

  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    `data=${encodeURIComponent(query)}`,
        signal:  AbortSignal.timeout(90_000), // 90s per mirror
      });

      if (res.status === 429 || res.status === 504) {
        console.log(`    → ${url} returned ${res.status}, trying next mirror...`);
        await sleep(3000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
      }

      const json = (await res.json()) as { elements: OverpassElement[] };
      return json.elements ?? [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("timeout") || msg.includes("aborted")) {
        console.log(`    → ${url} timed out, trying next mirror...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error("All Overpass mirrors failed");
}

// ── Element → POI row classifier ──────────────────────────────────────────────
function classifyElement(
  el: OverpassElement,
  queryDef: QueryDef
): { type: string; category: string } | null {
  const tags = el.tags;
  if (!tags) return null;

  for (const { key, value, type, category } of queryDef.tags) {
    if (tags[key] === value) {
      return { type, category };
    }
  }
  return null;
}

// ── Supabase upsert ────────────────────────────────────────────────────────────
async function upsertRows(rows: PoiRow[]): Promise<void> {
  const { error } = await sb
    .from("points_of_interest")
    .upsert(rows, { onConflict: "osm_id,osm_type", ignoreDuplicates: true });

  if (error) {
    console.error(`  Upsert error: ${error.message}`);
  }
}

// ── Process one query definition ───────────────────────────────────────────────
async function processCategory(queryDef: QueryDef): Promise<number> {
  console.log(`Fetching ${queryDef.label}...`);

  let elements: OverpassElement[] | undefined;
  const MAX_RETRIES = 4;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      elements = await fetchOverpass(queryDef);
      break;
    } catch (err) {
      const backoff = Math.pow(2, attempt) * 15_000; // 15s, 30s, 60s, 120s
      if (attempt < MAX_RETRIES - 1) {
        console.log(`    → attempt ${attempt + 1} failed, retrying in ${backoff / 1000}s...`);
        await sleep(backoff);
      } else {
        console.error(`  Failed to fetch ${queryDef.label} after ${MAX_RETRIES} attempts: ${err}`);
        return 0;
      }
    }
  }
  if (!elements) return 0;

  const rows: PoiRow[] = [];

  for (const el of elements) {
    try {
      const coords = resolveLatLng(el);
      if (!coords) continue;

      const cls = classifyElement(el, queryDef);
      if (!cls) continue;

      // Build metadata: all tags except name fields (keep up to 20 keys)
      const metadataEntries = Object.entries(el.tags ?? {})
        .filter(([k]) => !["name", "name:en"].includes(k))
        .slice(0, 20);

      const metadata: Record<string, string> | null =
        metadataEntries.length > 0
          ? Object.fromEntries(metadataEntries)
          : null;

      rows.push({
        osm_id:   el.id,
        osm_type: el.type,
        name:     resolveName(el.tags),
        type:     cls.type,
        category: cls.category,
        lat:      coords.lat,
        lng:      coords.lng,
        country:  COUNTRY,
        city:     CITY,
        metadata,
      });
    } catch (err) {
      console.error(`  Skipping element ${el.id} (${el.type}): ${err}`);
    }
  }

  if (rows.length > 0) {
    await upsertRows(rows);
  }

  console.log(`Inserted ${rows.length} ${queryDef.label}`);
  return rows.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("POI Import — Addis Ababa, Ethiopia (OSM → Supabase)");
  console.log("====================================================");
  console.log(`BBox:    ${ADDIS_BBOX}`);
  console.log(`City:    ${CITY} (${COUNTRY})`);
  console.log(`Target:  points_of_interest table`);
  console.log("");

  let totalInserted = 0;

  for (let i = 0; i < QUERY_DEFS.length; i++) {
    const queryDef = QUERY_DEFS[i];

    const inserted = await processCategory(queryDef);
    totalInserted += inserted;

    // Delay between requests — skip delay after the last one
    if (i < QUERY_DEFS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("");
  console.log(`====================================================`);
  console.log(`Total inserted: ${totalInserted.toLocaleString()} POIs`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
