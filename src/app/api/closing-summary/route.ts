import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { maskAnswers, assertTextCompletion, sanitizeName } from "@/lib/aiSafety";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
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

    const prompt = `You are Sorene — a direct, warm entrepreneurship coach. A user named ${firstName} just completed their DNA Assessment.

Here are all their answers:
${answerBlock}

Write a closing message in two short paragraphs:

Paragraph 1 — A warm, specific intro (2-3 sentences). Acknowledge that they've just done something real by answering honestly. Reference one specific thing they said that stood out — something that reveals character, not just facts.

Paragraph 2 — A concise, honest summary of who they are (3-4 sentences). Cover: what energises them, how they operate, and what they need from a business. Be specific. No hype, no platitudes. Write as if you've genuinely been listening.

Rules:
- No bullet points, no headers, no markdown
- No phrases like "I can see", "It's clear", "You've got this", "Let's dive in"
- Speak directly to ${firstName}
- Under 150 words total
- End naturally — do not say "let's explore" or point them anywhere

Output only the two paragraphs.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = assertTextCompletion(message);
    return Response.json({ summary });
  } catch (err) {
    console.error("[closing-summary] error:", err);
    return Response.json({ summary: "" });
  }
}
