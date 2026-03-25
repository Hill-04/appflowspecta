import { useCallback } from "react";
import { useCheckoutOrigin, type CheckoutOrigin } from "./useCheckoutOrigin";
import { trackEvent, generateEventId } from "@/lib/trackEvent";
import { sendServerEvent } from "@/lib/serverEvents";

interface ConversionTracker {
  origin: CheckoutOrigin;
  trackViewContent: () => void;
  trackViewPricing: () => void;
  trackInitiateCheckout: (plan: string, value: number) => void;
  trackAddPaymentInfo: (plan: string) => void;
  trackPurchase: (plan: string, value: number, email?: string) => void;
  trackUpgradeInitiated: (plan: string) => void;
}

/**
 * Hook that provides origin-aware conversion tracking.
 * Automatically routes events to the correct channel based on origin.
 */
export function useConversionTracking(): ConversionTracker {
  const origin = useCheckoutOrigin();

  const trackViewContent = useCallback(() => {
    if (origin !== "site") return;
    trackEvent({ eventName: "ViewContent", origin });
  }, [origin]);

  const trackViewPricing = useCallback(() => {
    if (origin !== "site") return;
    trackEvent({ eventName: "ViewPricing", origin });
  }, [origin]);

  const trackInitiateCheckout = useCallback(
    (plan: string, value: number) => {
      const eventId = generateEventId();

      if (origin === "site") {
        trackEvent({
          eventName: "InitiateCheckout",
          origin,
          eventId,
          params: { value, currency: "BRL", content_ids: [plan] },
        });
      }

      // Server-side for both origins
      sendServerEvent({
        eventName: origin === "site" ? "InitiateCheckout" : "UpgradeInitiated",
        eventId,
        origin,
        customData: { value, currency: "BRL", contentIds: [plan] },
      });
    },
    [origin]
  );

  const trackAddPaymentInfo = useCallback(
    (plan: string) => {
      if (origin !== "site") return;
      const eventId = generateEventId();
      trackEvent({
        eventName: "AddPaymentInfo",
        origin,
        eventId,
        params: { content_ids: [plan] },
      });
    },
    [origin]
  );

  const trackPurchase = useCallback(
    (plan: string, value: number, email?: string) => {
      const eventId = generateEventId();

      if (origin === "site") {
        trackEvent({
          eventName: "Purchase",
          origin,
          eventId,
          params: { value, currency: "BRL", content_ids: [plan] },
        });
      }

      sendServerEvent({
        eventName: "Purchase",
        eventId,
        origin,
        userData: email ? { email } : undefined,
        customData: { value, currency: "BRL", contentIds: [plan] },
      });
    },
    [origin]
  );

  const trackUpgradeInitiated = useCallback(
    (plan: string) => {
      if (origin !== "app") return;
      sendServerEvent({
        eventName: "UpgradeInitiated",
        eventId: generateEventId(),
        origin,
        customData: { contentIds: [plan] },
      });
    },
    [origin]
  );

  return {
    origin,
    trackViewContent,
    trackViewPricing,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackUpgradeInitiated,
  };
}
