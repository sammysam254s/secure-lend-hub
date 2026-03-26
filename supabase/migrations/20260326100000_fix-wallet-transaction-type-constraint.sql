-- Fix wallet_transactions transaction_type check constraint
-- Drop the old constraint that may reject lowercase values
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;

-- Add a new constraint that accepts lowercase values used by the app
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_transaction_type_check
  CHECK (transaction_type IN ('deposit', 'withdrawal', 'Deposit', 'Withdrawal', 'repayment', 'disbursement'));
