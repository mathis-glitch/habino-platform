-- ─────────────────────────────────────────────────────────────────────────────
-- 007_rebuild_city_counts.sql
--
-- Rebuilds city_listing_counts from actual properties data.
-- Run this when the cluster bubbles show incorrect counts (e.g. all showing 65).
-- Safe to run multiple times (uses ON CONFLICT DO UPDATE).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO city_listing_counts (tenant_id, city, country, lat, lng, listing_count)
SELECT
  p.tenant_id,
  p.city,
  -- Use the country from the existing city_listing_counts row if it exists,
  -- otherwise fall back to the city name (properties table has no country column).
  COALESCE(
    (SELECT clc.country FROM city_listing_counts clc
     WHERE clc.tenant_id = p.tenant_id AND clc.city = p.city LIMIT 1),
    p.city   -- last-resort placeholder
  )                       AS country,
  AVG(p.lat)              AS lat,
  AVG(p.lng)              AS lng,
  COUNT(*)                AS listing_count
FROM properties p
WHERE p.status = 'active'
  AND p.lat IS NOT NULL
  AND p.lng IS NOT NULL
GROUP BY p.tenant_id, p.city
ON CONFLICT (tenant_id, city, country)
DO UPDATE SET
  listing_count = EXCLUDED.listing_count,
  lat           = EXCLUDED.lat,
  lng           = EXCLUDED.lng;
