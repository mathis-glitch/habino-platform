-- Video support: add video_url to properties and media_type to property_images
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
-- media_type: 'image' or 'video'
