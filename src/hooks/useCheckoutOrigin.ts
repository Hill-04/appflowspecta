import { useSearchParams } from "react-router-dom";

export type CheckoutOrigin = "site" | "app";

const VALID_ORIGINS: CheckoutOrigin[] = ["site", "app"];

/**
 * Reads and validates the `origin` query parameter from checkout URLs.
 * Defaults to "app" if missing or invalid.
 */
export function useCheckoutOrigin(): CheckoutOrigin {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("origin");
  if (raw && VALID_ORIGINS.includes(raw as CheckoutOrigin)) {
    return raw as CheckoutOrigin;
  }
  return "app";
}

/**
 * Returns the correct "back" destination based on checkout origin.
 */
export function getBackDestination(origin: CheckoutOrigin): string {
  switch (origin) {
    case "site":
      return "/#pricing";
    case "app":
    default:
      return "/app/pricing";
  }
}
