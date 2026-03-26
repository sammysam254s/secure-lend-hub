import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const KYC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', id_number: '', date_of_birth: '' });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({ id_front: null, id_back: null, selfie: null, signature: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert: true });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('kyc-documents').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setLoading(true);

    try {
      const urls: Record<string, string | null> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          urls[key] = await uploadFile(file, `${profile.id}/${key}_${Date.now()}`);
        }
      }

      const { error: err } = await supabase.from('kyc_verifications').insert({
        user_id: profile.id,
        full_name: form.full_name,
        id_number: form.id_number,
        date_of_birth: form.date_of_birth,
        id_front_image_url: urls.id_front || null,
        id_back_image_url: urls.id_back || null,
        selfie_image_url: urls.selfie || null,
        signature_image_url: urls.signature || null,
        has_id_front_image: !!urls.id_front,
        has_id_back_image: !!urls.id_back,
        has_selfie_image: !!urls.selfie,
        has_signature_image: !!urls.signature,
      });

      if (err) { setError(err.message); setLoading(false); return; }
      navigate('/borrower');
    } catch {
      setError('Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>KYC Verification</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="As shown on ID" required />
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input value={form.id_number} onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} placeholder="National ID number" required />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} required />
              </div>

              {[
                { key: 'id_front', label: 'ID Front Photo' },
                { key: 'id_back', label: 'ID Back Photo' },
                { key: 'selfie', label: 'Selfie Photo' },
                { key: 'signature', label: 'Signature Image' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input type="file" accept="image/*" onChange={e => setFiles(p => ({ ...p, [key]: e.target.files?.[0] || null }))} />
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default KYC;
