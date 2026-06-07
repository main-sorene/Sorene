import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";
import { setCreditsLimit } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const { plan, duration, prorate, promotionCode } = await req.json();
    if (!plan || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const authedUser = await verifyAuth(req);
    if (!authedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    getAdminAuth();
    const db = getAdminFirestore();
    const userKey = authedUser.uid;
    const userDoc = await db.collection("users").doc(userKey).get();
    const data = userDoc.data() || {};

    const stripeSubscriptionId: string = data.subscription?.stripeSubscriptionId;
    if (!stripeSubscriptionId || stripeSubscriptionId === "manual-grant") {
      return NextResponse.json({ error: "No active Stripe subscription found" }, { status: 400 });
    }

    const priceId = getPriceId(plan, duration);
    const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
    const itemId = subscription.items.data[0].id;

    // Resolve promo code string to a Stripe promotion_code id
    let promoCodeId: string | undefined;
    if (promotionCode) {
      const codes = await getStripe().promotionCodes.list({ code: promotionCode, active: true, limit: 1 });
      if (!codes.data[0]) {
        return NextResponse.json({ error: "Invalid or expired promotion code" }, { status: 400 });
      }
      promoCodeId = codes.data[0].id;
    }

    const updated = await getStripe().subscriptions.update(stripeSubscriptionId, {
      proration_behavior: prorate ? "create_prorations" : "none",
      items: [{ id: itemId, price: priceId }],
      metadata: { email: userKey, plan, duration: String(duration) },
      ...(promoCodeId ? { discounts: [{ promotion_code: promoCodeId }] } : {}),
    } as import("stripe").Stripe.SubscriptionUpdateParams);

    // Use mergeFields to avoid wiping stripeSubscriptionId and other fields
    await db.collection("users").doc(userKey).set(
      { subscription: { plan, duration, status: updated.status, active: updated.status === "active" || updated.status === "trialing" } },
      { mergeFields: ["subscription.plan", "subscription.duration", "subscription.status", "subscription.active"] },
    );

    // Reset credits to new plan limit
    await setCreditsLimit(userKey, plan, true);

    return NextResponse.json({ plan, duration, price_id: priceId, status: updated.status });
  } catch (err: unknown) {
    console.error("[upgrade]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
