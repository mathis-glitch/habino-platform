-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004 — PostGIS spatial extension  (OPTIONAL — run when ready)
--
-- Why:
--   PostGIS replaces the plain FLOAT lat/lng B-tree index with a proper
--   GiST spatial index.  Viewport bbox queries use ST_MakeEnvelope + &&
--   which is ~5–10× faster on large tables than gte/lte range scans.
--
-- How to enable in Supabase:
--   1. Dashboard → Extensions → Enable "postgis"
--   2. Then run this migration in the SQL Editor.
--
-- After enabling, update app/api/properties/route.ts:
--   Replace:  .gte("lat", south).lte("lat", north).gte("lng", west).lte("lng", east)
--   With RPC: .rpc("properties_in_bbox", { south, west, north, east, p_tenant: tenantId })
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enable PostGIS (may already be enabled on your Supabase project)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geometry column (stored alongside lat/lng for backward compat)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (
      CASE WHEN lat IS NOT NULL AND lng IS NOT NULL
           THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)
      END
    ) STORED;

-- 3. GiST spatial index — used by ST_MakeEnvelope && bbox queries
CREATE INDEX IF NOT EXISTS properties_geom_gist
  ON properties USING GIST (geom)
  WHERE geom IS NOT NULL;

-- 4. RPC helper for bbox lookup (called from the API instead of gte/lte)
CREATE OR REPLACE FUNCTION properties_in_bbox(
  p_tenant UUID,
  south    FLOAT,
  west     FLOAT,
  north    FLOAT,
  east     FLOAT,
  lim      INT DEFAULT 500
)
RETURNS SETOF properties
LANGUAGE sql STABLE AS $$
  SELECT *
  FROM   properties
  WHERE  tenant_id = p_tenant
    AND  status    = 'active'
    AND  geom      IS NOT NULL
    AND  geom && ST_MakeEnvelope(west, south, east, north, 4326)
  ORDER BY created_at DESC
  LIMIT lim;
$$;
