import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import PayoutsTab from '@/components/admin/PayoutsTab';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [usersRes, loansRes, collateralRes, kycRes, commissionsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('collateral').select('*'),
      supabase.from('kyc_verifications').select('*'),
      supabase.from('commissions').select('*'),
    ]);
    setUsers(usersRes.data || []);
    setLoans(loansRes.data || []);
    setCollateral(collateralRes.data || []);
    setKyc(kycRes.data || []);
    setCommissions(commissionsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleKycAction = async (id: string, status: string) => {
    await supabase.from('kyc_verifications').update({ status, verified_at: status === 'verified' ? new Date().toISOString() : null }).eq('id', id);
    fetchData();
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  const totalInvested = loans.reduce((s, l) => s + Number(l.funded_amount || 0), 0);
  const activeLoans = loans.filter(l => ['active', 'paid'].includes(l.status));
  const platformFees = activeLoans.reduce((s, l) => s + Number(l.principal_amount) * 0.02, 0);
  const lenderPlatformFees = activeLoans.filter(l => l.status === 'paid').reduce((s, l) => s + Number(l.principal_amount) * 0.02, 0);
  const totalPlatformFees = platformFees + lenderPlatformFees;
  const insurancePool = activeLoans.reduce((s, l) => s + Number(l.principal_amount) * 0.01, 0);

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>

        <AdminStats usersCount={users.length} loansCount={loans.length} totalInvested={totalInvested} platformFees={totalPlatformFees} insurancePool={insurancePool} />

        <Tabs defaultValue="users">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="users" className="flex-1 text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="loans" className="flex-1 text-xs sm:text-sm">Loans</TabsTrigger>
            <TabsTrigger value="collateral" className="flex-1 text-xs sm:text-sm">Collateral</TabsTrigger>
            <TabsTrigger value="kyc" className="flex-1 text-xs sm:text-sm">KYC</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 text-xs sm:text-sm">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab users={users} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="loans">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">All Loans</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
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
                    {loans.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{formatKES(Number(l.principal_amount))}</TableCell>
                        <TableCell className="hidden sm:table-cell">{l.duration_months}mo</TableCell>
                        <TableCell className="text-sm">{formatKES(Number(l.funded_amount || 0))}</TableCell>
                        <TableCell><Badge className={`${getStatusColor(l.status)} text-xs`}>{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collateral">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">All Collateral</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
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
                        <TableCell className="text-sm">{c.item_type}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{c.brand_model}</TableCell>
                        <TableCell className="text-sm">{formatKES(Number(c.market_value))}</TableCell>
                        <TableCell><Badge className={`${getStatusColor(c.status)} text-xs`}>{c.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">KYC Verifications</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">ID Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kyc.map(k => (
                      <TableRow key={k.id}>
                        <TableCell className="text-sm">
                          {k.full_name}
                          <span className="block sm:hidden text-xs text-muted-foreground">{k.id_number}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{k.id_number}</TableCell>
                        <TableCell><Badge className={`${getStatusColor(k.status)} text-xs`}>{k.status}</Badge></TableCell>
                        <TableCell>
                          {k.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleKycAction(k.id, 'verified')}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleKycAction(k.id, 'rejected')}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutsTab commissions={commissions} users={users} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
