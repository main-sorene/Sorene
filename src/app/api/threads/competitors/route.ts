import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface Competitor {
  username: string;
  addedAt: number;
  lastAnalyzedAt?: number;
  postCount?: number;
  insights?: string;
}

// GET — list saved competitors
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const competitors = (snap.data()?.threadsCompetitors ?? []) as Competitor[];
  return Response.json({ competitors });
}

// POST — add a competitor username OR analyze all competitors
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { action: "add" | "analyze" | "remove"; username?: string };
  const db = getAdminFirestore();
  const docRef = db.collection("users").doc(user.uid);

  if (body.action === "add") {
    const username = body.username?.replace(/^@/, "").trim().toLowerCase();
    if (!username) return Response.json({ error: "Missing username" }, { status: 400 });

    const snap = await docRef.get();
    const existing = (snap.data()?.threadsCompetitors ?? []) as Competitor[];
    if (existing.find((c) => c.username === username)) {
      return Response.json({ error: "Already added" }, { status: 409 });
    }
    const updated = [...existing, { username, addedAt: Date.now() }];
    await docRef.set({ threadsCompetitors: updated }, { merge: true });
    return Response.json({ ok: true, competitors: updated });
  }

  if (body.action === "remove") {
    const username = body.username?.replace(/^@/, "").trim().toLowerCase();
    const snap = await docRef.get();
    const existing = (snap.data()?.threadsCompetitors ?? []) as Competitor[];
    const updated = existing.filter((c) => c.username !== username);
    await docRef.set({ threadsCompetitors: updated }, { merge: true });
    return Response.json({ ok: true, competitors: updated });
  }

  if (body.action === "analyze") {
    const snap = await docRef.get();
    const competitors = (snap.data()?.threadsCompetitors ?? []) as Competitor[];
    if (competitors.length === 0) return Response.json({ error: "No competitors added" }, { status: 400 });

    // Get the user's Threads access token to fetch competitor posts
    const accountSnap = await docRef.collection("integrations").doc("threads").get();
    const account = accountSnap.data();
    if (!account?.accessToken) return Response.json({ error: "Threads not connected" }, { status: 400 });

    const accessToken = account.accessToken as string;
    const updated: Competitor[] = [];

    for (const competitor of competitors) {
      try {
        // Look up user ID by username
        const userRes = await fetch(
          `https://graph.threads.net/v1.0/${competitor.username}?fields=id,username&access_token=${accessToken}`
        );
        const userData = await userRes.json() as { id?: string; username?: string; error?: { message: string } };

        if (!userData.id) {
          updated.push({ ...competitor, insights: `Could not find @${competitor.username} — account may be private or username incorrect.` });
          continue;
        }

        // Fetch their recent posts
        const postsRes = await fetch(
          `https://graph.threads.net/v1.0/${userData.id}/threads?fields=id,text,timestamp&limit=20&access_token=${accessToken}`
        );
        const postsData = await postsRes.json() as { data?: { id: string; text?: string; timestamp?: string }[] };
        const posts = (postsData.data ?? []).filter((p) => p.text?.trim());

        if (posts.length === 0) {
          updated.push({ ...competitor, insights: `No public posts found for @${competitor.username}.` });
          continue;
        }

        // Analyze with Claude
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: `You are a content strategist analyzing a Threads account to extract actionable patterns for a founder to learn from. Be specific and direct. Use **bold** for key phrases.`,
          messages: [{
            role: "user",
            content: `Analyze these ${posts.length} posts from @${competitor.username} on Threads. Extract the patterns that make their content work.

Posts:
${posts.map((p, i) => `${i + 1}. "${(p.text ?? "").slice(0, 250)}"`).join("\n")}

Write exactly 2 short paragraphs separated by a blank line. Do NOT run them together.

Paragraph 1: Start with "**Hook patterns**" — what opening lines, formats, and structures they use that grab attention. Be specific with examples.
Paragraph 2: Start with "**Steal this**" — 2-3 specific tactics or content angles our user should directly adapt (not copy) for their own audience.

Keep each paragraph under 70 words. Output nothing else.`,
          }],
        });

        const insights = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
        updated.push({
          ...competitor,
          lastAnalyzedAt: Date.now(),
          postCount: posts.length,
          insights,
        });
      } catch (err) {
        console.error(`[competitors] failed for ${competitor.username}:`, err);
        updated.push({ ...competitor, insights: `Analysis failed for @${competitor.username}.` });
      }
    }

    await docRef.set({ threadsCompetitors: updated }, { merge: true });
    return Response.json({ ok: true, competitors: updated });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
