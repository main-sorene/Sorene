import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

function getDb() {
  return getAdminFirestore();
}

export const PLAN_CREDITS: Record<string, number> = {
  free: 250,
  starter: 1500,
  pro: 5000,
};

// Credits per token by model (1 credit = $0.001)
const MODEL_RATES: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.0008, output: 0.004 },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015 },
};

export function calculateCredits(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = MODEL_RATES[model] ?? MODEL_RATES["claude-haiku-4-5-20251001"];
  return Math.ceil(rates.input * inputTokens + rates.output * outputTokens);
}

export interface CreditStatus {
  ok: boolean;
  used: number;
  limit: number;   // base plan limit
  extra: number;   // purchased add-ons (persists across monthly resets)
  plan: string;
  resetAt: number;
}

export async function checkCredits(email: string): Promise<CreditStatus> {
  const db = getDb();
  const ref = db.collection("users").doc(email);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};

    const plan: string = data.subscription?.active ? (data.subscription.plan ?? "free") : "free";
    const basePlanLimit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
    const storedLimit: number = data.credits?.limit ?? basePlanLimit;
    const extra: number = data.credits?.extra ?? 0;
    const effectiveLimit = storedLimit + extra;

    const now = Date.now();
    const resetAt: number = data.credits?.reset_at ?? 0;
    const needsReset = now > resetAt;
    const used: number = data.credits?.used ?? 0;

    if (needsReset) {
      if (resetAt === 0) {
        // First-time initialization — preserve any usage already accumulated
        const preservedUsed = data.credits?.used ?? 0;
        const nextReset = now + 30 * 24 * 60 * 60 * 1000;
        tx.set(ref, { credits: { used: preservedUsed, limit: basePlanLimit, extra: 0, reset_at: nextReset } }, { merge: true });
        return { ok: preservedUsed < basePlanLimit, used: preservedUsed, limit: basePlanLimit, extra: 0, plan, resetAt: nextReset };
      }
      if (plan === "free") {
        // Free: one-time budget — no monthly reset
        return { ok: used < effectiveLimit, used, limit: storedLimit, extra, plan, resetAt };
      }
      // Paid plans: reset used only; preserve limit (base) and extra (purchased) across resets
      const nextReset = now + 30 * 24 * 60 * 60 * 1000;
      tx.set(ref, { credits: { used: 0, reset_at: nextReset } }, { merge: true });
      return { ok: true, used: 0, limit: storedLimit, extra, plan, resetAt: nextReset };
    }

    return { ok: used < effectiveLimit, used, limit: storedLimit, extra, plan, resetAt };
  });
}

export async function deductCredits(email: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const db = getDb();
  try {
    // mergeFields ensures only credits.used is touched — creates the field if
    // it doesn't exist yet (update() would throw on a fresh user document).
    await db
      .collection("users")
      .doc(email)
      .set(
        { credits: { used: FieldValue.increment(amount) } },
        { mergeFields: ["credits.used"] },
      );
  } catch (err) {
    console.error("[deductCredits] failed to deduct", amount, "for", email, err);
  }
}

// Adds purchased credits that persist across monthly resets
export async function addExtraCredits(email: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const db = getDb();
  try {
    await db.collection("users").doc(email).update({ "credits.extra": FieldValue.increment(amount) });
  } catch {
    // Document or credits field doesn't exist yet — initialize and set extra
    await db.collection("users").doc(email).set(
      { credits: { extra: amount } },
      { merge: true },
    );
  }
}

export async function setCreditsLimit(userKey: string, plan: string, resetUsage = false): Promise<void> {
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const db = getDb();
  const snap = await db.collection("users").doc(userKey).get();
  const existing = snap.data()?.credits;
  const nextReset = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const currentUsed = existing?.used ?? 0;
  const usedAfterChange = resetUsage || currentUsed > limit ? 0 : currentUsed;

  // Note: extra (purchased credits) is intentionally NOT overwritten here
  await db
    .collection("users")
    .doc(userKey)
    .set(
      {
        credits: {
          limit,
          used: usedAfterChange,
          reset_at: existing?.reset_at ?? nextReset,
        },
      },
      { merge: true },
    );
}
