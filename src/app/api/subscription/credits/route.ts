import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { verifyAuth } from "@/lib/firebaseAdmin";

const CREDIT_PACK_AMOUNT = parseInt(process.env.CREDIT_PACK_AMOUNT || "1000", 10);

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, success_url, cancel_url } = await req.json();
    if (!email || !success_url || !cancel_url) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (email !== user.uid && email !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const priceId = process.env.STRIPE_PRICE_CREDIT_PACK;
    if (!priceId) {
      return NextResponse.json({ error: "Credit packs not configured" }, { status: 503 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: { email, type: "credits", amount: String(CREDIT_PACK_AMOUNT) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
