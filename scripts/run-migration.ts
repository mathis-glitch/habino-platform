/**
 * run-migration.ts — apply a SQL migration file via Supabase service role
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: npx tsx run-migration.ts <file.sql>"); process.exit(1); }
  const sql = readFileSync(resolve(__dirname, "..", file), "utf8");

  // Use pg REST endpoint directly
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  // Supabase doesn't expose exec_sql by default — use the db URL approach instead
  // Split statements and upsert via PostgREST workarounds
  // Better: use the management API sql endpoint
  const mgmtUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://", "https://")
    .replace(".supabase.co", ".supabase.co");

  // Extract project ref from URL
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://", "").split(".")[0];

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    console.error("Management API failed:", await res.text());
    console.log("Try running via Supabase Dashboard SQL editor instead.");
    process.exit(1);
  }
  console.log("Migration applied successfully.");
}
main().catch(console.error);
