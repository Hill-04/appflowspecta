import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number; title: string }> = {
  starter: { monthly: 49, annual: Math.round(49 * 12 * 0.83), title: "FlowSpecta Starter" },
  growth: { monthly: 69, annual: Math.round(69 * 12 * 0.83), title: "FlowSpecta Growth" },
  scale: { monthly: 147, annual: Math.round(147 * 12 * 0.83), title: "FlowSpecta Scale" },
};

const logStep = (step: string, details?: any) => {
  console.log(`[MP-PROCESS-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const { formData, email, plan, billing_period, coupon_code, free_coupon } = await req.json();
    if (!email || !plan || !billing_period) {
      throw new Error("Missing required fields");
    }

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

    let price = billing_period === "annual" ? planConfig.annual : planConfig.monthly;
    const periodLabel = billing_period === "annual" ? "Anual" : "Mensal";

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate coupon if provided
    let discountPercent = 0;
    let discountAmount = 0;
    let discountType = "percent";
    let couponId: string | null = null;
    if (coupon_code) {
      const { data: coupon, error: couponErr } = await supabaseClient
        .from("coupons")
        .select("*")
        .ilike("code", coupon_code.trim())
        .maybeSingle();

      if (couponErr || !coupon) throw new Error("Cupom inválido");
      if (!coupon.active) throw new Error("Cupom inativo");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Cupom expirado");
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) throw new Error("Cupom esgotado");

      // Check plan restriction
      if (coupon.applies_to_plans && coupon.applies_to_plans.length > 0) {
        if (!coupon.applies_to_plans.includes(plan)) {
          throw new Error(`Cupom válido apenas para: ${coupon.applies_to_plans.join(", ")}`);
        }
      }

      discountType = coupon.discount_type || "percent";
      discountPercent = coupon.discount_percent || 0;
      discountAmount = coupon.discount_amount || 0;
      couponId = coupon.id;
      logStep("Coupon validated", { code: coupon_code, type: discountType, percent: discountPercent, amount: discountAmount });
    }

    // Apply discount
    if (discountType === "percent" && discountPercent > 0 && discountPercent < 100) {
      price = Math.round(price * (1 - discountPercent / 100));
    } else if (discountType === "amount" && discountAmount > 0) {
      price = Math.max(0, price - discountAmount);
    }

    const isFree = (discountType === "percent" && discountPercent === 100) || price <= 0;

    logStep("Processing payment", { email, plan, billing_period, price, discountType, discountPercent, discountAmount, isFree });

    // Helper: create user + subscription
    const provisionUser = async (paymentId: string | null, paymentMethod: string) => {
      const cleanEmail = email.toLowerCase().trim();

      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === cleanEmail
      );

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        logStep("User already exists", { userId });
      } else {
        const tempPassword = crypto.randomUUID() + "Aa1!";
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
        });
        if (createError) throw new Error(`Failed to create user: ${createError.message}`);
        userId = newUser.user.id;
        logStep("User created", { userId });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      if (billing_period === "annual") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await supabaseClient.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          billing_period,
          payment_method: paymentMethod,
          mp_payment_id: paymentId ? String(paymentId) : null,
          mp_payer_email: cleanEmail,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "user_id" }
      );
      logStep("Subscription created", { paymentMethod });
    };

    // Increment coupon usage (idempotent via coupon_redeemed flag)
    const incrementCoupon = async (purchaseId: string) => {
      if (!couponId) return;
      // Check if already redeemed for this purchase
      const { data: purchase } = await supabaseClient
        .from("pending_purchases")
        .select("coupon_redeemed")
        .eq("id", purchaseId)
        .single();
      if (purchase?.coupon_redeemed) return; // already counted

      const { data: couponData } = await supabaseClient
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .single();
      if (couponData) {
        await supabaseClient
          .from("coupons")
          .update({ used_count: couponData.used_count + 1 })
          .eq("id", couponId);
      }
      await supabaseClient
        .from("pending_purchases")
        .update({ coupon_redeemed: true })
        .eq("id", purchaseId);
    };

    // FREE COUPON FLOW (100% discount or price <= 0)
    if ((free_coupon && discountPercent === 100) || (free_coupon && isFree)) {
      logStep("Free coupon flow - skipping MP API");

      const { data: pendingPurchase, error: insertError } = await supabaseClient
        .from("pending_purchases")
        .insert({
          email: email.toLowerCase().trim(),
          plan,
          billing_period,
          amount: 0,
          status: "approved",
          coupon_code: coupon_code || null,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(`Failed to save pending purchase: ${insertError.message}`);

      await provisionUser(null, "coupon");
      await incrementCoupon(pendingPurchase.id);

      return new Response(
        JSON.stringify({
          status: "approved",
          status_detail: "free_coupon",
          payment_id: null,
          purchase_id: pendingPurchase.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // REGULAR PAYMENT FLOW
    if (!formData) throw new Error("formData required for payment");

    // Save pending purchase
    const { data: pendingPurchase, error: insertError } = await supabaseClient
      .from("pending_purchases")
      .insert({
        email: email.toLowerCase().trim(),
        plan,
        billing_period,
        amount: price,
        status: "processing",
        coupon_code: coupon_code || null,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to save pending purchase: ${insertError.message}`);
    logStep("Pending purchase saved", { id: pendingPurchase.id });

    // Build payment body for MP API
    const paymentBody: any = {
      transaction_amount: price,
      description: `${planConfig.title} - ${periodLabel}`,
      payment_method_id: formData.payment_method_id,
      payer: {
        email: email.toLowerCase().trim(),
      },
      external_reference: pendingPurchase.id,
      statement_descriptor: "FLOWSPECTA",
    };

    // Determine payment method type
    const isPixPayment = formData.payment_method_id === "pix" || (!formData.token && formData.payment_method_id);

    // Card payment fields (only if token present)
    if (formData.token) {
      paymentBody.token = formData.token;
      const maxInstallments = billing_period === "annual" ? 12 : 1;
      const requestedInstallments = formData.installments || 1;
      paymentBody.installments = Math.min(requestedInstallments, maxInstallments);
      if (formData.issuer_id) paymentBody.issuer_id = formData.issuer_id;
      if (formData.payer?.identification) {
        paymentBody.payer.identification = formData.payer.identification;
      }
    }

    logStep("Sending to MP API", { payment_method_id: formData.payment_method_id, isPix: isPixPayment });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": pendingPurchase.id,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();
    logStep("MP response", { status: mpData.status, id: mpData.id, detail: mpData.status_detail });

    if (!mpResponse.ok) {
      throw new Error(`MP API error [${mpResponse.status}]: ${JSON.stringify(mpData)}`);
    }

    // Update pending purchase
    await supabaseClient
      .from("pending_purchases")
      .update({
        mp_payment_id: String(mpData.id),
        status: mpData.status,
      })
      .eq("id", pendingPurchase.id);

    const paymentMethod = isPixPayment ? "pix" : "card";

    // If approved, create user + subscription
    if (mpData.status === "approved") {
      logStep("Payment approved, creating user");
      await provisionUser(mpData.id, paymentMethod);
      await incrementCoupon(pendingPurchase.id);
    }

    return new Response(
      JSON.stringify({
        status: mpData.status,
        status_detail: mpData.status_detail,
        payment_id: mpData.id,
        purchase_id: pendingPurchase.id,
        point_of_interaction: mpData.point_of_interaction || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
