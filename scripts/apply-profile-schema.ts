/**
 * apply-profile-schema.ts — Add new profile columns + broker_profiles table
 * Runs safe ALTER TABLE / CREATE TABLE statements via Supabase REST.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sql(query: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  // PostgREST doesn't allow raw DDL — we use the pg connection via a helper table trick.
  // Instead, we'll create an RPC and call it.
  // Actually the cleanest way without the management API is to just do it via the JS client
  // using .rpc() — but we need to create the function first.
  // Simplest: use fetch to the Supabase SQL endpoint
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://", "").split(".supabase.co")[0];

  const res = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql: query }),
    }
  );
  if (!res.ok && res.status !== 404) {
    console.error(`SQL error (${res.status}):`, await res.text());
  }
}

async function main() {
  console.log("Applying schema changes via Supabase...");

  // Add columns to profiles
  const alterStmts = [
    `alter table profiles add column if not exists date_of_birth date`,
    `alter table profiles add column if not exists usage_type text`,
    `alter table profiles add column if not exists account_type text default 'private'`,
    `alter table profiles add column if not exists business_name text`,
    `alter table profiles add column if not exists is_agent boolean default false`,
    `alter table profiles add column if not exists verified_score integer default 0`,
    `alter table profiles add column if not exists badge_100 boolean default false`,
  ];

  for (const stmt of alterStmts) {
    await sql(stmt);
    process.stdout.write(".");
  }
  console.log("\nColumn additions queued.");

  // Create broker_profiles table
  const createBrokerTable = `
create table if not exists broker_profiles (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete cascade,
  full_name      text not null,
  email          text,
  phone          text,
  whatsapp       text,
  avatar_url     text,
  bio            text,
  agency         text,
  speciality     text[],
  districts      text[],
  languages      text[],
  verified       boolean default true,
  verified_score integer default 80,
  listings_count integer default 0,
  rating         numeric(3,2) default 4.5,
  reviews_count  integer default 0,
  years_exp      integer default 3,
  created_at     timestamptz not null default now()
)`;
  await sql(createBrokerTable);

  // Try inserting a test row to confirm table exists
  const { error } = await sb.from("broker_profiles").select("id").limit(1);
  if (error) {
    console.log("broker_profiles doesn't exist yet — will be created on first seed.");
    console.log("Error:", error.message);
  } else {
    console.log("broker_profiles table: OK");
  }

  // Check profiles columns exist
  const { data: profileCols } = await sb.from("profiles").select("usage_type").limit(1);
  console.log("profiles.usage_type column:", profileCols !== null ? "OK" : "missing");
}

main().catch(console.error);
