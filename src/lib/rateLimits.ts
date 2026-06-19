// Minimum daily / hourly rental rates (in NGN).
//
// These floors keep platform fees viable after Stripe + payout costs. They're
// expressed in the platform's base currency (NGN) on the assumption that
// providers price in their local currency and we accept the floor cross-
// currency at the same nominal number. If we ever localise floors per
// currency, swap this for a lookup keyed on currency code.

export const MIN_DAILY_RATE = 5000;
export const MIN_HOURLY_RATE = 1000;

export const RATE_FLOOR_NOTE =
  "Minimum daily rate is ₦5,000 and minimum hourly rate is ₦1,000 to keep the platform sustainable.";
