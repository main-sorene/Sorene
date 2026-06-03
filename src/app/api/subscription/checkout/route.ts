import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan, duration, success_url, cancel_url } = await req.json();

    if (!email || !plan || !duration || !success_url || !cancel_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (plan === "free") {
      return NextResponse.json({ error: "Cannot checkout free plan" }, { status: 400 });
    }

    getAdminAuth(); // ensures firebase admin is initialised

    const db = getDb();
    const userDoc = await db.collection("users").doc(email).get();
    const userData = userDoc.data() || {};

    // Reuse existing Stripe customer if available
    let customerId: string = userData.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({ email });
      customerId = customer.id;
      await db.collection("users").doc(email).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const priceId = getPriceId(plan, duration);

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: { email, plan, duration: String(duration) },
      subscription_data: { metadata: { email, plan, duration: String(duration) } },
    });

    return NextResponse.json({ session_id: session.id, url: session.url });
  } catch (err: unknown) {
    console.error("[checkout]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
