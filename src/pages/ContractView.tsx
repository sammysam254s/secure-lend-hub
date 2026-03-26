import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, FileText, CheckCircle } from 'lucide-react';

const ContractView = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const { profile } = useAuth();
  const [contractHtml, setContractHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!loanId) return;
    checkExistingContract();
  }, [loanId]);

  const checkExistingContract = async () => {
    const { data } = await supabase
      .from('loan_contracts')
      .select('*')
      .eq('loan_id', loanId!)
      .maybeSingle();

    if (data) {
      setContract(data);
      // Re-generate the HTML for display
      await generateContract();
    } else {
      await generateContract();
    }
  };

  const generateContract = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-contract', {
        body: { loan_id: loanId },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setContractHtml(data.html);
      setContract({ id: data.contract_id });
    } catch (err: any) {
      setError(err.message || 'Failed to generate contract');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!contractHtml) return;
    const blob = new Blob([contractHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `P2P-SecureLend-Contract-${contract?.id || loanId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.print();
  };

  if (loading || generating) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{generating ? 'Generating contract...' : 'Loading...'}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-sm max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={generateContract}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Loan Contract</h1>
            {contract && (
              <span className="flex items-center gap-1 text-sm text-success">
                <CheckCircle className="h-4 w-4" /> Verified
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <FileText className="h-4 w-4 mr-1" /> Print / Save PDF
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {contractHtml && (
              <iframe
                ref={iframeRef}
                srcDoc={contractHtml}
                className="w-full border-0 rounded-lg"
                style={{ minHeight: '80vh' }}
                title="Loan Contract"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ContractView;
