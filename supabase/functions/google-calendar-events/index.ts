import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

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

async function getValidAccessToken(serviceClient: any, userId: string): Promise<string | null> {
  const { data: conn } = await serviceClient
    .from("user_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn) return null;

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(conn.expiry_date).getTime();
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    // Refresh
    try {
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: conn.refresh_token,
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          grant_type: "refresh_token",
        }),
      });
      const tokens = await res.json();
      if (!res.ok) return null;

      const newExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
      await serviceClient
        .from("user_calendar_connections")
        .update({ access_token: tokens.access_token, expiry_date: newExpiry })
        .eq("user_id", userId);

      return tokens.access_token;
    } catch {
      return null;
    }
  }

  return conn.access_token;
}

async function createGoogleEvent(accessToken: string, event: any) {
  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    location: event.location || "",
    start: {
      dateTime: event.start_datetime,
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: event.end_datetime || new Date(new Date(event.start_datetime).getTime() + (event.duration_minutes || 30) * 60000).toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  };

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleEvent),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error: ${err}`);
  }

  return await res.json();
}

async function updateGoogleEvent(accessToken: string, googleEventId: string, event: any) {
  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    location: event.location || "",
    start: {
      dateTime: event.start_datetime,
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: event.end_datetime || new Date(new Date(event.start_datetime).getTime() + (event.duration_minutes || 30) * 60000).toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  };

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleEvent),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error: ${err}`);
  }

  return await res.json();
}

async function deleteGoogleEvent(accessToken: string, googleEventId: string) {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Google API error: ${err}`);
  }
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

    const { userId } = auth;
    const serviceClient = getServiceClient();

    // === CREATE ===
    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const { lead_id, campaign_id, type, title, description, location, start_datetime, end_datetime, duration_minutes, priority, source } = body;

      if (!lead_id || !campaign_id || !title || !start_datetime) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert into DB first
      const eventData = {
        lead_id,
        campaign_id,
        user_id: userId,
        type: type || "task",
        title,
        description: description || null,
        location: location || null,
        start_datetime,
        end_datetime: end_datetime || null,
        duration_minutes: duration_minutes || 30,
        status: "scheduled",
        priority: priority || "medium",
        source: source || "manual",
        sync_status: "not_connected",
      };

      const { data: dbEvent, error: dbError } = await serviceClient
        .from("lead_calendar_events")
        .insert(eventData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Try Google sync
      const accessToken = await getValidAccessToken(serviceClient, userId);
      if (accessToken) {
        try {
          const googleEvent = await createGoogleEvent(accessToken, dbEvent);
          await serviceClient
            .from("lead_calendar_events")
            .update({ google_event_id: googleEvent.id, sync_status: "synced" })
            .eq("id", dbEvent.id);
          dbEvent.google_event_id = googleEvent.id;
          dbEvent.sync_status = "synced";
        } catch (syncErr) {
          console.error("Google sync failed:", syncErr);
          await serviceClient
            .from("lead_calendar_events")
            .update({ sync_status: "error" })
            .eq("id", dbEvent.id);
          dbEvent.sync_status = "error";
        }
      }

      return new Response(JSON.stringify(dbEvent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === UPDATE ===
    if (action === "update" && req.method === "POST") {
      const body = await req.json();
      const { id, ...updates } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Event id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updates.user_id;
      delete updates.google_event_id;
      delete updates.sync_status;

      const { data: dbEvent, error: dbError } = await serviceClient
        .from("lead_calendar_events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (dbError) throw dbError;

      // Sync with Google if connected
      if (dbEvent.google_event_id) {
        const accessToken = await getValidAccessToken(serviceClient, userId);
        if (accessToken) {
          try {
            await updateGoogleEvent(accessToken, dbEvent.google_event_id, dbEvent);
            await serviceClient
              .from("lead_calendar_events")
              .update({ sync_status: "synced" })
              .eq("id", id);
          } catch {
            await serviceClient
              .from("lead_calendar_events")
              .update({ sync_status: "error" })
              .eq("id", id);
          }
        }
      }

      return new Response(JSON.stringify(dbEvent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === COMPLETE ===
    if (action === "complete" && req.method === "POST") {
      const body = await req.json();
      const { id } = body;

      const { data: dbEvent, error } = await serviceClient
        .from("lead_calendar_events")
        .update({ status: "completed", completed_at: new Date().toISOString(), is_overdue: false })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      // Remove from Google if synced
      if (dbEvent.google_event_id) {
        const accessToken = await getValidAccessToken(serviceClient, userId);
        if (accessToken) {
          try {
            await deleteGoogleEvent(accessToken, dbEvent.google_event_id);
          } catch {
            // Non-critical
          }
        }
      }

      return new Response(JSON.stringify(dbEvent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CANCEL ===
    if (action === "cancel" && req.method === "POST") {
      const body = await req.json();
      const { id } = body;

      const { data: dbEvent, error } = await serviceClient
        .from("lead_calendar_events")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      if (dbEvent.google_event_id) {
        const accessToken = await getValidAccessToken(serviceClient, userId);
        if (accessToken) {
          try {
            await deleteGoogleEvent(accessToken, dbEvent.google_event_id);
          } catch {
            // Non-critical
          }
        }
      }

      return new Response(JSON.stringify(dbEvent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === RETRY-SYNC ===
    if (action === "retry-sync" && req.method === "POST") {
      const { data: failedEvents, error } = await serviceClient
        .from("lead_calendar_events")
        .select("*")
        .eq("user_id", userId)
        .eq("sync_status", "error")
        .eq("status", "scheduled");

      if (error) throw error;

      const accessToken = await getValidAccessToken(serviceClient, userId);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Google not connected or token invalid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let synced = 0;
      let failed = 0;

      for (const event of failedEvents || []) {
        try {
          if (event.google_event_id) {
            await updateGoogleEvent(accessToken, event.google_event_id, event);
          } else {
            const googleEvent = await createGoogleEvent(accessToken, event);
            await serviceClient
              .from("lead_calendar_events")
              .update({ google_event_id: googleEvent.id, sync_status: "synced" })
              .eq("id", event.id);
          }
          await serviceClient
            .from("lead_calendar_events")
            .update({ sync_status: "synced" })
            .eq("id", event.id);
          synced++;
        } catch {
          failed++;
        }
      }

      return new Response(JSON.stringify({ synced, failed, total: (failedEvents || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === LIST ===
    if (action === "list") {
      const leadId = url.searchParams.get("lead_id");
      const campaignId = url.searchParams.get("campaign_id");

      let query = serviceClient
        .from("lead_calendar_events")
        .select("*")
        .eq("user_id", userId)
        .order("start_datetime", { ascending: true });

      if (leadId) query = query.eq("lead_id", leadId);
      if (campaignId) query = query.eq("campaign_id", campaignId);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-events error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
