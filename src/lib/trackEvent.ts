import type { CheckoutOrigin } from "@/hooks/useCheckoutOrigin";

/**
 * Standardized tracking event names for the acquisition funnel (site)
 * and the upgrade funnel (app).
 */
export type SiteTrackingEvent =
  | "ViewContent"
  | "ViewPricing"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

export type AppTrackingEvent =
  | "UpgradeInitiated"
  | "SubscriptionUpdated"
  | "Purchase";

interface TrackEventOptions {
  eventName: string;
  origin: CheckoutOrigin;
  /** Unique ID for deduplication between Pixel and CAPI */
  eventId?: string;
  params?: Record<string, any>;
}

/**
 * Generate a unique event ID for deduplication between Pixel and CAPI.
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Dispatch a client-side tracking event (Meta Pixel / Google Ads).
 * Only fires for origin=site events.
 */
export function trackPixelEvent({ eventName, origin, eventId, params }: TrackEventOptions): void {
  // Only fire pixel events for site origin (acquisition funnel)
  if (origin !== "site") return;

  // Meta Pixel
  if (typeof window !== "undefined" && (window as any).fbq) {
    const fbParams = {
      ...params,
      ...(eventId ? { eventID: eventId } : {}),
    };
    (window as any).fbq("track", eventName, fbParams);
  }

  // Google Ads gtag (if installed)
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, {
      ...params,
      event_id: eventId,
    });
  }

  if (import.meta.env.DEV) {
    console.log(`[TrackPixel] ${eventName}`, { origin, eventId, params });
  }
}

/**
 * Dispatch tracking event with automatic origin-based routing.
 * - origin=site → fires pixel + queues CAPI
 * - origin=app → queues server-side only
 */
export function trackEvent(options: TrackEventOptions): void {
  const { origin } = options;

  if (origin === "site") {
    // Fire client-side pixel
    trackPixelEvent(options);
  }

  // Both origins: log for server-side (CAPI will be handled by serverEvents)
  if (import.meta.env.DEV) {
    console.log(`[TrackEvent] ${options.eventName}`, {
      origin,
      eventId: options.eventId,
      params: options.params,
    });
  }
}
