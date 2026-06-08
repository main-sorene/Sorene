import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// Credit estimates based on what the user has completed.
// These reflect the real per-call costs now that deductions are awaited.
//
// Assessment only   ≈ 60  cr  (~25 Haiku calls for reflect/bg/closing)
// + DNA             ≈ 17  cr  (dna-narrative + dna-labels + bg-summary)
// + 1 direction card≈ 47  cr  (4 phases: 25 Sonnet + ~22 Haiku)
// + each extra card ≈ 22  cr  (all Haiku phases)
//
// We err on the conservative (lower) side so users don't feel over-charged.
const CREDITS_ASSESSMENT = 60;
const CREDITS_DNA = 17;
const CREDITS_DIRECTION_FIRST = 47; // first card includes Sonnet phase 2
const CREDITS_DIRECTION_EXTRA = 22; // each additional card

function estimateCredits(data: Record<string, any>): number {
  let total = 0;

  const assessmentDone = data.dnaAssessmentComplete === true;
  if (!assessmentDone) return 0;
  total += CREDITS_ASSESSMENT;

  // DNA is generated when dnaAssessmentComplete is set
  const hasDna = !!data.dnaScores;
  if (hasDna) total += CREDITS_DNA;

  // Count direction cards generated: directionAlternatives is the list of
  // eligible models; direction generation creates cards for the top ones.
  // We assume cards were generated if directionText or directionAlternatives exists.
  const altCount: number = Array.isArray(data.directionAlternatives)
    ? data.directionAlternatives.length
    : 0;
  const hasDirection = !!data.directionText || altCount > 0;
  if (hasDirection) {
    // Conservative: assume they viewed ~2 cards (the typical "some direction")
    const cardCount = Math.min(altCount || 2, 3);
    total += CREDITS_DIRECTION_FIRST + Math.max(0, cardCount - 1) * CREDITS_DIRECTION_EXTRA;
  }

  return total;
}

// GET  ?secret=...            → dry-run (shows what would be set, no writes)
// GET  ?secret=...&apply=1    → applies the backfill
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apply = req.nextUrl.searchParams.get("apply") === "1";
  const db = getAdminFirestore();
  const usersSnap = await db.collection("users").get();

  const now = Date.now();
  const resetAt = now + 30 * 24 * 60 * 60 * 1000;

  const results: { uid: string; status: string; estimatedCredits: number; previousUsed: number }[] = [];

  for (const doc of usersSnap.docs) {
    const uid = doc.id;
    const data = doc.data();

    const currentUsed: number = data.credits?.used ?? 0;
    const currentResetAt: number = data.credits?.reset_at ?? 0;
    const estimated = estimateCredits(data);

    // Only backfill if:
    // 1. The user has completed assessment (otherwise estimated = 0 and there's nothing to set)
    // 2. The stored used is less than our estimate (don't reduce someone's count)
    if (estimated === 0 || currentUsed >= estimated) {
      results.push({
        uid,
        status: currentUsed >= estimated ? "skip — already has usage recorded" : "skip — no qualifying activity",
        estimatedCredits: estimated,
        previousUsed: currentUsed,
      });
      continue;
    }

    if (apply) {
      const plan: string = data.subscription?.active ? (data.subscription.plan ?? "free") : "free";
      const planLimits: Record<string, number> = { free: 250, starter: 1500, pro: 5000 };
      const limit: number = data.credits?.limit ?? planLimits[plan] ?? 250;
      const extra: number = data.credits?.extra ?? 0;

      await doc.ref.set(
        {
          credits: {
            used: estimated,
            limit,
            extra,
            reset_at: currentResetAt > 0 ? currentResetAt : resetAt,
          },
        },
        { merge: true },
      );
    }

    results.push({
      uid,
      status: apply ? "updated" : "would update",
      estimatedCredits: estimated,
      previousUsed: currentUsed,
    });
  }

  const updated = results.filter((r) => r.status === "updated" || r.status === "would update");
  return Response.json({
    dryRun: !apply,
    totalUsers: results.length,
    toUpdate: updated.length,
    results,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
