import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { answers } = (await req.json()) as { answers: Record<string, string> };

    const successFeeling = answers["q9_success"] || "";
    const nonNegotiable = (answers["q6_tradeoff"] || "") + " " + (answers["q6_tradeoff_followup"] || "");
    const energy = answers["q1_energy"] || "";
    const quitReason = answers["q1b_quit_reason"] || "";

    const prompt = `You are Sorene, a sharp and warm entrepreneurship coach. Based on these raw answers from a user's assessment, generate two short, beautiful labels.

Their success feeling: "${successFeeling}"
Their non-negotiable trade-off: "${nonNegotiable.trim()}"
Their energy source: "${energy}"
Their quit reason: "${quitReason}"

Generate exactly 2 outputs, each on its own line, in this format:
SUCCESS_VISION: [3-6 word elegant phrase distilling what success means to them — aspirational, not a quote. Examples: "Work That Restores & Sustains", "Creative Freedom With Income", "Building Something That Matters"]
NON_NEGOTIABLE: [3-6 word principled stance naming what they won't trade away — not a quote. Examples: "Moral Integrity Over Revenue", "Wellbeing Above Output", "Creativity Without Compromise"]

No explanation. No extra lines. Just the two labeled outputs.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    const successMatch = raw.match(/SUCCESS_VISION:\s*(.+)/i);
    const nonNegMatch = raw.match(/NON_NEGOTIABLE:\s*(.+)/i);

    return Response.json({
      success_vision_label: successMatch?.[1]?.trim() || null,
      non_negotiable_label: nonNegMatch?.[1]?.trim() || null,
    });
  } catch (err) {
    console.error("[dna-labels] error:", err);
    return Response.json({ success_vision_label: null, non_negotiable_label: null });
  }
}
