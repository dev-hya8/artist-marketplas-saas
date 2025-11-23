-- Add dimension_unit column to artworks table
ALTER TABLE public.artworks 
ADD COLUMN IF NOT EXISTS dimension_unit text DEFAULT 'in';

-- Add check constraint to ensure valid units
ALTER TABLE public.artworks
ADD CONSTRAINT valid_dimension_unit 
CHECK (dimension_unit IN ('cm', 'in', 'ft'));