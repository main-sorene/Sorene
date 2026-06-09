import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) {
    return Response.json(
      { error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit },
      { status: 402 },
    );
  }

  const { prompt, name, segment } = (await req.json()) as {
    prompt: string;
    name?: string;
    segment?: string;
  };

  const userName = name?.trim() || "there";

  const systemPrompt = `You are Sorene, a warm, insightful, and practical AI coach for entrepreneurs and professionals.${userName !== "there" ? ` You are talking with ${userName}.` : ""}

Your role is to help users think clearly, make decisions, and take action. You offer thoughtful, direct guidance — not generic advice. You ask great questions when needed and give concrete answers when asked.

Keep responses concise (2-4 short paragraphs), use **bold** for key phrases to aid scanning. No bullet lists unless the user asks for them. Be human, warm, and specific.`;

  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const reply = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const credits = calculateCredits(message.usage.input_tokens, message.usage.output_tokens);
  await deductCredits(userKey, credits);

  return Response.json({
    done: false,
    nquestion: 0,
    reply,
    segment: segment ?? "chat",
  });
}
