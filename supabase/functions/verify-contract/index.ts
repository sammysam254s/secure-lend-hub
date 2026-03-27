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
      `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:Arial;text-align:center;padding:40px;">
        <h1 style="color:#d32f2f;">Invalid Request</h1>
        <p>No contract ID provided.</p>
      </body></html>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }

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
      `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:Arial;text-align:center;padding:40px;background:#f5f5f5;">
        <div style="max-width:500px;margin:0 auto;background:white;border:2px solid #d32f2f;border-radius:12px;padding:30px;">
          <h1 style="color:#d32f2f;">❌ Contract Not Found</h1>
          <p>This contract ID does not exist in our system.</p>
          <p style="color:#999;font-size:12px;">ID: ${contractId}</p>
        </div>
      </body></html>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
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

  // Fetch borrower details
  const { data: borrower } = await supabase
    .from("users")
    .select("username, email, phone_number, first_name, last_name")
    .eq("id", contract.borrower_id)
    .single();

  // Fetch borrower KYC
  const { data: kyc } = await supabase
    .from("kyc_verifications")
    .select("full_name, id_number, date_of_birth, selfie_image_url")
    .eq("user_id", contract.borrower_id)
    .single();

  // Fetch loan details
  const { data: loan } = await supabase
    .from("loans")
    .select("*, collateral:collateral_id(item_type, brand_model, market_value)")
    .eq("id", contract.loan_id)
    .single();

  // Fetch lender details
  const lenderIds = Array.isArray(contract.lender_ids) ? contract.lender_ids : [];
  let lenderRows = "";
  if (lenderIds.length > 0) {
    const { data: lenders } = await supabase
      .from("users")
      .select("username, email")
      .in("id", lenderIds);
    
    const { data: investments } = await supabase
      .from("investments")
      .select("lender_id, amount_invested")
      .eq("loan_id", contract.loan_id);

    lenderRows = (lenders || []).map((l: any) => {
      const inv = (investments || []).find((i: any) => i.lender_id === l.id);
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${l.username}</td>
        <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${l.email}</td>
        <td style="padding:8px;border-bottom:1px solid #e0e0e0;text-align:right;">${inv ? formatKES(Number(inv.amount_invested)) : 'N/A'}</td>
      </tr>`;
    }).join("");
  }

  const formatKES = (n: number) =>
    `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const verifiedDate = new Date().toLocaleString("en-KE", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const collateral = loan?.collateral as any;

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Contract Verified — P2P Secure-Lend Kenya</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f4f0; padding: 16px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2e7d32, #43a047); color: white; padding: 24px; text-align: center; }
    .header h1 { font-size: 20px; margin-bottom: 4px; }
    .header .tick { font-size: 48px; margin-bottom: 8px; }
    .header .subtitle { font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 8px; }
    .section { padding: 16px 20px; border-bottom: 1px solid #e8e8e8; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #2e7d32; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.5px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .row .label { color: #666; }
    .row .value { font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
    .status-active { color: #2e7d32; }
    .status-other { color: #d32f2f; }
    .highlight-row { background: #e8f5e9; margin: 0 -20px; padding: 8px 20px; border-radius: 4px; }
    table { width: 100%; font-size: 12px; border-collapse: collapse; }
    th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #999; }
    .selfie { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #2e7d32; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="tick">✅</div>
      <h1>Contract Verified</h1>
      <p class="subtitle">This is an authentic P2P Secure-Lend Kenya contract</p>
      <span class="badge">🔒 Digitally Verified</span>
    </div>

    <div class="section">
      <div class="section-title">Contract Details</div>
      <div class="row"><span class="label">Contract ID</span><span class="value" style="font-size:11px;">${contract.id}</span></div>
      <div class="row"><span class="label">Status</span><span class="value ${contract.status === 'active' ? 'status-active' : 'status-other'}">${(contract.status || 'active').toUpperCase()}</span></div>
      <div class="row"><span class="label">Created</span><span class="value">${new Date(contract.created_at).toLocaleDateString("en-KE")}</span></div>
      <div class="row"><span class="label">Due Date</span><span class="value">${new Date(contract.due_date).toLocaleDateString("en-KE", { dateStyle: "long" })}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Borrower Information</div>
      ${kyc?.selfie_image_url ? `<div style="text-align:center;"><img src="${kyc.selfie_image_url}" class="selfie" alt="Borrower" /></div>` : ''}
      <div class="row"><span class="label">Full Name</span><span class="value">${kyc?.full_name || `${borrower?.first_name || ''} ${borrower?.last_name || ''}`.trim() || 'N/A'}</span></div>
      <div class="row"><span class="label">ID Number</span><span class="value">${kyc?.id_number || 'N/A'}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${borrower?.phone_number || 'N/A'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Financial Summary</div>
      <div class="row"><span class="label">Principal Amount</span><span class="value">${formatKES(Number(contract.principal_amount))}</span></div>
      <div class="row highlight-row"><span class="label"><strong>Total Repayment</strong></span><span class="value" style="color:#1b5e20;font-size:15px;"><strong>${formatKES(Number(contract.total_repayment))}</strong></span></div>
    </div>

    ${collateral ? `
    <div class="section">
      <div class="section-title">Collateral</div>
      <div class="row"><span class="label">Item</span><span class="value">${collateral.item_type} — ${collateral.brand_model}</span></div>
      <div class="row"><span class="label">Market Value</span><span class="value">${formatKES(Number(collateral.market_value))}</span></div>
    </div>
    ` : ''}

    ${lenderRows ? `
    <div class="section">
      <div class="section-title">Lenders / Investors</div>
      <table>
        <thead><tr><th>Username</th><th>Email</th><th style="text-align:right;">Invested</th></tr></thead>
        <tbody>${lenderRows}</tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>✅ Verified on ${verifiedDate}</p>
      <p style="margin-top:4px;">P2P Secure-Lend Kenya &copy; ${new Date().getFullYear()}</p>
      <p style="margin-top:2px;">Kenya's Trusted Peer-to-Peer Lending Platform</p>
    </div>
  </div>
</body>
</html>`,
    { headers: { ...corsHeaders, "Content-Type": "text/html" } }
  );
});
