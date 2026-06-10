import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  const db = getAdminFirestore();

  let uid: string | null = null;
  const directSnap = await db.collection("users").doc(email).get();
  if (directSnap.exists) { uid = email; }
  else {
    const q = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!q.empty) uid = q.docs[0].id;
  }
  if (!uid) {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      uid = (await getAuth().getUserByEmail(email)).uid;
    } catch { /* ignore */ }
  }
  if (!uid) return Response.json({ error: "User not found" }, { status: 404 });

  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data() ?? {};

  return Response.json({
    uid,
    executionProjects: data.executionProjects ?? [],
    projectCount: (data.executionProjects ?? []).length,
  });
}
