import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type * as FirebaseFirestore from "@google-cloud/firestore";

const APP_SECRET = process.env.THREADS_APP_SECRET ?? "";

// Refresh a long-lived token if it was issued more than 30 days ago (expires at 60)
async function maybeRefreshToken(accessToken: string, connectedAt: number): Promise<string> {
  const ageDays = (Date.now() - connectedAt) / (1000 * 60 * 60 * 24);
  if (ageDays < 30) return accessToken;
  try {
    const res = await fetch(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${accessToken}`
    );
    const data = await res.json() as { access_token?: string };
    return data.access_token ?? accessToken;
  } catch {
    return accessToken;
  }
}

async function publishPost(accessToken: string, userId: string, text: string): Promise<string> {
  const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "TEXT", text, access_token: accessToken }),
  });
  const createData = await createRes.json() as { id?: string; error?: { message?: string } };
  if (!createData.id) throw new Error(createData.error?.message ?? "Create failed");

  await new Promise((r) => setTimeout(r, 1500));

  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json() as { id?: string; error?: { message?: string } };
  if (!publishData.id) throw new Error(publishData.error?.message ?? "Publish failed");
  return publishData.id;
}

// Post a reply (first comment) with the CTA link
async function postReply(accessToken: string, userId: string, postId: string, text: string): Promise<void> {
  try {
    const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "TEXT",
        text,
        reply_to_id: postId,
        access_token: accessToken,
      }),
    });
    const createData = await createRes.json() as { id?: string };
    if (!createData.id) return;

    await new Promise((r) => setTimeout(r, 1000));

    await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
    });
  } catch (err) {
    console.error("[threads-cron] reply failed:", err);
  }
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
    // Query all pending scheduled posts across all users using a collection group query
    const duePostsSnap = await db.collectionGroup("threadsScheduled")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now)
      .get();

    // Group by user (parent doc)
    const byUser = new Map<string, { userRef: FirebaseFirestore.DocumentReference; posts: FirebaseFirestore.QueryDocumentSnapshot[] }>();
    for (const postDoc of duePostsSnap.docs) {
      const userRef = postDoc.ref.parent.parent!;
      if (!byUser.has(userRef.id)) byUser.set(userRef.id, { userRef, posts: [] });
      byUser.get(userRef.id)!.posts.push(postDoc);
    }

    await Promise.all([...byUser.values()].map(async ({ userRef, posts }) => {
      // Load account from correct subcollection path
      const accountSnap = await userRef.collection("integrations").doc("threads").get();
      const account = accountSnap.data() as {
        accessToken: string;
        threadsUserId: string;
        connectedAt?: number;
      } | undefined;
      if (!account?.accessToken) return;

      // Refresh token if nearing expiry
      const freshToken = await maybeRefreshToken(account.accessToken, account.connectedAt ?? 0);
      if (freshToken !== account.accessToken) {
        await accountSnap.ref.set({ accessToken: freshToken, connectedAt: Date.now() }, { merge: true });
      }

      for (const postDoc of posts) {
        const post = postDoc.data() as { text: string; id: string; ctaLink?: string };
        try {
          const postId = await publishPost(freshToken, account.threadsUserId, post.text);
          await postDoc.ref.update({ status: "published", publishedAt: now, postId });
          await userRef.collection("threadsPosts").doc(postId).set({
            id: postId, text: post.text, postedAt: now,
          });
          if (post.ctaLink) {
            await postReply(freshToken, account.threadsUserId, postId, post.ctaLink);
          }
          processed++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[threads-cron] failed user=${userRef.id} post=${post.id}:`, msg);
          await postDoc.ref.update({ status: "failed", failReason: msg });
          failed++;
        }
      }
    }));

    return Response.json({ ok: true, processed, failed, checkedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[threads-cron]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
