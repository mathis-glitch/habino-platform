/**
 * seed-images.ts — Seed 3 Unsplash photos per property for all active listings.
 *
 * Clears existing property_images rows for properties that have fewer than 3,
 * then inserts 3 photos per property keyed by property type.
 *
 * Usage:
 *   npx tsx scripts/seed-images.ts
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3 curated Unsplash photos per property type
const TYPE_PHOTOS: Record<string, string[]> = {
  apartment: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format",
  ],
  house: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop&auto=format",
  ],
  villa: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format",
  ],
  commercial: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop&auto=format",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop&auto=format",
  ],
  land: [
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format",
  ],
  plot: [
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format",
  ],
  hall: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop&auto=format",
  ],
  production: [
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop&auto=format",
  ],
};
const FALLBACK = TYPE_PHOTOS.apartment;

async function fetchAllProperties() {
  const all: { id: string; property_type: string }[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("properties")
      .select("id, property_type")
      .eq("status", "active")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as { id: string; property_type: string }[]));
    process.stdout.write(`\r  Fetched ${all.length} properties…`);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log();
  return all;
}

async function fetchPropertyIdsWithImages(): Promise<Set<string>> {
  // Use count query per property_id — simpler: just get distinct property_ids
  // Supabase doesn't support GROUP BY via JS client, so fetch all IDs paginated
  const ids = new Set<string>();
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("property_images")
      .select("property_id")
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    (data as { property_id: string }[]).forEach(r => ids.add(r.property_id));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return ids;
}

async function main() {
  console.log("Fetching all active properties (paginated)…");
  const properties = await fetchAllProperties();
  console.log(`Total: ${properties.length} active properties.`);

  console.log("Fetching property IDs that already have images…");
  const withImages = await fetchPropertyIdsWithImages();
  console.log(`Already have images: ${withImages.size}`);

  const toSeed = properties.filter(p => !withImages.has(p.id));
  console.log(`To seed: ${toSeed.length} properties.`);

  if (toSeed.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Build rows
  const rows: { property_id: string; url: string; sort_order: number }[] = [];
  for (const p of toSeed) {
    const photos = TYPE_PHOTOS[p.property_type] ?? FALLBACK;
    photos.forEach((url, i) => rows.push({ property_id: p.id, url, sort_order: i }));
  }

  // Insert in batches of 500
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from("property_images").insert(batch);
    if (error) console.error("\nInsert error:", error.message);
    else {
      inserted += batch.length;
      process.stdout.write(`\r  ${inserted}/${rows.length} rows inserted…`);
    }
  }
  console.log(`\nDone. Inserted ${inserted} image rows for ${toSeed.length} properties.`);
}

main().catch(console.error);
