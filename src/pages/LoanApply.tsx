import { useEffect, useState } from 'react';
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
import { formatKES, calculateMaxLoanAmount, calculateTotalRepayment } from '@/lib/formatters';

const LoanApply = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collateral, setCollateral] = useState<any[]>([]);
  const [selectedCollateral, setSelectedCollateral] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase.from('collateral').select('*').eq('user_id', profile.id).eq('status', 'verified')
      .then(({ data }) => setCollateral(data || []));
  }, [profile]);

  const selected = collateral.find(c => c.id === selectedCollateral);
  const maxLoan = selected ? calculateMaxLoanAmount(Number(selected.market_value)) : 0;
  const totalRepayment = amount && duration ? calculateTotalRepayment(Number(amount), Number(duration)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedCollateral) return;
    if (Number(amount) > maxLoan) { setError(`Max loan amount is ${formatKES(maxLoan)}`); return; }
    setError('');
    setLoading(true);

    const { error: err } = await supabase.from('loans').insert({
      borrower_id: profile.id,
      collateral_id: selectedCollateral,
      principal_amount: Number(amount),
      duration_months: Number(duration),
    });

    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/borrower');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Apply for Loan</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label>Select Verified Collateral</Label>
                <Select value={selectedCollateral} onValueChange={setSelectedCollateral}>
                  <SelectTrigger><SelectValue placeholder="Choose collateral" /></SelectTrigger>
                  <SelectContent>
                    {collateral.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.item_type} - {c.brand_model} ({formatKES(Number(c.market_value))})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && <p className="text-sm text-muted-foreground">Max loan: {formatKES(maxLoan)}</p>}
              </div>

              <div className="space-y-2">
                <Label>Loan Amount (KES)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" max={maxLoan} required />
              </div>

              <div className="space-y-2">
                <Label>Duration (Months)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {totalRepayment > 0 && (
                <div className="rounded-md bg-muted p-4 space-y-1 text-sm">
                  <p><strong>Total Repayment:</strong> {formatKES(totalRepayment)}</p>
                  <p>Interest: 13% × {duration} months = {formatKES(Number(amount) * 0.13 * Number(duration))}</p>
                  <p>Platform fee (1%): {formatKES(Number(amount) * 0.01)}</p>
                  <p>Insurance fee (1%): {formatKES(Number(amount) * 0.01)}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !selectedCollateral}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : 'Apply for Loan'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LoanApply;
