
-- Add DELETE policy for users table (for admin operations)
CREATE POLICY "Allow delete for admin" ON public.users
FOR DELETE TO public
USING (true);

-- Create auto-assign admin function
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email = 'ammyseth260@gmail.com' THEN
        NEW.role := 'admin';
        NEW.is_staff := true;
        NEW.is_superuser := true;
        NEW.is_promoted_admin := true;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for auto admin assignment
CREATE TRIGGER trigger_auto_assign_admin
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();

-- Helper function to check admin status
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
