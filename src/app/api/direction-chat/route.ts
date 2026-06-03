import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, directionContext, systemOverride, history } = (await req.json()) as {
      message: string;
      directionContext: {
        recommendedModel: string | null;
        compatibility: number;
        directionText: string;
        alternatives: { model: string; compatibility: number; summary?: string }[];
        dnaScores: Record<string, unknown>;
      };
      systemOverride?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    let systemPrompt: string;
    let messages: { role: "user" | "assistant"; content: string }[];

    if (systemOverride) {
      // Recipe mode: use the recipe prompt as the system, replay full history
      systemPrompt = systemOverride;
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

    const jsonInstruction = '\n\nRespond ONLY with valid JSON — no markdown code fences, nothing outside the JSON: {"reply": "<your response>"}';

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt + jsonInstruction,
      messages,
    });

    const block = msg.content[0];
    let raw = block && block.type === "text" ? block.text.trim() : "{}";
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    // Extract JSON object if there's surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    let parsed: { reply: string };
    try {
      parsed = JSON.parse(raw) as { reply: string };
    } catch {
      parsed = { reply: raw };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[direction-chat] error:", error);
    return NextResponse.json({ reply: "Sorry, I had trouble with that. Please try again." }, { status: 500 });
  }
}
