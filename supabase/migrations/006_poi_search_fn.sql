-- ── 006_poi_search_fn.sql — Proximity-based property search ──────────────────
-- Provides fast ST_DWithin queries for the AI chat and API.
-- Requires migrations 004 (PostGIS) and 005 (POI table).

-- ── 1. Find properties near any POI of given type ─────────────────────────────
-- Returns property rows within `radius_m` metres of at least one matching POI.
-- Called by /api/chat when user specifies proximity constraints.
CREATE OR REPLACE FUNCTION find_properties_near_poi(
  p_tenant_id    UUID,
  p_poi_type     TEXT,               -- 'school' | 'hospital' | 'park' | ...
  p_radius_m     DOUBLE PRECISION,   -- search radius in metres
  p_city         TEXT    DEFAULT NULL,
  p_country      TEXT    DEFAULT NULL,
  p_listing_type TEXT    DEFAULT NULL,
  p_property_type TEXT   DEFAULT NULL,
  p_max_price    NUMERIC DEFAULT NULL,
  p_min_price    NUMERIC DEFAULT NULL,
  p_min_bedrooms INT     DEFAULT NULL,
  p_lim          INT     DEFAULT 20
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  price          NUMERIC,
  currency       TEXT,
  city           TEXT,
  neighbourhood  TEXT,
  address        TEXT,
  property_type  TEXT,
  listing_type   TEXT,
  bedrooms       INT,
  bathrooms      INT,
  area_sqm       NUMERIC,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  -- Distance to nearest matching POI (metres)
  nearest_poi_name TEXT,
  nearest_poi_dist_m DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id, p.title, p.price, p.currency,
    p.city, p.neighbourhood, p.address,
    p.property_type, p.listing_type,
    p.bedrooms, p.bathrooms, p.area_sqm,
    p.lat, p.lng,
    -- nearest POI details (lateral join)
    np.name  AS nearest_poi_name,
    ST_Distance(p.geom::geography, np.geom::geography) AS nearest_poi_dist_m
  FROM properties p
  -- Nearest matching POI for each property
  JOIN LATERAL (
    SELECT poi.name, poi.geom
    FROM points_of_interest poi
    WHERE poi.type = p_poi_type
      AND (p_city    IS NULL OR lower(poi.city)    LIKE '%' || lower(p_city)    || '%')
      AND (p_country IS NULL OR poi.country = p_country)
      AND ST_DWithin(p.geom::geography, poi.geom::geography, p_radius_m)
    ORDER BY p.geom <-> poi.geom
    LIMIT 1
  ) np ON true
  WHERE p.tenant_id = p_tenant_id
    AND p.status    = 'active'
    AND p.geom IS NOT NULL
    AND (p_listing_type  IS NULL OR p.listing_type  = p_listing_type)
    AND (p_property_type IS NULL OR p.property_type = p_property_type)
    AND (p_max_price     IS NULL OR p.price <= p_max_price)
    AND (p_min_price     IS NULL OR p.price >= p_min_price)
    AND (p_min_bedrooms  IS NULL OR p.bedrooms >= p_min_bedrooms)
    AND (p_city          IS NULL OR lower(p.city) LIKE '%' || lower(p_city) || '%')
  ORDER BY nearest_poi_dist_m ASC
  LIMIT p_lim;
$$;

-- ── 2. POI summary for a single property ─────────────────────────────────────
-- Returns the nearest POI of each category within `radius_m` metres.
-- Used by property detail page to show "500m to school", "1.2km to metro" etc.
CREATE OR REPLACE FUNCTION get_property_poi_summary(
  p_property_id UUID,
  p_radius_m    DOUBLE PRECISION DEFAULT 2000
)
RETURNS TABLE (
  category      TEXT,
  poi_type      TEXT,
  poi_name      TEXT,
  dist_m        DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT ON (poi.category)
    poi.category,
    poi.type,
    poi.name,
    ST_Distance(p.geom::geography, poi.geom::geography) AS dist_m
  FROM properties p
  JOIN points_of_interest poi
    ON ST_DWithin(p.geom::geography, poi.geom::geography, p_radius_m)
  WHERE p.id = p_property_id
    AND p.geom IS NOT NULL
  ORDER BY poi.category, dist_m ASC;
$$;

-- Grant anon + service_role access (Supabase default roles)
GRANT EXECUTE ON FUNCTION find_properties_near_poi TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_property_poi_summary  TO anon, authenticated, service_role;
