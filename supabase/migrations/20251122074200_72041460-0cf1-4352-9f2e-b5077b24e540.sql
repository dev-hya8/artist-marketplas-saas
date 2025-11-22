-- Create artist_settings table (single row table)
CREATE TABLE public.artist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Hya Baliña',
  contact_email TEXT,
  currency_region TEXT DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on artist_settings
ALTER TABLE public.artist_settings ENABLE ROW LEVEL SECURITY;

-- Admin can update artist_settings
CREATE POLICY "Admins can manage artist settings"
ON public.artist_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read artist_settings
CREATE POLICY "Public can view artist settings"
ON public.artist_settings
FOR SELECT
USING (true);

-- Insert default artist settings row
INSERT INTO public.artist_settings (display_name, contact_email, currency_region)
VALUES ('Hya Baliña', NULL, 'US');

-- Create inquiries table
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can create inquiries
CREATE POLICY "Anyone can create inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (true);

-- Add auction columns to artworks table
ALTER TABLE public.artworks 
ADD COLUMN sale_type TEXT DEFAULT 'fixed' CHECK (sale_type IN ('fixed', 'auction')),
ADD COLUMN auction_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN current_bid NUMERIC,
ADD COLUMN min_bid_increment NUMERIC DEFAULT 100,
ADD COLUMN bid_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN winner_name TEXT;

-- Trigger for updating artist_settings updated_at
CREATE TRIGGER update_artist_settings_updated_at
BEFORE UPDATE ON public.artist_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();