import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  let db: ReturnType<typeof getAdminFirestore>;
  try { db = getAdminFirestore(); } catch (e) { return Response.json({ error: "Firestore init failed: " + String(e) }, { status: 500 }); }

  // Try all lookup strategies, report what worked
  let uid: string | null = null;
  let lookupMethod = "";

  // 1. Firebase Auth by email
  try {
    const { getAuth } = await import("firebase-admin/auth");
    uid = (await getAuth().getUserByEmail(email)).uid;
    lookupMethod = "firebase-auth";
  } catch { /* ignore */ }

  // 2. Firestore doc ID = email
  if (!uid) {
    try {
      const directSnap = await db.collection("users").doc(email).get();
      if (directSnap.exists) { uid = email; lookupMethod = "firestore-email-as-docid"; }
    } catch { /* ignore */ }
  }


  if (!uid) {
    // Last resort: list Auth users and find by email (searches all providers)
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const result = await getAuth().listUsers(1000);
      const match = result.users.find(u =>
        u.email === email ||
        u.providerData.some(p => p.email === email)
      );
      if (match) { uid = match.uid; lookupMethod = "auth-list-scan"; }
    } catch { /* ignore */ }
  }

  if (!uid) {
    // Scan Firestore users collection for matching email field
    try {
      const snapshot = await db.collection("users").get();
      const match = snapshot.docs.find(d => {
        const data = d.data();
        return data.email === email || (typeof data.email === "string" && data.email.toLowerCase().includes("pamela"));
      });
      if (match) { uid = match.id; lookupMethod = "firestore-scan"; }
    } catch (e) { return Response.json({ error: "Firestore scan failed: " + String(e) }, { status: 500 }); }
  }

  if (!uid) return Response.json({ error: "User not found by any method", email }, { status: 404 });

  try {
    const snap = await db.collection("users").doc(uid).get();
    const data = snap.data() ?? {};
    return Response.json({
      uid,
      lookupMethod,
      executionProjects: data.executionProjects ?? [],
      projectCount: (data.executionProjects ?? []).length,
    });
  } catch (e) {
    return Response.json({ error: String(e), uid }, { status: 500 });
  }
}
