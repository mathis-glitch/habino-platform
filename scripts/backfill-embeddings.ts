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
  if (p.description)   parts.push(String(p.description).slice(0, 500));
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

// ── Backfill properties ────────────────────────────────────────────────────────
async function backfillProperties() {
  console.log("\n── Properties ──────────────────────────────────────");
  let offset = 0;
  let total  = 0;

  while (true) {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, property_type, listing_type, bedrooms, bathrooms, area_sqm, neighbourhood, city, description")
      .eq("status", "active")
      .is("embedding", null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) { console.error("Supabase error:", error.message); break; }
    if (!data || data.length === 0) break;

    // Process in sub-batches for OpenAI
    for (let i = 0; i < data.length; i += EMBED_BATCH) {
      const chunk = data.slice(i, i + EMBED_BATCH);
      const texts  = chunk.map(propertyText);

      try {
        const vectors = await embedTexts(texts);
        for (let j = 0; j < chunk.length; j++) {
          const { error: upErr } = await supabase
            .from("properties")
            .update({ embedding: vectors[j] as unknown as string })
            .eq("id", chunk[j].id);
          if (upErr) console.error(`  ✗ property ${chunk[j].id}:`, upErr.message);
          else        process.stdout.write(".");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("\n  OpenAI error:", msg);
      }
    }

    total  += data.length;
    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
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
  await backfillProperties();
  await backfillBrokers();
  console.log("\nAll done.");
})();
