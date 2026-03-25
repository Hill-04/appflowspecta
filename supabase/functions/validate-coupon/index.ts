import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 49, annual: Math.round(49 * 12 * 0.83) },
  growth: { monthly: 69, annual: Math.round(69 * 12 * 0.83) },
  scale: { monthly: 147, annual: Math.round(147 * 12 * 0.83) },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { code, plan, billing_period } = body;

    // Input validation: reject malformed or oversized inputs
    if (!code || typeof code !== "string" || code.trim().length === 0 || code.trim().length > 50) {
      return new Response(JSON.stringify({ valid: false, reason: "Código inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validPlans = ["starter", "growth", "scale"];
    if (plan && !validPlans.includes(plan)) {
      return new Response(JSON.stringify({ valid: false, reason: "Plano inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (billing_period && !["monthly", "annual"].includes(billing_period)) {
      return new Response(JSON.stringify({ valid: false, reason: "Período inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", code.trim())
      .maybeSingle();

    if (error) throw error;

    if (!coupon) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!coupon.active) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom inativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom esgotado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan restriction
    if (coupon.applies_to_plans && coupon.applies_to_plans.length > 0 && plan) {
      if (!coupon.applies_to_plans.includes(plan)) {
        return new Response(JSON.stringify({ valid: false, reason: `Cupom válido apenas para: ${coupon.applies_to_plans.join(", ")}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Calculate final amount
    const discountType = coupon.discount_type || "percent";
    const discountPercent = coupon.discount_percent || 0;
    const discountAmount = coupon.discount_amount || 0;

    let finalAmount: number | null = null;
    if (plan && billing_period) {
      const planConfig = PLAN_PRICES[plan];
      if (planConfig) {
        const basePrice = billing_period === "annual" ? planConfig.annual : planConfig.monthly;
        if (discountType === "percent") {
          finalAmount = Math.round(basePrice * (1 - discountPercent / 100));
        } else {
          finalAmount = Math.max(0, basePrice - discountAmount);
        }
      }
    }

    const responseBody = {
      valid: true,
      discount_type: discountType,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      coupon_id: coupon.id,
      applies_to_plans: coupon.applies_to_plans || null,
    };
    // Response logged server-side only (no sensitive data leaked to client)

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[validate-coupon] Error:", err.message);
    return new Response(JSON.stringify({ valid: false, reason: "Erro interno" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
