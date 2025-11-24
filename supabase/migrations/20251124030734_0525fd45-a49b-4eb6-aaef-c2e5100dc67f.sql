-- Add description column to artworks table for storing artwork meaning/story
ALTER TABLE public.artworks 
ADD COLUMN IF NOT EXISTS description TEXT;