import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number; title: string }> = {
  starter: { monthly: 49, annual: Math.round(49 * 12 * 0.83), title: "FlowSpecta Starter" },
  growth: { monthly: 69, annual: Math.round(69 * 12 * 0.83), title: "FlowSpecta Growth" },
  scale: { monthly: 147, annual: Math.round(147 * 12 * 0.83), title: "FlowSpecta Scale" },
};

const logStep = (step: string, details?: any) => {
  console.log(`[MP-CREATE-PREFERENCE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const { email, plan, billing_period } = await req.json();
    if (!email || !plan || !billing_period) throw new Error("Missing required fields: email, plan, billing_period");

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

    const price = billing_period === "annual" ? planConfig.annual : planConfig.monthly;
    const periodLabel = billing_period === "annual" ? "Anual" : "Mensal";
    logStep("Creating preference", { email, plan, billing_period, price });

    // Save pending purchase to DB
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: pendingPurchase, error: insertError } = await supabaseClient
      .from("pending_purchases")
      .insert({
        email: email.toLowerCase().trim(),
        plan,
        billing_period,
        amount: price,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to save pending purchase: ${insertError.message}`);
    logStep("Pending purchase saved", { id: pendingPurchase.id });

    const origin = req.headers.get("origin") || "https://flowtiful-prospect.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    // Create Mercado Pago preference
    const preferenceBody = {
      items: [
        {
          title: `${planConfig.title} - ${periodLabel}`,
          quantity: 1,
          unit_price: price,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: email.toLowerCase().trim(),
      },
      back_urls: {
        success: `${origin}/payment-success?purchase_id=${pendingPurchase.id}`,
        failure: `${origin}/pricing?payment_failed=true`,
        pending: `${origin}/pricing?payment_pending=true`,
      },
      auto_return: "approved",
      external_reference: pendingPurchase.id,
      notification_url: webhookUrl,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }], // exclude boleto, keep card + pix
      },
      statement_descriptor: "FLOWSPECTA",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      throw new Error(`Mercado Pago API error [${mpResponse.status}]: ${errorBody}`);
    }

    const mpData = await mpResponse.json();
    logStep("Preference created", { preferenceId: mpData.id });

    // Update pending purchase with preference ID
    await supabaseClient
      .from("pending_purchases")
      .update({ mp_preference_id: mpData.id })
      .eq("id", pendingPurchase.id);

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
        purchase_id: pendingPurchase.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
