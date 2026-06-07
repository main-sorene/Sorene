import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";

function getDb() {
  return getAdminFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan, duration, prorate } = await req.json();
    if (!email || !plan || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const authedUser = await verifyAuth(req);
    if (!authedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    getAdminAuth();
    const db = getDb();
    const userKey = authedUser.uid;
    const userDoc = await db.collection("users").doc(userKey).get();
    const data = userDoc.data() || {};

    const stripeSubscriptionId: string = data.subscription?.stripeSubscriptionId;
    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    const priceId = getPriceId(plan, duration);
    const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
    const itemId = subscription.items.data[0].id;

    const updated = await getStripe().subscriptions.update(stripeSubscriptionId, {
      proration_behavior: prorate ? "create_prorations" : "none",
      items: [{ id: itemId, price: priceId }],
      metadata: { email: userKey, plan, duration: String(duration) },
    });

    await db.collection("users").doc(userKey).set(
      { subscription: { plan, duration, status: updated.status, active: updated.status === "active" } },
      { merge: true },
    );

    return NextResponse.json({ plan, duration, price_id: priceId, status: updated.status });
  } catch (err: unknown) {
    console.error("[upgrade]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
