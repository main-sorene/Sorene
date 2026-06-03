import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
}

// Stripe requires the raw body for signature verification — disable body parsing
export const runtime = "nodejs";

async function upsertSubscription(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription,
) {
  const email =
    subscription.metadata?.email ||
    (typeof subscription.customer === "object"
      ? (subscription.customer as Stripe.Customer).email
      : null);

  if (!email) {
    console.warn("[webhook] No email on subscription", subscription.id);
    return;
  }

  const plan = subscription.metadata?.plan || "starter";
  const duration = Number(subscription.metadata?.duration || 1);
  const active = subscription.status === "active" || subscription.status === "trialing";

  await db.collection("users").doc(email).set(
    {
      subscription: {
        active,
        plan: active ? plan : "free",
        status: subscription.status,
        duration,
        stripeSubscriptionId: subscription.id,
      },
    },
    { merge: true },
  );
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[webhook] signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  getAdminAuth();
  const db = getDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          // Ensure metadata is set from session
          if (session.metadata?.email && !sub.metadata?.email) {
            await getStripe().subscriptions.update(sub.id, { metadata: session.metadata });
            sub.metadata = session.metadata;
          }
          await upsertSubscription(db, sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(db, sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) {
          const sub = await getStripe().subscriptions.retrieve(invoice.subscription);
          await upsertSubscription(db, sub);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
