import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

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

  const col = db.collection("users").doc(targetUid).collection("threadsScheduled");
  const all = await col.get();

  // Group by text, keep the earliest createdAt per text, delete the rest
  const byText: Record<string, typeof all.docs> = {};
  for (const doc of all.docs) {
    const text = doc.data().text as string;
    if (!byText[text]) byText[text] = [];
    byText[text].push(doc);
  }

  let deleted = 0;
  for (const docs of Object.values(byText)) {
    if (docs.length <= 1) continue;
    docs.sort((a, b) => (a.data().createdAt ?? 0) - (b.data().createdAt ?? 0));
    for (const dup of docs.slice(1)) {
      await dup.ref.delete();
      deleted++;
    }
  }

  return Response.json({ ok: true, deleted, uid: targetUid });
}
