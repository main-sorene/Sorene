import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene. You are in a conversation with someone doing a self-assessment.

Your task: read the user's latest message and decide if they are:
A) Answering the question (even partially, even if brief or off-topic — any attempt to answer counts)
B) Asking a clarifying question, expressing confusion, or asking you to explain what you mean

If A: output exactly: ANSWER
If B: output a short, natural response that:
- Explains what you meant in plain language
- Does NOT re-ask the question yet (end with a sentence that naturally invites them to respond, but not a re-ask)
- Stays under 3 sentences
- Matches Sorene's voice: direct, grounded, no hype, no flattery

Do not output anything else for case A. For case B, output only the clarifying response text.`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentQuestion, userMessage, preferredLanguage } = (await req.json()) as {
      currentQuestion: string;
      userMessage: string;
      preferredLanguage?: string;
    };

    const prompt = `The question that was asked: "${currentQuestion}"

The user's response: "${userMessage}"

Is this an answer or a clarifying question?`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

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
