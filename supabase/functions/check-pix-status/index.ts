import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-PIX] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { purchase_id } = await req.json();
    if (!purchase_id) throw new Error("purchase_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Check current status in DB
    const { data: purchase, error: fetchErr } = await supabase
      .from("pending_purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (fetchErr || !purchase) throw new Error("Purchase not found");

    // Already approved in DB
    if (purchase.status === "approved") {
      return new Response(JSON.stringify({ approved: true, status: "approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no mp_payment_id yet, still processing
    if (!purchase.mp_payment_id) {
      return new Response(JSON.stringify({ approved: false, status: purchase.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check with Mercado Pago API
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not set");

    const mpResp = await fetch(
      `https://api.mercadopago.com/v1/payments/${purchase.mp_payment_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const mpData = await mpResp.json();
    logStep("MP status check", { paymentId: purchase.mp_payment_id, status: mpData.status });

    if (mpData.status === "approved") {
      // Update purchase status
      await supabase
        .from("pending_purchases")
        .update({ status: "approved" })
        .eq("id", purchase_id);

      // Create user + subscription (idempotent)
      const cleanEmail = purchase.email.toLowerCase().trim();

      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === cleanEmail
      );

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const tempPassword = crypto.randomUUID() + "Aa1!";
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
        });
        if (createErr) throw createErr;
        userId = newUser.user.id;
      }

      // Check if subscription already exists (idempotent)
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingSub) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (purchase.billing_period === "annual") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan: purchase.plan,
          status: "active",
          billing_period: purchase.billing_period,
          payment_method: "pix",
          mp_payment_id: purchase.mp_payment_id,
          mp_payer_email: cleanEmail,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
      }

      // Idempotent coupon increment
      if (purchase.coupon_code && !purchase.coupon_redeemed) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("id, used_count")
          .ilike("code", purchase.coupon_code.trim())
          .maybeSingle();
        if (coupon) {
          await supabase.from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
          await supabase.from("pending_purchases").update({ coupon_redeemed: true }).eq("id", purchase_id);
          logStep("Coupon incremented via pix polling", { code: purchase.coupon_code });
        }
      }

      logStep("User & subscription provisioned via Pix polling", { userId });

      return new Response(JSON.stringify({ approved: true, status: "approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ approved: false, status: mpData.status || purchase.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    logStep("ERROR", { message: err.message });
    return new Response(JSON.stringify({ approved: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
