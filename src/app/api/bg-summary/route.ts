import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = (answers: Record<string, string>) => `You're Sorene, a personalized entrepreneurship coach.

Based on this person's answers from their assessment, write a polished narrative summary of their professional background.

Their answers:
- Current / most recent role: ${answers.bg1_history || "—"}
- Years of experience & industries: ${answers.bg2_skills || "—"}
- Core expertise: ${answers.bg3_pattern || "—"}
- Key skills & tools: ${answers.bg4_direction || "—"}
- Career path: ${answers.bg5_turning || "—"}

Write a narrative summary in second person, speaking warmly and directly ("You've built...", "Your path shows...").

Style rules:
- 3–4 SHORT paragraphs separated by double newlines. Each paragraph 2–3 sentences max.
- Use **bold** markdown to highlight: job titles, industries, years, skills, and key transitions
- Specific and observational, like a coach noticing patterns in their story
- Warm and human — not corporate or generic
- Never use the words "candidate", "applicant", or "journey"
- No bullet points, no headings

Output only the summary text, nothing else.`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) return Response.json({ error: "Credit limit reached" }, { status: 402 });

  try {
    const { answers } = (await req.json()) as { answers?: Record<string, string> };

    if (!answers || !Object.values(answers).some(Boolean)) {
      return Response.json({ error: "No answers provided" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: PROMPT(answers) }],
    });

    await deductCredits(userKey, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
    const block = message.content[0];
    const summary = block && block.type === "text" ? block.text.trim() : "";

    return Response.json({ summary });
  } catch (error) {
    console.error("[bg-summary] error:", error);
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
