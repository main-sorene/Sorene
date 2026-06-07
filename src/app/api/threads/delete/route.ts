import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Called by Meta when a user requests deletion of their data.
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
        // Also delete any stored posts
        const posts = await snap.docs[0].ref.collection("threadsPosts").get();
        await Promise.all(posts.docs.map((d) => d.ref.delete()));
      }
    }
  } catch (err) {
    console.error("[threads delete]", err);
  }
  return new Response("OK", { status: 200 });
}
