-- Add unique handle column to artist_settings for public profile URLs
ALTER TABLE public.artist_settings 
ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;

-- Create index for fast handle lookups
CREATE INDEX IF NOT EXISTS idx_artist_settings_handle ON public.artist_settings(handle);

-- Add constraint: handle must be lowercase, alphanumeric with hyphens, 3-30 chars
ALTER TABLE public.artist_settings
ADD CONSTRAINT handle_format_check 
CHECK (handle IS NULL OR (handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'));

-- Create function to check handle availability
CREATE OR REPLACE FUNCTION public.check_handle_available(check_handle TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.artist_settings
    WHERE handle = lower(check_handle)
  )
$$;