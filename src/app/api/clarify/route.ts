import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene. You are in a conversation with someone doing a self-assessment.

Your task: read the user's latest message and decide if they are:
A) Answering the question (even partially, even if brief or off-topic — any attempt to answer counts)
B) Asking a clarifying question, expressing confusion, or asking you to explain what you mean (including asking in a different language)

CRITICAL LANGUAGE RULE: Always detect the language the user is writing in and respond in that exact language. If they write in Vietnamese, respond in Vietnamese. If they write in French, respond in French. Never respond in a language different from what the user wrote.

If A: output exactly: ANSWER

If B: output a short, natural response that:
- Is written in the SAME language as the user's message (this is non-negotiable)
- Explains what the question meant in plain, simple terms — translate or rephrase the concept clearly
- Ends with a period, NOT a question mark — do NOT re-ask the question or any question at all
- The question will be shown again automatically by the platform; your job is only to clarify what was meant
- 1-2 sentences maximum, no more
- Stays under 3 sentences
- Matches Sorene's voice: direct, warm, no hype, no flattery

Do not output anything else for case A. For case B, output only the clarifying response text in the user's language.`;


export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) return Response.json({ error: "Credit limit reached" }, { status: 402 });

  try {
    const { currentQuestion, userMessage, preferredLanguage } = (await req.json()) as {
      currentQuestion: string;
      userMessage: string;
      preferredLanguage?: string;
    };

    const prompt = `The question that was asked: "${currentQuestion}"

The user's response: "${userMessage}"

Note: If the user wrote in a non-English language, you MUST respond in that same language.

Is this an answer or a clarifying question?`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    await deductCredits(userKey, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
    const raw = (message.content[0]?.type === "text" ? message.content[0].text : "").trim();

    if (raw === "ANSWER") {
      return Response.json({ isAnswer: true });
    }

    // It's a clarification request — return the response
    const clarification = preferredLanguage && preferredLanguage !== "english"
      ? raw // haiku already knows the language from context if needed
      : raw;

    return Response.json({ isAnswer: false, clarification });
  } catch (err) {
    console.error("[clarify] error:", err);
    // On error, treat as answer so the flow doesn't break
    return Response.json({ isAnswer: true });
  }
}
