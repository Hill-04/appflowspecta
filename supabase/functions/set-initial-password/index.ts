import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SET-INITIAL-PASSWORD] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

async function findUserByEmail(supabaseClient: any, email: string) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;
  const perPage = 500;

  while (true) {
    const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    
    const users = data?.users || [];
    const found = users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
    if (found) return found;
    
    if (users.length < perPage) break;
    page++;
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { purchase_id, password } = await req.json();

    if (!purchase_id || !password) {
      throw new Error("Missing purchase_id or password");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Look up the pending purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("pending_purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      logStep("Purchase lookup failed", { purchase_id, error: purchaseError?.message });
      throw new Error("Purchase not found");
    }

    if (purchase.status !== "approved") {
      logStep("Purchase not approved", { status: purchase.status });
      throw new Error("Purchase not approved");
    }

    logStep("Purchase found", { email: purchase.email, plan: purchase.plan });

    // Find the user by email with proper pagination
    const user = await findUserByEmail(supabaseClient, purchase.email);

    if (!user) {
      logStep("User not found", { email: purchase.email });
      throw new Error("User not found for this purchase");
    }

    logStep("User found", { userId: user.id });

    // Update the user's password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      throw new Error(`Failed to set password: ${updateError.message}`);
    }

    logStep("Password set successfully", { userId: user.id });

    return new Response(
      JSON.stringify({ success: true, email: purchase.email }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
