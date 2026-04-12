-- ─────────────────────────────────────────────────────────────────────────────
-- Addis Ababa Market Data Seed
-- Realistic ETB-based price estimates for residential, commercial, and land
-- Resolves tenant_id dynamically — no hardcoded UUIDs
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Resolve first active tenant (adjust WHERE if multi-tenant)
  SELECT id INTO v_tenant_id FROM tenants WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'No active tenant found — skipping market data seed';
    RETURN;
  END IF;

  -- ── Clear existing Addis Ababa data to avoid duplicates ─────────────────
  DELETE FROM market_district_stats  WHERE tenant_id = v_tenant_id AND city = 'Addis Ababa';
  DELETE FROM market_price_trend     WHERE tenant_id = v_tenant_id AND city = 'Addis Ababa';
  DELETE FROM market_micro_scores    WHERE tenant_id = v_tenant_id AND city = 'Addis Ababa';

  -- ── 1. District stats (buy_price_sqm in ETB, rent_price_sqm in ETB/m²/mo) ─
  INSERT INTO market_district_stats
    (tenant_id, city, district, usage_type, buy_price_sqm, rent_price_sqm, gross_yield, trend_pct, trend_up)
  VALUES
    -- Residential
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 28000, 95,  4.1,  3.2, true),
    (v_tenant_id, 'Addis Ababa', 'Bole',          'residential', 48000, 160, 4.0,  5.1, true),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis',     'residential', 38000, 130, 4.1,  4.3, true),
    (v_tenant_id, 'Addis Ababa', 'CMC',           'residential', 25000,  85, 4.1,  2.8, true),
    (v_tenant_id, 'Addis Ababa', 'Sarbet',        'residential', 32000, 110, 4.1,  3.5, true),
    (v_tenant_id, 'Addis Ababa', 'Gerji',         'residential', 22000,  75, 4.1,  2.1, true),
    (v_tenant_id, 'Addis Ababa', 'Ayat',          'residential', 18000,  60, 4.0,  1.5, true),
    (v_tenant_id, 'Addis Ababa', 'Summit',        'residential', 30000, 100, 4.0,  3.0, true),
    (v_tenant_id, 'Addis Ababa', 'Megenagna',     'residential', 35000, 115, 3.9,  3.8, true),
    (v_tenant_id, 'Addis Ababa', 'Piassa',        'residential', 20000,  68, 4.1,  0.8, true),
    (v_tenant_id, 'Addis Ababa', 'Lideta',        'residential', 22000,  72, 3.9,  1.2, true),
    (v_tenant_id, 'Addis Ababa', 'Kolfe',         'residential', 15000,  50, 4.0,  0.5, true),
    (v_tenant_id, 'Addis Ababa', 'Yeka',          'residential', 24000,  80, 4.0,  2.5, true),
    (v_tenant_id, 'Addis Ababa', 'Kirkos',        'residential', 26000,  88, 4.1,  2.2, true),
    (v_tenant_id, 'Addis Ababa', 'Gulele',        'residential', 16000,  52, 3.9,  0.4, true),
    -- Commercial
    (v_tenant_id, 'Addis Ababa', 'All districts', 'commercial',  55000, 200, 4.4,  4.5, true),
    (v_tenant_id, 'Addis Ababa', 'Bole',          'commercial',  90000, 350, 4.7,  6.2, true),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis',     'commercial',  75000, 290, 4.6,  5.0, true),
    (v_tenant_id, 'Addis Ababa', 'Piassa',        'commercial',  40000, 150, 4.5,  1.0, true),
    -- Land
    (v_tenant_id, 'Addis Ababa', 'All districts', 'land',        12000, null, null, 6.0, true),
    (v_tenant_id, 'Addis Ababa', 'Bole',          'land',        25000, null, null, 7.5, true),
    (v_tenant_id, 'Addis Ababa', 'Ayat',          'land',         7000, null, null, 4.5, true),
    (v_tenant_id, 'Addis Ababa', 'Yeka',          'land',         9000, null, null, 5.2, true);

  -- ── 2. 12-month price trend — Addis Ababa all districts, residential ────────
  INSERT INTO market_price_trend
    (tenant_id, city, district, usage_type, month, month_order, buy_price_sqm, rent_price_sqm)
  VALUES
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Apr',  1, 24800, 85),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'May',  2, 25100, 86),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Jun',  3, 25400, 87),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Jul',  4, 25800, 88),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Aug',  5, 26100, 89),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Sep',  6, 26400, 90),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Oct',  7, 26700, 91),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Nov',  8, 27000, 92),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Dec',  9, 27300, 93),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Jan', 10, 27600, 93),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Feb', 11, 27800, 94),
    (v_tenant_id, 'Addis Ababa', 'All districts', 'residential', 'Mar', 12, 28000, 95);

  -- Bole trend (premium segment)
  INSERT INTO market_price_trend
    (tenant_id, city, district, usage_type, month, month_order, buy_price_sqm, rent_price_sqm)
  VALUES
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Apr',  1, 42000, 142),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'May',  2, 42800, 145),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Jun',  3, 43500, 148),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Jul',  4, 44000, 150),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Aug',  5, 44800, 152),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Sep',  6, 45500, 154),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Oct',  7, 46000, 156),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Nov',  8, 46500, 157),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Dec',  9, 47000, 158),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Jan', 10, 47200, 159),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Feb', 11, 47600, 159),
    (v_tenant_id, 'Addis Ababa', 'Bole', 'residential', 'Mar', 12, 48000, 160);

  -- ── 3. Micro-location scores per district ───────────────────────────────────
  INSERT INTO market_micro_scores (tenant_id, city, district, factor, score, icon)
  VALUES
    -- Bole (premium, best connectivity)
    (v_tenant_id, 'Addis Ababa', 'Bole',      'Public Transport', 90, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Bole',      'Amenities',        96, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Bole',      'Green Space',      72, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Bole',      'Schools',          88, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Bole',      'Noise Level',      60, '🔇'),
    -- Kazanchis (CBD, loud but central)
    (v_tenant_id, 'Addis Ababa', 'Kazanchis', 'Public Transport', 88, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis', 'Amenities',        90, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis', 'Green Space',      50, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis', 'Schools',          80, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Kazanchis', 'Noise Level',      45, '🔇'),
    -- CMC (residential, quieter)
    (v_tenant_id, 'Addis Ababa', 'CMC',       'Public Transport', 70, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'CMC',       'Amenities',        75, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'CMC',       'Green Space',      80, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'CMC',       'Schools',          85, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'CMC',       'Noise Level',      78, '🔇'),
    -- Sarbet
    (v_tenant_id, 'Addis Ababa', 'Sarbet',    'Public Transport', 75, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Sarbet',    'Amenities',        80, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Sarbet',    'Green Space',      70, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Sarbet',    'Schools',          82, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Sarbet',    'Noise Level',      72, '🔇'),
    -- Ayat (affordable, suburban)
    (v_tenant_id, 'Addis Ababa', 'Ayat',      'Public Transport', 55, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Ayat',      'Amenities',        60, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Ayat',      'Green Space',      85, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Ayat',      'Schools',          65, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Ayat',      'Noise Level',      88, '🔇'),
    -- Megenagna
    (v_tenant_id, 'Addis Ababa', 'Megenagna', 'Public Transport', 82, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Megenagna', 'Amenities',        85, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Megenagna', 'Green Space',      68, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Megenagna', 'Schools',          78, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Megenagna', 'Noise Level',      58, '🔇'),
    -- Yeka
    (v_tenant_id, 'Addis Ababa', 'Yeka',      'Public Transport', 65, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Yeka',      'Amenities',        70, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Yeka',      'Green Space',      82, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Yeka',      'Schools',          75, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Yeka',      'Noise Level',      80, '🔇'),
    -- Piassa (historic, busy)
    (v_tenant_id, 'Addis Ababa', 'Piassa',    'Public Transport', 85, '🚌'),
    (v_tenant_id, 'Addis Ababa', 'Piassa',    'Amenities',        88, '🏪'),
    (v_tenant_id, 'Addis Ababa', 'Piassa',    'Green Space',      40, '🌳'),
    (v_tenant_id, 'Addis Ababa', 'Piassa',    'Schools',          70, '🏫'),
    (v_tenant_id, 'Addis Ababa', 'Piassa',    'Noise Level',      35, '🔇');

  RAISE NOTICE 'Addis Ababa market data seeded for tenant %', v_tenant_id;
END;
$$;
