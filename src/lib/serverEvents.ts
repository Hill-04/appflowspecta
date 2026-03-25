import { supabase } from "@/integrations/supabase/client";
import type { CheckoutOrigin } from "@/hooks/useCheckoutOrigin";

interface ServerEventPayload {
  eventName: string;
  eventId: string;
  origin: CheckoutOrigin;
  userData?: {
    email?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentType?: string;
    [key: string]: any;
  };
}

/**
 * Send a server-side conversion event via edge function.
 * This handles Meta CAPI and any other server-side tracking.
 *
 * For origin=site: sends with eventId for deduplication with Pixel.
 * For origin=app: sends server-only events (no Pixel counterpart).
 */
export async function sendServerEvent(payload: ServerEventPayload): Promise<void> {
  try {
    // Edge function will handle CAPI dispatch when configured
    const { error } = await supabase.functions.invoke("track-conversion", {
      body: payload,
    });

    if (error) {
      console.error("[ServerEvent] Failed to send:", error);
    }

    if (import.meta.env.DEV) {
      console.log("[ServerEvent] Sent:", payload);
    }
  } catch (err) {
    console.error("[ServerEvent] Error:", err);
  }
}
