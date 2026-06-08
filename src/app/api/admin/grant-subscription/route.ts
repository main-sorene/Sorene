import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { setCreditsLimit } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userKey, plan = "starter", duration = 1, stripeCustomerId, stripeSubscriptionId } = await req.json();
  if (!userKey) {
    return NextResponse.json({ error: "Missing userKey" }, { status: 400 });
  }

  const db = getAdminFirestore();

  const updateData: Record<string, unknown> = {
    subscription: {
      active: true,
      plan,
      status: "active",
      duration,
      stripeSubscriptionId: stripeSubscriptionId ?? "manual-grant",
    },
  };
  if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;

  await db.collection("users").doc(userKey).set(updateData, { merge: true });

  // Also update Stripe subscription metadata so the status route (which reads
  // Stripe as source of truth) returns the correct plan.
  if (stripeSubscriptionId && stripeSubscriptionId !== "manual-grant") {
    try {
      await getStripe().subscriptions.update(stripeSubscriptionId, {
        metadata: { email: userKey, plan, duration: String(duration) },
      });
    } catch (e) {
      console.warn("[grant-subscription] failed to update Stripe metadata", e);
    }
  }

  await setCreditsLimit(userKey, plan, true);

  const snap = await db.collection("users").doc(userKey).get();
  const data = snap.data();

  return NextResponse.json({
    ok: true,
    userKey,
    plan,
    credits: data?.credits,
    subscription: data?.subscription,
  });
}
