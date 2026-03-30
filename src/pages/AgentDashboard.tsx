import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, Pencil, User, Search, ShieldCheck, Package } from 'lucide-react';
import { formatKES, calculateMaxLoanAmount, getStatusColor } from '@/lib/formatters';
import { toast } from 'sonner';

const generateCollateralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SL-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const AgentDashboard = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Release tab state
  const [releaseCode, setReleaseCode] = useState('');
  const [releaseSearching, setReleaseSearching] = useState(false);
  const [releaseResult, setReleaseResult] = useState<any>(null);
  const [releasing, setReleasing] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase
      .from('collateral')
      .select(`
        *,
        users!collateral_user_id_fkey(username, email, phone_number, national_id, first_name, last_name),
        loans(id, principal_amount, duration_months, status)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (collateral: any) => {
    setActionLoading(collateral.id);
    const finalValue = editingId === collateral.id && editValue
      ? Number(editValue)
      : Number(collateral.market_value);

    const collateralCode = generateCollateralCode();

    const { error: collErr } = await supabase.from('collateral').update({
      status: 'verified',
      agent_verified_value: finalValue,
      market_value: finalValue,
      verification_date: new Date().toISOString(),
      collateral_code: collateralCode,
    }).eq('id', collateral.id);

    if (collErr) { toast.error(collErr.message); setActionLoading(null); return; }

    const loan = Array.isArray(collateral.loans) ? collateral.loans[0] : collateral.loans;
    if (loan) {
      const maxLoanFromAgent = calculateMaxLoanAmount(finalValue);
      const cappedPrincipal = Math.min(Number(loan.principal_amount), maxLoanFromAgent);
      
      await supabase.from('loans').update({ 
        status: 'listed',
        principal_amount: cappedPrincipal,
      })
        .eq('id', loan.id)
        .eq('status', 'pending_collateral');

      if (profile?.id) {
        const commissionAmount = finalValue * 0.005;
        await supabase.from('commissions').insert({
          agent_id: profile.id,
          loan_id: loan.id,
          amount: commissionAmount,
          status: 'pending',
        });
      }
    }

    toast.success(`Collateral verified! Code: ${collateralCode}`);
    setEditingId(null);
    setEditValue('');
    setActionLoading(null);
    fetchData();
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await supabase.from('collateral').update({
      status: 'released',
      verification_date: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('loans').update({ status: 'cancelled' })
      .eq('collateral_id', id)
      .eq('status', 'pending_collateral');

    toast.success('Collateral rejected');
    setActionLoading(null);
    fetchData();
  };

  // Release flow
  const handleSearchRelease = async () => {
    if (!releaseCode.trim()) return;
    setReleaseSearching(true);
    setReleaseResult(null);

    const { data, error } = await supabase
      .from('collateral')
      .select(`
        *,
        users!collateral_user_id_fkey(id, username, email, phone_number, national_id, first_name, last_name),
        loans(id, status, principal_amount)
      `)
      .eq('collateral_code', releaseCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast.error('Collateral not found with that code');
      setReleaseSearching(false);
      return;
    }
    setReleaseResult(data);
    setReleaseSearching(false);
  };

  const handleRelease = async () => {
    if (!releaseResult) return;
    setReleasing(true);

    const loan = Array.isArray(releaseResult.loans) ? releaseResult.loans[0] : releaseResult.loans;
    if (!loan || loan.status !== 'paid') {
      toast.error('Loan is not fully paid. Cannot release collateral.');
      setReleasing(false);
      return;
    }

    await supabase.from('collateral').update({ status: 'released' }).eq('id', releaseResult.id);
    toast.success('Collateral released to borrower successfully!');
    setReleasing(false);
    setReleaseResult(null);
    setReleaseCode('');
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Agent Dashboard</h1>

        <Tabs defaultValue="verify">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="verify" className="text-xs sm:text-sm"><ShieldCheck className="h-4 w-4 mr-1" /> Verify</TabsTrigger>
            <TabsTrigger value="release" className="text-xs sm:text-sm"><Package className="h-4 w-4 mr-1" /> Release</TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Pending Collateral Verifications
                  {items.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending collateral to verify.</p>
                ) : (
                  <div className="space-y-4">
                    {items.map(c => {
                      const borrower = c.users;
                      const loan = Array.isArray(c.loans) ? c.loans[0] : c.loans;
                      const isEditing = editingId === c.id;
                      const displayValue = isEditing ? Number(editValue || c.market_value) : Number(c.market_value);
                      const maxLoan = calculateMaxLoanAmount(displayValue);
                      const isActioning = actionLoading === c.id;

                      return (
                        <Card key={c.id} className="border shadow-none">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="text-sm space-y-0.5">
                                <p className="font-medium">
                                  {borrower?.first_name || borrower?.last_name
                                    ? `${borrower.first_name || ''} ${borrower.last_name || ''}`.trim()
                                    : borrower?.username}
                                </p>
                                <p className="text-muted-foreground text-xs">{borrower?.email}</p>
                                <p className="text-muted-foreground text-xs">Phone: {borrower?.phone_number}</p>
                                <p className="text-muted-foreground text-xs">National ID: {borrower?.national_id}</p>
                              </div>
                            </div>

                            <hr />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Item</p>
                                <p className="font-medium">{c.item_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Brand / Model</p>
                                <p className="font-medium">{c.brand_model}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Borrower's Estimated Value</p>
                                <p className="font-medium">{formatKES(Number(c.market_value))}</p>
                              </div>
                              {loan && (
                                <div>
                                  <p className="text-muted-foreground text-xs">Requested Loan</p>
                                  <p className="font-medium">{formatKES(Number(loan.principal_amount))} / {loan.duration_months}mo</p>
                                </div>
                              )}
                            </div>

                            <div className="rounded-md bg-muted p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Agent Assessed Market Value (KES)</Label>
                                {!isEditing && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2"
                                    onClick={() => { setEditingId(c.id); setEditValue(String(c.market_value)); }}>
                                    <Pencil className="h-3 w-3" /> Edit
                                  </Button>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm" autoFocus />
                                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEditingId(null); setEditValue(''); }}>Cancel</Button>
                                </div>
                              ) : (
                                <p className="text-sm font-semibold">{formatKES(displayValue)}</p>
                              )}
                              <p className="text-xs text-muted-foreground">Max loan at this value: <strong>{formatKES(maxLoan)}</strong></p>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1" disabled={isActioning} onClick={() => handleApprove(c)}>
                                {isActioning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                Verify & List Loan
                              </Button>
                              <Button size="sm" variant="destructive" className="flex-1" disabled={isActioning} onClick={() => handleReject(c.id)}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="release">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Release Collateral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Search by collateral code to verify borrower and release their collateral.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter collateral code (e.g. SL-ABCD1234)"
                    value={releaseCode}
                    onChange={e => setReleaseCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchRelease} disabled={releaseSearching || !releaseCode.trim()}>
                    {releaseSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {releaseResult && (
                  <Card className="border">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-mono">{releaseResult.collateral_code}</Badge>
                        <Badge className={getStatusColor(releaseResult.status)}>{releaseResult.status}</Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <p className="font-semibold">Borrower Details</p>
                        <p>Name: {releaseResult.users?.first_name} {releaseResult.users?.last_name}</p>
                        <p>Username: {releaseResult.users?.username}</p>
                        <p>Email: {releaseResult.users?.email}</p>
                        <p>Phone: {releaseResult.users?.phone_number}</p>
                        <p>National ID: {releaseResult.users?.national_id}</p>
                      </div>

                      <hr />

                      <div className="text-sm space-y-1">
                        <p className="font-semibold">Collateral Details</p>
                        <p>Item: {releaseResult.item_type} - {releaseResult.brand_model}</p>
                        <p>Value: {formatKES(Number(releaseResult.agent_verified_value || releaseResult.market_value))}</p>
                      </div>

                      {(() => {
                        const loan = Array.isArray(releaseResult.loans) ? releaseResult.loans[0] : releaseResult.loans;
                        const isPaid = loan?.status === 'paid';
                        return (
                          <>
                            <div className={`rounded-md p-3 text-sm ${isPaid ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                              <p className="font-semibold">{isPaid ? '✅ Loan Fully Paid' : '❌ Loan NOT Fully Paid'}</p>
                              <p>Loan Amount: {formatKES(Number(loan?.principal_amount || 0))}</p>
                              <p>Status: {loan?.status || 'N/A'}</p>
                            </div>

                            {releaseResult.status === 'verified' && isPaid && (
                              <Button className="w-full" onClick={handleRelease} disabled={releasing}>
                                {releasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Confirm Release to Borrower
                              </Button>
                            )}
                            {releaseResult.status === 'released' && (
                              <p className="text-center text-sm text-muted-foreground">This collateral has already been released.</p>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
