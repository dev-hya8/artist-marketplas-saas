-- Drop unused Profiles table that has RLS enabled but no policies
-- This table is empty (0 rows) and appears to be a legacy table
-- The proper 'profiles' table (lowercase) is being used instead

DROP TABLE IF EXISTS public."Profiles" CASCADE;