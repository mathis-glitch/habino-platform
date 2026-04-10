-- ============================================================
-- PostGIS spatial index for properties
-- Enables fast ST_DWithin radius search (replaces client-side
-- bounding-box / Haversine filtering in the API layer)
-- ============================================================

-- 1. Enable PostGIS extension (idempotent)
create extension if not exists postgis;

-- 2. Add a geography column on properties
--    Using geography(Point, 4326) handles the Earth's curvature
--    correctly so ST_DWithin returns metres, not degrees.
alter table properties
  add column if not exists location geography(Point, 4326);

-- 3. Back-fill from existing lat/lng float columns
update properties
set location = ST_MakePoint(lng, lat)::geography
where lat is not null
  and lng is not null
  and location is null;

-- 4. GiST spatial index — required for ST_DWithin to be fast
create index if not exists properties_location_gist
  on properties using gist(location);

-- 5. Helper function: properties within X metres of a point
--    Usage: select * from properties_near(9.0054, 38.7636, 2000)
--    Returns all property columns, ordered by ascending distance
create or replace function properties_near(
  _lat   double precision,
  _lng   double precision,
  _m     double precision          -- radius in metres
)
returns setof properties
language sql
stable
as $$
  select p.*
  from   properties p
  where  p.location is not null
    and  ST_DWithin(
           p.location,
           ST_MakePoint(_lng, _lat)::geography,
           _m
         )
  order  by ST_Distance(p.location, ST_MakePoint(_lng, _lat)::geography);
$$;

-- 6. Keep location column in sync via trigger when lat/lng are updated
create or replace function sync_property_location()
returns trigger
language plpgsql
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := ST_MakePoint(new.lng, new.lat)::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_property_location on properties;

create trigger trg_sync_property_location
  before insert or update of lat, lng
  on properties
  for each row
  execute function sync_property_location();

-- 7. broker_profiles: place centroid per primary district
--    (brokers don't have exact coordinates — we store the centroid
--     of their first district so the API can do proximity matching)
alter table broker_profiles
  add column if not exists primary_location geography(Point, 4326);

create index if not exists broker_profiles_location_gist
  on broker_profiles using gist(primary_location);

-- Note: broker primary_location is set by the application when
-- broker_profiles.districts[1] is saved (using the district centroid
-- lookup table maintained by the API layer).
