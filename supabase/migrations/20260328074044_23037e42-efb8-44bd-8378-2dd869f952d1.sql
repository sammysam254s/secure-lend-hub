
-- Update platform fee to 2%
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(principal numeric)
RETURNS numeric LANGUAGE plpgsql AS $$
BEGIN
    RETURN principal * 0.02;
END;
$$;

-- Update total repayment to reflect 2% platform fee
CREATE OR REPLACE FUNCTION public.calculate_total_repayment(principal numeric, duration integer, rate numeric DEFAULT 13.00)
RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE
    monthly_interest DECIMAL;
    total_interest DECIMAL;
    platform_fee DECIMAL;
    insurance_fee DECIMAL;
BEGIN
    monthly_interest := calculate_monthly_interest(principal, rate);
    total_interest := monthly_interest * duration;
    platform_fee := calculate_platform_fee(principal);
    insurance_fee := calculate_insurance_fee(principal);
    RETURN principal + total_interest + platform_fee + insurance_fee;
END;
$$;

-- Restore triggers
CREATE OR REPLACE TRIGGER trigger_auto_assign_admin
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_admin_role();

CREATE OR REPLACE TRIGGER trigger_prevent_admin_deletion
    BEFORE DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_deletion();

CREATE OR REPLACE TRIGGER trigger_prevent_admin_modification
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_modification();

CREATE OR REPLACE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_collateral_updated_at
    BEFORE UPDATE ON public.collateral
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
