import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { checkCredits } from "@/lib/credits";

// Tests whether Firestore credit writes actually persist.
// GET /api/admin/test-credit-write?secret=...&email=user@example.com
// Writes +1 to credits.used and reads it back to confirm.
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "Missing email" }, { status: 400 });

  const db = getAdminFirestore();
  const ref = db.collection("users").doc(email);

  // 1. Read before
  const before = await ref.get();
  const beforeUsed = before.data()?.credits?.used ?? "field missing";

  // 2. Ensure initialized
  const creditStatus = await checkCredits(email);

  // 3. Write +1 directly
  let writeError: string | null = null;
  try {
    await ref.update({ "credits.used": FieldValue.increment(1) });
  } catch (e: any) {
    writeError = e.message;
  }

  // 4. Read after
  const after = await ref.get();
  const afterUsed = after.data()?.credits?.used ?? "field missing";
  const afterFull = after.data()?.credits ?? null;

  return Response.json({
    email,
    before_credits_used: beforeUsed,
    checkCredits_result: creditStatus,
    write_error: writeError,
    after_credits_used: afterUsed,
    after_credits_full: afterFull,
    write_succeeded: writeError === null && afterUsed !== beforeUsed,
  });
}
