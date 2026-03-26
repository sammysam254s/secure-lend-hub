import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatKES, calculateMaxLoanAmount, calculateTotalRepayment } from '@/lib/formatters';

const LoanApply = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collateral, setCollateral] = useState<any[]>([]);
  const [selectedCollateral, setSelectedCollateral] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [kycVerified, setKycVerified] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const [collateralRes] = await Promise.all([
        supabase.from('collateral').select('*').eq('user_id', profile.id).eq('status', 'verified'),
      ]);
      setCollateral(collateralRes.data || []);
      setKycVerified(true);
      setPageLoading(false);
    };
    fetchData();
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

  if (pageLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {!kycVerified && (
          <Card className="border-destructive bg-destructive/5 mb-6">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">KYC Verification Required</p>
                <p className="text-sm text-muted-foreground">You must complete and have your KYC verified before applying for a loan.</p>
                <Button variant="destructive" size="sm" className="mt-2" asChild>
                  <Link to="/kyc">Complete KYC Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Apply for Loan</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label>Select Verified Collateral</Label>
                {collateral.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm flex flex-col gap-2 text-muted-foreground bg-muted/50">
                    <p>No verified collateral available.</p>
                    <Button variant="outline" size="sm" asChild className="w-fit">
                      <Link to="/borrower/collateral-submit">Submit Collateral</Link>
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedCollateral} onValueChange={setSelectedCollateral} disabled={!kycVerified}>
                    <SelectTrigger><SelectValue placeholder="Choose collateral" /></SelectTrigger>
                    <SelectContent>
                      {collateral.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.item_type} - {c.brand_model} ({formatKES(Number(c.market_value))})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selected && <p className="text-sm text-muted-foreground">Max loan: {formatKES(maxLoan)}</p>}
              </div>

              <div className="space-y-2">
                <Label>Loan Amount (KES)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" max={maxLoan} required disabled={!kycVerified} />
              </div>

              <div className="space-y-2">
                <Label>Duration (Months)</Label>
                <Select value={duration} onValueChange={setDuration} disabled={!kycVerified}>
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

              <Button type="submit" className="w-full" disabled={loading || !selectedCollateral || !kycVerified}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : kycVerified ? 'Apply for Loan' : 'KYC Required'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LoanApply;
