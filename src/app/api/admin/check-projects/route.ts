import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch (e) { return Response.json({ error: "Firestore init failed: " + String(e) }, { status: 500 }); }

  let uid: string | null = null;
  try {
    const directSnap = await db.collection("users").doc(email).get();
    if (directSnap.exists) { uid = email; }
    else {
      const q = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!q.empty) uid = q.docs[0].id;
    }
  } catch (e) { return Response.json({ error: "Firestore query failed: " + String(e) }, { status: 500 }); }

  if (!uid) {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      uid = (await getAuth().getUserByEmail(email)).uid;
    } catch { /* ignore */ }
  }
  if (!uid) return Response.json({ error: "User not found" }, { status: 404 });

  try {
    const snap = await db.collection("users").doc(uid).get();
    const data = snap.data() ?? {};
    return Response.json({
      uid,
      executionProjects: data.executionProjects ?? [],
      projectCount: (data.executionProjects ?? []).length,
    });
  } catch (e) {
    return Response.json({ error: String(e), uid }, { status: 500 });
  }
}
