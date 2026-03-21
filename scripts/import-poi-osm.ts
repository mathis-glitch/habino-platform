/**
 * import-poi-osm.ts
 * ─────────────────
 * Downloads Points of Interest from OpenStreetMap (Overpass API) and
 * imports them into the Supabase `points_of_interest` table.
 *
 * Features:
 *  - Covers all cities in city-data-geonames.ts (26k cities) or city-data-extended.ts
 *  - Resumable: skips city+type combos already in poi_import_log
 *  - Rate-limit friendly: 1.5s pause between Overpass requests
 *  - Batched upserts (500 rows) with retry
 *  - Deduplicates by osm_id
 *
 * Usage:
 *   npx tsx scripts/import-poi-osm.ts
 *   npx tsx scripts/import-poi-osm.ts --country DE        # only Germany
 *   npx tsx scripts/import-poi-osm.ts --type school       # only schools
 *   npx tsx scripts/import-poi-osm.ts --limit 100         # only first 100 cities
 *
 * Run AFTER migration 005_poi.sql has been applied.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local automatically ─────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

// ── Supabase client ────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI args ───────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const getArg  = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const FILTER_COUNTRY = getArg("--country");   // e.g. "DE"
const FILTER_TYPE    = getArg("--type");       // e.g. "school"
const CITY_LIMIT     = getArg("--limit") ? parseInt(getArg("--limit")!) : Infinity;

// ── POI type definitions ───────────────────────────────────────────────────────
// Each entry: [overpass_tag, type_name, category]
// OSM tag docs: https://wiki.openstreetmap.org/wiki/Map_features
const POI_TYPES: [string, string, string][] = [
  // Education
  ['amenity=school',            'school',       'education'],
  ['amenity=kindergarten',      'kindergarten', 'education'],
  ['amenity=university',        'university',   'education'],
  ['amenity=college',           'college',      'education'],
  // Health
  ['amenity=hospital',          'hospital',     'health'],
  ['amenity=clinic',            'clinic',       'health'],
  ['amenity=pharmacy',          'pharmacy',     'health'],
  ['amenity=doctors',           'doctor',       'health'],
  // Transport
  ['railway=station',           'train_station','transport'],
  ['railway=subway_entrance',   'subway',       'transport'],
  ['amenity=bus_station',       'bus_station',  'transport'],
  ['aeroway=aerodrome',         'airport',      'transport'],
  // Leisure & Nature
  ['leisure=park',              'park',         'leisure'],
  ['leisure=playground',        'playground',   'leisure'],
  ['leisure=sports_centre',     'sports_centre','leisure'],
  ['leisure=fitness_centre',    'gym',          'leisure'],
  ['natural=beach',             'beach',        'leisure'],
  // Food & Shopping
  ['shop=supermarket',          'supermarket',  'food'],
  ['shop=mall',                 'mall',         'food'],
  ['amenity=restaurant',        'restaurant',   'food'],
  ['amenity=cafe',              'cafe',         'food'],
  // Services
  ['amenity=bank',              'bank',         'services'],
  ['amenity=post_office',       'post_office',  'services'],
  ['amenity=police',            'police',       'services'],
];

const POI_TYPE_MAP = new Map(POI_TYPES.map(([tag, type, cat]) => [tag, { type, category: cat }]));

// ── Load city list ─────────────────────────────────────────────────────────────
interface CityRecord { name: string; country: string; lat: number; lng: number; }

function loadCities(): CityRecord[] {
  // Try GeoNames first (26k cities), fall back to extended (1200 cities)
  const geoNamesPath = path.join(__dirname, "city-data-geonames.ts");
  const extPath      = path.join(__dirname, "city-data-extended.ts");

  let cities: CityRecord[] = [];

  if (fs.existsSync(geoNamesPath)) {
    console.log("📍 Loading GeoNames cities (~26k)…");
    const src = fs.readFileSync(geoNamesPath, "utf-8");
    // Parse: ["CityName","CC",lat,lng,"CUR",priceIdx]
    const matches = [...src.matchAll(/\["([^"]+)","([A-Z]{2})",(-?[\d.]+),(-?[\d.]+)/g)];
    cities = matches.map(m => ({
      name:    m[1],
      country: m[2],
      lat:     parseFloat(m[3]),
      lng:     parseFloat(m[4]),
    }));
  } else if (fs.existsSync(extPath)) {
    console.log("📍 Loading extended cities (~1200)…");
    const src = fs.readFileSync(extPath, "utf-8");
    const matches = [...src.matchAll(/\["([^"]+)","([^"]+)",(-?[\d.]+),(-?[\d.]+)/g)];
    cities = matches.map(m => ({
      name:    m[1],
      country: m[2],
      lat:     parseFloat(m[3]),
      lng:     parseFloat(m[4]),
    }));
  } else {
    throw new Error("No city data file found. Run prepare-geonames.ts first.");
  }

  if (FILTER_COUNTRY) {
    cities = cities.filter(c => c.country === FILTER_COUNTRY.toUpperCase());
    console.log(`🔍 Filtered to country ${FILTER_COUNTRY}: ${cities.length} cities`);
  }

  if (cities.length > CITY_LIMIT) {
    cities = cities.slice(0, CITY_LIMIT);
    console.log(`✂️  Limited to ${CITY_LIMIT} cities`);
  }

  return cities;
}

// ── Already-imported lookup ────────────────────────────────────────────────────
async function loadDoneSet(): Promise<Set<string>> {
  const { data } = await sb.from("poi_import_log").select("city,country,poi_type");
  const done = new Set<string>();
  for (const row of data ?? []) {
    done.add(`${row.city}||${row.country}||${row.poi_type}`);
  }
  console.log(`✅ Already imported: ${done.size} city+type combos`);
  return done;
}

// ── Overpass query ────────────────────────────────────────────────────────────
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];
let overpassIdx = 0;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Build ONE Overpass query fetching ALL poi types at once (24× fewer requests)
function buildBatchQuery(lat: number, lng: number, radiusM: number, tags: string[]): string {
  const unions = tags.flatMap(tag => {
    const [key, val] = tag.split("=");
    return [
      `  node["${key}"="${val}"](around:${radiusM},${lat},${lng});`,
      `  way["${key}"="${val}"](around:${radiusM},${lat},${lng});`,
    ];
  }).join("\n");
  return `[out:json][timeout:60];\n(\n${unions}\n);\nout center tags;`;
}

async function queryOverpassBatch(lat: number, lng: number, radiusM: number, tags: string[]): Promise<OverpassElement[]> {
  const query = buildBatchQuery(lat, lng, radiusM, tags);

  for (let attempt = 0; attempt < 3; attempt++) {
    const url = OVERPASS_URLS[overpassIdx % OVERPASS_URLS.length];
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    `data=${encodeURIComponent(query)}`,
        signal:  AbortSignal.timeout(65_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { elements: OverpassElement[] };
      return json.elements ?? [];
    } catch (e) {
      if (attempt === 2) throw e;
      overpassIdx++;
      await sleep(3000 * (attempt + 1));
    }
  }
  return [];
}

// Classify an element by its OSM tags → our POI type
function classifyElement(tags: Record<string, string> | undefined): { type: string; category: string } | null {
  if (!tags) return null;
  for (const [tag, type, category] of POI_TYPES) {
    const [key, val] = tag.split("=");
    if (tags[key] === val) return { type, category };
  }
  return null;
}

// ── Batch upsert ──────────────────────────────────────────────────────────────
const UPSERT_BATCH = 500;

interface PoiRow {
  osm_id:   number;
  osm_type: string;
  name:     string | null;
  type:     string;
  category: string;
  lat:      number;
  lng:      number;
  country:  string;
  city:     string;
  metadata: Record<string, string> | null;
}

async function upsertBatch(rows: PoiRow[]): Promise<void> {
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const chunk = rows.slice(i, i + UPSERT_BATCH);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await sb
        .from("points_of_interest")
        .upsert(chunk, { onConflict: "osm_id,osm_type", ignoreDuplicates: true });
      if (!error) break;
      if (attempt === 2) console.error("  ⚠️  Upsert error:", error.message);
      else await sleep(1000 * (attempt + 1));
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getLatLng(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon };
  if (el.center)                         return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌍  POI Import — OpenStreetMap → Supabase");
  console.log("=========================================\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const cities     = loadCities();
  const done       = await loadDoneSet();
  const typesToRun = FILTER_TYPE
    ? POI_TYPES.filter(([, type]) => type === FILTER_TYPE)
    : POI_TYPES;
  const tagsToRun  = typesToRun.map(([tag]) => tag);

  console.log(`\n🏙️  Cities to process: ${cities.length}`);
  console.log(`📌 POI types: ${typesToRun.map(([,t]) => t).join(", ")}`);
  console.log(`⚡ Mode: 1 Overpass request per city (all types batched)\n`);

  let totalImported = 0;
  let cityIdx = 0;

  for (const city of cities) {
    cityIdx++;
    const cityLabel = `${city.name} (${city.country}) [${cityIdx}/${cities.length}]`;

    // Skip city entirely if ALL types already done
    const allDone = typesToRun.every(([, type]) =>
      done.has(`${city.name}||${city.country}||${type}`)
    );
    if (allDone) continue;

    // ONE request fetching all POI types at once
    let elements: OverpassElement[] = [];
    try {
      elements = await queryOverpassBatch(city.lat, city.lng, 15_000, tagsToRun);
    } catch (e) {
      console.warn(`  ⚠️  Overpass failed for ${cityLabel}: ${e}`);
      await sleep(5000);
      continue;
    }

    // Classify each element and build rows
    const rows: PoiRow[] = [];
    for (const el of elements) {
      const coords = getLatLng(el);
      if (!coords) continue;
      const cls = classifyElement(el.tags);
      if (!cls) continue;
      // Skip if this type was already imported for this city
      if (done.has(`${city.name}||${city.country}||${cls.type}`)) continue;
      rows.push({
        osm_id:   el.id,
        osm_type: el.type,
        name:     el.tags?.name ?? el.tags?.["name:en"] ?? null,
        type:     cls.type,
        category: cls.category,
        lat:      coords.lat,
        lng:      coords.lng,
        country:  city.country,
        city:     city.name,
        metadata: el.tags ? Object.fromEntries(
          Object.entries(el.tags).filter(([k]) => !["name","type"].includes(k)).slice(0, 10)
        ) : null,
      });
    }

    if (rows.length > 0) {
      await upsertBatch(rows);
      totalImported += rows.length;
    }

    // Mark all types as done for this city (even if count=0)
    const countByType = new Map<string, number>();
    for (const r of rows) countByType.set(r.type, (countByType.get(r.type) ?? 0) + 1);

    const logRows = typesToRun.map(([, type]) => ({
      city: city.name, country: city.country, poi_type: type,
      count: countByType.get(type) ?? 0,
    }));
    await sb.from("poi_import_log").upsert(logRows, { onConflict: "city,country,poi_type" });
    for (const [, type] of typesToRun) done.add(`${city.name}||${city.country}||${type}`);

    console.log(`  ✅ ${cityLabel}: ${rows.length} POIs`);

    // Polite rate limit — 1 request per city now instead of 24
    await sleep(1500);
  }

  console.log(`\n🎉 Done! Total POIs imported: ${totalImported.toLocaleString()}`);
}

main().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
