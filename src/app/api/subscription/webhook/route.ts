import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { setCreditsLimit, addExtraCredits } from "@/lib/credits";
import Stripe from "stripe";

function getDb() {
  return getAdminFirestore();
}

// Stripe requires the raw body for signature verification — disable body parsing
export const runtime = "nodejs";

async function upsertSubscription(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription,
  resetUsage = false,
) {
  // The metadata.email field is actually the user's canonical Firestore doc key
  // (uid or email depending on how they signed up — set at checkout time).
  const userKey =
    subscription.metadata?.email ||
    (typeof subscription.customer === "object"
      ? (subscription.customer as Stripe.Customer).email
      : null);

  if (!userKey) {
    console.warn("[webhook] No user key on subscription", subscription.id);
    return;
  }

  const plan = subscription.metadata?.plan || "starter";
  const duration = Number(subscription.metadata?.duration || 1);
  const active = subscription.status === "active" || subscription.status === "trialing";
  const effectivePlan = active ? plan : "free";

  await db.collection("users").doc(userKey).set(
    {
      subscription: {
        active,
        plan: effectivePlan,
        status: subscription.status,
        duration,
        stripeSubscriptionId: subscription.id,
      },
    },
    { merge: true },
  );

  // Update credit limit to match new plan; reset usage on new subscriptions
  await setCreditsLimit(userKey, effectivePlan, resetUsage);
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

        // Credit pack one-time purchase
        if (session.mode === "payment" && session.metadata?.type === "credits") {
          const email = session.metadata.email;
          const amount = parseInt(session.metadata.amount || "1000", 10);
          if (email && amount > 0) {
            await addExtraCredits(email, amount);
          }
          break;
        }

        // New subscription
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          if (session.metadata?.email && !sub.metadata?.email) {
            await getStripe().subscriptions.update(sub.id, { metadata: session.metadata });
            sub.metadata = session.metadata;
          }
          await upsertSubscription(db, sub, true); // new subscription — reset usage counter
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
