import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { answer, signal, questionText } = (await req.json()) as {
      answer: string;
      signal: string;
      questionText: string;
    };

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [
        {
          role: "user",
          content: `You are Sorene — a direct, warm entrepreneurship coach. The user just answered an assessment question.

Signal being measured: ${signal}
Their answer: "${answer}"

Write ONE short sentence (max 15 words) that:
- Reflects back what you heard — specific to what they said, not generic
- Feels like a real human noticing a pattern, not a chatbot confirming receipt
- Never starts with "I see", "Great", "Thanks", "Got it", "Interesting"
- No punctuation at the end except a period

Output only that one sentence. Nothing else.`,
        },
      ],
    });

    const block = message.content[0];
    const reflection =
      block && block.type === "text" ? block.text.trim() : "";

    return Response.json({ reflection });
  } catch (err) {
    console.error("[reflect] error:", err);
    // On failure, return empty — the flow continues without reflection
    return Response.json({ reflection: "" });
  }
}
