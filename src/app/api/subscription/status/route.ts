import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PLAN_CREDITS } from "@/lib/credits";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    getAdminAuth();
    const db = getDb();
    const userDoc = await db.collection("users").doc(email).get();
    const data = userDoc.data() || {};

    const sub = data.subscription;
    const credits = data.credits;
    const plan = sub?.active ? (sub.plan ?? "free") : "free";
    const creditsLimit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
    const creditsUsed = credits?.used ?? 0;

    if (!sub || !sub.active) {
      return NextResponse.json({
        active: false, plan: "free", status: "inactive", duration: 1,
        credits: { used: creditsUsed, limit: creditsLimit },
      });
    }

    return NextResponse.json({
      active: sub.active,
      plan: sub.plan,
      status: sub.status,
      duration: sub.duration,
      credits: { used: creditsUsed, limit: creditsLimit },
    });
  } catch (err: unknown) {
    console.error("[status]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
