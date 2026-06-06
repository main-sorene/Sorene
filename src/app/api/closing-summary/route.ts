import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCheck = await checkCredits(user.uid);
  if (!creditCheck.ok) {
    return Response.json({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }, { status: 402 });
  }

  try {
    const { firstName, answers, hasCv } = (await req.json()) as {
      firstName: string;
      answers: Record<string, string>;
      hasCv: boolean;
    };

    const answerBlock = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const prompt = `You are Sorene — a direct, warm entrepreneurship coach. A user named ${firstName} just completed their DNA Assessment.

Here are all their answers:
${answerBlock}

Write a closing message in two short paragraphs:

Paragraph 1 — A warm, specific intro (2-3 sentences). Acknowledge that they've just done something real by answering honestly. Reference one specific thing they said that stood out — something that reveals character, not just facts.

Paragraph 2 — A concise, honest summary of who they are (3-4 sentences). Cover: what energises them, how they operate, and what they need from a business. Be specific. No hype, no platitudes. Write as if you've genuinely been listening.

Rules:
- No bullet points, no headers
- Use **bold** (markdown) to highlight 4–6 key phrases across the two paragraphs — the words that define who they are: the energy source, the operating style, the core need, the constraint. Bold the concept, not filler words.
- No phrases like "I can see", "It's clear", "You've got this", "Let's dive in"
- Speak directly to ${firstName}
- Under 150 words total for the two paragraphs
- After the two paragraphs, add one short line asking if they want to add anything or are ready to explore their DNA Page. Keep it simple and warm — one sentence only.

Output only the two paragraphs followed by the one closing question.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    await deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));

    const block = message.content[0];
    const summary = block && block.type === "text" ? block.text.trim() : "";
    return Response.json({ summary });
  } catch (err) {
    console.error("[closing-summary] error:", err);
    return Response.json({ summary: "" });
  }
}
