-- Create function to automatically initialize artist_settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new artist_settings record for the new user
  INSERT INTO public.artist_settings (
    user_id,
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Artist'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user_settings() IS 
'Automatically creates an artist_settings record when a new user signs up. Uses SECURITY DEFINER to bypass RLS policies during initialization.';