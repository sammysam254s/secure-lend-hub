import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CreditCard, Package, DollarSign, Wallet, Plus, FileCheck } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const BorrowerDashboard = () => {
  const { profile } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const [loansRes, collateralRes] = await Promise.all([
        supabase.from('loans').select('*').eq('borrower_id', profile.id),
        supabase.from('collateral').select('*').eq('user_id', profile.id),
      ]);
      setLoans(loansRes.data || []);
      setCollateral(collateralRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  const activeLoans = loans.filter(l => l.status === 'active').length;
  const pendingCollateral = collateral.filter(c => c.status === 'pending').length;
  const totalBorrowed = loans.filter(l => ['active', 'paid'].includes(l.status)).reduce((s, l) => s + Number(l.principal_amount), 0);

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Borrower Dashboard</h1>

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
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="text-lg font-bold truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" asChild><Link to="/borrower/loan-apply"><Plus className="h-4 w-4 mr-1" /> Apply for Loan</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/borrower/collateral-submit"><Package className="h-4 w-4 mr-1" /> Submit Collateral</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/kyc"><FileCheck className="h-4 w-4 mr-1" /> KYC Verification</Link></Button>
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
                    <TableHead>Funded</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id}>
                      <TableCell className="text-sm">{formatKES(Number(loan.principal_amount))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{loan.duration_months}mo</TableCell>
                      <TableCell className="text-sm">{formatKES(Number(loan.funded_amount || 0))}</TableCell>
                      <TableCell><Badge className={`${getStatusColor(loan.status)} text-xs`}>{loan.status}</Badge></TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collateral.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        {c.item_type}
                        <span className="block sm:hidden text-xs text-muted-foreground">{c.brand_model}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{c.brand_model}</TableCell>
                      <TableCell className="text-sm">{formatKES(Number(c.market_value))}</TableCell>
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
