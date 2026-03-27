import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const contractId = url.searchParams.get("id");

  if (!contractId) {
    return new Response(
      buildPage("Invalid Request", `<p style="color:#666;">No contract ID provided.</p>`, true),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: contract } = await supabase
      .from("loan_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (!contract) {
      return new Response(
        buildPage("Contract Not Found", `<p style="color:#666;">This contract ID does not exist in our system.</p><p style="color:#aaa;font-size:12px;margin-top:8px;">ID: ${contractId}</p>`, true),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Log verification
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] || "unknown";
    await supabase.from("contract_verifications").insert({
      contract_id: contractId,
      verified_by_ip: ip,
      user_agent: req.headers.get("user-agent") || "unknown",
      verification_method: "qr_scan",
    });

    // Fetch all data in parallel
    const [borrowerRes, kycRes, loanRes] = await Promise.all([
      supabase.from("users").select("username, email, phone_number, first_name, last_name").eq("id", contract.borrower_id).single(),
      supabase.from("kyc_verifications").select("full_name, id_number, date_of_birth, selfie_image_url").eq("user_id", contract.borrower_id).single(),
      supabase.from("loans").select("*, collateral:collateral_id(item_type, brand_model, market_value)").eq("id", contract.loan_id).single(),
    ]);

    const borrower = borrowerRes.data;
    const kyc = kycRes.data;
    const loan = loanRes.data;
    const collateral = loan?.collateral as any;

    const formatKES = (n: number) =>
      `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

    // Fetch lenders
    const lenderIds = Array.isArray(contract.lender_ids) ? contract.lender_ids : [];
    let lenderHtml = "";
    if (lenderIds.length > 0) {
      const [lendersRes, investmentsRes] = await Promise.all([
        supabase.from("users").select("id, username, email").in("id", lenderIds),
        supabase.from("investments").select("lender_id, amount_invested").eq("loan_id", contract.loan_id),
      ]);
      const lenders = lendersRes.data || [];
      const investments = investmentsRes.data || [];

      lenderHtml = lenders.map((l: any) => {
        const inv = investments.find((i: any) => i.lender_id === l.id);
        return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
          <div><strong>${l.username}</strong><br><span style="font-size:12px;color:#666;">${l.email}</span></div>
          <div style="text-align:right;font-weight:600;">${inv ? formatKES(Number(inv.amount_invested)) : 'N/A'}</div>
        </div>`;
      }).join("");
    }

    const verifiedDate = new Date().toLocaleString("en-KE", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const borrowerName = kyc?.full_name || `${borrower?.first_name || ''} ${borrower?.last_name || ''}`.trim() || 'N/A';
    const statusClass = contract.status === 'active' ? 'color:#2e7d32;' : 'color:#d32f2f;';

    const body = `
      <div style="text-align:center;padding:28px 20px;background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:16px 16px 0 0;">
        <div style="font-size:56px;margin-bottom:8px;">&#10004;</div>
        <h1 style="color:white;font-size:22px;margin:0 0 4px;">Contract Verified</h1>
        <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">This is an authentic P2P Secure-Lend Kenya contract</p>
        <span style="display:inline-block;background:rgba(255,255,255,0.2);color:white;padding:4px 14px;border-radius:20px;font-size:12px;margin-top:10px;">&#128274; Digitally Verified</span>
      </div>

      <div style="padding:16px 20px;border-bottom:1px solid #eee;">
        <h2 style="font-size:12px;text-transform:uppercase;color:#2e7d32;font-weight:700;letter-spacing:0.5px;margin:0 0 12px;">Contract Details</h2>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Contract ID</span><span style="font-weight:600;font-size:11px;word-break:break-all;max-width:55%;text-align:right;">${contract.id}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Status</span><span style="font-weight:700;${statusClass}">${(contract.status || 'active').toUpperCase()}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Created</span><span style="font-weight:600;">${formatDate(contract.created_at)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Due Date</span><span style="font-weight:600;">${formatDate(contract.due_date)}</span></div>
      </div>

      <div style="padding:16px 20px;border-bottom:1px solid #eee;">
        <h2 style="font-size:12px;text-transform:uppercase;color:#2e7d32;font-weight:700;letter-spacing:0.5px;margin:0 0 12px;">Borrower Information</h2>
        ${kyc?.selfie_image_url ? `<div style="text-align:center;margin-bottom:12px;"><img src="${kyc.selfie_image_url}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid #2e7d32;" alt="Borrower" /></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Full Name</span><span style="font-weight:600;">${borrowerName}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">ID Number</span><span style="font-weight:600;">${kyc?.id_number || 'N/A'}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Phone</span><span style="font-weight:600;">${borrower?.phone_number || 'N/A'}</span></div>
      </div>

      <div style="padding:16px 20px;border-bottom:1px solid #eee;">
        <h2 style="font-size:12px;text-transform:uppercase;color:#2e7d32;font-weight:700;letter-spacing:0.5px;margin:0 0 12px;">Financial Summary</h2>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Principal Amount</span><span style="font-weight:600;">${formatKES(Number(contract.principal_amount))}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:14px;background:#e8f5e9;border-radius:8px;margin-top:4px;"><span style="font-weight:700;">Total Repayment</span><span style="font-weight:700;color:#1b5e20;font-size:16px;">${formatKES(Number(contract.total_repayment))}</span></div>
      </div>

      ${collateral ? `
      <div style="padding:16px 20px;border-bottom:1px solid #eee;">
        <h2 style="font-size:12px;text-transform:uppercase;color:#2e7d32;font-weight:700;letter-spacing:0.5px;margin:0 0 12px;">Collateral</h2>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Item</span><span style="font-weight:600;">${collateral.item_type} - ${collateral.brand_model}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#666;">Market Value</span><span style="font-weight:600;">${formatKES(Number(collateral.market_value))}</span></div>
      </div>
      ` : ''}

      ${lenderHtml ? `
      <div style="padding:16px 20px;border-bottom:1px solid #eee;">
        <h2 style="font-size:12px;text-transform:uppercase;color:#2e7d32;font-weight:700;letter-spacing:0.5px;margin:0 0 12px;">Lenders / Investors</h2>
        ${lenderHtml}
      </div>
      ` : ''}

      <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
        <p style="margin:0;">Verified on ${verifiedDate}</p>
        <p style="margin:4px 0 0;font-weight:600;color:#666;">P2P Secure-Lend Kenya &copy; ${new Date().getFullYear()}</p>
        <p style="margin:2px 0 0;">Kenya's Trusted Peer-to-Peer Lending Platform</p>
      </div>
    `;

    return new Response(buildPage("Contract Verified", body, false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("verify-contract error:", err);
    return new Response(
      buildPage("Server Error", `<p style="color:#666;">Something went wrong while verifying this contract.</p><p style="color:#aaa;font-size:11px;margin-top:8px;">${err?.message || 'Unknown error'}</p>`, true),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});

function buildPage(title: string, content: string, isError: boolean): string {
  const headerBg = isError ? '#d32f2f' : '#2e7d32';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - P2P Secure-Lend Kenya</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f4f0; padding: 16px; color: #333; -webkit-font-smoothing: antialiased; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  </style>
</head>
<body>
  <div class="container">
    ${isError ? `<div style="text-align:center;padding:40px 20px;"><h1 style="color:${headerBg};font-size:20px;margin-bottom:8px;">${title}</h1>${content}</div>` : content}
  </div>
</body>
</html>`;
}
