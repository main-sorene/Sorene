import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";

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

    const stripeSubscriptionId: string = data.subscription?.stripeSubscriptionId;
    if (!stripeSubscriptionId || stripeSubscriptionId === "manual-grant") {
      // No real Stripe subscription — just mark inactive in Firestore
      await db.collection("users").doc(userKey).set(
        { subscription: { active: false, status: "canceled" } },
        { merge: true },
      );
      return NextResponse.json({ ok: true, cancel_at_period_end: false });
    }

    // Cancel at period end — user keeps access until billing cycle ends
    const updated = await getStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Use mergeFields to update only specific subscription subfields without wiping others
    await db.collection("users").doc(userKey).set(
      { subscription: { cancel_at_period_end: true, status: updated.status } },
      { mergeFields: ["subscription.cancel_at_period_end", "subscription.status"] },
    );

    return NextResponse.json({
      ok: true,
      cancel_at_period_end: true,
    });
  } catch (err: unknown) {
    console.error("[cancel]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
