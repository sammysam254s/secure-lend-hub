import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { formatKES } from '@/lib/formatters';

const statusColor = (s: string) => {
  switch (s) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'completed': return 'bg-blue-100 text-blue-700';
    case 'defaulted': return 'bg-red-100 text-red-700';
    default: return 'bg-muted text-muted-foreground';
  }
};

const ContractsList = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchContracts();
  }, [profile]);

  const fetchContracts = async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('loan_contracts')
      .select('*, loans(principal_amount, duration_months, status, interest_rate)')
      .order('created_at', { ascending: false });

    if (profile.role === 'borrower') {
      query = query.eq('borrower_id', profile.id);
    } else if (profile.role === 'lender') {
      // Fetch loan IDs where this lender has invested
      const { data: investments } = await supabase
        .from('investments')
        .select('loan_id')
        .eq('lender_id', profile.id);
      const loanIds = (investments || []).map((i: any) => i.loan_id);
      if (loanIds.length === 0) { setContracts([]); setLoading(false); return; }
      query = query.in('loan_id', loanIds);
    }
    // admin sees all — no extra filter

    const { data } = await query;
    setContracts(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Contract Agreements</h1>
        </div>

        {contracts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contracts found.</p>
              {profile?.role === 'borrower' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Contracts are generated once your loan is fully funded.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''} found
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Total Repayment</TableHead>
                    <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />
                          {c.id.slice(0, 8)}…
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatKES(Number(c.principal_amount))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatKES(Number(c.total_repayment))}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(c.due_date).toLocaleDateString('en-KE')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('en-KE')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColor(c.status)} text-xs`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/contract/${c.loan_id}`)}
                          className="gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ContractsList;
