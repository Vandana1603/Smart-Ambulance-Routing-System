-- Ensure app_role enum includes required values and create if missing
DO $$
DECLARE
  app_role_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) INTO app_role_exists;

  IF NOT app_role_exists THEN
    CREATE TYPE public.app_role AS ENUM ('patient','driver','dispatcher','admin');
  ELSE
    -- Add enum values if they don't exist yet
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumlabel = 'patient' AND e.enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE 'patient';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumlabel = 'driver' AND e.enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE 'driver';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumlabel = 'dispatcher' AND e.enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE 'dispatcher';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumlabel = 'admin' AND e.enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE 'admin';
    END IF;
  END IF;
END $$;

-- Function to automatically assign a role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_text text := coalesce(NEW.raw_user_meta_data->>'role', 'patient');
  final_role public.app_role;
BEGIN
  -- Only allow self-signup roles: patient, driver, dispatcher. Block admin self-assignment.
  IF role_text NOT IN ('patient','driver','dispatcher') THEN
    role_text := 'patient';
  END IF;

  final_role := role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users to create a role row automatically
DROP TRIGGER IF EXISTS on_auth_user_created_roles ON auth.users;
CREATE TRIGGER on_auth_user_created_roles
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_roles();