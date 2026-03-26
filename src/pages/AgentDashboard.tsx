import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const AgentDashboard = () => {
  const [collateral, setCollateral] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data } = await supabase.from('collateral').select('*').eq('status', 'pending');
    setCollateral(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, status: string) => {
    await supabase.from('collateral').update({ status, verification_date: new Date().toISOString() }).eq('id', id);
    if (status === 'verified') {
      await supabase.from('loans').update({ status: 'listed' }).eq('collateral_id', id).eq('status', 'pending_collateral');
    }
    fetchData();
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Agent Dashboard</h1>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Pending Collateral Verifications</CardTitle></CardHeader>
          <CardContent>
            {collateral.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending collateral.</p>
            ) : (
              <div className="space-y-3">
                {collateral.map(c => (
                  <Card key={c.id} className="border shadow-none">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{c.item_type} — {c.brand_model}</p>
                          <p className="text-sm text-muted-foreground">Value: {formatKES(Number(c.market_value))}</p>
                          <Badge className={`${getStatusColor(c.status)} text-xs mt-1`}>{c.status}</Badge>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="h-8 text-xs" onClick={() => handleAction(c.id, 'verified')}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleAction(c.id, 'released')}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
