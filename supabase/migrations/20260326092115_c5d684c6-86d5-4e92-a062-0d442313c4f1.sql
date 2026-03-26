
-- Truncate bypasses row-level triggers
TRUNCATE public.contract_verifications, public.loan_contracts, public.payments, public.investments, public.commissions, public.wallet_transactions, public.kyc_verifications, public.loans, public.collateral, public.users CASCADE;
