-- Add upcoming_events column to artist_settings table
ALTER TABLE public.artist_settings 
ADD COLUMN IF NOT EXISTS upcoming_events text;