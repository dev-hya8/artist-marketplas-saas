-- Add creation_year column to artworks table
ALTER TABLE artworks 
ADD COLUMN creation_year INTEGER;

COMMENT ON COLUMN artworks.creation_year IS 'Year the artwork was created';