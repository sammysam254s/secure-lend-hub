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
      `<!DOCTYPE html><html><body style="font-family:Arial;text-align:center;padding:40px;">
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

  // Log verification
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  await supabase.from("contract_verifications").insert({
    contract_id: contractId,
    verified_by_ip: ip,
    user_agent: req.headers.get("user-agent") || "unknown",
    verification_method: "qr_scan",
  });

  if (!contract) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:Arial;text-align:center;padding:40px;">
        <div style="max-width:500px;margin:0 auto;border:2px solid #d32f2f;border-radius:12px;padding:30px;">
          <h1 style="color:#d32f2f;">❌ Contract Not Found</h1>
          <p>This contract ID does not exist in our system.</p>
          <p style="color:#999;font-size:12px;">ID: ${contractId}</p>
        </div>
      </body></html>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }

  const formatKES = (n: number) =>
    `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  return new Response(
    `<!DOCTYPE html><html><body style="font-family:Arial;text-align:center;padding:40px;background:#f5f5f5;">
      <div style="max-width:500px;margin:0 auto;background:white;border:2px solid #2e7d32;border-radius:12px;padding:30px;">
        <h1 style="color:#2e7d32;">✅ Contract Verified</h1>
        <p style="color:#666;">This is an authentic P2P Secure-Lend Kenya contract.</p>
        <hr style="border-color:#e0e0e0;">
        <table style="width:100%;text-align:left;font-size:14px;">
          <tr><td style="padding:6px 0;"><strong>Contract ID:</strong></td><td>${contract.id}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Principal:</strong></td><td>${formatKES(Number(contract.principal_amount))}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Total Repayment:</strong></td><td>${formatKES(Number(contract.total_repayment))}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Due Date:</strong></td><td>${new Date(contract.due_date).toLocaleDateString("en-KE")}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Status:</strong></td><td style="color:${contract.status === "active" ? "#2e7d32" : "#d32f2f"};font-weight:bold;">${contract.status?.toUpperCase()}</td></tr>
        </table>
        <hr style="border-color:#e0e0e0;">
        <p style="font-size:11px;color:#999;">Verified on ${new Date().toLocaleString("en-KE")}</p>
        <p style="font-size:11px;color:#999;">P2P Secure-Lend Kenya &copy; ${new Date().getFullYear()}</p>
      </div>
    </body></html>`,
    { headers: { ...corsHeaders, "Content-Type": "text/html" } }
  );
});
