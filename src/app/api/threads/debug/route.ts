import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();

  const accountSnap = await db.doc(`users/${user.uid}/integrations/threads`).get();
  const account = accountSnap.data();

  const postsSnap = await db.collection("users").doc(user.uid).collection("threadsScheduled").get();
  const posts = postsSnap.docs.map((d) => d.data());

  return Response.json({
    account: account ? {
      connected: !!account.accessToken,
      threadsUserId: account.threadsUserId,
      username: account.username,
      connectedAt: account.connectedAt ? new Date(account.connectedAt).toISOString() : null,
      expiresAt: account.expiresAt ? new Date(account.expiresAt).toISOString() : null,
    } : null,
    scheduledPosts: posts,
  });
}
