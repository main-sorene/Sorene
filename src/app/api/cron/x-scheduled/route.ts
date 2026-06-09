import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { postTweet } from "@/app/api/x/post/route";
import type { XKeys } from "@/app/api/x/keys/route";
import type { XScheduledPost } from "@/app/api/x/schedule/route";

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const db = getAdminFirestore();
  let processed = 0, failed = 0;

  const usersSnap = await db.collection("users").get();
  await Promise.all(usersSnap.docs.map(async (userDoc) => {
    const postsSnap = await userDoc.ref.collection("xScheduled").get();
    const due = postsSnap.docs.filter((d) => {
      const p = d.data() as XScheduledPost;
      if (p.scheduledAt > now) return false;
      if (p.status === "pending") return true;
      if (p.status === "failed") return (now - p.scheduledAt) < 10 * 60 * 1000;
      return false;
    });

    if (due.length === 0) return;

    // Group due posts by projectTitle
    const groups = new Map<string, typeof due>();
    for (const postDoc of due) {
      const p = postDoc.data() as XScheduledPost;
      const key = p.projectTitle ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(postDoc);
    }

    for (const [projectTitle, posts] of groups) {
      // Look up namespaced keys, fall back to legacy "x" doc
      const docId = projectTitle ? `x__${slug(projectTitle)}` : "x";
      const keysSnap = await userDoc.ref.collection("integrations").doc(docId).get();
      let keys = keysSnap.exists ? (keysSnap.data() as XKeys) : undefined;
      if (!keys?.apiKey && projectTitle) {
        const legacySnap = await userDoc.ref.collection("integrations").doc("x").get();
        if (legacySnap.exists) keys = legacySnap.data() as XKeys;
      }
      if (!keys?.apiKey) continue;

      for (const postDoc of posts) {
        const post = postDoc.data() as XScheduledPost;
        try {
          const tweetId = await postTweet(keys.apiKey, keys.apiSecret, keys.accessToken, keys.accessTokenSecret, post.text);
          await postDoc.ref.update({ status: "published", publishedAt: now, tweetId });
          processed++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[x-cron] failed user=${userDoc.id} post=${post.id}:`, msg);
          await postDoc.ref.update({ status: "failed", failReason: msg });
          failed++;
        }
      }
    }
  }));

  return Response.json({ ok: true, processed, failed });
}
