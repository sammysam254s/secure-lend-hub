import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet as WalletIcon } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const WalletPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);
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

    if (form.type === 'withdrawal' && amount > currentBalance) {
      setError('Insufficient balance');
      setSubmitting(false);
      return;
    }

    const newBalance = form.type === 'deposit' ? currentBalance + amount : currentBalance - amount;

    const { error: txError } = await supabase.from('wallet_transactions').insert({
      user_id: profile.id,
      transaction_type: form.type,
      amount,
      balance_after: newBalance,
      description: `${form.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatKES(amount)}`,
    });

    if (txError) { setError(txError.message); setSubmitting(false); return; }

    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', profile.id);
    await refreshProfile();

    // Refresh transactions
    const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setTransactions(data || []);
    setForm({ type: '', amount: '' });
    setSubmitting(false);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Balance */}
          <Card className="border-0 shadow-sm md:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <WalletIcon className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-primary">{formatKES(Number(profile?.wallet_balance || 0))}</p>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw */}
          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader><CardTitle>Deposit / Withdraw</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" required />
                  </div>
                </div>
                <Button type="submit" disabled={submitting || !form.type}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Processing...' : 'Submit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card className="border-0 shadow-sm mt-8">
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-muted-foreground">No transactions yet.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge className={tx.transaction_type === 'deposit' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>{tx.transaction_type}</Badge></TableCell>
                      <TableCell>{formatKES(Number(tx.amount))}</TableCell>
                      <TableCell>{formatKES(Number(tx.balance_after))}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WalletPage;
