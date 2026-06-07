import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore, verifyAuth } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS, checkCredits } from "@/lib/credits";

// Never cache — credits change with every AI call and must read fresh.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

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
        _debug: { keysRead: keys, foundCreditsDoc: !!creditOwner.credits, rawUsed: credits?.used ?? null, tokenUid: authedUser.uid, tokenEmail: authedUser.email ?? null, queryEmail: email },
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
