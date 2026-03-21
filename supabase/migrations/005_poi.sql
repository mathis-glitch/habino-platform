-- ── 005_poi.sql — Points of Interest (OpenStreetMap data) ────────────────────
-- Run in Supabase SQL Editor (paste content, not filename).
-- Requires PostGIS (migration 004 must have been applied first).

-- ── 1. POI table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS points_of_interest (
  id          BIGSERIAL PRIMARY KEY,
  osm_id      BIGINT,                    -- OpenStreetMap node/way/relation id
  osm_type    TEXT,                      -- 'node' | 'way' | 'relation'
  name        TEXT,
  type        TEXT        NOT NULL,      -- 'school' | 'hospital' | 'park' | ...
  category    TEXT        NOT NULL,      -- 'education' | 'health' | 'transport' | 'leisure' | 'food' | 'services'
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  geom        GEOMETRY(Point, 4326)
                GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326))
                STORED,
  country     TEXT,
  city        TEXT,
  metadata    JSONB,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (osm_id, osm_type)             -- deduplicate OSM objects
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_poi_geom     ON points_of_interest USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_poi_type     ON points_of_interest (type);
CREATE INDEX IF NOT EXISTS idx_poi_country  ON points_of_interest (country, type);
CREATE INDEX IF NOT EXISTS idx_poi_city     ON points_of_interest (city, type);

-- ── 3. RLS — public read, no write ───────────────────────────────────────────
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read poi" ON points_of_interest FOR SELECT USING (true);

-- ── 4. Import progress tracker (for resumable script) ─────────────────────────
CREATE TABLE IF NOT EXISTS poi_import_log (
  id          SERIAL PRIMARY KEY,
  city        TEXT NOT NULL,
  country     TEXT NOT NULL,
  poi_type    TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  count       INT  DEFAULT 0,
  UNIQUE (city, country, poi_type)
);
