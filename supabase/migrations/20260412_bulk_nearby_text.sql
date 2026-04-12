-- Bulk nearby_text updater — callable from service role to avoid slow sequential loops
CREATE OR REPLACE FUNCTION bulk_update_nearby_text()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE properties p
  SET nearby_text = (
    SELECT string_agg(entry, ' · ' ORDER BY dist_m)
    FROM (
      SELECT DISTINCT ON (poi.category)
        CASE
          WHEN ST_Distance(p.geom::geography, poi.geom::geography) < 100
            THEN '< 100m to ' || poi.name
          WHEN ST_Distance(p.geom::geography, poi.geom::geography) < 1000
            THEN round(ST_Distance(p.geom::geography, poi.geom::geography))::text || 'm to ' || poi.name
          ELSE
            round(ST_Distance(p.geom::geography, poi.geom::geography) / 100.0) / 10 || 'km to ' || poi.name
        END AS entry,
        ST_Distance(p.geom::geography, poi.geom::geography) AS dist_m
      FROM points_of_interest poi
      WHERE ST_DWithin(p.geom::geography, poi.geom::geography, 2000)
        AND poi.name IS NOT NULL
      ORDER BY poi.category, dist_m ASC
      LIMIT 8
    ) sub
  )
  WHERE p.status = 'active'
    AND p.geom IS NOT NULL
    AND (p.nearby_text IS NULL OR p.nearby_text = '');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION bulk_update_nearby_text TO service_role;
