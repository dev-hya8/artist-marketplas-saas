-- Add bio fields to artist_settings
ALTER TABLE artist_settings 
ADD COLUMN bio_text text,
ADD COLUMN bio_image_url text,
ADD COLUMN measurement_unit text DEFAULT 'in';

-- Add depth column to artworks
ALTER TABLE artworks
ADD COLUMN depth numeric;