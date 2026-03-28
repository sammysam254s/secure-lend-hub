import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, MapPin, CheckCircle2 } from 'lucide-react';
import { formatKES, calculateMaxLoanAmount, calculateTotalRepayment } from '@/lib/formatters';

const ITEM_TYPES = ['Smartphone', 'Laptop', 'TV', 'Tablet', 'Camera', 'Other Electronics'];

const LoanApply = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [kycVerified, setKycVerified] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Collateral fields
  const [itemType, setItemType] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [marketValue, setMarketValue] = useState('');

  // Loan fields
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase.from('kyc_verifications').select('status').eq('user_id', profile.id).single()
      .then(({ data }) => {
        setKycVerified(data?.status === 'verified');
        setPageLoading(false);
      });
  }, [profile]);

  const maxLoan = marketValue ? calculateMaxLoanAmount(Number(marketValue)) : 0;
  const totalRepayment = amount && duration ? calculateTotalRepayment(Number(amount), Number(duration)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (Number(amount) > maxLoan) { setError(`Max loan amount is ${formatKES(maxLoan)}`); return; }
    setError('');
    setLoading(true);

    // 1. Create collateral as pending
    const { data: collateral, error: collErr } = await supabase.from('collateral').insert({
      user_id: profile.id,
      item_type: itemType,
      brand_model: brandModel,
      market_value: Number(marketValue),
      status: 'pending',
    }).select().single();

    if (collErr || !collateral) { setError(collErr?.message || 'Failed to submit collateral'); setLoading(false); return; }

    // 2. Create loan tied to that collateral
    const { error: loanErr } = await supabase.from('loans').insert({
      borrower_id: profile.id,
      collateral_id: collateral.id,
      principal_amount: Number(amount),
      duration_months: Number(duration),
      status: 'pending_collateral',
    });

    if (loanErr) {
      // Rollback collateral
      await supabase.from('collateral').delete().eq('id', collateral.id);
      setError(loanErr.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (pageLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Application Submitted!</h2>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-left w-full">
                <div className="flex gap-2 items-start">
                  <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Visit the Agent Station</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your loan application is pending collateral verification. Please visit your nearest agent station with your physical collateral item so the agent can verify and assess its value.
                    </p>
                    <p className="text-xs text-amber-600 mt-2">Once verified, your loan will be listed for funding by lenders.</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/borrower')} className="mt-2 w-full">Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {!kycVerified && (
          <Card className="border-destructive bg-destructive/5 mb-6">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">KYC Verification Required</p>
                <p className="text-sm text-muted-foreground">Complete KYC before applying for a loan.</p>
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              {/* Collateral section */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Collateral Details</p>

                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select value={itemType} onValueChange={setItemType} disabled={!kycVerified}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Brand / Model</Label>
                  <Input value={brandModel} onChange={e => setBrandModel(e.target.value)} placeholder="e.g. iPhone 14 Pro" required disabled={!kycVerified} />
                </div>

                <div className="space-y-2">
                  <Label>Your Estimated Market Value (KES)</Label>
                  <Input type="number" value={marketValue} onChange={e => setMarketValue(e.target.value)} placeholder="Estimated value" required disabled={!kycVerified} />
                  {maxLoan > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Estimated max loan: <strong>{formatKES(maxLoan)}</strong> (agent may adjust after physical inspection)
                    </p>
                  )}
                </div>
              </div>

              <hr />

              {/* Loan section */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Loan Details</p>

                <div className="space-y-2">
                  <Label>Loan Amount (KES)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" max={maxLoan || undefined} required disabled={!kycVerified || !marketValue} />
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
                    <p>Platform fee (2%): {formatKES(Number(amount) * 0.02)}</p>
                    <p>Insurance fee (1%): {formatKES(Number(amount) * 0.01)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                After submitting, you will need to visit an agent station with your physical item for verification before your loan is listed.
              </div>

              <Button type="submit" className="w-full" disabled={loading || !kycVerified || !itemType || !duration}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : kycVerified ? 'Submit Application' : 'KYC Required'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LoanApply;
