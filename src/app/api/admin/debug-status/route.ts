import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS, checkCredits } from "@/lib/credits";

// Replicates the EXACT subscription/status read logic, but without auth, so we
// can see what the Usage bar would receive for a given user.
// GET /api/admin/debug-status?secret=...&email=...&uid=...
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email") || "";
  const uid = req.nextUrl.searchParams.get("uid") || email;

  const db = getAdminFirestore();
  const keys = Array.from(new Set([uid, email].filter(Boolean)));
  const snaps = await Promise.all(keys.map((k) => db.collection("users").doc(k).get()));
  const datas = snaps.map((s) => s.data() || {});

  const creditOwner = datas.find((d) => d.credits) || {};
  const subOwner = datas.find((d) => d.subscription) || {};

  const sub = subOwner.subscription;
  let credits = creditOwner.credits;
  const plan = sub?.active ? (sub.plan ?? "free") : "free";

  let initialized = false;
  if (!credits?.reset_at) {
    const status = await checkCredits(uid);
    credits = { used: status.used, limit: status.limit, extra: status.extra, reset_at: status.resetAt };
    initialized = true;
  }

  const creditsLimit: number = credits?.limit ?? (PLAN_CREDITS[plan] ?? PLAN_CREDITS.free);
  const extra: number = credits?.extra ?? 0;
  const resetAt: number = credits?.reset_at ?? 0;
  const windowExpired = resetAt > 0 && Date.now() > resetAt;
  const creditsUsed = (windowExpired && plan !== "free") ? 0 : (credits?.used ?? 0);

  const effectiveLimit = creditsLimit + extra;
  const pct = effectiveLimit > 0 ? Math.min(100, Math.round((creditsUsed / effectiveLimit) * 100)) : 0;

  return Response.json({
    keysRead: keys,
    docsHaveCredits: datas.map((d) => !!d.credits),
    initializedFromCheckCredits: initialized,
    // what the API would return:
    response: { active: !!sub?.active, plan, credits: { used: creditsUsed, limit: creditsLimit, extra, resetAt } },
    // what the bar would show:
    barPercent: pct,
  });
}
