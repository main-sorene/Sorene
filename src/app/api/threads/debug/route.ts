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

// PATCH — fix corrupted threadsUserId by re-fetching from Threads API
export async function PATCH(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const accountRef = db.doc(`users/${user.uid}/integrations/threads`);
  const accountSnap = await accountRef.get();
  const account = accountSnap.data();

  if (!account?.accessToken) return Response.json({ error: "Not connected" }, { status: 400 });

  // Re-fetch the correct user ID from Threads API as a string
  const res = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${account.accessToken}`
  );
  if (!res.ok) return Response.json({ error: "Threads API error" }, { status: 502 });

  const data = await res.json() as { id: string; username: string };
  if (!data.id) return Response.json({ error: "No ID returned" }, { status: 502 });

  await accountRef.update({ threadsUserId: String(data.id), username: data.username });

  return Response.json({ ok: true, threadsUserId: String(data.id), username: data.username });
}
