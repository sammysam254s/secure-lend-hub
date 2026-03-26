import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet as WalletIcon } from 'lucide-react';
import { formatKES } from '@/lib/formatters';
import { toast } from 'sonner';

const WalletPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [simStep, setSimStep] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase.from('wallet_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => { setTransactions(data || []); setLoading(false); });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setSubmitting(true);

    const amount = Number(form.amount);
    const currentBalance = Number(profile.wallet_balance || 0);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount.');
      setSubmitting(false);
      return;
    }

    if (form.type === 'withdrawal' && amount > currentBalance) {
      setError('Insufficient balance.');
      setSubmitting(false);
      return;
    }

    const newBalance = form.type === 'deposit' ? currentBalance + amount : currentBalance - amount;

    // Simulate M-Pesa Transaction Phases
    setSimStep('Initiating M-Pesa Request...');
    await new Promise(r => setTimeout(r, 1500));
    
    setSimStep('Waiting for user PIN...');
    await new Promise(r => setTimeout(r, 2000));
    
    setSimStep('Verifying Transaction...');
    await new Promise(r => setTimeout(r, 1000));

    const uppercaseType = form.type.charAt(0).toUpperCase() + form.type.slice(1);

    const { error: txError } = await supabase.from('wallet_transactions').insert({
      user_id: profile.id,
      transaction_type: uppercaseType,
      amount,
      balance_after: newBalance,
      description: `${uppercaseType} of ${formatKES(amount)}`,
    });

    if (txError) { setError(txError.message); setSubmitting(false); return; }

    const { error: updateError } = await supabase.from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();

    const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setTransactions(data || []);
    setForm({ type: '', amount: '' });
    setSubmitting(false);
    setSimStep('');
    toast.success(`${form.type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Wallet</h1>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Balance */}
          <Card className="border-0 shadow-sm md:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <WalletIcon className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{formatKES(Number(profile?.wallet_balance || 0))}</p>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw */}
          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader><CardTitle className="text-lg">Deposit / Withdraw</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Transaction Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Amount (KES)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" required />
                  </div>
                </div>
                <Button type="submit" disabled={submitting || !form.type} className="w-full sm:w-auto">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? (simStep || 'Processing...') : 'Submit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card className="border-0 shadow-sm mt-6">
          <CardHeader><CardTitle className="text-lg">Transaction History</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-muted-foreground text-sm">No transactions yet.</p> : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={tx.transaction_type.toLowerCase() === 'deposit' ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                          {tx.transaction_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{tx.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-sm">{formatKES(Number(tx.amount))}</p>
                      <p className="text-xs text-muted-foreground">Bal: {formatKES(Number(tx.balance_after))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WalletPage;
