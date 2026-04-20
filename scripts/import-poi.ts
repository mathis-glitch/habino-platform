/**
 * import-poi.ts
 * ─────────────
 * Imports Points of Interest from OpenStreetMap's Overpass API
 * for any city defined in the `cities` table.
 *
 * Usage:
 *   npx tsx scripts/import-poi.ts --city="Nairobi"
 *   npx tsx scripts/import-poi.ts --city="Dar es Salaam"
 *   npx tsx scripts/import-poi.ts --city="Addis Ababa"
 *   npx tsx scripts/import-poi.ts --all   (imports for all active cities)
 *
 * Run AFTER migration 005_poi.sql and 20260420_cities_districts.sql have been applied.
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Overpass mirrors ────────────────────────────────────────────────────────────
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const DELAY_MS = 8000;

// Country code → country name mapping for POI rows
const COUNTRY_MAP: Record<string, string> = {
  ET: "Ethiopia",
  KE: "Kenya",
  TZ: "Tanzania",
};

// ── POI query definitions (same for all cities) ─────────────────────────────────
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
      { key: "shop",    value: "supermarket",  type: "supermarket", category: "food" },
      { key: "amenity", value: "marketplace",  type: "market",      category: "food" },
    ],
  },
  {
    label: "services",
    tags: [
      { key: "amenity", value: "bank",        type: "bank",        category: "services" },
      { key: "amenity", value: "post_office", type: "post_office", category: "services" },
      { key: "amenity", value: "embassy",     type: "embassy",     category: "services" },
    ],
  },
  {
    label: "shopping",
    tags: [
      { key: "shop", value: "mall", type: "mall", category: "shopping" },
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
  osm_id: number; osm_type: string; name: string | null;
  type: string; category: string; lat: number; lng: number;
  country: string; city: string; metadata: Record<string, unknown> | null;
}

interface CityConfig {
  name: string;
  country_code: string;
  bbox: string; // lat_min,lng_min,lat_max,lng_max
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function resolveLatLng(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  if (el.bounds) return {
    lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
    lng: (el.bounds.minlon + el.bounds.maxlon) / 2,
  };
  return null;
}

function resolveName(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  return tags["name:en"] ?? tags["name"] ?? null;
}

function buildQuery(queryDef: QueryDef, bbox: string): string {
  const lines = queryDef.tags.flatMap(({ key, value }) => [
    `  node["${key}"="${value}"](${bbox});`,
    `  way["${key}"="${value}"](${bbox});`,
  ]);
  return [`[out:json][timeout:60];`, `(`, ...lines, `);`, `out center;`].join("\n");
}

async function fetchOverpass(queryDef: QueryDef, bbox: string): Promise<OverpassElement[]> {
  const query = buildQuery(queryDef, bbox);
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(90_000),
      });
      if (res.status === 429 || res.status === 504) {
        console.log(`    → ${url} returned ${res.status}, trying next mirror...`);
        await sleep(3000);
        continue;
      }
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
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

async function processCategory(queryDef: QueryDef, city: CityConfig): Promise<number> {
  console.log(`  Fetching ${queryDef.label}...`);

  let elements: OverpassElement[] | undefined;
  const MAX_RETRIES = 4;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      elements = await fetchOverpass(queryDef, city.bbox);
      break;
    } catch (err) {
      const backoff = Math.pow(2, attempt) * 15_000;
      if (attempt < MAX_RETRIES - 1) {
        console.log(`    → attempt ${attempt + 1} failed, retrying in ${backoff / 1000}s...`);
        await sleep(backoff);
      } else {
        console.error(`  Failed ${queryDef.label} after ${MAX_RETRIES} attempts: ${err}`);
        return 0;
      }
    }
  }
  if (!elements) return 0;

  const rows: PoiRow[] = [];
  for (const el of elements) {
    const coords = resolveLatLng(el);
    if (!coords) continue;
    const cls = queryDef.tags.find(
      (t) => el.tags?.[t.key] === t.value,
    );
    if (!cls) continue;

    const metaEntries = Object.entries(el.tags ?? {})
      .filter(([k]) => !["name", "name:en"].includes(k))
      .slice(0, 20);

    rows.push({
      osm_id: el.id,
      osm_type: el.type,
      name: resolveName(el.tags),
      type: cls.type,
      category: cls.category,
      lat: coords.lat,
      lng: coords.lng,
      country: city.country_code,
      city: city.name,
      metadata: metaEntries.length > 0 ? Object.fromEntries(metaEntries) : null,
    });
  }

  // Upsert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb
      .from("points_of_interest")
      .upsert(batch, { onConflict: "osm_id,osm_type", ignoreDuplicates: true });
    if (error) console.error(`    Upsert error: ${error.message}`);
  }

  console.log(`    → ${rows.length} POIs`);
  return rows.length;
}

async function importCity(city: CityConfig): Promise<void> {
  console.log(`\n══ ${city.name} (${city.country_code}) ══`);
  let total = 0;
  for (const qd of QUERY_DEFS) {
    const count = await processCategory(qd, city);
    total += count;
    await sleep(DELAY_MS);
  }
  console.log(`  Total: ${total} POIs for ${city.name}`);
}

async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find((a) => a.startsWith("--city="))?.split("=")[1];
  const allFlag = args.includes("--all");

  // Load cities from DB
  const { data: cities, error } = await sb
    .from("cities")
    .select("name, country_code, bounds_sw, bounds_ne")
    .eq("is_active", true);

  if (error || !cities) {
    console.error("Failed to load cities:", error?.message);
    process.exit(1);
  }

  const cityConfigs: CityConfig[] = cities.map((c) => ({
    name: c.name,
    country_code: c.country_code,
    // bbox: lat_min,lng_min,lat_max,lng_max
    bbox: `${c.bounds_sw[0]},${c.bounds_sw[1]},${c.bounds_ne[0]},${c.bounds_ne[1]}`,
  }));

  let targets: CityConfig[];
  if (allFlag) {
    targets = cityConfigs;
  } else if (cityArg) {
    const match = cityConfigs.find(
      (c) => c.name.toLowerCase() === cityArg.toLowerCase(),
    );
    if (!match) {
      console.error(`City "${cityArg}" not found. Available: ${cityConfigs.map((c) => c.name).join(", ")}`);
      process.exit(1);
    }
    targets = [match];
  } else {
    console.log("Usage:");
    console.log('  npx tsx scripts/import-poi.ts --city="Nairobi"');
    console.log("  npx tsx scripts/import-poi.ts --all");
    console.log(`\nAvailable cities: ${cityConfigs.map((c) => c.name).join(", ")}`);
    process.exit(0);
  }

  for (const city of targets) {
    await importCity(city);
  }

  console.log("\nDone.");
}

main();
