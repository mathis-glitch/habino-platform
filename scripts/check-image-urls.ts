import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get a sample of ALL distinct URLs used across all property_images
  const { data } = await sb
    .from("property_images")
    .select("url")
    .limit(200);

  const distinct = [...new Set((data ?? []).map((r: { url: string }) => r.url))];
  console.log(`Distinct URLs in first 200 rows (${distinct.length} unique):`);
  distinct.forEach(u => console.log(" ", u));
}

main().catch(console.error);
