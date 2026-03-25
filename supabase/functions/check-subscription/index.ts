import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check subscription from DB
    const { data: sub, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      logStep("DB error", { error: subError.message });
      throw new Error(`DB error: ${subError.message}`);
    }

    if (!sub) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ subscribed: false, plan: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if subscription period has ended
    if (sub.current_period_end) {
      const periodEnd = new Date(sub.current_period_end);
      if (periodEnd < new Date()) {
        logStep("Subscription expired", { periodEnd: sub.current_period_end });
        // Mark as expired
        await supabaseClient
          .from("subscriptions")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", sub.id);

        return new Response(JSON.stringify({ subscribed: false, plan: null, expired: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    logStep("Active subscription found", { plan: sub.plan, periodEnd: sub.current_period_end });

    return new Response(JSON.stringify({
      subscribed: true,
      plan: sub.plan,
      subscription_end: sub.current_period_end,
      billing_period: sub.billing_period,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
