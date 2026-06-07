import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { checkCredits } from "@/lib/credits";

// Debug endpoint: dumps raw Firestore credit state.
//
// GET /api/admin/debug-credits?secret=...                → lists ALL user docs
//      with their doc id (key), email field, and credits. Use this to see
//      exactly which document key credits are being written under.
// GET /api/admin/debug-credits?secret=...&email=...       → single doc lookup
//      by the given key (could be uid OR email), plus live checkCredits.
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const key = req.nextUrl.searchParams.get("email");

  // Single-doc mode
  if (key) {
    const snap = await db.collection("users").doc(key).get();
    const creditStatus = await checkCredits(key);
    return Response.json({
      lookupKey: key,
      exists: snap.exists,
      firestore_raw_credits: snap.data()?.credits ?? null,
      firestore_email_field: snap.data()?.email ?? null,
      firestore_subscription: snap.data()?.subscription ?? null,
      checkCredits_result: creditStatus,
    });
  }

  // List-all mode — see every user doc, its key, and credits
  const usersSnap = await db.collection("users").get();
  const docs = usersSnap.docs.map((d) => {
    const data = d.data();
    return {
      docId: d.id,
      emailField: data.email ?? null,
      hasEmailKey: d.id.includes("@"),
      credits: data.credits ?? null,
      dnaAssessmentComplete: data.dnaAssessmentComplete ?? false,
    };
  });

  return Response.json({ totalDocs: docs.length, docs });
}
