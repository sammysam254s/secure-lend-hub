import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Marketplace = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [investError, setInvestError] = useState('');

  const fetchData = async () => {
    const [loansRes, investRes] = await Promise.all([
      // Show all loans that need funding — listed or pending_collateral
      supabase
        .from('loans')
        .select('*, collateral(*)')
        .in('status', ['listed', 'pending_collateral'])
        .order('created_at', { ascending: false }),
      profile ? supabase.from('investments').select('*, loans(*)').eq('lender_id', profile.id) : { data: [] },
    ]);
    setLoans(loansRes.data || []);
    setInvestments(investRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleInvest = async (loanId: string) => {
    if (!profile || !investAmount) return;
    setInvesting(true);
    setInvestError('');

    const amount = Number(investAmount);
    const lenderBalance = Number(profile.wallet_balance || 0);

    if (amount > lenderBalance) {
      setInvestError('Insufficient wallet balance. Please deposit funds first.');
      setInvesting(false);
      return;
    }

    const loan = loans.find(l => l.id === loanId);
    if (!loan) { setInvesting(false); return; }

    const principal = Number(loan.principal_amount);
    const funded = Number(loan.funded_amount || 0);
    const remaining = principal - funded;

    if (amount > remaining) {
      setInvestError(`Maximum you can invest is ${formatKES(remaining)}`);
      setInvesting(false);
      return;
    }

    // Deduct from lender wallet
    const newLenderBalance = lenderBalance - amount;
    const { error: walletErr } = await supabase.from('users')
      .update({ wallet_balance: newLenderBalance })
      .eq('id', profile.id);
    if (walletErr) { setInvestError(walletErr.message); setInvesting(false); return; }

    // Record lender wallet transaction
    await supabase.from('wallet_transactions').insert({
      user_id: profile.id,
      transaction_type: 'withdrawal',
      amount,
      balance_after: newLenderBalance,
      description: `Investment in loan ${loanId.slice(0, 8)}`,
    });

    // Record investment
    const { error: invErr } = await supabase.from('investments').insert({
      lender_id: profile.id,
      loan_id: loanId,
      amount_invested: amount,
    });
    if (invErr) { setInvestError(invErr.message); setInvesting(false); return; }

    const newFunded = funded + amount;
    const fullyFunded = newFunded >= principal;

    // Update loan funded amount (and status if fully funded)
    await supabase.from('loans').update({
      funded_amount: newFunded,
      ...(fullyFunded ? { status: 'active' } : {}),
    }).eq('id', loanId);

    if (fullyFunded) {
      // Disburse principal to borrower wallet
      const { data: borrower } = await supabase.from('users').select('wallet_balance').eq('id', loan.borrower_id).single();
      const borrowerNewBalance = Number(borrower?.wallet_balance || 0) + principal;
      await supabase.from('users').update({ wallet_balance: borrowerNewBalance }).eq('id', loan.borrower_id);
      await supabase.from('wallet_transactions').insert({
        user_id: loan.borrower_id,
        transaction_type: 'deposit',
        amount: principal,
        balance_after: borrowerNewBalance,
        description: `Loan disbursement`,
      });

      // Generate contract
      try {
        await supabase.functions.invoke('generate-contract', { body: { loan_id: loanId } });
      } catch (e) {
        console.error('Contract generation error:', e);
      }
    }

    setInvestAmount('');
    setInvesting(false);
    fetchData();
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="marketplace">
          <TabsList className="mb-6">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            <h1 className="text-2xl font-bold mb-6">Loan Marketplace</h1>
            {loans.length === 0 ? (
              <p className="text-muted-foreground">No loans available for investment.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loans.map(loan => {
                  const funded = Number(loan.funded_amount || 0);
                  const principal = Number(loan.principal_amount);
                  const pct = Math.min((funded / principal) * 100, 100);
                  const collateralData = Array.isArray(loan.collateral) ? loan.collateral[0] : loan.collateral;

                  return (
                    <Card key={loan.id} className="border-0 shadow-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{formatKES(principal)}</CardTitle>
                          <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {collateralData && (
                          <div className="text-sm space-y-1">
                            <p><strong>Collateral:</strong> {collateralData.item_type} - {collateralData.brand_model}</p>
                            <p><strong>Value:</strong> {formatKES(Number(collateralData.agent_verified_value || collateralData.market_value))}</p>
                            {collateralData.status !== 'verified' && (
                              <p className="text-xs text-amber-600">⏳ Collateral pending agent verification</p>
                            )}
                          </div>
                        )}
                        <div className="text-sm space-y-1">
                          <p><strong>Interest Rate:</strong> {loan.interest_rate}% / month</p>
                          <p><strong>Duration:</strong> {loan.duration_months} months</p>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Funded</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{formatKES(funded)} of {formatKES(principal)}</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" disabled={collateralData?.status !== 'verified'}>
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {collateralData?.status !== 'verified' ? 'Awaiting Verification' : 'Invest'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Invest in Loan</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-2">
                              {investError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{investError}</div>}
                              <div className="text-sm">
                                <p>Loan Amount: {formatKES(principal)}</p>
                                <p>Remaining: {formatKES(principal - funded)}</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Investment Amount (KES)</Label>
                                <Input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)} max={principal - funded} placeholder="Enter amount" />
                              </div>
                              <Button className="w-full" disabled={investing || !investAmount} onClick={() => handleInvest(loan.id)}>
                                {investing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {investing ? 'Investing...' : 'Confirm Investment'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio">
            <h1 className="text-2xl font-bold mb-6">My Portfolio</h1>
            {investments.length === 0 ? (
              <p className="text-muted-foreground">No investments yet.</p>
            ) : (
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Amount Invested</TableHead>
                     <TableHead>Expected Return (13%/mo)</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Contract</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {investments.map(inv => (
                     <TableRow key={inv.id}>
                       <TableCell>{formatKES(Number(inv.amount_invested))}</TableCell>
                       <TableCell>{formatKES(Number(inv.amount_invested) * 0.13)}/month</TableCell>
                       <TableCell>{new Date(inv.date || inv.created_at).toLocaleDateString()}</TableCell>
                       <TableCell>
                         <Button size="sm" variant="outline" onClick={() => navigate(`/contract/${inv.loan_id}`)}>
                           View Contract
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Marketplace;
