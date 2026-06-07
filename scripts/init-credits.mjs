/**
 * One-time migration: initialise credits for all existing Firestore users.
 * - Skips users who already have a credits.reset_at field.
 * - Sets limit based on active subscription plan (free / starter / pro).
 * - Sets used=0 and reset_at = now + 30 days.
 *
 * Run: node scripts/init-credits.mjs
 * Requires serviceAccount.json in the repo root (never commit that file).
 */
import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const PLAN_CREDITS = { free: 250, starter: 1500, pro: 5000 };
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("users").get();
console.log(`Found ${snap.size} users. Initialising credits...`);

let batch = db.batch();
let ops = 0;
let skipped = 0;
let updated = 0;

const resetAt = Date.now() + THIRTY_DAYS;

for (const doc of snap.docs) {
  const data = doc.data();

  // Skip users who already have credits set up
  if (data.credits?.reset_at) {
    skipped++;
    continue;
  }

  const plan = data.subscription?.active ? (data.subscription.plan ?? "free") : "free";
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;

  batch.set(doc.ref, { credits: { used: 0, limit, reset_at: resetAt } }, { merge: true });
  ops++;
  updated++;

  if (ops === 400) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
    console.log(`  ...committed 400 (total updated so far: ${updated})`);
  }
}

if (ops > 0) await batch.commit();

console.log(`Done. Updated: ${updated}, Skipped (already had credits): ${skipped}`);
