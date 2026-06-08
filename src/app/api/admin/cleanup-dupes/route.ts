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
    const snap = await db.collection("users").get();
    for (const doc of snap.docs) {
      if (doc.data().email === email) { targetUid = doc.id; break; }
    }
  }
  if (!targetUid) return Response.json({ error: "User not found" }, { status: 404 });

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
