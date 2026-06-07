import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS, checkCredits } from "@/lib/credits";

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
    const db = getAdminFirestore();

    // The user document key is ambiguous across this codebase: the AI API routes
    // write credits via the value of verifyAuth().uid, while the Stripe webhook and
    // the client write by email. For some accounts decoded.uid IS the email, for
    // others it's a Firebase uid. To be bulletproof we read BOTH possible keys and
    // use whichever document actually holds the credits / subscription data.
    const uid = authedUser.uid;
    const keys = Array.from(new Set([uid, email].filter(Boolean) as string[]));
    const snaps = await Promise.all(
      keys.map((k) => db.collection("users").doc(k).get()),
    );
    const datas = snaps.map((s) => s.data() || {});

    // The doc that owns credits is the one whose credits field exists.
    const creditOwner = datas.find((d) => d.credits) || {};
    const subOwner = datas.find((d) => d.subscription) || {};

    const sub = subOwner.subscription;
    let credits = creditOwner.credits;
    const plan = sub?.active ? (sub.plan ?? "free") : "free";

    // The key we should initialize against if no credits exist yet — prefer the
    // same key the AI routes use (uid) so future deductions land on the same doc.
    const initKey = uid;

    // Auto-initialize credits for users who haven't made an AI call yet
    if (!credits?.reset_at) {
      const status = await checkCredits(initKey);
      credits = { used: status.used, limit: status.limit, extra: status.extra, reset_at: status.resetAt };
    }

    // Use stored limit (may include purchased pack adjustments); fall back to plan default
    const creditsLimit: number = credits?.limit ?? (PLAN_CREDITS[plan] ?? PLAN_CREDITS.free);
    const extra: number = credits?.extra ?? 0;
    const resetAt: number = credits?.reset_at ?? 0;

    // Paid plans reset monthly — show 0 once window has passed (mirrors checkCredits).
    // Free users have a one-time budget: show actual used count, never reset to 0.
    const windowExpired = resetAt > 0 && Date.now() > resetAt;
    const creditsUsed = (windowExpired && plan !== "free") ? 0 : (credits?.used ?? 0);

    if (!sub || !sub.active) {
      return NextResponse.json({
        active: false, plan: "free", status: "inactive", duration: 1,
        credits: { used: creditsUsed, limit: creditsLimit, extra, resetAt },
      });
    }

    return NextResponse.json({
      active: sub.active,
      plan: sub.plan,
      status: sub.status,
      duration: sub.duration,
      credits: { used: creditsUsed, limit: creditsLimit, extra, resetAt },
    });
  } catch (err: unknown) {
    console.error("[status]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
