
-- Collateral images table
CREATE TABLE public.collateral_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collateral_id UUID NOT NULL REFERENCES public.collateral(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.collateral_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on collateral_images" ON public.collateral_images FOR ALL USING (true) WITH CHECK (true);

-- Collateral orders table
CREATE TABLE public.collateral_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collateral_sale_id UUID NOT NULL REFERENCES public.collateral_sales(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  agent_id UUID REFERENCES public.users(id),
  shipping_address TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.collateral_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on collateral_orders" ON public.collateral_orders FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for collateral images
INSERT INTO storage.buckets (id, name, public) VALUES ('collateral-images', 'collateral-images', true);
CREATE POLICY "Allow public read collateral images" ON storage.objects FOR SELECT USING (bucket_id = 'collateral-images');
CREATE POLICY "Allow authenticated upload collateral images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'collateral-images');
CREATE POLICY "Allow authenticated delete collateral images" ON storage.objects FOR DELETE USING (bucket_id = 'collateral-images');
