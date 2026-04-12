-- Add all property detail columns collected by the mobile listing form.
-- Uses IF NOT EXISTS so this is safe to re-run.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS furnished        text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS condition        text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS amenities        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parking          integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS floor            integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS year_built       integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_type      text    DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS negotiable       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit          text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lease_term       text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utilities_included boolean DEFAULT false;
