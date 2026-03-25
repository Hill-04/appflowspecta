import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[ADMIN] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Authenticate caller using anon client with user's token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const callerId = userData.user.id;
    log("Caller authenticated", { callerId });

    // Verify caller is owner
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "owner")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: owner role required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json();
    const { action, userId, data } = body;
    log("Action requested", { action, userId });

    let result: unknown = null;

    switch (action) {
      case "list_users": {
        // Get all users from auth
        const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        });
        if (listErr) throw listErr;

        // Get roles and subscriptions
        const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
        const { data: subs } = await supabaseAdmin.from("subscriptions").select("*");
        const { data: profiles } = await supabaseAdmin.from("profiles").select("id, created_at");

        const rolesMap = new Map((roles || []).map((r) => [r.user_id, r]));
        const subsMap = new Map((subs || []).map((s) => [s.user_id, s]));
        const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

        result = authUsers.users.map((u) => {
          const role = rolesMap.get(u.id);
          const sub = subsMap.get(u.id);
          const profile = profilesMap.get(u.id);
          return {
            id: u.id,
            email: u.email,
            created_at: profile?.created_at || u.created_at,
            role: role?.role || null,
            role_id: role?.id || null,
            plan: sub?.plan || null,
            subscription_status: sub?.status || null,
            current_period_end: sub?.current_period_end || null,
            stripe_subscription_id: sub?.stripe_subscription_id || null,
            billing_period: sub?.billing_period || null,
            payment_method: sub?.payment_method || null,
          };
        });
        break;
      }

      case "change_role": {
        if (!userId || !data?.role) throw new Error("userId and data.role required");
        const validRoles = ["owner", "admin", "member"];
        if (!validRoles.includes(data.role)) throw new Error("Invalid role");

        // Check if user already has a role
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .update({ role: data.role })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: data.role });
          if (error) throw error;
        }
        result = { success: true };
        break;
      }

      case "change_plan": {
        if (!userId || !data?.plan) throw new Error("userId and data.plan required");
        const validPlans = ["test", "starter", "growth", "scale"];
        if (!validPlans.includes(data.plan)) throw new Error("Invalid plan");

        // Upsert subscription
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({ plan: data.plan, status: "active", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .insert({ user_id: userId, plan: data.plan, status: "active" });
          if (error) throw error;
        }
        result = { success: true };
        break;
      }

      case "cancel_subscription": {
        if (!userId) throw new Error("userId required");

        // Try to cancel via Stripe if subscription exists
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("stripe_subscription_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (sub?.stripe_subscription_id) {
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKey) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
              await stripe.subscriptions.cancel(sub.stripe_subscription_id);
              log("Stripe subscription canceled", { stripeId: sub.stripe_subscription_id });
            } catch (e) {
              log("Stripe cancel failed (updating DB anyway)", { error: String(e) });
            }
          }
        }

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "invite_user": {
        if (!data?.email) throw new Error("data.email required");

        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          password: crypto.randomUUID().slice(0, 16),
        });
        if (createErr) throw createErr;

        const newUserId = newUser.user.id;

        if (data.role && ["owner", "admin", "member"].includes(data.role)) {
          await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: data.role });
        }

        if (data.plan && ["starter", "growth", "scale"].includes(data.plan)) {
          await supabaseAdmin
            .from("subscriptions")
            .insert({ user_id: newUserId, plan: data.plan, status: "active" });
        }

        result = { success: true, userId: newUserId };
        break;
      }

      case "delete_user": {
        if (!userId) throw new Error("userId required");

        // Prevent deleting yourself
        if (userId === callerId) throw new Error("Cannot delete yourself");

        // Delete related data first
        await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("profiles").delete().eq("id", userId);

        // Delete auth user
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteErr) throw deleteErr;

        log("User deleted", { userId });
        result = { success: true };
        break;
      }

      case "list_coupons": {
        const { data: couponsList, error: cErr } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });
        if (cErr) throw cErr;
        result = couponsList;
        break;
      }

      case "create_coupon": {
        if (!data?.code) throw new Error("code required");
        const normalizedCode = data.code.toUpperCase().trim();
        const { data: existingCoupon } = await supabaseAdmin
          .from("coupons")
          .select("id")
          .eq("code", normalizedCode)
          .maybeSingle();
        if (existingCoupon) throw new Error(`Cupom "${normalizedCode}" já existe.`);
        const insertData: any = {
          code: normalizedCode,
          discount_type: data.discount_type || "percent",
          discount_percent: data.discount_percent || 0,
          discount_amount: data.discount_amount || 0,
          max_uses: data.max_uses || null,
          expires_at: data.expires_at || null,
        };
        if (data.applies_to_plans && data.applies_to_plans.length > 0) {
          insertData.applies_to_plans = data.applies_to_plans;
        }
        const { error: createErr } = await supabaseAdmin.from("coupons").insert(insertData);
        if (createErr) throw createErr;
        result = { success: true };
        break;
      }

      case "toggle_coupon": {
        if (!data?.coupon_id) throw new Error("coupon_id required");
        const { data: existing } = await supabaseAdmin
          .from("coupons")
          .select("active")
          .eq("id", data.coupon_id)
          .single();
        if (!existing) throw new Error("Coupon not found");
        const { error: toggleErr } = await supabaseAdmin
          .from("coupons")
          .update({ active: !existing.active })
          .eq("id", data.coupon_id);
        if (toggleErr) throw toggleErr;
        result = { success: true };
        break;
      }

      case "delete_coupon": {
        if (!data?.coupon_id) throw new Error("coupon_id required");
        const { error: delErr } = await supabaseAdmin
          .from("coupons")
          .delete()
          .eq("id", data.coupon_id);
        if (delErr) throw delErr;
        result = { success: true };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : (typeof error === "object" && error !== null && "message" in error) ? (error as any).message : JSON.stringify(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
