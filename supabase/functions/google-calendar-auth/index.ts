import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return { userId: user.id, supabase };
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "Token exchange failed");
  return data;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Token refresh failed");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, supabase } = auth;
    const serviceClient = getServiceClient();

    // === CONNECT ===
    if (action === "connect" && req.method === "POST") {
      const body = await req.json();
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: "code and redirect_uri required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await exchangeCodeForTokens(code, redirect_uri);
      const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

      // Upsert connection
      const { error } = await serviceClient
        .from("user_calendar_connections")
        .upsert(
          {
            user_id: userId,
            provider: "google",
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || "",
            expiry_date: expiryDate,
            calendar_id: "primary",
            connected_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DISCONNECT ===
    if (action === "disconnect" && req.method === "POST") {
      const { error } = await serviceClient
        .from("user_calendar_connections")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === STATUS ===
    if (action === "status") {
      const { data, error } = await serviceClient
        .from("user_calendar_connections")
        .select("id, provider, calendar_id, connected_at, expiry_date")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      const connected = !!data;
      const expired = data ? new Date(data.expiry_date) < new Date() : false;

      return new Response(
        JSON.stringify({ connected, expired, connection: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === AUTH-URL ===
    if (action === "auth-url") {
      const body = await req.json().catch(() => ({}));
      const redirectUri = body.redirect_uri || `${req.headers.get("origin") || ""}/auth/google-calendar/callback`;
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.events")}&access_type=offline&prompt=consent`;
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === REFRESH (internal helper, also exposed) ===
    if (action === "refresh" && req.method === "POST") {
      const { data: conn, error: connError } = await serviceClient
        .from("user_calendar_connections")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (connError || !conn) {
        return new Response(JSON.stringify({ error: "No connection found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await refreshAccessToken(conn.refresh_token);
      const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

      await serviceClient
        .from("user_calendar_connections")
        .update({
          access_token: tokens.access_token,
          expiry_date: expiryDate,
        })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-auth error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
