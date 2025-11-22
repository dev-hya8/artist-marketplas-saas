-- Create artwork_gallery table for multiple photos per artwork
CREATE TABLE public.artwork_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_artwork_gallery_image UNIQUE (artwork_id, image_url)
);

-- Enable RLS
ALTER TABLE public.artwork_gallery ENABLE ROW LEVEL SECURITY;

-- Admins can manage gallery images
CREATE POLICY "Admins can manage artwork gallery"
ON public.artwork_gallery
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view gallery images
CREATE POLICY "Public can view artwork gallery"
ON public.artwork_gallery
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_artwork_gallery_artwork_id ON public.artwork_gallery(artwork_id);