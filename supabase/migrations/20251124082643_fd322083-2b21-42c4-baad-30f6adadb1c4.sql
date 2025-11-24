-- Fix security issue: Enable RLS on artist_settings table
-- This table has policies defined but RLS is disabled
ALTER TABLE public.artist_settings ENABLE ROW LEVEL SECURITY;

-- Fix security issue: Enable RLS on artwork_gallery table
-- This table has policies defined but RLS is disabled
ALTER TABLE public.artwork_gallery ENABLE ROW LEVEL SECURITY;