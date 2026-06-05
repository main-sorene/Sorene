import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth, verifyAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
}

export async function POST(req: NextRequest) {
  try {
    const { email, return_url } = await req.json();
    if (!email || !return_url) {
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
    const customerId: string = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[portal]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
