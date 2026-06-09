import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let uid = new URL(req.url).searchParams.get("uid");
  const email = new URL(req.url).searchParams.get("email");
  const db = getAdminFirestore();

  if (!uid && email) {
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
  }
  if (!uid) return Response.json({ error: "Missing uid or email" }, { status: 400 });
  const snap = await db.collection("users").doc(uid).collection("threadsScheduled").get();
  const now = Date.now();

  const posts = snap.docs.map((d) => {
    const p = d.data();
    return {
      id: p.id,
      status: p.status,
      projectTitle: p.projectTitle ?? "(untagged)",
      scheduledAt: p.scheduledAt,
      scheduledDate: new Date(p.scheduledAt).toISOString(),
      isPast: p.scheduledAt < now,
      text: (p.text as string)?.slice(0, 60),
    };
  }).sort((a, b) => a.scheduledAt - b.scheduledAt);

  const pending = posts.filter((p) => p.status === "pending");
  const published = posts.filter((p) => p.status === "published");
  const failed = posts.filter((p) => p.status === "failed");
  const pastPending = pending.filter((p) => p.isPast);

  return Response.json({
    total: posts.length,
    pending: pending.length,
    published: published.length,
    failed: failed.length,
    pastPendingCount: pastPending.length,
    nextPending: pending.slice(0, 5),
    pastPending: pastPending.slice(0, 5),
  });
}
