import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Map plan id + duration (months) → Stripe price ID env var
export function getPriceId(plan: string, duration: number): string {
  const key =
    duration === 1
      ? plan === "starter"
        ? process.env.STRIPE_PRICE_STARTER_MONTHLY
        : process.env.STRIPE_PRICE_PRO_MONTHLY
      : plan === "starter"
        ? process.env.STRIPE_PRICE_STARTER_SEMI_ANNUAL
        : process.env.STRIPE_PRICE_PRO_SEMI_ANNUAL;

  if (!key) throw new Error(`Missing Stripe price env var for plan=${plan} duration=${duration}`);
  return key;
}
