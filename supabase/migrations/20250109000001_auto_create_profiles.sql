-- Auto-create profiles when new users sign up
-- This trigger ensures every auth.users entry gets a corresponding profiles entry

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    -- Use display_name from metadata, or fall back to email username
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    -- Optionally include avatar_url from metadata
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Create the trigger that fires after user insertion
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Note: This trigger will automatically create a profile entry whenever:
-- 1. A user signs up via supabase.auth.signUp()
-- 2. An admin creates a user via the Supabase dashboard
-- 3. A user is created via the Auth API

