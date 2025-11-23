-- Add base_currency column to artworks table
ALTER TABLE artworks 
ADD COLUMN base_currency text DEFAULT 'USD';