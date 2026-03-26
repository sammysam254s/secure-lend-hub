import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { runKycVerification } from '@/lib/ocr';

const KYC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', id_number: '', date_of_birth: '', id_text: '' });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    id_front: null, id_back: null, selfie: null, signature: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [verified, setVerified] = useState(false);

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
    setProgress('');
    setLoading(true);

    if (!files.id_front || !files.id_back || !files.selfie || !files.signature) {
      setError('All 4 documents are required.');
      setLoading(false);
      return;
    }

    if (!form.id_text.trim()) {
      setError('Please enter the text content from your ID card.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Run verification against entered details + ID text
      setProgress('Verifying your details against ID document...');
      const result = runKycVerification(
        form.id_text,
        form.full_name,
        form.id_number,
        form.date_of_birth,
        files.id_front,
        files.id_back,
        files.selfie,
      );

      if (!result.isVerified) {
        setError(`Verification failed: ${result.errors.join(' ')}`);
        setLoading(false);
        setProgress('');
        return;
      }

      // Step 2: Upload documents
      setProgress('Uploading documents securely...');
      const urls: Record<string, string | null> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          urls[key] = await uploadFile(file as File, `${profile.id}/${key}_${Date.now()}`);
        }
      }

      // Step 3: Save to DB — mark as verified immediately
      setProgress('Saving verification results...');
      const { error: err } = await supabase.from('kyc_verifications').upsert({
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
        status: 'verified',
        verification_score: result.score,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (err) { setError(err.message); setLoading(false); setProgress(''); return; }

      setVerified(true);
      setProgress('');
      toast.success('KYC verified successfully!');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
              <ShieldCheck className="h-16 w-16 text-green-600" />
              <Badge className="bg-green-100 text-green-700 text-sm px-4 py-1">Identity Verified</Badge>
              <h2 className="text-xl font-bold">You're verified!</h2>
              <p className="text-muted-foreground text-sm">Your identity has been confirmed. You can now apply for loans.</p>
              <Button onClick={() => navigate('/borrower')} className="mt-2">Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>KYC Verification</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex gap-2 items-start">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Personal details */}
              <div className="space-y-2">
                <Label>Full Name <span className="text-muted-foreground text-xs">(as on ID)</span></Label>
                <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. John Kamau Mwangi" required />
              </div>
              <div className="space-y-2">
                <Label>National ID Number</Label>
                <Input value={form.id_number} onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} placeholder="e.g. 12345678" required />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} required />
              </div>

              {/* ID text content for verification */}
              <div className="space-y-2">
                <Label>
                  ID Card Text Content
                  <span className="text-muted-foreground text-xs ml-1">(type the text visible on your ID front)</span>
                </Label>
                <Textarea
                  value={form.id_text}
                  onChange={e => setForm(p => ({ ...p, id_text: e.target.value }))}
                  placeholder="Type all text visible on your ID card — name, ID number, date of birth, district, etc."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is used to verify your details match your ID. Include all text you can read on the card.
                </p>
              </div>

              {/* Document uploads */}
              {[
                { key: 'id_front', label: 'ID Front Photo', hint: 'Clear photo of the front of your ID' },
                { key: 'id_back', label: 'ID Back Photo', hint: 'Clear photo of the back of your ID' },
                { key: 'selfie', label: 'Selfie Photo', hint: 'A recent photo of your face' },
                { key: 'signature', label: 'Signature Image', hint: 'Photo or scan of your signature' },
              ].map(({ key, label, hint }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => setFiles(p => ({ ...p, [key]: e.target.files?.[0] || null }))}
                  />
                  {files[key] && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {files[key]!.name}
                    </p>
                  )}
                  {!files[key] && <p className="text-xs text-muted-foreground">{hint}</p>}
                </div>
              ))}

              {progress && (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Verifying...' : 'Verify Identity'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default KYC;
