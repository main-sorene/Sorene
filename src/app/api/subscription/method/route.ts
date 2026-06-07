import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";

function getDb() {
  return getAdminFirestore();
}

export async function GET(req: NextRequest) {
  try {
    const authedUser = await verifyAuth(req);
    if (!authedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // email param is optional — fall back to the verified token's identity so the
    // lookup never fails when the client fires before its user state is populated.
    const email =
      req.nextUrl.searchParams.get("email") || authedUser.email || authedUser.uid;

    getAdminAuth();
    const db = getDb();
    const userDoc = await db.collection("users").doc(email).get();
    const customerId: string = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ has_payment_method: false });
    }

    const methods = await getStripe().customers.listPaymentMethods(customerId, { type: "card", limit: 1 });
    const card = methods.data[0]?.card;

    if (!card) return NextResponse.json({ has_payment_method: false });

    return NextResponse.json({
      has_payment_method: true,
      brand: card.brand,
      last4: card.last4,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      type: "card",
    });
  } catch (err: unknown) {
    console.error("[method]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
