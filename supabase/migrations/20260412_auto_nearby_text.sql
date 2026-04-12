-- Auto-generate nearby_text for properties using PostGIS + POI table.
-- Called server-side when a property is created or its coordinates change.
-- Returns a human-readable string like:
--   "300m to Edna Mall · 600m to British School · 1.1km to Bole Roundabout"

CREATE OR REPLACE FUNCTION generate_property_nearby_text(
  p_property_id UUID,
  p_radius_m    DOUBLE PRECISION DEFAULT 2000,
  p_max_pois    INT              DEFAULT 8
)
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT string_agg(entry, ' · ' ORDER BY dist_m)
  FROM (
    SELECT DISTINCT ON (poi.category)
      CASE
        WHEN ST_Distance(prop.geom::geography, poi.geom::geography) < 100
          THEN '< 100m to ' || poi.name
        WHEN ST_Distance(prop.geom::geography, poi.geom::geography) < 1000
          THEN round(ST_Distance(prop.geom::geography, poi.geom::geography))::text || 'm to ' || poi.name
        ELSE
          round(ST_Distance(prop.geom::geography, poi.geom::geography) / 100.0) / 10 || 'km to ' || poi.name
      END AS entry,
      ST_Distance(prop.geom::geography, poi.geom::geography) AS dist_m
    FROM properties prop
    JOIN points_of_interest poi
      ON ST_DWithin(prop.geom::geography, poi.geom::geography, p_radius_m)
    WHERE prop.id   = p_property_id
      AND prop.geom IS NOT NULL
      AND poi.name  IS NOT NULL
    ORDER BY poi.category, dist_m ASC
    LIMIT p_max_pois
  ) sub;
$$;

GRANT EXECUTE ON FUNCTION generate_property_nearby_text TO service_role;

-- Convenience: bulk-populate nearby_text for all active properties that have
-- coordinates but no nearby_text yet. Run once after this migration.
-- UPDATE properties
-- SET nearby_text = generate_property_nearby_text(id)
-- WHERE status = 'active'
--   AND geom IS NOT NULL
--   AND (nearby_text IS NULL OR nearby_text = '');
