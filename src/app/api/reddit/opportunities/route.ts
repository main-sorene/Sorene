import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import type { RedditWatchlist } from "../watchlist/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RedditOpportunity {
  id: string;
  subreddit: string;
  threadId: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  createdAt: number;
  relevanceScore: number;
  draftReply: string;
  dismissed?: boolean;
  posted?: boolean;
  postedAt?: number;
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

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(user.uid).get();
  const opportunities = (snap.data()?.redditOpportunities ?? []) as RedditOpportunity[];
  return Response.json({ opportunities: opportunities.filter((o) => !o.dismissed) });
}

// POST — scan for new opportunities (called by cron or manually)
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const userSnap = await db.collection("users").doc(user.uid).get();
  const watchlist = userSnap.data()?.redditWatchlist as RedditWatchlist | undefined;
  const approvedSubreddits = (watchlist?.subreddits ?? []).filter((s) => s.addedBy === "user" || s.approved);

  if (approvedSubreddits.length === 0 || !watchlist?.keywords?.length) {
    return Response.json({ error: "Add subreddits and keywords first" }, { status: 400 });
  }

  let accessToken = userSnap.data()?.integrations?.reddit?.accessToken;
  if (!accessToken) {
    const integSnap = await db.doc(`users/${user.uid}/integrations/reddit`).get();
    accessToken = integSnap.data()?.accessToken;
  }
  if (!accessToken) accessToken = await refreshToken(user.uid);
  if (!accessToken) return Response.json({ error: "Reddit not connected" }, { status: 400 });

  const productContext = [
    userSnap.data()?.project?.oneliner ?? "",
    watchlist.keywords.join(", "),
  ].filter(Boolean).join(" — ");

  const existing = (userSnap.data()?.redditOpportunities ?? []) as RedditOpportunity[];
  const seenIds = new Set(existing.map((o) => o.threadId));
  const newOpportunities: RedditOpportunity[] = [];

  for (const sub of approvedSubreddits.slice(0, 5)) {
    try {
      const res = await fetch(`https://oauth.reddit.com/r/${sub.name}/new?limit=25`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "User-Agent": "Sorene/1.0" },
      });
      const data = await res.json() as { data?: { children?: { data: { id: string; title: string; selftext?: string; score: number; num_comments: number; created_utc: number; permalink: string } }[] } };
      const posts = data.data?.children ?? [];

      // Filter by keyword relevance
      const relevant = posts.filter((p) => {
        const text = `${p.data.title} ${p.data.selftext ?? ""}`.toLowerCase();
        return watchlist.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).filter((p) => !seenIds.has(p.data.id));

      if (relevant.length === 0) continue;

      // Draft replies with Claude for top 2 per subreddit
      for (const post of relevant.slice(0, 2)) {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: `You are a founder crafting a helpful Reddit reply. Write genuinely useful content — answer the question first. Never start with "I" or "Great question". Sound like a knowledgeable peer, not a marketer. If the product is relevant, mention it naturally at the end with a soft touch — never a hard pitch. Max 150 words.`,
          messages: [{
            role: "user",
            content: `Subreddit: r/${sub.name}
Thread title: "${post.data.title}"
Thread text: "${(post.data.selftext ?? "").slice(0, 400)}"
Product context: ${productContext}

Write a helpful reply. If the product is directly relevant to their problem, mention it briefly at the end ("I actually built something for this — happy to share more if useful"). If it's not directly relevant, just be helpful with no product mention.`,
          }],
        });

        const draftReply = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
        newOpportunities.push({
          id: `${Date.now()}-${post.data.id}`,
          subreddit: sub.name,
          threadId: post.data.id,
          title: post.data.title,
          url: `https://reddit.com${post.data.permalink}`,
          score: post.data.score,
          commentCount: post.data.num_comments,
          createdAt: post.data.created_utc * 1000,
          relevanceScore: watchlist.keywords.filter((kw) =>
            `${post.data.title} ${post.data.selftext ?? ""}`.toLowerCase().includes(kw.toLowerCase())
          ).length,
          draftReply,
        });
      }
    } catch (err) {
      console.error(`[reddit/opportunities] r/${sub.name}:`, err);
    }
  }

  if (newOpportunities.length > 0) {
    const updated = [...existing, ...newOpportunities].slice(-50); // keep last 50
    await db.collection("users").doc(user.uid).set({ redditOpportunities: updated }, { merge: true });
  }

  return Response.json({ ok: true, found: newOpportunities.length, opportunities: newOpportunities });
}

// PATCH — dismiss or mark posted
export async function PATCH(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, draftReply } = await req.json() as { id: string; action: "dismiss" | "post" | "update_draft"; draftReply?: string };
  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(user.uid).get();
  const opportunities = (snap.data()?.redditOpportunities ?? []) as RedditOpportunity[];

  const updated = opportunities.map((o) => {
    if (o.id !== id) return o;
    if (action === "dismiss") return { ...o, dismissed: true };
    if (action === "post") return { ...o, posted: true, postedAt: Date.now() };
    if (action === "update_draft") return { ...o, draftReply: draftReply ?? o.draftReply };
    return o;
  });

  await db.collection("users").doc(user.uid).set({ redditOpportunities: updated }, { merge: true });

  // If posting, submit to Reddit
  if (action === "post") {
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      try {
        const integSnap = await db.doc(`users/${user.uid}/integrations/reddit`).get();
        const accessToken = integSnap.data()?.accessToken;
        if (accessToken) {
          await fetch("https://oauth.reddit.com/api/comment", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Sorene/1.0",
            },
            body: new URLSearchParams({
              api_type: "json",
              thing_id: `t3_${opp.threadId}`,
              text: opp.draftReply,
            }),
          });
        }
      } catch (err) {
        console.error("[reddit/opportunities PATCH post]", err);
      }
    }
  }

  return Response.json({ ok: true });
}
