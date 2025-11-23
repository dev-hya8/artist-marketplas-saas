-- Add tiktok_handle field to artist_settings table
ALTER TABLE artist_settings 
ADD COLUMN IF NOT EXISTS tiktok_handle text;