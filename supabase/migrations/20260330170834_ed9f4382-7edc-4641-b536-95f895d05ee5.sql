
ALTER TABLE public.collateral ADD COLUMN IF NOT EXISTS collateral_code VARCHAR UNIQUE;

-- Create collateral_sales table for the overdue collateral marketplace
CREATE TABLE public.collateral_sales (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  collateral_id UUID NOT NULL REFERENCES public.collateral(id),
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  borrower_id UUID NOT NULL REFERENCES public.users(id),
  sale_price NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'listed',
  buyer_id UUID REFERENCES public.users(id),
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.collateral_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on collateral_sales" ON public.collateral_sales FOR ALL TO public USING (true) WITH CHECK (true);

-- Cart table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collateral_sale_id UUID NOT NULL REFERENCES public.collateral_sales(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, collateral_sale_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cart_items" ON public.cart_items FOR ALL TO public USING (true) WITH CHECK (true);
