import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShieldCheck, ShieldAlert, Package } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';

const CollateralCheck = () => {
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);

    const { data } = await supabase
      .from('collateral')
      .select(`
        id, item_type, brand_model, market_value, agent_verified_value, status, collateral_code, verification_date, created_at,
        loans(id, status, principal_amount, duration_months)
      `)
      .eq('collateral_code', code.trim().toUpperCase())
      .maybeSingle();

    if (!data) {
      setNotFound(true);
    } else {
      setResult(data);
    }
    setSearching(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { icon: <ShieldAlert className="h-5 w-5 text-amber-500" />, label: 'Pending Verification', desc: 'This collateral is awaiting agent verification.' };
      case 'verified': return { icon: <ShieldCheck className="h-5 w-5 text-blue-500" />, label: 'Verified & Held', desc: 'This collateral has been verified and is currently held as security for an active loan.' };
      case 'released': return { icon: <Package className="h-5 w-5 text-green-500" />, label: 'Released', desc: 'This collateral has been released back to the owner.' };
      default: return { icon: <ShieldAlert className="h-5 w-5 text-muted-foreground" />, label: status, desc: '' };
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Collateral Status Check</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter a collateral code to check its current status</p>
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. SL-ABCD1234"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 font-mono"
              />
              <Button onClick={handleSearch} disabled={searching || !code.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <ShieldAlert className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-destructive">Collateral Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">No collateral exists with code "{code}". Please verify the code and try again.</p>
            </CardContent>
          </Card>
        )}

        {result && (() => {
          const info = getStatusInfo(result.status);
          const loan = Array.isArray(result.loans) ? result.loans[0] : result.loans;
          return (
            <Card className="border-0 shadow-sm">
              <CardHeader className="text-center pb-2">
                {info.icon}
                <CardTitle className="text-lg mt-2">{info.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{info.desc}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">{result.collateral_code}</span>
                  <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Item Type</p>
                    <p className="font-medium">{result.item_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Brand / Model</p>
                    <p className="font-medium">{result.brand_model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Verified Value</p>
                    <p className="font-medium">{formatKES(Number(result.agent_verified_value || result.market_value))}</p>
                  </div>
                  {result.verification_date && (
                    <div>
                      <p className="text-muted-foreground text-xs">Verified On</p>
                      <p className="font-medium">{new Date(result.verification_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {loan && (
                  <>
                    <hr />
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">Associated Loan</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground text-xs">Amount</p>
                          <p className="font-medium">{formatKES(Number(loan.principal_amount))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Loan Status</p>
                          <Badge className={`${getStatusColor(loan.status)} text-xs`}>{loan.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
                  Verified by SecureLend Kenya • {result.verification_date ? new Date(result.verification_date).toLocaleString() : 'Pending'}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </Layout>
  );
};

export default CollateralCheck;
