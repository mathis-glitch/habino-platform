-- ══════════════════════════════════════════════════════════════
-- Search optimizations: indexes, city-aware semantic, multi-POI
-- ══════════════════════════════════════════════════════════════

-- ── #1: Neighbourhood + city indexes ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_neighbourhood
  ON properties(neighbourhood);

CREATE INDEX IF NOT EXISTS idx_properties_city_neighbourhood
  ON properties(city, neighbourhood);

CREATE INDEX IF NOT EXISTS idx_properties_city_type_status
  ON properties(city, property_type, status);

-- ── #5: City-aware semantic search RPC ───────────────────────
-- Replaces the original search_properties_semantic to add optional city filter.
CREATE OR REPLACE FUNCTION search_properties_semantic(
  query_embedding  vector(1536),
  tenant_id_filter uuid,
  match_count      int     default 30,
  threshold        float   default 0.35,
  city_filter      text    default null
)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM properties p
  WHERE
    p.tenant_id = tenant_id_filter
    AND p.status  = 'active'
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > threshold
    AND (city_filter IS NULL OR p.city = city_filter)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── #4: Multi-POI proximity search ──────────────────────────
-- Finds properties near ANY of the specified POI types.
-- Accepts an array of poi types and finds nearest of any type.
CREATE OR REPLACE FUNCTION find_properties_near_pois(
  p_tenant_id     UUID,
  p_poi_types     TEXT[],              -- array: {'school','park','bus_station'}
  p_radius_m      DOUBLE PRECISION,
  p_city          TEXT    DEFAULT NULL,
  p_country       TEXT    DEFAULT NULL,
  p_listing_type  TEXT    DEFAULT NULL,
  p_property_type TEXT    DEFAULT NULL,
  p_max_price     NUMERIC DEFAULT NULL,
  p_min_price     NUMERIC DEFAULT NULL,
  p_min_bedrooms  INT     DEFAULT NULL,
  p_lim           INT     DEFAULT 20
)
RETURNS TABLE (
  id               UUID,
  title            TEXT,
  price            NUMERIC,
  currency         TEXT,
  city             TEXT,
  neighbourhood    TEXT,
  address          TEXT,
  property_type    TEXT,
  listing_type     TEXT,
  bedrooms         INT,
  bathrooms        INT,
  area_sqm         NUMERIC,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  nearest_poi_name TEXT,
  nearest_poi_type TEXT,
  nearest_poi_dist_m DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id, p.title, p.price, p.currency,
    p.city, p.neighbourhood, p.address,
    p.property_type, p.listing_type,
    p.bedrooms, p.bathrooms, p.area_sqm,
    p.lat, p.lng,
    np.name  AS nearest_poi_name,
    np.type  AS nearest_poi_type,
    ST_Distance(p.geom::geography, np.geom::geography) AS nearest_poi_dist_m
  FROM properties p
  JOIN LATERAL (
    SELECT poi.name, poi.type, poi.geom
    FROM points_of_interest poi
    WHERE poi.type = ANY(p_poi_types)
      AND (p_city    IS NULL OR lower(poi.city) LIKE '%' || lower(p_city) || '%')
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

GRANT EXECUTE ON FUNCTION find_properties_near_pois TO anon, authenticated, service_role;
