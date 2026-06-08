import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS, checkCredits } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";

// Never cache — credits change with every AI call and must read fresh.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // email query param is optional — the client sometimes fires before its user
    // state is populated, sending an empty value. We derive identity from the
    // verified token instead, so the lookup never depends on the param.
    const email = req.nextUrl.searchParams.get("email") || "";

    const authedUser = await verifyAuth(req);
    if (!authedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    getAdminAuth();
    const db = getAdminFirestore();

    // The user document key is ambiguous across this codebase: the AI API routes
    // write credits via verifyAuth().uid, the client (AuthPersistence) uses the
    // email as the key, and the Stripe webhook writes by email. The token's email
    // claim may also be empty for some providers. Rather than enforce a brittle
    // exact-match (which 403s legitimate users and hides their credits), we read
    // every key the authenticated identity could own — the token uid, the token
    // email, and the requested email — and use whichever doc holds the data.
    const uid = authedUser.uid;
    const keys = Array.from(
      new Set([uid, authedUser.email, email].filter(Boolean) as string[]),
    );
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

    // Verify plan against Stripe as source of truth when a real subscription ID exists.
    // This prevents stale/incorrect Firestore data from showing the wrong plan.
    let truePlan = sub.plan;
    let trueStatus = sub.status;
    let cancelAt: number | null = null;
    const stripeSubId: string = sub.stripeSubscriptionId;

    if (stripeSubId && stripeSubId !== "manual-grant") {
      try {
        const stripeSub = await getStripe().subscriptions.retrieve(stripeSubId);
        const stripeMetaPlan = stripeSub.metadata?.plan;
        if (stripeMetaPlan) truePlan = stripeMetaPlan;
        trueStatus = stripeSub.status;
        const trueActive = trueStatus === "active" || trueStatus === "trialing";

        // Sync back to Firestore if plan or status drifted
        if (stripeMetaPlan && (stripeMetaPlan !== sub.plan || trueStatus !== sub.status)) {
          const docKey = Object.keys(subOwner).length ? keys[datas.indexOf(subOwner)] : uid;
          await db.collection("users").doc(docKey || uid).set(
            { subscription: { plan: truePlan, status: trueStatus, active: trueActive } },
            { mergeFields: ["subscription.plan", "subscription.status", "subscription.active"] },
          );
        }

        if (stripeSub.cancel_at_period_end) {
          cancelAt = (stripeSub as unknown as { current_period_end?: number }).current_period_end ?? null;
        }
      } catch { /* non-fatal — fall back to Firestore data */ }
    } else if (sub.cancel_at_period_end) {
      // manual-grant: no Stripe to check
      cancelAt = null;
    }

    return NextResponse.json({
      active: sub.active,
      plan: truePlan,
      status: trueStatus,
      duration: sub.duration,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      cancel_at: cancelAt,
      credits: { used: creditsUsed, limit: creditsLimit, extra, resetAt },
    });
  } catch (err: unknown) {
    console.error("[status]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
