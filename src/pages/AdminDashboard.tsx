import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Gavel, Download } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';
import AdminStats from '@/components/admin/AdminStats';
import UsersTab from '@/components/admin/UsersTab';
import PayoutsTab from '@/components/admin/PayoutsTab';
import { toast } from 'sonner';

const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) { toast.info('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState<string | null>(null);

  const fetchData = async () => {
    const [usersRes, loansRes, collateralRes, kycRes, commissionsRes, ordersRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('collateral').select('*'),
      supabase.from('kyc_verifications').select('*'),
      supabase.from('commissions').select('*'),
      (supabase as any).from('collateral_orders').select(`
        *,
        collateral_sales(*, collateral(item_type, brand_model, collateral_code, agent_verified_value)),
        buyer:users!collateral_orders_buyer_id_fkey(username, email, phone_number),
        agent:users!collateral_orders_agent_id_fkey(username)
      `).order('created_at', { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setLoans(loansRes.data || []);
    setCollateral(collateralRes.data || []);
    setKyc(kycRes.data || []);
    setCommissions(commissionsRes.data || []);
    setOrders(ordersRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-list overdue loans (due + 7 days)
  useEffect(() => {
    if (loans.length === 0 || collateral.length === 0) return;
    const autoList = async () => {
      const now = new Date();
      const activeFundedLoans = loans.filter(l => l.status === 'active');
      for (const loan of activeFundedLoans) {
        // Check if loan has a contract with a due_date
        const { data: contract } = await supabase.from('loan_contracts')
          .select('due_date').eq('loan_id', loan.id).maybeSingle();
        if (!contract?.due_date) continue;
        const dueDate = new Date(contract.due_date);
        const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPastDue >= 7) {
          // Check if already listed
          const { data: existing } = await supabase.from('collateral_sales')
            .select('id').eq('loan_id', loan.id).maybeSingle();
          if (!existing) {
            // Sale price = total loan amount (principal + interest) + 10%
            const interestRate = Number(loan.interest_rate || 13) / 100;
            const totalLoanAmount = Number(loan.principal_amount) + (Number(loan.principal_amount) * interestRate * Number(loan.duration_months));
            const salePrice = totalLoanAmount * 1.10;
            await supabase.from('collateral_sales').insert({
              collateral_id: loan.collateral_id,
              loan_id: loan.id,
              borrower_id: loan.borrower_id,
              sale_price: salePrice,
            });
          }
        }
      }
    };
    autoList();
  }, [loans, collateral]);

  const handleKycAction = async (id: string, status: string) => {
    await supabase.from('kyc_verifications').update({ status, verified_at: status === 'verified' ? new Date().toISOString() : null }).eq('id', id);
    fetchData();
  };

  const handleListForSale = async (loan: any) => {
    setListingId(loan.id);
    const coll = collateral.find(c => c.id === loan.collateral_id);
    if (!coll) { toast.error('Collateral not found'); setListingId(null); return; }

    const interestRate = Number(loan.interest_rate || 13) / 100;
    const totalLoanAmount = Number(loan.principal_amount) + (Number(loan.principal_amount) * interestRate * Number(loan.duration_months));
    const salePrice = totalLoanAmount * 1.10;

    const { data: existing } = await supabase.from('collateral_sales')
      .select('id').eq('loan_id', loan.id).eq('status', 'listed').maybeSingle();
    if (existing) { toast.info('Already listed for sale'); setListingId(null); return; }

    await supabase.from('collateral_sales').insert({
      collateral_id: loan.collateral_id,
      loan_id: loan.id,
      borrower_id: loan.borrower_id,
      sale_price: salePrice,
    });

    toast.success(`Collateral listed for sale at ${formatKES(salePrice)}`);
    setListingId(null);
    fetchData();
  };

  const downloadPurchasesReport = () => {
    const data = orders.map((o: any) => ({
      'Order ID': o.id,
      'Item': `${o.collateral_sales?.collateral?.item_type} - ${o.collateral_sales?.collateral?.brand_model}`,
      'Collateral Code': o.collateral_sales?.collateral?.collateral_code || '',
      'Sale Price': o.collateral_sales?.sale_price || 0,
      'Buyer': o.buyer?.username || '',
      'Buyer Email': o.buyer?.email || '',
      'Buyer Phone': o.buyer?.phone_number || '',
      'Shipping Address': o.shipping_address || '',
      'Status': o.status,
      'Agent': o.agent?.username || '',
      'Purchased At': o.created_at,
      'Updated At': o.updated_at,
    }));
    downloadCSV(data, `collateral-purchases-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadCollateralReport = () => {
    const verifiedCollateral = collateral.filter(c => c.collateral_code);
    const data = verifiedCollateral.map(c => {
      const agent = users.find(u => u.id === c.verified_by);
      const loan = loans.find(l => l.collateral_id === c.id);
      return {
        'Collateral Code': c.collateral_code,
        'Item Type': c.item_type,
        'Brand/Model': c.brand_model,
        'Market Value': c.agent_verified_value || c.market_value,
        'Status': c.status,
        'Agent': agent?.username || 'N/A',
        'Agent Email': agent?.email || '',
        'Loan Status': loan?.status || 'N/A',
        'Loan Amount': loan?.principal_amount || 0,
        'Listed in Marketplace': collateral.find(cs => cs.id === c.id)?.status === 'sold' ? 'Sold' : 
          loan?.status === 'active' ? 'Check' : 'No',
        'Verification Date': c.verification_date || '',
      };
    });
    downloadCSV(data, `collateral-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  const totalInvested = loans.reduce((s, l) => s + Number(l.funded_amount || 0), 0);
  const activeLoans = loans.filter(l => ['active', 'paid'].includes(l.status));
  const platformFees = activeLoans.reduce((s, l) => s + Number(l.principal_amount) * 0.02, 0);
  const lenderPlatformFees = activeLoans.filter(l => l.status === 'paid').reduce((s, l) => s + Number(l.principal_amount) * 0.02, 0);
  const totalPlatformFees = platformFees + lenderPlatformFees;
  const insurancePool = activeLoans.reduce((s, l) => s + Number(l.principal_amount) * 0.01, 0);
  const overdueLoans = loans.filter(l => l.status === 'active');

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
            <TabsTrigger value="defaults" className="flex-1 text-xs sm:text-sm">Defaults</TabsTrigger>
            <TabsTrigger value="purchases" className="flex-1 text-xs sm:text-sm">Purchases</TabsTrigger>
            <TabsTrigger value="kyc" className="flex-1 text-xs sm:text-sm">KYC</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 text-xs sm:text-sm">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="users"><UsersTab users={users} onRefresh={fetchData} /></TabsContent>

          <TabsContent value="loans">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">All Loans</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Funded</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Collateral</CardTitle>
                <Button size="sm" variant="outline" onClick={downloadCollateralReport}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Brand/Model</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {collateral.map(c => {
                      const agent = users.find(u => u.id === c.verified_by);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{c.item_type}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{c.brand_model}</TableCell>
                          <TableCell className="text-xs font-mono">{c.collateral_code || '-'}</TableCell>
                          <TableCell className="text-sm">{formatKES(Number(c.agent_verified_value || c.market_value))}</TableCell>
                          <TableCell className="text-xs">{agent?.username || '-'}</TableCell>
                          <TableCell><Badge className={`${getStatusColor(c.status)} text-xs`}>{c.status}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defaults">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">Defaulted Loans — List Collateral for Sale</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <p className="text-xs text-muted-foreground mb-3">Loans overdue by 7+ days are auto-listed. Sale price = (principal + total interest) × 1.10</p>
                {overdueLoans.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active loans to process.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Duration</TableHead>
                      <TableHead>Sale Price (+10%)</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {overdueLoans.map(l => {
                        const interestRate = Number(l.interest_rate || 13) / 100;
                        const totalLoanAmount = Number(l.principal_amount) + (Number(l.principal_amount) * interestRate * Number(l.duration_months));
                        const salePrice = totalLoanAmount * 1.10;
                        const isListing = listingId === l.id;
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm">{formatKES(Number(l.principal_amount))}</TableCell>
                            <TableCell className="hidden sm:table-cell">{l.duration_months}mo</TableCell>
                            <TableCell className="text-sm font-semibold text-primary">{formatKES(salePrice)}</TableCell>
                            <TableCell>
                              <Button size="sm" className="h-7 text-xs" disabled={isListing} onClick={() => handleListForSale(l)}>
                                {isListing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Gavel className="h-3 w-3 mr-1" />}
                                List for Sale
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Collateral Purchases</CardTitle>
                <Button size="sm" variant="outline" onClick={downloadPurchasesReport}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No purchases yet.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden sm:table-cell">Code</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead className="hidden sm:table-cell">Price</TableHead>
                      <TableHead>Ship To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Agent</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {orders.map((o: any) => {
                        const coll = o.collateral_sales?.collateral;
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="text-sm">{coll?.item_type} - {coll?.brand_model}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs font-mono">{coll?.collateral_code}</TableCell>
                            <TableCell className="text-sm">{o.buyer?.username}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{formatKES(Number(o.collateral_sales?.sale_price || 0))}</TableCell>
                            <TableCell className="text-xs max-w-[100px] truncate">{o.shipping_address}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${
                                o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>{o.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs">{o.agent?.username || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-lg">KYC Verifications</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">ID Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
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

          <TabsContent value="payouts"><PayoutsTab commissions={commissions} users={users} onRefresh={fetchData} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
