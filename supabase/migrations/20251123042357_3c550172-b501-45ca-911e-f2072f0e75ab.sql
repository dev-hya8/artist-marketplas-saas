-- Add CV fields to artist_settings
ALTER TABLE artist_settings 
ADD COLUMN cv_exhibitions text,
ADD COLUMN cv_education text,
ADD COLUMN cv_awards text;