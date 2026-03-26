import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const AgentDashboard = () => {
  const [collateral, setCollateral] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data } = await supabase.from('collateral').select('*, users!collateral_user_id_fkey(username, email)').eq('status', 'pending');
    setCollateral(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, status: string) => {
    await supabase.from('collateral').update({ status, verification_date: new Date().toISOString() }).eq('id', id);

    if (status === 'verified') {
      // Find loan with this collateral and set to listed
      await supabase.from('loans').update({ status: 'listed' }).eq('collateral_id', id).eq('status', 'pending_collateral');
    }
    fetchData();
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Pending Collateral Verifications</CardTitle></CardHeader>
          <CardContent>
            {collateral.length === 0 ? <p className="text-muted-foreground">No pending collateral.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand/Model</TableHead>
                    <TableHead>Market Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collateral.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.users?.username || 'N/A'}</TableCell>
                      <TableCell>{c.item_type}</TableCell>
                      <TableCell>{c.brand_model}</TableCell>
                      <TableCell>{formatKES(Number(c.market_value))}</TableCell>
                      <TableCell><Badge className={getStatusColor(c.status)}>{c.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAction(c.id, 'verified')}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, 'released')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
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

export default AgentDashboard;
