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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Borrower Dashboard</h1>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: 'Active Loans', value: activeLoans, icon: CreditCard },
            { label: 'Pending Collateral', value: pendingCollateral, icon: Package },
            { label: 'Total Borrowed', value: formatKES(totalBorrowed), icon: DollarSign },
            { label: 'Wallet Balance', value: formatKES(Number(profile?.wallet_balance || 0)), icon: Wallet },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button asChild><Link to="/borrower/loan-apply"><Plus className="h-4 w-4 mr-1" /> Apply for Loan</Link></Button>
          <Button variant="outline" asChild><Link to="/borrower/collateral-submit"><Package className="h-4 w-4 mr-1" /> Submit Collateral</Link></Button>
          <Button variant="outline" asChild><Link to="/kyc"><FileCheck className="h-4 w-4 mr-1" /> KYC Verification</Link></Button>
        </div>

        {/* Loans Table */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader><CardTitle>My Loans</CardTitle></CardHeader>
          <CardContent>
            {loans.length === 0 ? <p className="text-muted-foreground">No loans yet.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Funded</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id}>
                      <TableCell>{formatKES(Number(loan.principal_amount))}</TableCell>
                      <TableCell>{loan.duration_months} months</TableCell>
                      <TableCell>{loan.interest_rate}%</TableCell>
                      <TableCell>{formatKES(Number(loan.funded_amount || 0))}</TableCell>
                      <TableCell><Badge className={getStatusColor(loan.status)}>{loan.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Collateral Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>My Collateral</CardTitle></CardHeader>
          <CardContent>
            {collateral.length === 0 ? <p className="text-muted-foreground">No collateral submitted.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand/Model</TableHead>
                    <TableHead>Market Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collateral.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.item_type}</TableCell>
                      <TableCell>{c.brand_model}</TableCell>
                      <TableCell>{formatKES(Number(c.market_value))}</TableCell>
                      <TableCell><Badge className={getStatusColor(c.status)}>{c.status}</Badge></TableCell>
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
