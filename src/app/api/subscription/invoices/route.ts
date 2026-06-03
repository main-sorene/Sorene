import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "10");

    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    getAdminAuth();
    const db = getDb();
    const userDoc = await db.collection("users").doc(email).get();
    const customerId: string = userDoc.data()?.stripeCustomerId;

    if (!customerId) return NextResponse.json({ invoices: [] });

    const stripeInvoices = await getStripe().invoices.list({ customer: customerId, limit });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      date: new Date((inv.created) * 1000).toISOString(),
      status: inv.status,
      pdf_url: inv.invoice_pdf,
      plan: inv.metadata?.plan || "",
    }));

    return NextResponse.json({ invoices });
  } catch (err: unknown) {
    console.error("[invoices]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
