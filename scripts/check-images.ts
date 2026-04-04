import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const allImgs: { property_id: string }[] = [];
  let from = 0;
  while (true) {
    const { data } = await sb.from("property_images").select("property_id").range(from, from + 999);
    if (!data || data.length === 0) break;
    allImgs.push(...(data as { property_id: string }[]));
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Total property_images rows: ${allImgs.length}`);
  const counts: Record<string, number> = {};
  allImgs.forEach((x) => {
    counts[x.property_id] = (counts[x.property_id] || 0) + 1;
  });
  const dist: Record<number, number> = {};
  Object.values(counts).forEach((c) => { dist[c] = (dist[c] || 0) + 1; });
  console.log("Image count distribution (images -> # of properties):", dist);

  const { count } = await sb.from("properties").select("id", { count: "exact", head: true }).eq("status", "active");
  console.log("Total active properties:", count);
  console.log("Properties with images:", Object.keys(counts).length);
  console.log("Properties with 0 images in property_images:", (count ?? 0) - Object.keys(counts).length);
}

main().catch(console.error);
