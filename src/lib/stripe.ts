import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

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
