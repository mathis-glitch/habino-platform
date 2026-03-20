-- Extend property_type check constraint to include new types
-- Adds: villa, office, hall, production, plot

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN (
    'apartment',
    'house',
    'commercial',
    'land',
    'villa',
    'office',
    'hall',
    'production',
    'plot'
  ));
