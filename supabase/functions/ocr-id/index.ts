import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Expect: { imageBase64: string, mimeType: string }
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ocrApiKey = Deno.env.get("OCR_SPACE_API_KEY") || "helloworld"; // free tier key

    // Call OCR.space API
    const formData = new FormData();
    formData.append("base64Image", `data:${mimeType || "image/jpeg"};base64,${imageBase64}`);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 is better for IDs

    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: ocrApiKey },
      body: formData,
    });

    if (!ocrRes.ok) {
      throw new Error(`OCR API error: ${ocrRes.status}`);
    }

    const ocrData = await ocrRes.json();

    if (ocrData.IsErroredOnProcessing) {
      throw new Error(ocrData.ErrorMessage?.[0] || "OCR processing failed");
    }

    const extractedText = ocrData.ParsedResults
      ?.map((r: any) => r.ParsedText || "")
      .join("\n")
      .trim() || "";

    return new Response(
      JSON.stringify({ success: true, text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "OCR failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
