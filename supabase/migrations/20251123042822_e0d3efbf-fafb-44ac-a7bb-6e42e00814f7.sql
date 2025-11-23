-- Fix RLS policy for artwork_gallery
-- Allow admins to insert into artwork_gallery
CREATE POLICY "Admins can insert gallery images"
ON artwork_gallery
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));