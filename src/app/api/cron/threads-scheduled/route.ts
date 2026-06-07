import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

async function publishPost(accessToken: string, userId: string, text: string): Promise<string> {
  const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "TEXT", text, access_token: accessToken }),
  });
  const createData = await createRes.json() as { id?: string };
  if (!createData.id) throw new Error("Create failed");

  await new Promise((r) => setTimeout(r, 1000));

  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json() as { id?: string };
  if (!publishData.id) throw new Error("Publish failed");
  return publishData.id;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Date.now();
  const db = getAdminFirestore();
  let processed = 0;
  let failed = 0;

  try {
    // Find all pending posts due now or in the past
    const usersSnap = await db.collection("users")
      .where("threadsAccount.accessToken", "!=", null)
      .get();

    await Promise.all(usersSnap.docs.map(async (userDoc) => {
      const account = userDoc.data().threadsAccount as { accessToken: string; userId: string } | undefined;
      if (!account?.accessToken) return;

      try {
        const dueSnap = await userDoc.ref
          .collection("threadsScheduled")
          .where("status", "==", "pending")
          .where("scheduledAt", "<=", now)
          .get();

        for (const postDoc of dueSnap.docs) {
          const post = postDoc.data() as { text: string; id: string };
          try {
            const postId = await publishPost(account.accessToken, account.userId, post.text);
            await postDoc.ref.update({ status: "published", publishedAt: now, postId });
            // Record in threadsPosts for analytics
            await userDoc.ref.collection("threadsPosts").doc(postId).set({
              id: postId, text: post.text, postedAt: now,
            });
            processed++;
          } catch (err) {
            console.error(`[threads-cron] failed for user ${userDoc.id} post ${post.id}:`, err);
            await postDoc.ref.update({ status: "failed" });
            failed++;
          }
        }
      } catch (err) {
        console.error(`[threads-cron] error for user ${userDoc.id}:`, err);
      }
    }));

    return Response.json({ ok: true, processed, failed, checkedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[threads-cron]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
