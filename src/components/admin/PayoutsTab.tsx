import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Loader2 } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';
import { toast } from 'sonner';

interface PayoutsTabProps {
  commissions: any[];
  users: any[];
  onRefresh: () => void;
}

const PayoutsTab = ({ commissions, users, onRefresh }: PayoutsTabProps) => {
  const [processing, setProcessing] = useState<string | null>(null);

  const getAgentName = (agentId: string) => {
    const agent = users.find(u => u.id === agentId);
    return agent ? agent.username : 'Unknown';
  };

  const handlePayout = async (commission: any) => {
    setProcessing(commission.id);
    try {
      await supabase.from('commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', commission.id);

      const agent = users.find(u => u.id === commission.agent_id);
      if (agent) {
        const newBalance = Number(agent.wallet_balance || 0) + Number(commission.amount);
        await supabase.from('users').update({
          wallet_balance: newBalance,
          total_earnings: Number(agent.total_earnings || 0) + Number(commission.amount),
        }).eq('id', commission.agent_id);

        await supabase.from('wallet_transactions').insert({
          user_id: commission.agent_id,
          transaction_type: 'commission_payout',
          amount: commission.amount,
          balance_after: newBalance,
          description: `Commission payout for loan`,
        });
      }

      toast.success('Payout processed successfully');
      onRefresh();
    } catch {
      toast.error('Failed to process payout');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const paidCommissions = commissions.filter(c => c.status === 'paid');

  return (
    <Card className="border-0 shadow-sm mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Agent Payouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-sm">Pending Payouts ({pendingCommissions.length})</h3>
          {pendingCommissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending payouts</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCommissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{getAgentName(c.agent_id)}</TableCell>
                      <TableCell className="text-sm">{formatKES(Number(c.amount))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" className="h-7 text-xs" onClick={() => handlePayout(c)} disabled={processing === c.id}>
                          {processing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3 mr-1" />}
                          {processing === c.id ? '...' : 'Pay'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-sm">Completed Payouts ({paidCommissions.length})</h3>
          {paidCommissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed payouts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Paid At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidCommissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{getAgentName(c.agent_id)}</TableCell>
                      <TableCell className="text-sm">{formatKES(Number(c.amount))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Badge className={`${getStatusColor('active')} text-xs`}>Paid</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutsTab;
