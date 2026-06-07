import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Called by Meta when a user deauthorizes the app from their Threads settings.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { user_id?: string };
    const threadsUserId = body?.user_id;
    if (threadsUserId) {
      const db = getAdminFirestore();
      const snap = await db.collection("users")
        .where("threadsAccount.userId", "==", String(threadsUserId))
        .limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ threadsAccount: FieldValue.delete() });
      }
    }
  } catch (err) {
    console.error("[threads uninstall]", err);
  }
  return new Response("OK", { status: 200 });
}
