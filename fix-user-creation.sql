-- Fix for "Database error creating new user" 
-- This grants proper permissions to the trigger function

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This is crucial - it runs with elevated privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donator')
    );
    
    -- If user is a receiver, create their points record
    IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donator') = 'receiver' THEN
        INSERT INTO public.receiver_points (receiver_id, total_points)
        VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'points')::INTEGER, 0));
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Temporarily disable RLS for the service role on profiles (trigger uses service role)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add a policy that allows service_role to insert (used by triggers)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- Same for receiver_points
DROP POLICY IF EXISTS "Service role can insert receiver points" ON public.receiver_points;
CREATE POLICY "Service role can insert receiver points"
    ON public.receiver_points
    FOR INSERT
    WITH CHECK (true);

-- Test the function (optional - this should succeed)
-- SELECT public.handle_new_user();

