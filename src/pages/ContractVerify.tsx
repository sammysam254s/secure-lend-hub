import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ContractData {
  id: string;
  status: string;
  created_at: string;
  due_date: string;
  principal_amount: number;
  total_repayment: number;
  borrower_id: string;
  loan_id: string;
  lender_ids: string[];
}

const formatKES = (n: number) =>
  `KES ${Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

export default function ContractVerify() {
  const [params] = useSearchParams();
  const contractId = params.get("id");
  const [state, setState] = useState<"loading" | "found" | "not_found" | "error">("loading");
  const [contract, setContract] = useState<ContractData | null>(null);
  const [borrower, setBorrower] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loan, setLoan] = useState<any>(null);
  const [lenders, setLenders] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!contractId) { setState("not_found"); return; }
    load();
  }, [contractId]);

  async function load() {
    try {
      const { data: c } = await supabase
        .from("loan_contracts")
        .select("*")
        .eq("id", contractId!)
        .single();

      if (!c) { setState("not_found"); return; }
      setContract(c as ContractData);

      // Log verification
      await supabase.from("contract_verifications").insert({
        contract_id: contractId,
        verification_method: "qr_scan",
      });

      const [borrowerRes, kycRes, loanRes] = await Promise.all([
        supabase.from("users").select("username, email, phone_number, first_name, last_name").eq("id", c.borrower_id).single(),
        supabase.from("kyc_verifications").select("full_name, id_number, selfie_image_url").eq("user_id", c.borrower_id).single(),
        supabase.from("loans").select("*, collateral:collateral_id(item_type, brand_model, market_value)").eq("id", c.loan_id).single(),
      ]);

      setBorrower(borrowerRes.data);
      setKyc(kycRes.data);
      setLoan(loanRes.data);

      const lenderIds = (Array.isArray(c.lender_ids) ? c.lender_ids : []).map(String);
      if (lenderIds.length > 0) {
        const [lendersRes, invRes] = await Promise.all([
          supabase.from("users").select("id, username, email").in("id", lenderIds),
          supabase.from("investments").select("lender_id, amount_invested").eq("loan_id", c.loan_id),
        ]);
        setLenders(lendersRes.data || []);
        setInvestments(invRes.data || []);
      }

      setState("found");
    } catch (e: any) {
      setErrorMsg(e?.message || "Unknown error");
      setState("error");
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4" />
          <p className="text-gray-600">Verifying contract...</p>
        </div>
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Contract Not Found</h1>
          <p className="text-gray-500 text-sm">{contractId ? `No contract found for ID: ${contractId}` : "No contract ID provided."}</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const collateral = loan?.collateral as any;
  const borrowerName = kyc?.full_name || `${borrower?.first_name || ""} ${borrower?.last_name || ""}`.trim() || "N/A";
  const isActive = contract!.status === "active";
  const isCompleted = contract!.status === "completed" || contract!.status === "paid";
  const sealColor = isCompleted ? "text-red-700 border-red-700" : "text-green-700 border-green-700";
  const sealBg = isCompleted ? "bg-red-50" : "bg-green-50";

  return (
    <div className="min-h-screen bg-green-50 py-6 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className={`${isCompleted ? 'bg-gradient-to-br from-red-800 to-red-500' : 'bg-gradient-to-br from-green-800 to-green-500'} text-white text-center py-8 px-6`}>
          <div className="text-5xl mb-2">{isCompleted ? '📋' : '✔'}</div>
          <h1 className="text-xl font-bold mb-1">{isCompleted ? 'Contract Expired' : 'Contract Verified'}</h1>
          <p className={`${isCompleted ? 'text-red-100' : 'text-green-100'} text-sm`}>
            {isCompleted ? 'This contract has been fulfilled — payment honoured by borrower' : 'This is an authentic P2P Secure-Lend Kenya contract'}
          </p>
          <span className="inline-block mt-3 bg-white/20 text-white text-xs px-4 py-1 rounded-full">
            {isCompleted ? '✅ Payment Complete' : '🔒 Digitally Verified'}
          </span>
        </div>

        {/* Official Stamp/Seal */}
        <div className="flex justify-center py-6">
          <div className={`relative w-52 h-52 flex items-center justify-center`}>
            <div className={`absolute w-48 h-48 rounded-full border-4 ${sealColor}`}></div>
            <div className={`absolute w-44 h-44 rounded-full border-2 ${sealColor}`}></div>
            <div className={`text-center z-10 px-4 ${sealColor}`}>
              <p className="text-[8px] font-bold tracking-[3px] uppercase">P2P Secure-Lend</p>
              <p className="text-2xl my-1">🌿</p>
              {isCompleted ? (
                <>
                  <p className="text-sm font-bold tracking-wider text-red-700">EXPIRED</p>
                  <p className="text-[7px] font-bold text-red-600 mt-0.5">PAYMENT HONOURED</p>
                  <p className="text-[7px] font-bold text-red-600">BY BORROWER</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold tracking-wider text-green-700">ACTIVE</p>
                  <p className="text-[7px] font-bold text-green-600 mt-0.5">DIGITALLY VERIFIED</p>
                  <p className="text-[7px] font-bold text-green-600">& SEALED</p>
                </>
              )}
              <div className={`border-t ${sealColor} mx-2 my-1.5`}></div>
              <p className="text-[7px] text-gray-500">{formatDate(contract!.created_at)}</p>
              <p className="text-[7px] text-gray-500">Due: {formatDate(contract!.due_date)}</p>
              <p className="text-[6px] tracking-[2px] uppercase mt-1">Official Digital Seal</p>
            </div>
          </div>
        </div>

        {/* Contract Details */}
        <Section title="Contract Details">
          <Row label="Contract ID"><span className="text-xs break-all">{contract!.id}</span></Row>
          <Row label="Status">
            <span className={`font-bold ${isCompleted ? "text-red-600" : isActive ? "text-green-700" : "text-yellow-600"}`}>
              {isCompleted ? "EXPIRED — PAYMENT HONOURED" : (contract!.status || "active").toUpperCase()}
            </span>
          </Row>
          <Row label="Created">{formatDate(contract!.created_at)}</Row>
          <Row label="Due Date">{formatDate(contract!.due_date)}</Row>
        </Section>

        {/* Borrower */}
        <Section title="Borrower Information">
          {kyc?.selfie_image_url && (
            <div className="flex justify-center mb-3">
              <img src={kyc.selfie_image_url} alt="Borrower" className="w-16 h-16 rounded-full object-cover border-2 border-green-700" />
            </div>
          )}
          <Row label="Full Name">{borrowerName}</Row>
          <Row label="ID Number">{kyc?.id_number || "N/A"}</Row>
          <Row label="Phone">{borrower?.phone_number || "N/A"}</Row>
        </Section>

        {/* Financial Summary */}
        <Section title="Financial Summary">
          <Row label="Principal Amount">{formatKES(Number(contract!.principal_amount))}</Row>
          <div className={`flex justify-between items-center ${sealBg} rounded-lg px-4 py-3 mt-1`}>
            <span className="font-bold text-sm">Total Repayment</span>
            <span className={`font-bold text-base ${isCompleted ? 'text-red-900' : 'text-green-900'}`}>{formatKES(Number(contract!.total_repayment))}</span>
          </div>
        </Section>

        {/* Collateral */}
        {collateral && (
          <Section title="Collateral">
            <Row label="Item">{collateral.item_type} — {collateral.brand_model}</Row>
            <Row label="Market Value">{formatKES(Number(collateral.market_value))}</Row>
          </Section>
        )}

        {/* Lenders */}
        {lenders.length > 0 && (
          <Section title="Lenders / Investors">
            {lenders.map((l: any) => {
              const inv = investments.find((i: any) => i.lender_id === l.id);
              return (
                <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{l.username}</p>
                    <p className="text-xs text-gray-500">{l.email}</p>
                  </div>
                  <span className="font-semibold text-sm">{inv ? formatKES(Number(inv.amount_invested)) : "N/A"}</span>
                </div>
              );
            })}
          </Section>
        )}

        {/* Footer */}
        <div className="text-center py-5 text-gray-400 text-xs">
          <p>Verified on {new Date().toLocaleString("en-KE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <p className="font-semibold text-gray-500 mt-1">P2P Secure-Lend Kenya © {new Date().getFullYear()}</p>
          <p>Kenya's Trusted Peer-to-Peer Lending Platform</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-xs font-bold uppercase tracking-wide text-green-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 text-sm">
      <span className="text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="font-semibold text-right">{children}</span>
    </div>
  );
}
