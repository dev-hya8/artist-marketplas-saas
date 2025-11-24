-- Fix security warning: Set search_path on function to prevent search_path hijacking
-- This ensures the function always operates in the expected schema context

-- Recreate update_updated_at_column function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;