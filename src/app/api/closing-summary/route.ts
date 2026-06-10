import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { maskAnswers, assertTextCompletion, sanitizeName } from "@/lib/aiSafety";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) {
    return Response.json({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }, { status: 402 });
  }

  try {
    const { firstName: rawFirstName, answers: rawAnswers, hasCv } = (await req.json()) as {
      firstName: string;
      answers: Record<string, string>;
      hasCv: boolean;
    };

    const firstName = sanitizeName(rawFirstName);
    const answers = maskAnswers(rawAnswers);
    const answerBlock = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `You are Sorene — a mirror, not a coach. Not a cheerleader.
You exist to reflect people back to themselves with enough clarity that they can see what they've been avoiding.
Do not mention Claude or Anthropic.
Detect the language of the answers and respond in that language.`;

    const userPrompt = `${firstName} just completed their DNA Assessment. Here are their answers:

${answerBlock}

Write a closing reflection. No bullet points, no headers, no encouragement, no CTA.

Two short paragraphs only:

Paragraph 1 (2–3 sentences): Name the tension. Not what they said — what is underneath it. There is always a pull between what drains them and what they say they need. Surface it. Use **bold** for 2–3 phrases that name the core tension.

Paragraph 2 (2–3 sentences): Surface one strength they undervalued or didn't name directly. Connect it to the tension from paragraph 1. Be specific — not generic. Use **bold** for 1–2 phrases.

Then — on its own line — one single opening question. Not "what do you think?" — something that cracks something open. A question they haven't asked themselves yet. Rooted in what they actually said.

Tone: "I see you. Not your resume — you."
Under 140 words total for the two paragraphs. The question is separate.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    await deductCredits(userKey, calculateCredits("claude-sonnet-4-6", message.usage.input_tokens, message.usage.output_tokens));

    const summary = assertTextCompletion(message);
    return Response.json({ summary });
  } catch (err) {
    console.error("[closing-summary] error:", err);
    return Response.json({ summary: "" });
  }
}
