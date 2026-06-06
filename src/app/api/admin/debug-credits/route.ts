import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { checkCredits } from "@/lib/credits";

// Debug endpoint: shows raw Firestore credits for a user + runs checkCredits
// GET /api/admin/debug-credits?secret=...&email=user@example.com
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
  const snap = await db.collection("users").doc(email).get();

  if (!snap.exists) {
    return Response.json({ error: "User not found" });
  }

  const data = snap.data()!;

  // Also run checkCredits to see what it returns live
  const creditStatus = await checkCredits(email);

  return Response.json({
    firestore_raw_credits: data.credits ?? null,
    firestore_subscription: data.subscription ?? null,
    firestore_dnaAssessmentComplete: data.dnaAssessmentComplete ?? false,
    checkCredits_result: creditStatus,
  });
}
