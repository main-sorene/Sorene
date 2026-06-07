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
      return NextResponse.json({ error: "No Stripe subscription found" }, { status: 400 });
    }

    // Remove the pending cancellation
    const updated = await getStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db.collection("users").doc(userKey).set(
      { subscription: { cancel_at_period_end: false, status: updated.status } },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[resubscribe]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
