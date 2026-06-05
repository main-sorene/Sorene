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
}

export async function checkCredits(email: string): Promise<CreditStatus> {
  const db = getDb();
  const ref = db.collection("users").doc(email);
  const snap = await ref.get();
  const data = snap.data() || {};

  const plan: string = data.subscription?.active ? (data.subscription.plan ?? "free") : "free";
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;

  const now = Date.now();
  const resetAt: number = data.credits?.reset_at ?? 0;
  const needsReset = now > resetAt;

  let used: number = data.credits?.used ?? 0;

  if (needsReset) {
    // Reset monthly counter
    const nextReset = now + 30 * 24 * 60 * 60 * 1000;
    await ref.set(
      { credits: { used: 0, limit, reset_at: nextReset } },
      { merge: true },
    );
    used = 0;
  }

  return { ok: used < limit, used, limit, plan };
}

export async function deductCredits(email: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const db = getDb();
  await db
    .collection("users")
    .doc(email)
    .set(
      { credits: { used: FieldValue.increment(amount) } },
      { merge: true },
    );
}

export async function setCreditsLimit(email: string, plan: string): Promise<void> {
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
  const db = getDb();
  const snap = await db.collection("users").doc(email).get();
  const existing = snap.data()?.credits;
  // Keep usage, just update limit (and reset if upgrading)
  const nextReset = Date.now() + 30 * 24 * 60 * 60 * 1000;
  await db
    .collection("users")
    .doc(email)
    .set(
      { credits: { limit, used: existing?.used ?? 0, reset_at: existing?.reset_at ?? nextReset } },
      { merge: true },
    );
}
