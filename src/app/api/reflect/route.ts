import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { answer, signal, questionText, nextQuestion, forceLanguage } = (await req.json()) as {
      answer: string;
      signal: string;
      questionText: string;
      nextQuestion?: string;
      forceLanguage?: string;
    };

    const hasNextQuestion = nextQuestion && nextQuestion.trim().length > 0;

    // Translation-only mode: skip reflection, just translate nextQuestion
    if (forceLanguage && hasNextQuestion) {
      const prompt = `Translate the following text into ${forceLanguage}. Preserve all formatting, line breaks, and bullet points. Output only the translated text, nothing else.\n\n"""${nextQuestion}"""`;
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const translated = block && block.type === "text" ? block.text.trim() : nextQuestion;
      return Response.json({ reflection: "", translatedQuestion: translated });
    }

    const prompt = hasNextQuestion
      ? `You are Sorene — a direct, warm entrepreneurship coach. The user just answered an assessment question.

Signal being measured: ${signal}
Their answer: "${answer}"
Next question to ask (in English): """${nextQuestion}"""

Detect the language the user wrote in. Your output must have exactly three parts separated by blank lines:

Part 1 — The detected language name in English (e.g. "English", "Vietnamese", "Spanish"). One word or two words only.

Part 2 — ONE short sentence (max 15 words) in the user's language that:
- Reflects back what you heard — specific to what they said, not generic
- Feels like a real human noticing a pattern, not a chatbot confirming receipt
- Never starts with "I see", "Great", "Thanks", "Got it", "Interesting"
- No punctuation at the end except a period

Part 3 — The next question, translated/adapted into the user's language. Preserve the full meaning and tone. Keep all line breaks and bullet points intact. If the user wrote in English, output the original question unchanged.

Output only these three parts. No labels, no extra text.`
      : `You are Sorene — a direct, warm entrepreneurship coach. The user just answered an assessment question.

Signal being measured: ${signal}
Their answer: "${answer}"

IMPORTANT: Detect the language the user wrote in. Respond in that same language.

Write ONE short sentence (max 15 words) that:
- Reflects back what you heard — specific to what they said, not generic
- Feels like a real human noticing a pattern, not a chatbot confirming receipt
- Never starts with "I see", "Great", "Thanks", "Got it", "Interesting"
- No punctuation at the end except a period

Output only that one sentence. Nothing else.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: hasNextQuestion ? 400 : 80,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";

    if (!hasNextQuestion) {
      return Response.json({ reflection: raw, translatedQuestion: "", detectedLanguage: "" });
    }

    // Split into three parts: language, reflection, translated question
    const parts = raw.split(/\n\n+/);
    if (parts.length < 3) {
      // Fallback: treat as old 2-part format
      const reflection = parts[0]?.trim() ?? "";
      const translatedQuestion = parts[1]?.trim() ?? "";
      return Response.json({ reflection, translatedQuestion, detectedLanguage: "" });
    }
    const detectedLanguage = parts[0].trim();
    const reflection = parts[1].trim();
    const translatedQuestion = parts.slice(2).join("\n\n").trim();
    return Response.json({ reflection, translatedQuestion, detectedLanguage });
  } catch (err) {
    console.error("[reflect] error:", err);
    return Response.json({ reflection: "", translatedQuestion: "" });
  }
}
