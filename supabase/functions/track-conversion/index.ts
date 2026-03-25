import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256Hash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { eventName, eventId, origin, userData, customData } = body;

    if (!eventName || !eventId || !origin) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: eventName, eventId, origin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TrackConversion] ${eventName}`, {
      eventId,
      origin,
      userData: userData ? { email: userData.email ? "***" : undefined } : undefined,
      customData,
    });

    // Send to Meta Conversions API
    const pixelId = Deno.env.get("META_PIXEL_ID");
    const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");

    if (!pixelId || !accessToken) {
      console.warn("[TrackConversion] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not configured, skipping CAPI");
      return new Response(
        JSON.stringify({ success: true, eventName, eventId, origin, capi: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build user_data with hashed PII
    const userDataPayload: Record<string, unknown> = {
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      client_user_agent: req.headers.get("user-agent") || undefined,
    };

    if (userData?.email) {
      userDataPayload.em = [await sha256Hash(userData.email)];
    }
    if (userData?.phone) {
      userDataPayload.ph = [await sha256Hash(userData.phone)];
    }
    if (userData?.fbc) {
      userDataPayload.fbc = userData.fbc;
    }
    if (userData?.fbp) {
      userDataPayload.fbp = userData.fbp;
    }
    if (userData?.externalId) {
      userDataPayload.external_id = [await sha256Hash(userData.externalId)];
    }

    // Build custom_data
    const customDataPayload: Record<string, unknown> = {};
    if (customData?.value !== undefined) customDataPayload.value = customData.value;
    customDataPayload.currency = customData?.currency || "BRL";
    if (customData?.contentIds) {
      customDataPayload.content_ids = customData.contentIds;
      customDataPayload.content_type = "product";
    }

    const eventPayload = {
      data: [
        {
          event_name: eventName,
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: userData?.sourceUrl || undefined,
          action_source: "website",
          user_data: userDataPayload,
          custom_data: Object.keys(customDataPayload).length > 0 ? customDataPayload : undefined,
        },
      ],
    };

    const capiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    const capiResponse = await fetch(capiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    const capiResult = await capiResponse.json();

    if (!capiResponse.ok) {
      console.error("[TrackConversion] CAPI error:", JSON.stringify(capiResult));
      return new Response(
        JSON.stringify({ success: false, error: "CAPI request failed", details: capiResult }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[TrackConversion] CAPI success:", JSON.stringify(capiResult));

    return new Response(
      JSON.stringify({ success: true, eventName, eventId, origin, capi: true, events_received: capiResult.events_received }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[TrackConversion] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
