import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, CreditCard, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [usersRes, loansRes, collateralRes, kycRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('collateral').select('*'),
      supabase.from('kyc_verifications').select('*'),
    ]);
    setUsers(usersRes.data || []);
    setLoans(loansRes.data || []);
    setCollateral(collateralRes.data || []);
    setKyc(kycRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleKycAction = async (id: string, status: string) => {
    await supabase.from('kyc_verifications').update({ status, verified_at: status === 'verified' ? new Date().toISOString() : null }).eq('id', id);
    fetchData();
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  const totalInvested = loans.reduce((s, l) => s + Number(l.funded_amount || 0), 0);
  const platformFees = loans.filter(l => ['active', 'paid'].includes(l.status)).reduce((s, l) => s + Number(l.principal_amount) * 0.01, 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: Users },
            { label: 'Total Loans', value: loans.length, icon: CreditCard },
            { label: 'Total Invested', value: formatKES(totalInvested), icon: TrendingUp },
            { label: 'Platform Fees', value: formatKES(platformFees), icon: DollarSign },
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

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="collateral">Collateral</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell><Badge className={getStatusColor(u.role === 'admin' ? 'listed' : 'active')}>{u.role}</Badge></TableCell>
                        <TableCell>{formatKES(Number(u.wallet_balance || 0))}</TableCell>
                        <TableCell>{u.is_active ? '✅' : '❌'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle>All Loans</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Funded</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map(l => (
                      <TableRow key={l.id}>
                        <TableCell>{formatKES(Number(l.principal_amount))}</TableCell>
                        <TableCell>{l.duration_months} months</TableCell>
                        <TableCell>{formatKES(Number(l.funded_amount || 0))}</TableCell>
                        <TableCell><Badge className={getStatusColor(l.status)}>{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collateral">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle>All Collateral</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Brand/Model</TableHead>
                      <TableHead>Value</TableHead>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle>KYC Verifications</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kyc.map(k => (
                      <TableRow key={k.id}>
                        <TableCell>{k.full_name}</TableCell>
                        <TableCell>{k.id_number}</TableCell>
                        <TableCell>{k.date_of_birth}</TableCell>
                        <TableCell><Badge className={getStatusColor(k.status)}>{k.status}</Badge></TableCell>
                        <TableCell>
                          {k.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleKycAction(k.id, 'verified')}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleKycAction(k.id, 'rejected')}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
