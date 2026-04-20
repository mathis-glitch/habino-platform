-- ══════════════════════════════════════════════════════════════
-- Multi-market: cities + districts tables
-- ══════════════════════════════════════════════════════════════

-- ── Cities ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  country       TEXT NOT NULL,
  country_code  TEXT NOT NULL,
  currency      TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  zoom          INT NOT NULL DEFAULT 13,
  bounds_sw     DOUBLE PRECISION[] NOT NULL,  -- [south_lat, west_lng]
  bounds_ne     DOUBLE PRECISION[] NOT NULL,  -- [north_lat, east_lng]
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_cities_tenant ON cities(tenant_id);
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cities" ON cities FOR SELECT USING (is_active = true);
CREATE POLICY "service role manage cities" ON cities FOR ALL
  USING (true) WITH CHECK (true);

-- ── Districts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id       UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  aliases       TEXT[] DEFAULT '{}',
  is_major      BOOLEAN DEFAULT false,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (city_id, name)
);

CREATE INDEX idx_districts_city ON districts(city_id);
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "service role manage districts" ON districts FOR ALL
  USING (true) WITH CHECK (true);

-- ── Add city_id reference to properties (optional, for direct lookups) ──
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id);
