-- ─────────────────────────────────────────────────────────────────────────────
-- Habino Market Data Tables
-- Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. District statistics (one row per city / district / usage / snapshot) ──
CREATE TABLE IF NOT EXISTS market_district_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  city            text NOT NULL,           -- e.g. "Hamburg"
  district        text NOT NULL,           -- e.g. "Eimsbüttel" | "All districts"
  usage_type      text NOT NULL            -- "residential" | "commercial" | "land"
                  CHECK (usage_type IN ('residential', 'commercial', 'land')),

  buy_price_sqm   numeric(10,2),           -- avg sale price per m²
  rent_price_sqm  numeric(8,2),            -- avg rent per m² (null for land)
  gross_yield     numeric(5,2),            -- e.g. 3.7 (percent)
  trend_pct       numeric(5,2),            -- month-over-month % change
  trend_up        boolean DEFAULT true,

  recorded_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mds_tenant_city_district
  ON market_district_stats (tenant_id, city, district, usage_type, recorded_at DESC);


-- ── 2. Price trend (12-month series per city / district / usage) ─────────────
CREATE TABLE IF NOT EXISTS market_price_trend (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  city            text NOT NULL,
  district        text NOT NULL DEFAULT 'All districts',
  usage_type      text NOT NULL
                  CHECK (usage_type IN ('residential', 'commercial', 'land')),

  month           text NOT NULL,           -- e.g. "Jan", "Feb", ...
  month_order     int  NOT NULL,           -- 1–12 for sorting
  buy_price_sqm   numeric(10,2),
  rent_price_sqm  numeric(8,2),

  recorded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mpt_tenant_city
  ON market_price_trend (tenant_id, city, district, usage_type, month_order);


-- ── 3. Micro-location scores per city / district ──────────────────────────────
CREATE TABLE IF NOT EXISTS market_micro_scores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  city       text NOT NULL,
  district   text NOT NULL,
  factor     text NOT NULL,   -- "Public Transport" | "Amenities" | "Green Space" | "Schools" | "Noise Level"
  score      int  NOT NULL CHECK (score BETWEEN 0 AND 100),
  icon       text,            -- emoji, optional

  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mms_tenant_city_district
  ON market_micro_scores (tenant_id, city, district);


-- ── Enable Row Level Security ─────────────────────────────────────────────────
ALTER TABLE market_district_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_price_trend     ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_micro_scores    ENABLE ROW LEVEL SECURITY;

-- Public read (market data is not sensitive)
CREATE POLICY "public read market_district_stats"
  ON market_district_stats FOR SELECT USING (true);

CREATE POLICY "public read market_price_trend"
  ON market_price_trend FOR SELECT USING (true);

CREATE POLICY "public read market_micro_scores"
  ON market_micro_scores FOR SELECT USING (true);

-- Only service role can insert/update (via API)
-- (No INSERT policy needed for anon/authenticated — done via service client in API)


-- ─────────────────────────────────────────────────────────────────────────────
-- SAMPLE DATA — Hamburg, residential
-- Delete or replace once real GIS data is connected
-- ─────────────────────────────────────────────────────────────────────────────

-- Replace YOUR_TENANT_ID with your actual tenant UUID from the tenants table
-- SELECT id FROM tenants LIMIT 1;

/*

INSERT INTO market_district_stats (tenant_id, city, district, usage_type, buy_price_sqm, rent_price_sqm, gross_yield, trend_pct, trend_up) VALUES
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts',           'residential', 4720, 16.30, 3.7,  2.8,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'City Centre / HafenCity', 'residential', 6200, 18.50, 3.6,  4.1,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'Altona',                  'residential', 5800, 17.20, 3.5,  3.2,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel',              'residential', 5500, 16.80, 3.7,  2.9,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'Hamburg-Nord',            'residential', 5100, 15.60, 3.7,  1.8,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'Wandsbek',                'residential', 4200, 13.40, 3.8,  0.9,  true),
  ('YOUR_TENANT_ID', 'Hamburg', 'Harburg',                 'residential', 3200, 11.00, 4.1, -0.4, false);

INSERT INTO market_price_trend (tenant_id, city, district, usage_type, month, month_order, buy_price_sqm, rent_price_sqm) VALUES
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Apr', 1, 4520, 15.80),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'May', 2, 4540, 15.90),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Jun', 3, 4560, 15.95),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Jul', 4, 4590, 16.00),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Aug', 5, 4610, 16.05),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Sep', 6, 4630, 16.10),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Oct', 7, 4650, 16.15),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Nov', 8, 4670, 16.20),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Dec', 9, 4680, 16.22),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Jan',10, 4690, 16.25),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Feb',11, 4705, 16.28),
  ('YOUR_TENANT_ID', 'Hamburg', 'All districts', 'residential', 'Mar',12, 4720, 16.30);

INSERT INTO market_micro_scores (tenant_id, city, district, factor, score, icon) VALUES
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel', 'Public Transport', 88, '🚇'),
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel', 'Amenities',        92, '🏪'),
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel', 'Green Space',      90, '🌳'),
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel', 'Schools',          94, '🏫'),
  ('YOUR_TENANT_ID', 'Hamburg', 'Eimsbüttel', 'Noise Level',      88, '🔇');

*/
