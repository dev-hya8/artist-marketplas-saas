-- Add payment settings fields to artist_settings table
ALTER TABLE public.artist_settings 
ADD COLUMN IF NOT EXISTS payment_platform TEXT,
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;