import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "No text" }, { status: 400 });

  const snap = await getAdminFirestore().doc(`users/${user.uid}/integrations/threads`).get();
  const account = snap.data();
  if (!account?.accessToken) return Response.json({ error: "Threads not connected" }, { status: 400 });

  const accessToken = account.accessToken as string;
  const userId = account.threadsUserId as string;

  try {
    // Step 1: Create text container
    const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "TEXT", text: text.trim(), access_token: accessToken }),
    });
    const createData = await createRes.json() as { id?: string; error?: unknown };
    if (!createData.id) throw new Error(`Create failed: ${JSON.stringify(createData)}`);

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
    });
    const publishData = await publishRes.json() as { id?: string; error?: unknown };
    if (!publishData.id) throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);

    // Record the post for analytics
    await getAdminFirestore()
      .collection("users").doc(user.uid)
      .collection("threadsPosts").doc(publishData.id)
      .set({ id: publishData.id, text: text.trim(), postedAt: Date.now() });

    return Response.json({ ok: true, postId: publishData.id });
  } catch (err) {
    console.error("[threads post]", err);
    return Response.json({ error: "Post failed" }, { status: 500 });
  }
}
