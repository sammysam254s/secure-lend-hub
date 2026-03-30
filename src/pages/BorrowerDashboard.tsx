import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CreditCard, Package, DollarSign, Wallet, Plus, FileCheck, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import { formatKES, calculateTotalRepayment, getStatusColor } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BorrowerDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile) return;
    const [loansRes, collateralRes, kycRes] = await Promise.all([
      supabase.from('loans').select('*').eq('borrower_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('collateral').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('kyc_verifications').select('status').eq('user_id', profile.id).maybeSingle(),
    ]);
    setLoans(loansRes.data || []);
    setCollateral(collateralRes.data || []);
    setKycStatus(kycRes.data?.status || null);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handlePay = async (loan: any) => {
    if (!profile) return;
    setPayingLoanId(loan.id);

    const totalRepayment = calculateTotalRepayment(Number(loan.principal_amount), Number(loan.duration_months));
    const walletBalance = Number(profile.wallet_balance || 0);

    if (walletBalance < totalRepayment) {
      toast.error(`Insufficient balance. You need ${formatKES(totalRepayment)} but have ${formatKES(walletBalance)}. Please deposit funds.`);
      setPayingLoanId(null);
      return;
    }

    // Deduct from borrower wallet
    const newBorrowerBalance = walletBalance - totalRepayment;
    const { error: deductErr } = await supabase.from('users')
      .update({ wallet_balance: newBorrowerBalance })
      .eq('id', profile.id);
    if (deductErr) { toast.error(deductErr.message); setPayingLoanId(null); return; }

    await supabase.from('wallet_transactions').insert({
      user_id: profile.id,
      transaction_type: 'withdrawal',
      amount: totalRepayment,
      balance_after: newBorrowerBalance,
      description: `Loan repayment for loan ${loan.id.slice(0, 8)}`,
    });

    // Distribute repayment to lenders proportionally
    const { data: investments } = await supabase
      .from('investments')
      .select('lender_id, amount_invested')
      .eq('loan_id', loan.id);

    const principal = Number(loan.principal_amount);
    const interestRate = Number(loan.interest_rate || 13) / 100;
    const durationMonths = Number(loan.duration_months);
    const totalInterest = principal * interestRate * durationMonths;
    
    for (const inv of investments || []) {
      const share = Number(inv.amount_invested) / principal;
      const lenderPrincipalShare = Number(inv.amount_invested);
      const lenderInterestShare = totalInterest * share;
      
      // Deduct lender platform fee (2% of interest earned) and insurance fee (1% of principal share)
      const lenderPlatformFee = lenderInterestShare * 0.02;
      const lenderInsuranceFee = lenderPrincipalShare * 0.01;
      const grossReturn = lenderPrincipalShare + lenderInterestShare;
      const lenderReturn = grossReturn - lenderPlatformFee - lenderInsuranceFee;

      const { data: lender } = await supabase.from('users').select('wallet_balance').eq('id', inv.lender_id).single();
      const currentLenderBal = Number(lender?.wallet_balance || 0);

      // Log platform fee deduction for lender
      await supabase.from('wallet_transactions').insert({
        user_id: inv.lender_id,
        transaction_type: 'withdrawal',
        amount: lenderPlatformFee,
        balance_after: currentLenderBal,
        description: `Platform fee (2% of interest) deducted - loan ${loan.id.slice(0, 8)}`,
      });

      // Log insurance fee deduction for lender
      await supabase.from('wallet_transactions').insert({
        user_id: inv.lender_id,
        transaction_type: 'withdrawal',
        amount: lenderInsuranceFee,
        balance_after: currentLenderBal,
        description: `Insurance fee (1% of principal) deducted - loan ${loan.id.slice(0, 8)}`,
      });

      const newLenderBalance = currentLenderBal + lenderReturn;
      await supabase.from('users').update({ wallet_balance: newLenderBalance }).eq('id', inv.lender_id);
      await supabase.from('wallet_transactions').insert({
        user_id: inv.lender_id,
        transaction_type: 'deposit',
        amount: lenderReturn,
        balance_after: newLenderBalance,
        description: `Loan repayment received for loan ${loan.id.slice(0, 8)} (net after fees)`,
      });
    }

    // Mark loan as paid and contract as completed
    await supabase.from('loans').update({ status: 'paid' }).eq('id', loan.id);
    await supabase.from('loan_contracts').update({ status: 'completed' }).eq('loan_id', loan.id);

    await refreshProfile();
    await fetchData();
    toast.success('Loan repaid successfully! Funds distributed to lenders.');
    setPayingLoanId(null);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  const activeLoans = loans.filter(l => l.status === 'active').length;
  const pendingCollateral = collateral.filter(c => c.status === 'pending').length;
  const totalBorrowed = loans.filter(l => ['active', 'paid'].includes(l.status)).reduce((s, l) => s + Number(l.principal_amount), 0);

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Borrower Dashboard</h1>
          {kycStatus === 'verified' ? (
            <Badge className="bg-green-100 text-green-700 flex items-center gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1 text-xs">
              <ShieldAlert className="h-3 w-3" /> {kycStatus === 'pending' ? 'KYC Pending' : 'KYC Required'}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: 'Active Loans', value: activeLoans, icon: CreditCard },
            { label: 'Pending Collateral', value: pendingCollateral, icon: Package },
            { label: 'Total Borrowed', value: formatKES(totalBorrowed), icon: DollarSign },
            { label: 'Wallet Balance', value: formatKES(Number(profile?.wallet_balance || 0)), icon: Wallet },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm sm:text-lg font-bold break-all">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" asChild><Link to="/borrower/loan-apply"><Plus className="h-4 w-4 mr-1" /> Apply for Loan</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/kyc"><FileCheck className="h-4 w-4 mr-1" /> KYC Verification</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/contracts"><FileText className="h-4 w-4 mr-1" /> My Contracts</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/wallet"><Wallet className="h-4 w-4 mr-1" /> Wallet</Link></Button>
        </div>

        {/* Loans Table */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader><CardTitle className="text-lg">My Loans</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loans.length === 0 ? <p className="text-muted-foreground text-sm">No loans yet.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead className="hidden sm:table-cell">Total Repayment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => {
                    const totalRepayment = calculateTotalRepayment(Number(loan.principal_amount), Number(loan.duration_months));
                    const isPaying = payingLoanId === loan.id;
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="text-sm">{formatKES(Number(loan.principal_amount))}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{loan.duration_months}mo</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{formatKES(totalRepayment)}</TableCell>
                        <TableCell><Badge className={`${getStatusColor(loan.status)} text-xs`}>{loan.status}</Badge></TableCell>
                        <TableCell>
                          {loan.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="h-7 text-xs" disabled={isPaying}>
                                  {isPaying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pay'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Loan Repayment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <span className="block">You are about to repay:</span>
                                    <span className="block font-semibold text-foreground mt-1">{formatKES(totalRepayment)}</span>
                                    <span className="block text-xs mt-1">
                                      Principal: {formatKES(Number(loan.principal_amount))} + Interest + Fees
                                    </span>
                                    <span className="block text-xs mt-1">
                                      Your wallet balance: {formatKES(Number(profile?.wallet_balance || 0))}
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handlePay(loan)}>Confirm Payment</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {loan.status === 'active' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs ml-1"
                              onClick={() => navigate(`/contract/${loan.id}`)}>
                              Contract
                            </Button>
                          )}
                          {loan.status === 'paid' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs"
                              onClick={() => navigate(`/contract/${loan.id}`)}>
                              View Contract
                            </Button>
                          )}
                          {loan.status === 'pending_collateral' && (
                            <span className="text-xs text-amber-600">Awaiting agent</span>
                          )}
                          {loan.status === 'listed' && (
                            <span className="text-xs text-blue-600">Awaiting funding</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Collateral Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">My Collateral</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {collateral.length === 0 ? <p className="text-muted-foreground text-sm">No collateral submitted.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Brand/Model</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collateral.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        {c.item_type}
                        <span className="block sm:hidden text-xs text-muted-foreground">{c.brand_model}</span>
                        {(c as any).collateral_code && <span className="block sm:hidden text-xs font-mono text-primary">{(c as any).collateral_code}</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{c.brand_model}</TableCell>
                      <TableCell className="text-sm">{formatKES(Number(c.market_value))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-mono">{(c as any).collateral_code || '-'}</TableCell>
                      <TableCell><Badge className={`${getStatusColor(c.status)} text-xs`}>{c.status}</Badge></TableCell>
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

export default BorrowerDashboard;
