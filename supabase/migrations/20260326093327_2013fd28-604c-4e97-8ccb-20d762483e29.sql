-- Recreate all triggers that were lost after TRUNCATE

DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON public.users;
CREATE TRIGGER trigger_auto_assign_admin
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_admin_role();

DROP TRIGGER IF EXISTS trigger_prevent_admin_deletion ON public.users;
CREATE TRIGGER trigger_prevent_admin_deletion
    BEFORE DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_admin_modification ON public.users;
CREATE TRIGGER trigger_prevent_admin_modification
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_modification();

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_collateral_updated_at ON public.collateral;
CREATE TRIGGER trigger_update_collateral_updated_at
    BEFORE UPDATE ON public.collateral
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_kyc_updated_at ON public.kyc_verifications;
CREATE TRIGGER trigger_update_kyc_updated_at
    BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_loans_updated_at ON public.loans;
CREATE TRIGGER trigger_update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();