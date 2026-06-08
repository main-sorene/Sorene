import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

export interface WatchedSubreddit {
  name: string;           // e.g. "entrepreneur"
  addedBy: "user" | "sorene";
  addedAt: number;
  approved?: boolean;     // for Sorene suggestions, user must approve
  reason?: string;        // why Sorene suggested it
}

export interface RedditWatchlist {
  subreddits: WatchedSubreddit[];
  keywords: string[];
  updatedAt: number;
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const key = projectTitle ? `redditWatchlist__${slug(projectTitle)}` : "redditWatchlist";

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const data = snap.data();
  const watchlist = (data?.[key] ?? (projectTitle ? data?.redditWatchlist : undefined)) as RedditWatchlist | undefined;
  return Response.json({ watchlist: watchlist ?? { subreddits: [], keywords: [], updatedAt: 0 } });
}

export async function PUT(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const key = projectTitle ? `redditWatchlist__${slug(projectTitle)}` : "redditWatchlist";

  const body = await req.json() as Partial<RedditWatchlist>;
  const watchlist: RedditWatchlist = {
    subreddits: body.subreddits ?? [],
    keywords: body.keywords ?? [],
    updatedAt: Date.now(),
  };
  await getAdminFirestore().collection("users").doc(user.uid).set({ [key]: watchlist }, { merge: true });
  return Response.json({ ok: true, watchlist });
}

// POST — ask Sorene to suggest relevant subreddits based on product context
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { productContext } = await req.json() as { productContext: string };
  if (!productContext?.trim()) return Response.json({ error: "Missing product context" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: "You are a Reddit growth expert. Suggest the most relevant subreddits for a founder to engage in — mix of large communities where their target customers hang out, and smaller niche ones where they can build real credibility. Be specific and practical.",
    messages: [{
      role: "user",
      content: `Suggest 6 subreddits for this product/founder: "${productContext}"

Return ONLY valid JSON array, no markdown:
[{"name": "entrepreneur", "reason": "one sentence why"}, ...]

Rules:
- Use exact subreddit names (no r/ prefix)
- Mix: 2-3 large general (r/entrepreneur, r/startups, r/SideProject) + 3-4 niche ones specific to their space
- Prioritize communities where their TARGET CUSTOMER hangs out, not just founder communities
- Include at least 1-2 that allow self-promotion posts`,
    }],
  });

  try {
    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
    const suggestions = JSON.parse(text) as { name: string; reason: string }[];
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
