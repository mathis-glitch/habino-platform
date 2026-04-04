import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb.from("property_images").select("url").limit(500);
  const distinct = [...new Set((data ?? []).map((r: { url: string }) => r.url))];
  console.log(`Testing ${distinct.length} distinct URLs...`);

  let ok = 0, fail = 0;
  const broken: string[] = [];

  await Promise.all(distinct.map(async (url) => {
    try {
      const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      if (r.ok) ok++;
      else { fail++; broken.push(`${r.status} ${url}`); }
    } catch {
      fail++;
      broken.push(`ERR ${url}`);
    }
  }));

  console.log(`OK: ${ok}  FAIL: ${fail}`);
  if (broken.length) {
    console.log("Broken:");
    broken.forEach(b => console.log(" ", b));
  }
}

main().catch(console.error);
