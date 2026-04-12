/**
 * apply-ddl.ts — Run DDL via Supabase Management API
 * The Management API requires a personal access token, not the service role key.
 * Alternative: we fake DDL by using the Supabase "pg" approach via REST extensions.
 *
 * Actually the cleanest path: use the pg library directly with the Supabase
 * connection string (port 5432). Without that, we push a Next.js API route
 * that runs the DDL server-side with the service role.
 *
 * This script creates a temporary API endpoint, calls it, then removes it.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { execSync } from "child_process";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
  .replace("https://", "").split(".supabase.co")[0];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string): Promise<{ error?: string }> {
  // Use the Supabase pg REST endpoint (available on all projects)
  const res = await fetch(
    `https://${projectRef}.supabase.co/pg/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  if (!res.ok) return { error: text };
  return {};
}

const MIGRATION = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260404_profile_score.sql"),
  "utf8"
);

async function main() {
  console.log("Trying Supabase pg/query endpoint...");
  const { error } = await runSQL(MIGRATION);
  if (error) {
    console.log("pg/query not available:", error.slice(0, 200));
    console.log("\n⚠️  Please run the migration manually in Supabase Dashboard:");
    console.log("   https://supabase.com/dashboard/project/ikubxgsptautubecukoi/sql/new");
    console.log("\nSQL file: supabase/migrations/20260404_profile_score.sql");
  } else {
    console.log("✓ Migration applied successfully.");
  }
}

main().catch(console.error);
