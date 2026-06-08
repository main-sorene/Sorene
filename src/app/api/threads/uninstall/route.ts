import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// Meta calls this when a user uninstalls the app from Threads settings.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { user_id?: string };
    const threadsUserId = body.user_id;
    if (!threadsUserId) return Response.json({ ok: true });
    const db = getAdminFirestore();
    const snap = await db.collectionGroup("integrations")
      .where("threadsUserId", "==", threadsUserId).limit(1).get();
    if (!snap.empty) await snap.docs[0].ref.delete();
  } catch (err) { console.error("[threads/uninstall]", err); }
  return Response.json({ ok: true });
}
