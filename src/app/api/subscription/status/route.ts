import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, verifyAuth } from "@/lib/firebaseAdmin";
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

    const sub = data.subscription;
    const credits = data.credits;
    const plan = sub?.active ? (sub.plan ?? "free") : "free";
    const creditsLimit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;

    const resetAt: number = credits?.reset_at ?? 0;
    // Paid plans reset monthly — show 0 once the window has passed (mirrors checkCredits).
    // Free users have a one-time budget: never reset, always show actual used count.
    const windowExpired = resetAt > 0 && Date.now() > resetAt;
    const creditsUsed = (windowExpired && plan !== "free") ? 0 : (credits?.used ?? 0);

    if (!sub || !sub.active) {
      return NextResponse.json({
        active: false, plan: "free", status: "inactive", duration: 1,
        credits: { used: creditsUsed, limit: creditsLimit, resetAt },
      });
    }

    return NextResponse.json({
      active: sub.active,
      plan: sub.plan,
      status: sub.status,
      duration: sub.duration,
      credits: { used: creditsUsed, limit: creditsLimit, resetAt },
    });
  } catch (err: unknown) {
    console.error("[status]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
