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
      supabase.from('loans').select('*, collateral(*)').eq('status', 'listed'),
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

    const { error } = await supabase.from('investments').insert({
      lender_id: profile.id,
      loan_id: loanId,
      amount_invested: Number(investAmount),
    });

    if (error) { setInvestError(error.message); setInvesting(false); return; }

    // Update funded_amount
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      await supabase.from('loans').update({
        funded_amount: Number(loan.funded_amount || 0) + Number(investAmount),
      }).eq('id', loanId);
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
                            <p><strong>Value:</strong> {formatKES(Number(collateralData.market_value))}</p>
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
                            <Button className="w-full"><TrendingUp className="h-4 w-4 mr-1" /> Invest</Button>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>{formatKES(Number(inv.amount_invested))}</TableCell>
                      <TableCell>{formatKES(Number(inv.amount_invested) * 0.13)}/month</TableCell>
                      <TableCell>{new Date(inv.date || inv.created_at).toLocaleDateString()}</TableCell>
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
