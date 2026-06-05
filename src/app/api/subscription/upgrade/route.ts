import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getAdminAuth, verifyAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
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
    if (email !== authedUser.uid && email !== authedUser.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    getAdminAuth();
    const db = getDb();
    const userDoc = await db.collection("users").doc(email).get();
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
      metadata: { email, plan, duration: String(duration) },
    });

    await db.collection("users").doc(email).set(
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
