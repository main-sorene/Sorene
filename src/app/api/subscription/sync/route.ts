import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";
import { setCreditsLimit } from "@/lib/credits";

// Called from the upgrade page after a successful checkout to guarantee
// the subscription is registered in Firestore even if the webhook was delayed or failed.
export async function POST(req: NextRequest) {
  try {
    const authedUser = await verifyAuth(req);
    if (!authedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKey = authedUser.uid;
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userKey).get();
    const data = userDoc.data() || {};

    // Already has an active subscription — nothing to do
    if (data.subscription?.active) {
      return NextResponse.json({ ok: true, synced: false });
    }

    const customerId: string = data.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ ok: true, synced: false, reason: "no_customer" });
    }

    // Find the most recent active subscription for this customer
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const sub = subscriptions.data[0];
    if (!sub) {
      // Try trialing too
      const trialing = await getStripe().subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      if (!trialing.data[0]) {
        return NextResponse.json({ ok: true, synced: false, reason: "no_active_subscription" });
      }
    }

    const activeSub = sub || (await getStripe().subscriptions.list({ customer: customerId, status: "trialing", limit: 1 })).data[0];

    // Ensure metadata is populated
    const plan = activeSub.metadata?.plan || "starter";
    const duration = Number(activeSub.metadata?.duration || 1);

    await db.collection("users").doc(userKey).set(
      {
        subscription: {
          active: true,
          plan,
          status: activeSub.status,
          duration,
          stripeSubscriptionId: activeSub.id,
        },
      },
      { merge: true },
    );

    await setCreditsLimit(userKey, plan, true);

    return NextResponse.json({ ok: true, synced: true, plan, status: activeSub.status });
  } catch (err: unknown) {
    console.error("[sync-subscription]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
