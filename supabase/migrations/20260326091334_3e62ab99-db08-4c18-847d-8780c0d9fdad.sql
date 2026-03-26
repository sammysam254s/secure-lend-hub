
-- Update admin trigger function to use correct email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email = 'sammyseth260@gmail.com' THEN
        NEW.role := 'admin';
        NEW.is_staff := true;
        NEW.is_superuser := true;
        NEW.is_promoted_admin := true;
    END IF;
    RETURN NEW;
END;
$$;

-- Update prevent_admin_modification to use correct email
CREATE OR REPLACE FUNCTION public.prevent_admin_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.email = 'sammyseth260@gmail.com' OR OLD.username = 'sammyseth260' THEN
        NEW.email := OLD.email;
        NEW.username := OLD.username;
        NEW.role := 'admin';
        NEW.is_staff := true;
        NEW.is_superuser := true;
        NEW.is_promoted_admin := true;
    END IF;
    RETURN NEW;
END;
$$;

-- Update prevent_admin_deletion to use correct email
CREATE OR REPLACE FUNCTION public.prevent_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.email = 'sammyseth260@gmail.com' OR OLD.username = 'sammyseth260' THEN
        RAISE EXCEPTION 'Admin user cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth_id
        AND role = 'admin'
    );
$$;
