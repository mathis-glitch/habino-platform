-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003 — City listing-count summary table
--
-- Purpose: pre-aggregated city layer for the map cluster view.
-- At zoom < 8 the frontend queries this table (~1 500 rows) instead of
-- scanning 1M property rows — loads in < 50 ms vs 1–2 s.
--
-- The seed script (re-)populates this table after every seed run.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS city_listing_counts (
  id            SERIAL          PRIMARY KEY,
  tenant_id     UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  city          TEXT            NOT NULL,
  country       TEXT            NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  listing_count INT             NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, city, country)
);

-- Fast lookup by tenant (used by /api/map/cities)
CREATE INDEX IF NOT EXISTS idx_city_listing_counts_tenant
  ON city_listing_counts(tenant_id);

-- RLS: read-only for all authenticated users, write restricted to service role
ALTER TABLE city_listing_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read city clusters"
  ON city_listing_counts FOR SELECT
  USING (true);
