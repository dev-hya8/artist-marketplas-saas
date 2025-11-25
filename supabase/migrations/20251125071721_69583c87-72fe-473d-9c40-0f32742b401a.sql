-- Add user_id columns to enforce multi-tenant ownership
-- Step 1: Add user_id to artist_settings table
ALTER TABLE public.artist_settings
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add user_id to artworks table
ALTER TABLE public.artworks
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create indexes for performance
CREATE INDEX idx_artist_settings_user_id ON public.artist_settings(user_id);
CREATE INDEX idx_artworks_user_id ON public.artworks(user_id);

-- Step 4: Add unique constraint to artist_settings (one settings record per user)
ALTER TABLE public.artist_settings
ADD CONSTRAINT unique_artist_settings_per_user UNIQUE (user_id);

-- Step 5: Update RLS policies for artist_settings
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for artists" ON public.artist_settings;

-- Create new row-level policies based on user_id
CREATE POLICY "Users can view their own artist settings"
ON public.artist_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artist settings"
ON public.artist_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist settings"
ON public.artist_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artist settings"
ON public.artist_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Keep admin access (already exists, but ensure it's correct)
-- "Admins can manage artist settings" - already exists

-- Step 6: Update RLS policies for artworks
-- Drop the overly permissive "Master Key Policy"
DROP POLICY IF EXISTS "Master Key Policy" ON public.artworks;

-- Create new row-level policies based on user_id
CREATE POLICY "Users can view their own artworks"
ON public.artworks
FOR SELECT
USING (auth.uid() = user_id OR status <> 'Sold'::artwork_status);

CREATE POLICY "Users can insert their own artworks"
ON public.artworks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks"
ON public.artworks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artworks"
ON public.artworks
FOR DELETE
USING (auth.uid() = user_id);

-- Keep existing policies for admins and public viewing
-- "Admins can manage all artworks" - already exists
-- "Public can view available artworks" - already exists