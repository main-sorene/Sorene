import { getApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getDb() {
  return getFirestore(getApps().length ? getApp() : undefined!);
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
  limit: number;
  plan: string;
  resetAt: number;
}

export async function checkCredits(email: string): Promise<CreditStatus> {
  const db = getDb();
  const ref = db.collection("users").doc(email);

  // Use a transaction to atomically read + conditionally reset, preventing
  // concurrent requests from triggering multiple resets in the same window.
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};

    const plan: string = data.subscription?.active ? (data.subscription.plan ?? "free") : "free";
    const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;

    const now = Date.now();
    const resetAt: number = data.credits?.reset_at ?? 0;
    const needsReset = now > resetAt;

    let used: number = data.credits?.used ?? 0;

    if (needsReset) {
      if (resetAt === 0) {
        // First-time initialization — all plans get a window set so reset_at is never 0 again
        const nextReset = now + 30 * 24 * 60 * 60 * 1000;
        tx.set(ref, { credits: { used: 0, limit, reset_at: nextReset } }, { merge: true });
        return { ok: true, used: 0, limit, plan, resetAt: nextReset };
      }
      if (plan === "free") {
        // Free budget is one-time — no monthly reset, credits stay exhausted until upgrade
        return { ok: used < limit, used, limit, plan, resetAt };
      }
      // Paid plans reset monthly
      const nextReset = now + 30 * 24 * 60 * 60 * 1000;
      tx.set(ref, { credits: { used: 0, limit, reset_at: nextReset } }, { merge: true });
      return { ok: true, used: 0, limit, plan, resetAt: nextReset };
    }

    return { ok: used < limit, used, limit, plan, resetAt };
  });
}

export async function deductCredits(email: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const db = getDb();
  try {
    await db
      .collection("users")
      .doc(email)
      .set(
        { credits: { used: FieldValue.increment(amount) } },
        { merge: true },
      );
  } catch (err) {
    console.error("[deductCredits] failed to deduct", amount, "for", email, err);
  }
}

export async function setCreditsLimit(email: string, plan: string, resetUsage = false): Promise<void> {
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const db = getDb();
  const snap = await db.collection("users").doc(email).get();
  const existing = snap.data()?.credits;
  const nextReset = Date.now() + 30 * 24 * 60 * 60 * 1000;

  // On plan change: keep existing usage unless resetUsage=true or user is downgrading
  // and their current usage already exceeds the new limit (avoid permanently locked-out users).
  const currentUsed = existing?.used ?? 0;
  const usedAfterChange = resetUsage || currentUsed > limit ? 0 : currentUsed;

  await db
    .collection("users")
    .doc(email)
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
