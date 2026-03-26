import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { formatKES, calculateMaxLoanAmount } from '@/lib/formatters';

const CollateralSubmit = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ item_type: '', brand_model: '', market_value: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const estimatedLoan = form.market_value ? calculateMaxLoanAmount(Number(form.market_value)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setLoading(true);

    const { error: err } = await supabase.from('collateral').insert({
      user_id: profile.id,
      item_type: form.item_type,
      brand_model: form.brand_model,
      market_value: Number(form.market_value),
      status: 'verified',
    });

    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/borrower');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Submit Collateral</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select value={form.item_type} onValueChange={v => setForm(p => ({ ...p, item_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['Smartphone', 'Laptop', 'TV', 'Tablet', 'Camera', 'Other Electronics'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand / Model</Label>
                <Input value={form.brand_model} onChange={e => setForm(p => ({ ...p, brand_model: e.target.value }))} placeholder="e.g. iPhone 14 Pro" required />
              </div>

              <div className="space-y-2">
                <Label>Market Value (KES)</Label>
                <Input type="number" value={form.market_value} onChange={e => setForm(p => ({ ...p, market_value: e.target.value }))} placeholder="Estimated market value" required />
              </div>

              {estimatedLoan > 0 && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <p><strong>Estimated Max Loan:</strong> {formatKES(estimatedLoan)}</p>
                  <p className="text-muted-foreground">Based on 30% devaluation, then 50% of devalued amount</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !form.item_type}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : 'Submit Collateral'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CollateralSubmit;
