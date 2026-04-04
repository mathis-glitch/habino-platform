/**
 * fix-broken-images.ts
 * Replaces all property_images rows whose URL contains the old &q=80 suffix
 * (those came from the original seed and 26/78 are confirmed 404s).
 * Replaces with verified-working URLs based on property type + sort_order.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PHOTOS: Record<string, string[]> = {
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
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop&auto=format",
  ],
  land: [
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
  plot: [
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format",
  ],
};
const FALLBACK = PHOTOS.apartment;

async function main() {
  // 1. Find all rows with the old q=80 suffix (the problematic ones)
  console.log("Finding old-format image rows...");
  const oldRows: { id: string; url: string; property_id: string; sort_order: number }[] = [];
  let from = 0;
  while (true) {
    const { data } = await sb
      .from("property_images")
      .select("id, url, property_id, sort_order")
      .ilike("url", "%&q=80%")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    oldRows.push(...(data as typeof oldRows));
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Found ${oldRows.length} old-format rows to replace.`);
  if (oldRows.length === 0) { console.log("Nothing to fix!"); return; }

  // 2. Fetch property types
  const propIds = [...new Set(oldRows.map(r => r.property_id))];
  const typeMap: Record<string, string> = {};
  for (let i = 0; i < propIds.length; i += 500) {
    const { data } = await sb
      .from("properties")
      .select("id, property_type")
      .in("id", propIds.slice(i, i + 500));
    (data ?? []).forEach((p: { id: string; property_type: string }) => {
      typeMap[p.id] = p.property_type;
    });
  }

  // 3. Update each row in batches using upsert
  let fixed = 0;
  const updates = oldRows.map(row => {
    const ptype = typeMap[row.property_id] ?? "apartment";
    const pool = PHOTOS[ptype] ?? FALLBACK;
    return { id: row.id, property_id: row.property_id, sort_order: row.sort_order, url: pool[row.sort_order % pool.length] };
  });

  for (let i = 0; i < updates.length; i += 500) {
    const batch = updates.slice(i, i + 500);
    const { error } = await sb.from("property_images").upsert(batch);
    if (error) console.error("Upsert error:", error.message);
    else {
      fixed += batch.length;
      process.stdout.write(`\r  ${fixed}/${updates.length} rows updated...`);
    }
  }
  console.log(`\nDone. Replaced ${fixed} old-format image URLs.`);
}

main().catch(console.error);
