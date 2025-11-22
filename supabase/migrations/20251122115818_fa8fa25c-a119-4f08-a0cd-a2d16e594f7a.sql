-- Add contact and social media fields to artist_settings
ALTER TABLE artist_settings 
ADD COLUMN phone_number text,
ADD COLUMN instagram_handle text,
ADD COLUMN facebook_handle text,
ADD COLUMN twitter_handle text,
ADD COLUMN primary_contact_method text DEFAULT 'form';