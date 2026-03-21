-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004 — PostGIS spatial index
--
-- Run this AFTER enabling the PostGIS extension in Supabase:
--   Dashboard → Database → Extensions → postgis → Enable
--
-- Then paste this entire file into the Supabase SQL Editor and run it.
--
-- What this does:
--   1. Adds a generated `geom` column (Point geometry derived from lat/lng)
--   2. Builds a GiST spatial index on it — bbox queries become 5–10× faster
--   3. Populates geom for any existing rows that have lat/lng
--
-- After this migration is applied, the API auto-detects PostGIS and switches
-- to the faster st_intersects path on the next bbox request. No code deploy needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enable the extension (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geom as a stored generated column (auto-computed from lat/lng)
--    The GENERATED ALWAYS AS syntax keeps geom in sync with lat/lng automatically.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (
      CASE
        WHEN lat IS NOT NULL AND lng IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)
      END
    ) STORED;

-- 3. GiST spatial index — used by st_intersects queries
--    This is the index that makes bbox map queries fast.
-- GiST only supports geometry columns — UUID can't be part of a GiST index.
-- The existing B-tree index on tenant_id handles tenant filtering; PostGIS
-- uses geom_gist for the spatial bbox lookup and Postgres combines both.
CREATE INDEX IF NOT EXISTS properties_geom_gist
  ON properties USING GIST (geom)
  WHERE geom IS NOT NULL;

-- Done. The API will automatically detect and use PostGIS on next request.
-- You can verify it's working by checking the `_postgis: true` field in
-- any /api/properties?bbox=... response.
