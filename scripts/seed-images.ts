/**
 * seed-images.ts — Backfill property_images for all properties that have none.
 *
 * Uses Unsplash Source URLs keyed by property type (3 photos per property).
 * Safe to run multiple times — skips properties that already have images.
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

// 3 curated Unsplash photos per property type — varied interiors + exteriors
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
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format",
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

const FALLBACK_PHOTOS = TYPE_PHOTOS.apartment;

async function main() {
  console.log("Fetching all properties…");
  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select("id, property_type")
    .eq("status", "active");

  if (propErr || !properties) {
    console.error("Error fetching properties:", propErr?.message);
    process.exit(1);
  }

  console.log(`Found ${properties.length} active properties.`);

  // Find properties that already have images
  const { data: existing } = await supabase
    .from("property_images")
    .select("property_id");

  const withImages = new Set((existing ?? []).map((r: { property_id: string }) => r.property_id));
  const toSeed = properties.filter((p: { id: string }) => !withImages.has(p.id));
  console.log(`Skipping ${withImages.size} already have images. Seeding ${toSeed.length} properties…`);

  const rows: { property_id: string; url: string; sort_order: number }[] = [];
  for (const p of toSeed as { id: string; property_type: string }[]) {
    const photos = TYPE_PHOTOS[p.property_type] ?? FALLBACK_PHOTOS;
    photos.forEach((url, i) => {
      rows.push({ property_id: p.id, url, sort_order: i });
    });
  }

  // Insert in batches of 200
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await supabase.from("property_images").insert(batch);
    if (error) {
      console.error("Insert error:", error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  ${inserted}/${rows.length} image rows inserted…`);
    }
  }

  console.log(`\nDone. Inserted ${inserted} image rows for ${toSeed.length} properties.`);
}

main().catch(console.error);
