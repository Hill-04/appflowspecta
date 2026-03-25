import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[MP-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

async function validateSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) {
    logStep("MP_WEBHOOK_SECRET not configured, rejecting webhook");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logStep("Missing x-signature or x-request-id headers");
    return false;
  }

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, ...valueParts] = part.split("=");
    parts[key.trim()] = valueParts.join("=").trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    logStep("Missing ts or v1 in x-signature");
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHash !== v1) {
    logStep("Signature mismatch", { expected: v1, computed: computedHash });
    return false;
  }

  logStep("Signature validated successfully");
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    logStep("Webhook received", { type: body.type, action: body.action, id: body.data?.id });

    // Validate webhook signature
    const dataId = body.data?.id ? String(body.data.id) : "";
    const isValid = await validateSignature(req, dataId);
    if (!isValid) {
      logStep("Signature validation failed, rejecting request");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Only process payment notifications
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      logStep("Ignoring non-payment notification", { type: body.type, action: body.action });
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logStep("No payment ID in webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch payment details from Mercado Pago
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Failed to fetch payment [${paymentResponse.status}]: ${errorText}`);
    }

    const payment = await paymentResponse.json();
    logStep("Payment fetched", {
      status: payment.status,
      external_reference: payment.external_reference,
      payer_email: payment.payer?.email,
      payment_method: payment.payment_method_id,
    });

    // Only process approved payments
    if (payment.status !== "approved") {
      logStep("Payment not approved, updating pending_purchase status", { status: payment.status });
      if (payment.external_reference) {
        await supabaseClient
          .from("pending_purchases")
          .update({ status: payment.status, mp_payment_id: String(paymentId) })
          .eq("id", payment.external_reference);
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Payment approved! Get the pending purchase
    const purchaseId = payment.external_reference;
    if (!purchaseId) {
      logStep("No external_reference in payment");
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("pending_purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (purchaseError || !purchase) {
      logStep("Pending purchase not found", { purchaseId, error: purchaseError?.message });
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Already processed?
    if (purchase.status === "approved") {
      logStep("Purchase already processed", { purchaseId });
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Processing approved payment", { email: purchase.email, plan: purchase.plan });

    // Update pending purchase
    await supabaseClient
      .from("pending_purchases")
      .update({ status: "approved", mp_payment_id: String(paymentId) })
      .eq("id", purchaseId);

    // Determine payment method
    const isPixPayment = payment.payment_method_id === "pix" || payment.payment_type_id === "bank_transfer";
    const paymentMethod = isPixPayment ? "pix" : "card";

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === purchase.email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      logStep("User already exists", { userId });
    } else {
      const randomPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: purchase.email,
        password: randomPassword,
        email_confirm: true,
      });
      if (createError) throw new Error(`Failed to create user: ${createError.message}`);
      userId = newUser.user.id;
      logStep("User created", { userId });
    }

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (purchase.billing_period === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert subscription with payment_method
    const { error: subError } = await supabaseClient
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: purchase.plan,
          status: "active",
          billing_period: purchase.billing_period,
          payment_method: paymentMethod,
          mp_payment_id: String(paymentId),
          mp_payer_email: purchase.email,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subError) {
      logStep("Failed to upsert subscription", { error: subError.message });
      await supabaseClient.from("subscriptions").insert({
        user_id: userId,
        plan: purchase.plan,
        status: "active",
        billing_period: purchase.billing_period,
        payment_method: paymentMethod,
        mp_payment_id: String(paymentId),
        mp_payer_email: purchase.email,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });
    }

    // Idempotent coupon increment
    if (purchase.coupon_code && !purchase.coupon_redeemed) {
      const { data: coupon } = await supabaseClient
        .from("coupons")
        .select("id, used_count")
        .ilike("code", purchase.coupon_code.trim())
        .maybeSingle();
      if (coupon) {
        await supabaseClient.from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
        await supabaseClient.from("pending_purchases").update({ coupon_redeemed: true }).eq("id", purchaseId);
        logStep("Coupon usage incremented via webhook", { code: purchase.coupon_code });
      }
    }

    logStep("Subscription activated", { userId, plan: purchase.plan, paymentMethod, periodEnd: periodEnd.toISOString() });

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
});
