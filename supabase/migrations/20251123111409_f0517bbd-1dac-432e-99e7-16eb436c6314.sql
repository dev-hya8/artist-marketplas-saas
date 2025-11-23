-- Add new columns to artist_settings for notifications and privacy preferences
ALTER TABLE artist_settings
ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS public_profile_enabled boolean DEFAULT true;

COMMENT ON COLUMN artist_settings.email_alerts_enabled IS 'Whether artist receives email notifications for new inquiries';
COMMENT ON COLUMN artist_settings.public_profile_enabled IS 'Whether artist profile is visible on public portfolio page';