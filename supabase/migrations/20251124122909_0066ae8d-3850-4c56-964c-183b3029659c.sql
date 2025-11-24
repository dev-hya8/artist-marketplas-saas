-- Add new columns to artist_settings for About page content
ALTER TABLE public.artist_settings 
ADD COLUMN artist_bio TEXT,
ADD COLUMN artist_statement TEXT,
ADD COLUMN elevator_pitch TEXT;

-- Create studio_photos table for the "In The Studio" gallery
CREATE TABLE public.studio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on studio_photos
ALTER TABLE public.studio_photos ENABLE ROW LEVEL SECURITY;

-- Allow public to view studio photos
CREATE POLICY "Public can view studio photos"
ON public.studio_photos
FOR SELECT
USING (true);

-- Allow admins to manage studio photos
CREATE POLICY "Admins can manage studio photos"
ON public.studio_photos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for ordering
CREATE INDEX idx_studio_photos_display_order ON public.studio_photos(display_order);

-- Add index for featured photos
CREATE INDEX idx_studio_photos_is_featured ON public.studio_photos(is_featured) WHERE is_featured = true;