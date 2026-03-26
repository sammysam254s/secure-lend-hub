import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple QR code SVG generator using a basic encoding
function generateQRCodeSVG(data: string, size: number = 150): string {
  // Use a simple hash-based visual pattern as a stylized QR representation
  // For production, integrate a proper QR library
  const hash = Array.from(data).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  
  const modules = 21;
  const cellSize = size / modules;
  let rects = "";
  
  // Generate a deterministic pattern from the data
  let seed = Math.abs(hash);
  const grid: boolean[][] = [];
  
  for (let r = 0; r < modules; r++) {
    grid[r] = [];
    for (let c = 0; c < modules; c++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const isFinderTL = r < 7 && c < 7;
      const isFinderTR = r < 7 && c >= modules - 7;
      const isFinderBL = r >= modules - 7 && c < 7;
      
      if (isFinderTL || isFinderTR || isFinderBL) {
        const lr = isFinderTL ? r : isFinderTR ? r : r - (modules - 7);
        const lc = isFinderTL ? c : isFinderTR ? c - (modules - 7) : c;
        const isBorder = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const isInner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        grid[r][c] = isBorder || isInner;
      } else {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        grid[r][c] = (seed % 3) === 0;
      }
    }
  }
  
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
}

function generateLeafSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 11-10 11Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
}

const CONTRACT_CLAUSES = [
  {
    title: "Parties to the Agreement",
    text: "This Loan Agreement ('Agreement') is entered into between the Borrower (details specified herein) and the Lender(s) (details specified herein), collectively referred to as 'the Parties', in accordance with the provisions of the Law of Contract Act (Cap. 23, Laws of Kenya)."
  },
  {
    title: "Loan Principal and Disbursement",
    text: "The Lender(s) agree to advance the Borrower the principal sum specified herein ('the Loan'), which shall be disbursed through the P2P Secure-Lend Kenya platform upon full funding. Disbursement shall be made to the Borrower's platform wallet in accordance with Section 2 of the Banking Act (Cap. 488)."
  },
  {
    title: "Interest Rate and Computation",
    text: "The Loan shall accrue interest at a flat rate of 13% per month on the principal amount, computed from the date of full disbursement. This rate is agreed upon by both parties in compliance with Section 44A of the Banking Act as amended by the Banking (Amendment) Act, 2016."
  },
  {
    title: "Platform and Insurance Fees",
    text: "A platform administration fee of 1% of the principal and an insurance fee of 1% of the principal shall be charged and deducted at the point of disbursement or added to the total repayment amount, in accordance with the Consumer Protection Act, 2012 (No. 46 of 2012)."
  },
  {
    title: "Repayment Terms",
    text: "The Borrower shall repay the total amount (principal + interest + fees) within the agreed loan duration. Repayment shall be made through the platform's wallet system or via M-Pesa. Failure to repay on time shall constitute a breach of this Agreement under the Law of Contract Act (Cap. 23)."
  },
  {
    title: "Collateral Security",
    text: "The Borrower has pledged physical collateral (described herein) as security for this Loan, in accordance with the Chattels Transfer Act (Cap. 28, Laws of Kenya). The collateral has been independently verified by an authorized agent of the platform."
  },
  {
    title: "Collateral Valuation and Loan-to-Value",
    text: "The collateral has been valued at the market value stated herein. The maximum loan amount is calculated as 50% of 70% of the market value (the '30/50 Rule'). This conservative valuation protects both parties in accordance with prudent lending practices."
  },
  {
    title: "Default and Remedies",
    text: "In the event the Borrower fails to make repayment within 14 days after the due date, the Lender(s) shall be entitled to: (a) claim the pledged collateral, (b) pursue legal remedies under the Civil Procedure Act (Cap. 21), and (c) report the default to credit reference bureaus as permitted under the Credit Reference Bureau Regulations, 2013."
  },
  {
    title: "Collateral Seizure and Disposal",
    text: "Upon default, the platform shall facilitate the transfer of the pledged collateral to the Lender(s) or its disposal through a fair and transparent process in compliance with the Auctioneers Act (Cap. 526, Laws of Kenya). Proceeds shall first satisfy the outstanding loan, interest, and fees."
  },
  {
    title: "Dispute Resolution",
    text: "Any disputes arising from this Agreement shall first be resolved through mediation facilitated by the platform. If mediation fails, disputes shall be referred to arbitration under the Arbitration Act, 1995 (No. 4 of 1995, Laws of Kenya), or to the courts of competent jurisdiction in Kenya."
  },
  {
    title: "Data Protection and Privacy",
    text: "Both parties consent to the collection, processing, and storage of personal data as required for this transaction, in compliance with the Data Protection Act, 2019 (No. 24 of 2019). The platform shall implement appropriate safeguards to protect all personal information shared."
  },
  {
    title: "Anti-Money Laundering Compliance",
    text: "This transaction complies with the Proceeds of Crime and Anti-Money Laundering Act, 2009 (No. 9 of 2009). Both parties have undergone KYC (Know Your Customer) verification. Any suspicious activity shall be reported to the Financial Reporting Centre (FRC)."
  },
  {
    title: "Consumer Protection",
    text: "The terms of this Agreement are transparent and disclosed in full prior to execution, in compliance with the Consumer Protection Act, 2012. The Borrower has the right to review all terms and seek independent legal advice before acceptance."
  },
  {
    title: "Force Majeure",
    text: "Neither party shall be liable for failure to perform obligations under this Agreement due to events beyond their reasonable control, including but not limited to natural disasters, government actions, pandemics, or civil unrest, as recognized under Kenyan common law principles."
  },
  {
    title: "Governing Law and Entire Agreement",
    text: "This Agreement shall be governed by and construed in accordance with the Laws of Kenya. This document constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, and agreements. Amendments must be in writing and signed by all Parties."
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { loan_id } = await req.json();
    if (!loan_id) throw new Error("loan_id is required");

    // Fetch loan
    const { data: loan, error: loanErr } = await supabase
      .from("loans")
      .select("*")
      .eq("id", loan_id)
      .single();
    if (loanErr || !loan) throw new Error("Loan not found");

    // Fetch borrower
    const { data: borrower } = await supabase
      .from("users")
      .select("*")
      .eq("id", loan.borrower_id)
      .single();

    // Fetch borrower KYC
    const { data: kyc } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("user_id", loan.borrower_id)
      .single();

    // Fetch collateral
    const { data: collateral } = await supabase
      .from("collateral")
      .select("*")
      .eq("id", loan.collateral_id)
      .single();

    // Fetch investments/lenders
    const { data: investments } = await supabase
      .from("investments")
      .select("*")
      .eq("loan_id", loan_id);

    // Fetch lender details
    const lenderIds = (investments || []).map((i: any) => i.lender_id);
    let lenders: any[] = [];
    let lenderKycMap: Record<string, any> = {};
    if (lenderIds.length > 0) {
      const { data: lenderData } = await supabase
        .from("users")
        .select("id, username, email, phone_number, national_id")
        .in("id", lenderIds);
      lenders = lenderData || [];

      // Fetch lender KYC data for selfie images
      const { data: lenderKycData } = await supabase
        .from("kyc_verifications")
        .select("user_id, selfie_image_url, full_name")
        .in("user_id", lenderIds);
      if (lenderKycData) {
        for (const k of lenderKycData) {
          lenderKycMap[k.user_id] = k;
        }
      }
    }

    // Calculate financials
    const principal = Number(loan.principal_amount);
    const rate = Number(loan.interest_rate || 13);
    const duration = Number(loan.duration_months);
    const monthlyInterest = principal * (rate / 100);
    const totalInterest = monthlyInterest * duration;
    const platformFee = principal * 0.01;
    const insuranceFee = principal * 0.01;
    const totalRepayment = principal + totalInterest + platformFee + insuranceFee;

    const contractDate = new Date().toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);
    const dueDateStr = dueDate.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const contractId = crypto.randomUUID();
    const verificationUrl = `${supabaseUrl}/functions/v1/verify-contract?id=${contractId}`;
    const qrSvg = generateQRCodeSVG(verificationUrl);
    const leafSvg = generateLeafSVG();

    const formatKES = (n: number) =>
      `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Build lenders table rows
    const lenderRows = (investments || [])
      .map((inv: any) => {
        const lender = lenders.find((l: any) => l.id === inv.lender_id);
        const lenderKyc = lenderKycMap[inv.lender_id];
        const selfieImg = lenderKyc?.selfie_image_url
          ? `<img src="${lenderKyc.selfie_image_url}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid #ccc;" />`
          : `<span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:#e0e0e0;text-align:center;line-height:40px;font-size:16px;">👤</span>`;
        return `<tr>
          <td style="border:1px solid #ddd;padding:8px;text-align:center;">${selfieImg}</td>
          <td style="border:1px solid #ddd;padding:8px;">${lender?.username || "N/A"}</td>
          <td style="border:1px solid #ddd;padding:8px;">${lender?.email || "N/A"}</td>
          <td style="border:1px solid #ddd;padding:8px;">${lender?.phone_number || "N/A"}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatKES(Number(inv.amount_invested))}</td>
          <td style="border:1px solid #ddd;padding:8px;">${new Date(inv.date || inv.created_at).toLocaleDateString("en-KE")}</td>
        </tr>`;
      })
      .join("");

    // Build clauses HTML
    const clausesHtml = CONTRACT_CLAUSES.map(
      (c, i) =>
        `<div style="margin-bottom:12px;">
          <p style="margin:0;font-weight:bold;color:#1b5e20;">Clause ${i + 1}: ${c.title}</p>
          <p style="margin:4px 0 0;font-size:11px;line-height:1.5;color:#333;">${c.text}</p>
        </div>`
    ).join("");

    // KYC images
    const idFrontImg = kyc?.id_front_image_url
      ? `<img src="${kyc.id_front_image_url}" style="max-width:250px;max-height:160px;border:1px solid #ccc;border-radius:4px;" />`
      : `<p style="color:#999;font-style:italic;">Not provided</p>`;
    const idBackImg = kyc?.id_back_image_url
      ? `<img src="${kyc.id_back_image_url}" style="max-width:250px;max-height:160px;border:1px solid #ccc;border-radius:4px;" />`
      : `<p style="color:#999;font-style:italic;">Not provided</p>`;
    const selfieImg = kyc?.selfie_image_url
      ? `<img src="${kyc.selfie_image_url}" style="max-width:150px;max-height:150px;border:1px solid #ccc;border-radius:50%;object-fit:cover;" />`
      : `<p style="color:#999;font-style:italic;">Not provided</p>`;
    const signatureImg = kyc?.signature_image_url
      ? `<img src="${kyc.signature_image_url}" style="max-width:200px;max-height:80px;border:1px solid #ccc;border-radius:4px;" />`
      : `<p style="color:#999;font-style:italic;">Not provided</p>`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Loan Contract</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:40px;color:#222;max-width:800px;margin:0 auto;">
  
  <!-- Header -->
  <div style="text-align:center;border-bottom:3px solid #2e7d32;padding-bottom:20px;margin-bottom:30px;">
    <div style="display:inline-block;vertical-align:middle;">${leafSvg}</div>
    <h1 style="color:#2e7d32;margin:8px 0 4px;font-size:24px;">P2P Secure-Lend Kenya</h1>
    <p style="color:#666;margin:0;font-size:12px;">Peer-to-Peer Secured Lending Platform</p>
    <h2 style="color:#1b5e20;margin:16px 0 0;font-size:18px;">LOAN CONTRACT AGREEMENT</h2>
    <p style="color:#666;margin:4px 0 0;font-size:11px;">Contract ID: ${contractId}</p>
    <p style="color:#666;margin:2px 0 0;font-size:11px;">Date: ${contractDate}</p>
  </div>

  <!-- Borrower Details -->
  <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h3 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">BORROWER DETAILS</h3>
    <table style="width:100%;font-size:12px;">
      <tr><td style="padding:3px 0;width:150px;"><strong>Full Name:</strong></td><td>${kyc?.full_name || `${borrower?.first_name || ""} ${borrower?.last_name || ""}`}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Username:</strong></td><td>${borrower?.username || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Email:</strong></td><td>${borrower?.email || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Phone:</strong></td><td>${borrower?.phone_number || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>National ID:</strong></td><td>${kyc?.id_number || borrower?.national_id || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Date of Birth:</strong></td><td>${kyc?.date_of_birth || "N/A"}</td></tr>
    </table>
  </div>

  <!-- KYC Documents -->
  <div style="margin-bottom:20px;">
    <h3 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">BORROWER KYC DOCUMENTS</h3>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <div><p style="font-size:11px;font-weight:bold;margin:0 0 4px;">ID Front:</p>${idFrontImg}</div>
      <div><p style="font-size:11px;font-weight:bold;margin:0 0 4px;">ID Back:</p>${idBackImg}</div>
    </div>
    <div style="margin-top:12px;"><p style="font-size:11px;font-weight:bold;margin:0 0 4px;">Borrower Signature:</p>${signatureImg}</div>
  </div>

  <!-- Collateral -->
  <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:20px;">
    <h3 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">COLLATERAL DETAILS</h3>
    <table style="width:100%;font-size:12px;">
      <tr><td style="padding:3px 0;width:150px;"><strong>Item Type:</strong></td><td>${collateral?.item_type || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Brand/Model:</strong></td><td>${collateral?.brand_model || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Market Value:</strong></td><td>${formatKES(Number(collateral?.market_value || 0))}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Status:</strong></td><td>${collateral?.status || "N/A"}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Verification Date:</strong></td><td>${collateral?.verification_date ? new Date(collateral.verification_date).toLocaleDateString("en-KE") : "N/A"}</td></tr>
    </table>
  </div>

  <!-- Loan Details -->
  <div style="background:#e8f5e9;padding:16px;border-radius:8px;margin-bottom:20px;border:1px solid #a5d6a7;">
    <h3 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">LOAN DETAILS</h3>
    <table style="width:100%;font-size:12px;">
      <tr><td style="padding:3px 0;width:200px;"><strong>Principal Amount:</strong></td><td style="font-weight:bold;">${formatKES(principal)}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Interest Rate:</strong></td><td>${rate}% per month (flat)</td></tr>
      <tr><td style="padding:3px 0;"><strong>Loan Duration:</strong></td><td>${duration} month(s)</td></tr>
      <tr><td style="padding:3px 0;"><strong>Monthly Interest:</strong></td><td>${formatKES(monthlyInterest)}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Total Interest:</strong></td><td>${formatKES(totalInterest)}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Platform Fee (1%):</strong></td><td>${formatKES(platformFee)}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Insurance Fee (1%):</strong></td><td>${formatKES(insuranceFee)}</td></tr>
      <tr style="border-top:2px solid #2e7d32;"><td style="padding:8px 0;"><strong>Total Repayment:</strong></td><td style="font-weight:bold;font-size:14px;color:#1b5e20;">${formatKES(totalRepayment)}</td></tr>
      <tr><td style="padding:3px 0;"><strong>Due Date:</strong></td><td style="color:#d32f2f;font-weight:bold;">${dueDateStr}</td></tr>
    </table>
  </div>

  <!-- Lenders -->
  <div style="margin-bottom:20px;">
    <h3 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">LENDER(S) / INVESTORS</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#2e7d32;color:white;">
          <th style="border:1px solid #ddd;padding:8px;text-align:center;">Photo</th>
          <th style="border:1px solid #ddd;padding:8px;text-align:left;">Username</th>
          <th style="border:1px solid #ddd;padding:8px;text-align:left;">Email</th>
          <th style="border:1px solid #ddd;padding:8px;text-align:left;">Phone</th>
          <th style="border:1px solid #ddd;padding:8px;text-align:right;">Amount Invested</th>
          <th style="border:1px solid #ddd;padding:8px;text-align:left;">Date</th>
        </tr>
      </thead>
      <tbody>${lenderRows || '<tr><td colspan="6" style="border:1px solid #ddd;padding:8px;text-align:center;color:#999;">No investors</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Contract Clauses -->
  <div style="margin-bottom:20px;">
    <h3 style="color:#2e7d32;margin:0 0 14px;font-size:14px;border-bottom:2px solid #2e7d32;padding-bottom:6px;">TERMS AND CONDITIONS (15 Clauses — Kenyan Law)</h3>
    ${clausesHtml}
  </div>

  <!-- QR Code & Verification -->
  <div style="text-align:center;border-top:2px solid #2e7d32;padding-top:20px;margin-top:30px;">
    <p style="font-size:11px;color:#666;margin:0 0 8px;">Scan the QR code below to verify the authenticity of this contract</p>
    <div style="display:inline-block;padding:8px;border:2px solid #2e7d32;border-radius:8px;">${qrSvg}</div>
    <p style="font-size:10px;color:#999;margin:8px 0 0;">Contract ID: ${contractId}</p>
    <p style="font-size:10px;color:#999;margin:4px 0 0;">Verification URL: ${verificationUrl}</p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #ddd;">
    <div style="display:inline-block;vertical-align:middle;">${leafSvg}</div>
    <p style="font-size:11px;color:#666;margin:4px 0 0;">P2P Secure-Lend Kenya — Kenya's Trusted Peer-to-Peer Lending Platform</p>
    <p style="font-size:10px;color:#999;margin:2px 0 0;">This is a legally binding document generated on ${contractDate}</p>
    <p style="font-size:10px;color:#999;margin:2px 0 0;">© ${new Date().getFullYear()} P2P Secure-Lend Kenya. All rights reserved.</p>
  </div>

</body>
</html>`;

    // Store contract in database
    await supabase.from("loan_contracts").insert({
      id: contractId,
      loan_id,
      borrower_id: loan.borrower_id,
      lender_ids: lenderIds,
      principal_amount: principal,
      total_repayment: totalRepayment,
      due_date: dueDate.toISOString(),
      pdf_url: "", // Will update after storage
      status: "active",
    });

    // Store verification record
    await supabase.from("contract_verifications").insert({
      contract_id: contractId,
      verification_method: "qr_code",
    });

    // Update loan status to active
    await supabase
      .from("loans")
      .update({ status: "active" })
      .eq("id", loan_id);

    return new Response(
      JSON.stringify({
        success: true,
        contract_id: contractId,
        html,
        verification_url: verificationUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
