-- Migration 002: Add lat/lng coordinates to properties table
-- Required for viewport-based (bounding box) map queries

alter table properties
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Composite index for fast bounding-box queries:
-- WHERE tenant_id = X AND lat BETWEEN south AND north AND lng BETWEEN west AND east
create index if not exists properties_coords_idx
  on properties(tenant_id, lat, lng)
  where lat is not null and lng is not null;
