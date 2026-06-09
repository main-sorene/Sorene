import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

function dedupeScheduled(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  const byText: Record<string, FirebaseFirestore.QueryDocumentSnapshot[]> = {};
  for (const doc of docs) {
    const text = doc.data().text as string;
    if (!byText[text]) byText[text] = [];
    byText[text].push(doc);
  }
  const toDelete: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (const group of Object.values(byText)) {
    if (group.length <= 1) continue;
    group.sort((a, b) => (a.data().createdAt ?? 0) - (b.data().createdAt ?? 0));
    toDelete.push(...group.slice(1));
  }
  return toDelete;
}

// GET — list all users with scheduled posts, or ?all=true to clean up all users
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const users = await db.collection("users").get();

  if (new URL(req.url).searchParams.get("all") === "true") {
    // Clean up duplicates for every user
    const results: { uid: string; deleted: number }[] = [];
    for (const userDoc of users.docs) {
      const snap = await userDoc.ref.collection("threadsScheduled").get();
      if (snap.empty) continue;
      const toDelete = dedupeScheduled(snap.docs);
      for (const doc of toDelete) await doc.ref.delete();
      if (toDelete.length > 0) results.push({ uid: userDoc.id, deleted: toDelete.length });
    }
    return Response.json({ ok: true, results, totalDeleted: results.reduce((s, r) => s + r.deleted, 0) });
  }

  const result: { uid: string; count: number }[] = [];
  for (const doc of users.docs) {
    const scheduled = await doc.ref.collection("threadsScheduled").get();
    if (scheduled.size > 0) result.push({ uid: doc.id, count: scheduled.size });
  }
  return Response.json({ users: result });
}

// DELETE — keep only the latest N pending posts for a user, remove the rest
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { uid, keep = 21 } = await req.json() as { uid: string; keep?: number };
  if (!uid) return Response.json({ error: "Missing uid" }, { status: 400 });

  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(uid).collection("threadsScheduled").get();

  // Sort pending posts by createdAt descending, keep the latest `keep`, delete the rest
  const pending = snap.docs
    .filter((d) => d.data().status === "pending")
    .sort((a, b) => (b.data().createdAt ?? 0) - (a.data().createdAt ?? 0));

  const toDelete = pending.slice(keep);
  for (const doc of toDelete) await doc.ref.delete();

  return Response.json({ ok: true, deleted: toDelete.length, kept: Math.min(pending.length, keep), uid });
}

// One-shot admin endpoint to deduplicate threadsScheduled for a given uid or email
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { uid, email } = await req.json() as { uid?: string; email?: string };
  const db = getAdminFirestore();

  let targetUid = uid;
  if (!targetUid && email) {
    // Try Firebase Auth getUserByEmail
    try {
      const { getAdminAuth } = await import("@/lib/firebaseAdmin");
      const auth = getAdminAuth();
      if (auth) {
        const userRecord = await auth.getUserByEmail(email);
        targetUid = userRecord.uid;
      }
    } catch (e) { console.log("[cleanup-dupes] auth lookup failed:", e) }
    // Fall back: scan Firestore user docs for any email field
    if (!targetUid) {
      const snap = await db.collection("users").get();
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.email === email || d.emailAddress === email || d.userEmail === email) {
          targetUid = doc.id;
          break;
        }
      }
    }
    // Last resort: list Firebase Auth users
    if (!targetUid) {
      try {
        const { getAdminAuth } = await import("@/lib/firebaseAdmin");
        const auth = getAdminAuth();
        if (auth) {
          const list = await auth.listUsers(1000);
          const found = list.users.find((u) => u.email === email);
          if (found) targetUid = found.uid;
        }
      } catch (e) { console.log("[cleanup-dupes] listUsers failed:", e) }
    }
  }
  if (!targetUid) return Response.json({ error: "User not found", searched: email ?? uid }, { status: 404 });

  const snap = await db.collection("users").doc(targetUid).collection("threadsScheduled").get();
  const toDelete = dedupeScheduled(snap.docs);
  for (const doc of toDelete) await doc.ref.delete();

  return Response.json({ ok: true, deleted: toDelete.length, uid: targetUid });
}
