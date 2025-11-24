-- Add inquiry_type column to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN inquiry_type TEXT;

-- Add a check constraint to ensure only valid inquiry types
ALTER TABLE public.inquiries
ADD CONSTRAINT inquiry_type_check 
CHECK (inquiry_type IN ('Commission', 'Purchase Inquiry', 'Collaboration', 'Other'));

-- Set a default value for existing records
UPDATE public.inquiries 
SET inquiry_type = 'Other' 
WHERE inquiry_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.inquiries 
ALTER COLUMN inquiry_type SET NOT NULL;

-- Set default for new records
ALTER TABLE public.inquiries 
ALTER COLUMN inquiry_type SET DEFAULT 'Other';