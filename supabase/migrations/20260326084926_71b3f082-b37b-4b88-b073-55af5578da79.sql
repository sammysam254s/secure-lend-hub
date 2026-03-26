
-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to kyc-documents
CREATE POLICY "Authenticated users can upload KYC documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-documents');

-- Allow public read access
CREATE POLICY "Public read access for KYC documents" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents');
