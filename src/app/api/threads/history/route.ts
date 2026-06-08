import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ThreadsPost {
  id: string;
  text?: string;
  timestamp?: string;
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
}

async function fetchPostInsights(postId: string, token: string): Promise<Partial<ThreadsPost>> {
  try {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${postId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`
    );
    const data = await res.json() as { data?: { name: string; values?: { value: number }[] }[] };
    const metrics: Partial<ThreadsPost> = {};
    for (const item of data.data ?? []) {
      const val = item.values?.[0]?.value ?? 0;
      if (item.name === "views") metrics.views = val;
      if (item.name === "likes") metrics.likes = val;
      if (item.name === "replies") metrics.replies = val;
      if (item.name === "reposts") metrics.reposts = val;
      if (item.name === "quotes") metrics.quotes = val;
    }
    return metrics;
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const snap = await db.doc(`users/${user.uid}/integrations/threads`).get();
  const account = snap.data();
  if (!account?.accessToken) return Response.json({ error: "Not connected" }, { status: 400 });

  const accessToken = account.accessToken as string;
  const userId = account.threadsUserId as string;

  try {
    // Fetch last 25 posts
    const postsRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?fields=id,text,timestamp&limit=25&access_token=${accessToken}`
    );
    const postsData = await postsRes.json() as { data?: { id: string; text?: string; timestamp?: string }[] };
    const rawPosts = postsData.data ?? [];

    if (rawPosts.length === 0) {
      return Response.json({ dna: null, message: "No posts found to analyse." });
    }

    // Fetch insights for each post (in parallel, max 25)
    const posts: ThreadsPost[] = await Promise.all(
      rawPosts.map(async (p) => {
        const insights = await fetchPostInsights(p.id, accessToken);
        return { id: p.id, text: p.text ?? "", timestamp: p.timestamp, ...insights };
      })
    );

    // Find best posting hours from top-performing posts
    const scored = posts
      .filter((p) => p.timestamp)
      .map((p) => ({
        ...p,
        score: (p.views ?? 0) + (p.likes ?? 0) * 3 + (p.replies ?? 0) * 5 + (p.reposts ?? 0) * 4,
        hour: new Date(p.timestamp!).getUTCHours(),
      }))
      .sort((a, b) => b.score - a.score);

    const topPosts = scored.slice(0, 10);
    const hourCounts: Record<number, number> = {};
    topPosts.forEach((p) => {
      hourCounts[p.hour] = (hourCounts[p.hour] ?? 0) + p.score;
    });
    const bestHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => parseInt(h));

    // Analyse with Sorene
    const postsForAnalysis = posts.slice(0, 20).map((p) => ({
      text: (p.text ?? "").slice(0, 300),
      views: p.views ?? 0,
      likes: p.likes ?? 0,
      replies: p.replies ?? 0,
      reposts: p.reposts ?? 0,
    }));

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: `You are Sorene, a sharp execution coach analysing a founder's Threads content performance. Be specific, direct, and actionable. Use **bold** to highlight key phrases and numbers. Structure your response in exactly 3 short paragraphs separated by blank lines.`,
      messages: [{
        role: "user",
        content: `Analyse these ${posts.length} Threads posts and their engagement metrics. Find the patterns that drive performance for this specific account.

Posts (text + engagement):
${postsForAnalysis.map((p, i) => `${i + 1}. "${p.text}" | views:${p.views} likes:${p.likes} replies:${p.replies} reposts:${p.reposts}`).join("\n")}

Write exactly 3 short paragraphs. Start each on a new line with a blank line between them. Do NOT run them together.

Paragraph 1: Start with "**What's Working**" — which post types, formats, or topics get the most engagement (cite post numbers and real metrics).
Paragraph 2: Start with "**What's Not Working**" — patterns that underperform and why.
Paragraph 3: Start with "**Next:**" — 2-3 specific, actionable things to do this week.

Use **bold** on key numbers and phrases. Keep each paragraph under 60 words. Output nothing else — just the 3 paragraphs separated by blank lines.`,
      }],
    });

    const summary = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

    const dna = {
      summary,
      bestHours,
      postCount: posts.length,
      analyzedAt: Date.now(),
      topScore: scored[0]?.score ?? 0,
    };

    await db.collection("users").doc(user.uid).set({ threadsContentDNA: dna }, { merge: true });

    return Response.json({ dna });
  } catch (err) {
    console.error("[threads history]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
