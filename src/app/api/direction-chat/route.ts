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
    const { message, directionContext } = (await req.json()) as {
      message: string;
      directionContext: {
        recommendedModel: string | null;
        compatibility: number;
        directionText: string;
        alternatives: { model: string; compatibility: number; summary?: string }[];
        dnaScores: Record<string, unknown>;
      };
    };

    const altsList = directionContext.alternatives
      .map((a) => `- ${a.model} (${a.compatibility}% compatibility)${a.summary ? ": " + a.summary : ""}`)
      .join("\n");

    const prompt = `You are Sorene, a warm and direct entrepreneurship coach. A user is viewing their Direction results — the business model paths that best fit their profile.

Their recommended direction: ${directionContext.recommendedModel || "Not yet determined"} (${directionContext.compatibility}% compatibility)

Direction summary:
${directionContext.directionText || "Not available yet."}

Other possible directions:
${altsList || "None available."}

User's DNA signals: ${JSON.stringify(directionContext.dnaScores)}

The user asks: "${message}"

Reply as Sorene. Be direct, warm, and specific to their actual data. Use short paragraphs separated by blank lines. Bold key phrases with **text** syntax. No bullet lists, no headers. Under 200 words.

Respond ONLY with valid JSON — no markdown code fences, nothing outside the JSON:
{"reply": "<your response>"}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const block = msg.content[0];
    let raw = block && block.type === "text" ? block.text.trim() : "{}";
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

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
