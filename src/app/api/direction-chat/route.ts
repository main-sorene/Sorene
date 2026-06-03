import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const RECIPE_PROMPTS: Record<string, string> = {
  "check-my-idea": `You are helping the user stress-test a specific business or project idea they have in mind.

On turn 1: write exactly two warm, friendly sentences inviting the user to share their idea. Nothing else — no question label, no third line.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one sharp observation about what they've shared — a strength, a gap, or a pattern (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions across turns 2–6 — dig into the idea's target audience, problem fit, competitive edge, revenue model, and first proof of traction. After their answer to question 5, output a Direction Card:

**Direction: [name of their idea, sharpened]**
[2-3 sentences on the idea's core potential and why it could work]

**Why it fits you**
- [grounded in what they shared about themselves]
- [grounded in their words]

**Key risks**
- [1-2 honest, specific risks for this idea]

**Your first step**
[One small, concrete action to validate the idea this week]

Start now with turn 1.`,

  "brainstorm-new-idea": `You are helping the user brainstorm business or project ideas.

On turn 1: write exactly two warm, friendly sentences opening the conversation and setting the tone. Nothing else — no question label, no third line.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one observation about a pattern in what they've shared (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn. After their answer to question 5, output a Direction Card:

**Direction: [specific direction]**
[2-3 sentences on why it fits]

**Why it fits you**
- [grounded in their words]
- [grounded in their words]

**Key risks**
- [1-2 honest risks]

**Your first step**
[One small, reversible action]

Start now with turn 1.`,

  "generate-from-constraints": `You are Sorene, a direction generator. The user has shared their resources and constraints. Generate exactly ONE Direction Card immediately — no preamble, no questions, no explanation.

Output ONLY this format:

**Direction: [specific, concrete direction name]**
[2-3 sentences on the core opportunity and why it works given their situation]

**Why it fits you**
- [grounded in their specific resources or assets]
- [grounded in their time and capital constraints]
- [grounded in their preferences and ambitions]

**Key risks**
- [1-2 honest, specific risks given their stated constraints]

**Your first step**
[One small, concrete, reversible action they can take this week, matching their available hours and capital]`,

  "generate-new-direction": `You are helping the user discover new directions beyond what they already have.

On turn 1: write exactly two warm, friendly sentences opening the conversation and setting the tone. Nothing else — no question label, no third line.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one observation about a pattern in what they've shared about their current directions or what feels missing (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn. After their answer to question 5, output a Direction Card:

**Direction: [specific direction]**
[2-3 sentences on why it fits]

**Why it fits you**
- [grounded in their words]
- [grounded in their words]

**Key risks**
- [1-2 honest risks]

**Your first step**
[One small, reversible action]

Start now with turn 1.`,
};

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, directionContext, recipeId, history } = (await req.json()) as {
      message: string;
      directionContext: {
        recommendedModel: string | null;
        compatibility: number;
        directionText: string;
        alternatives: { model: string; compatibility: number; summary?: string }[];
        dnaScores: Record<string, unknown>;
      };
      recipeId?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    let systemPrompt: string;
    let messages: { role: "user" | "assistant"; content: string }[];

    const recipePrompt = recipeId ? RECIPE_PROMPTS[recipeId] : null;
    if (recipePrompt) {
      // Recipe mode: look up prompt server-side, replay full history
      systemPrompt = recipePrompt;
      const prior = (history ?? []).map((m) => ({ role: m.role, content: m.content }));
      messages = [...prior, { role: "user" as const, content: message }];
    } else {
      // Default direction-chat mode
      const altsList = directionContext.alternatives
        .map((a) => `- ${a.model} (${a.compatibility}% compatibility)${a.summary ? ": " + a.summary : ""}`)
        .join("\n");

      systemPrompt = `You are Sorene, a warm and direct entrepreneurship coach. A user is viewing their Direction results — the business model paths that best fit their profile.

Their recommended direction: ${directionContext.recommendedModel || "Not yet determined"} (${directionContext.compatibility}% compatibility)

Direction summary:
${directionContext.directionText || "Not available yet."}

Other possible directions:
${altsList || "None available."}

User's DNA signals: ${JSON.stringify(directionContext.dnaScores)}

IMPORTANT: If the user expresses dissatisfaction with the suggested directions or asks for more options:
1. Ask them to clarify WHY the current directions don't feel right.
2. Suggest alternative directions that better address their concerns.
3. Don't just repeat the existing alternatives.

Be direct, warm, and specific to their actual data. Use short paragraphs. Bold key phrases with **text** syntax. No bullet lists, no headers. Under 200 words.`;

      messages = [{ role: "user" as const, content: message }];
    }

    const msg = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const block = msg.content[0];
    const reply = block && block.type === "text" ? block.text.trim() : "Sorry, I couldn't respond. Try again.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[direction-chat] error:", error);
    return NextResponse.json({ reply: "Sorry, I had trouble with that. Please try again." }, { status: 500 });
  }
}
