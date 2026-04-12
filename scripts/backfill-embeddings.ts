/**
 * Backfill OpenAI text-embedding-3-small embeddings for all active properties
 * and all broker profiles that don't yet have an embedding.
 *
 * Run once (and re-run whenever you add new listings):
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *   in .env.local (loaded automatically by dotenv below).
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const BATCH_SIZE  = 100;  // rows fetched per Supabase page
const EMBED_BATCH = 20;   // texts sent to OpenAI per call (max 2048 inputs)
const MODEL       = "text-embedding-3-small";

// ── Property text representation ──────────────────────────────────────────────
function propertyText(p: Record<string, unknown>): string {
  const parts: string[] = [];
  if (p.title)         parts.push(String(p.title));
  if (p.property_type) parts.push(String(p.property_type));
  if (p.listing_type)  parts.push(p.listing_type === "rent" ? "for rent" : "for sale");
  if (p.bedrooms)      parts.push(`${p.bedrooms} bedrooms`);
  if (p.bathrooms)     parts.push(`${p.bathrooms} bathrooms`);
  if (p.area_sqm)      parts.push(`${p.area_sqm} sqm`);
  if (p.neighbourhood) parts.push(String(p.neighbourhood));
  if (p.city)          parts.push(String(p.city));
  if (p.furnished)     parts.push(String(p.furnished));
  if (p.condition)     parts.push(`condition: ${p.condition}`);
  if (p.parking)       parts.push(`${p.parking} parking spaces`);
  if (p.floor)         parts.push(`floor ${p.floor}`);
  if (Array.isArray(p.amenities) && p.amenities.length > 0)
    parts.push("amenities: " + (p.amenities as string[]).join(", "));
  if (p.nearby_text)   parts.push("nearby: " + String(p.nearby_text));
  if (p.description)   parts.push(String(p.description).slice(0, 600));
  return parts.join(". ");
}

// ── Broker text representation ─────────────────────────────────────────────────
function brokerText(b: Record<string, unknown>): string {
  const parts: string[] = [];
  if (b.full_name)  parts.push(String(b.full_name));
  if (b.agency)     parts.push(String(b.agency));
  if (b.bio)        parts.push(String(b.bio).slice(0, 400));
  if (Array.isArray(b.speciality) && b.speciality.length)
    parts.push("specialises in " + b.speciality.join(", "));
  if (Array.isArray(b.districts) && b.districts.length)
    parts.push("covers " + b.districts.join(", "));
  if (Array.isArray(b.property_types) && b.property_types.length)
    parts.push("property types: " + b.property_types.join(", "));
  if (b.years_exp)  parts.push(`${b.years_exp} years experience`);
  if (Array.isArray(b.certifications) && b.certifications.length)
    parts.push("certifications: " + b.certifications.join(", "));
  return parts.join(". ");
}

// ── Embed a batch of texts → float[] vectors ──────────────────────────────────
async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({ model: MODEL, input: texts });
  return response.data.map((d) => d.embedding);
}

// ── Auto-populate nearby_text from PostGIS POI data ───────────────────────────
async function backfillNearbyText(): Promise<string[]> {
  console.log("\n── Auto-generating nearby_text from POI data ───────");

  // Check if POI table has any data first — skip if empty
  const { count: poiCount } = await supabase
    .from("points_of_interest")
    .select("id", { count: "exact", head: true });

  if (!poiCount || poiCount === 0) {
    console.log("  POI table is empty — skipping nearby_text generation.");
    console.log("  Import OSM data first, then re-run this script.");
    return [];
  }

  console.log(`  Found ${poiCount} POIs — generating nearby_text for properties...`);

  // Paginate: fetch all IDs needing nearby_text update
  const ids: string[] = [];
  let page = 0;
  while (true) {
    const { data: pageIds } = await supabase
      .from("properties")
      .select("id")
      .eq("status", "active")
      .not("lat", "is", null)
      .or("nearby_text.is.null,nearby_text.eq.")
      .range(page * 1000, page * 1000 + 999);
    if (!pageIds || pageIds.length === 0) break;
    ids.push(...pageIds.map(r => r.id));
    if (pageIds.length < 1000) break;
    page++;
  }

  if (ids.length === 0) { console.log("  Nothing to update."); return []; }
  console.log(`  ${ids.length} properties need nearby_text...`);

  const updated: string[] = [];
  for (const id of ids) {
    const { data: nearby } = await supabase
      .rpc("generate_property_nearby_text", { p_property_id: id, p_radius_m: 2000, p_max_pois: 8 });
    if (nearby) {
      await supabase.from("properties").update({ nearby_text: nearby }).eq("id", id);
      updated.push(id);
      process.stdout.write(".");
    }
  }
  console.log(`\n  Done — updated ${updated.length} properties with nearby_text.`);
  return updated; // IDs that now have new nearby_text → need re-embedding
}

// ── Clear embeddings for re-embed ─────────────────────────────────────────────
async function clearEmbeddingsForIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  console.log(`\n── Clearing stale embeddings for ${ids.length} properties (nearby_text updated) ───`);
  // Process in batches of 500
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    const { error } = await supabase
      .from("properties")
      .update({ embedding: null })
      .in("id", batch);
    if (error) console.error("  Clear error:", error.message);
    else process.stdout.write(".");
  }
  console.log(`\n  Cleared ${ids.length} embeddings — will re-embed with enriched text.`);
}

// ── Backfill properties ────────────────────────────────────────────────────────
async function backfillProperties() {
  console.log("\n── Properties ──────────────────────────────────────");

  // Fetch ALL IDs first in pages of 1000 (Supabase default row limit)
  const ids: string[] = [];
  let page = 0;
  while (true) {
    const { data: pageIds, error: idErr } = await supabase
      .from("properties")
      .select("id")
      .eq("status", "active")
      .is("embedding", null)
      .range(page * 1000, page * 1000 + 999);
    if (idErr) { console.error("Supabase error:", idErr.message); break; }
    if (!pageIds || pageIds.length === 0) break;
    ids.push(...pageIds.map(r => r.id));
    if (pageIds.length < 1000) break;
    page++;
  }

  if (ids.length === 0) { console.log("Nothing to embed."); return; }
  console.log(`  Found ${ids.length} properties to embed...`);
  let   total = 0;

  // Process in batches of BATCH_SIZE, fetching full data per batch
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, property_type, listing_type, bedrooms, bathrooms, area_sqm, neighbourhood, city, description, furnished, condition, parking, floor, amenities, nearby_text")
      .in("id", batchIds);

    if (error) { console.error("Supabase error:", error.message); continue; }
    if (!data || data.length === 0) continue;

    for (let j = 0; j < data.length; j += EMBED_BATCH) {
      const chunk = data.slice(j, j + EMBED_BATCH);
      const texts = chunk.map(propertyText);
      try {
        const vectors = await embedTexts(texts);
        for (let k = 0; k < chunk.length; k++) {
          const { error: upErr } = await supabase
            .from("properties")
            .update({ embedding: vectors[k] as unknown as string })
            .eq("id", chunk[k].id);
          if (upErr) console.error(`  ✗ property ${chunk[k].id}:`, upErr.message);
          else        process.stdout.write(".");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("\n  OpenAI error:", msg);
      }
    }
    total += data.length;
  }

  console.log(`\nDone. Embedded ${total} properties.`);
}

// ── Backfill broker profiles ───────────────────────────────────────────────────
async function backfillBrokers() {
  console.log("\n── Broker profiles ─────────────────────────────────");
  const { data, error } = await supabase
    .from("broker_profiles")
    .select("id, full_name, agency, bio, speciality, districts, property_types, years_exp, certifications")
    .is("embedding", null);

  if (error) { console.error("Supabase error:", error.message); return; }
  if (!data || data.length === 0) { console.log("Nothing to embed."); return; }

  for (let i = 0; i < data.length; i += EMBED_BATCH) {
    const chunk = data.slice(i, i + EMBED_BATCH);
    const texts  = chunk.map(brokerText);
    try {
      const vectors = await embedTexts(texts);
      for (let j = 0; j < chunk.length; j++) {
        const { error: upErr } = await supabase
          .from("broker_profiles")
          .update({ embedding: vectors[j] as unknown as string })
          .eq("id", chunk[j].id);
        if (upErr) console.error(`  ✗ broker ${chunk[j].id}:`, upErr.message);
        else        process.stdout.write(".");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("\n  OpenAI error:", msg);
    }
  }

  console.log(`\nDone. Embedded ${data.length} broker profiles.`);
}

// ── Entry point ────────────────────────────────────────────────────────────────
(async () => {
  console.log("Habino embedding backfill");
  console.log("Model:", MODEL);
  const updatedIds = await backfillNearbyText();   // Step 1: auto-fill nearby_text from POI data
  await clearEmbeddingsForIds(updatedIds);          // Step 2: clear stale embeddings for re-embed
  await backfillProperties();                       // Step 3: embed all properties without embedding
  await backfillBrokers();                          // Step 4: embed broker profiles
  console.log("\nAll done.");
})();
