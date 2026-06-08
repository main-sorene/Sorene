import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface WatchedSubreddit { name: string; addedBy: "user" | "sorene"; addedAt: number; approved?: boolean; }
interface RedditOpportunity {
  id: string; subreddit: string; threadId: string; title: string; url: string;
  score: number; commentCount: number; createdAt: number; relevanceScore: number;
  draftReply: string; dismissed?: boolean; posted?: boolean;
}

async function refreshToken(uid: string): Promise<string | null> {
  const db = getAdminFirestore();
  const snap = await db.doc(`users/${uid}/integrations/reddit`).get();
  const data = snap.data();
  if (!data?.refreshToken) return null;

  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Sorene/1.0",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: data.refreshToken }),
  });
  const tokenData = await res.json() as { access_token?: string };
  if (!tokenData.access_token) return null;
  await snap.ref.set({ accessToken: tokenData.access_token }, { merge: true });
  return tokenData.access_token;
}

// Runs hourly — scans subreddits for all connected Reddit users
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return new Response("Unauthorized", { status: 401 });

  const db = getAdminFirestore();
  const usersSnap = await db.collection("users").get();
  let scanned = 0;
  let found = 0;

  for (const userDoc of usersSnap.docs) {
    try {
      const integSnap = await userDoc.ref.collection("integrations").doc("reddit").get();
      if (!integSnap.exists) continue;

      const watchlist = userDoc.data()?.redditWatchlist as { subreddits?: WatchedSubreddit[]; keywords?: string[] } | undefined;
      const approvedSubs = (watchlist?.subreddits ?? []).filter((s) => s.addedBy === "user" || s.approved);
      if (!approvedSubs.length || !watchlist?.keywords?.length) continue;

      let accessToken = integSnap.data()?.accessToken;
      if (!accessToken) accessToken = await refreshToken(userDoc.id);
      if (!accessToken) continue;

      const productContext = [
        userDoc.data()?.project?.oneliner ?? "",
        watchlist.keywords.join(", "),
      ].filter(Boolean).join(" — ");

      const existing = (userDoc.data()?.redditOpportunities ?? []) as RedditOpportunity[];
      const seenIds = new Set(existing.map((o) => o.threadId));
      const newOpps: RedditOpportunity[] = [];

      for (const sub of approvedSubs.slice(0, 3)) {
        const res = await fetch(`https://oauth.reddit.com/r/${sub.name}/new?limit=25`, {
          headers: { "Authorization": `Bearer ${accessToken}`, "User-Agent": "Sorene/1.0" },
        });
        const data = await res.json() as { data?: { children?: { data: { id: string; title: string; selftext?: string; score: number; num_comments: number; created_utc: number; permalink: string } }[] } };
        const posts = data.data?.children ?? [];

        const relevant = posts.filter((p) => {
          const text = `${p.data.title} ${p.data.selftext ?? ""}`.toLowerCase();
          return watchlist.keywords!.some((kw) => text.includes(kw.toLowerCase())) && !seenIds.has(p.data.id);
        });

        for (const post of relevant.slice(0, 2)) {
          const msg = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            system: `You are a founder crafting a helpful Reddit reply. Answer the question first. Never start with "I" or "Great question". Sound like a knowledgeable peer. If the product is relevant, mention it naturally at the end. Max 150 words.`,
            messages: [{ role: "user", content: `Subreddit: r/${sub.name}\nThread: "${post.data.title}"\nText: "${(post.data.selftext ?? "").slice(0, 400)}"\nProduct context: ${productContext}\n\nWrite a helpful reply.` }],
          });
          const draftReply = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
          newOpps.push({
            id: `${Date.now()}-${post.data.id}`,
            subreddit: sub.name, threadId: post.data.id, title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            score: post.data.score, commentCount: post.data.num_comments,
            createdAt: post.data.created_utc * 1000,
            relevanceScore: watchlist.keywords!.filter((kw) => `${post.data.title} ${post.data.selftext ?? ""}`.toLowerCase().includes(kw.toLowerCase())).length,
            draftReply,
          });
        }
      }

      if (newOpps.length > 0) {
        const updated = [...existing, ...newOpps].slice(-50);
        await userDoc.ref.set({ redditOpportunities: updated }, { merge: true });
        found += newOpps.length;
      }
      scanned++;
    } catch (err) {
      console.error("[reddit-monitor] uid:", userDoc.id, err);
    }
  }

  return Response.json({ ok: true, usersScanned: scanned, opportunitiesFound: found });
}
