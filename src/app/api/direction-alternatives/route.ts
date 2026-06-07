import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DnaScores } from "@/lib/dnaEngine";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) {
    return Response.json({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }, { status: 402 });
  }

  try {
    const { models, scores, firstName } = (await req.json()) as {
      models: { model: string; compatibility: number }[];
      scores: DnaScores;
      firstName: string;
    };

    if (!Array.isArray(models) || models.length === 0) {
      return Response.json({ summaries: [] });
    }

    const modelList = models
      .map((m, i) => `${i + 1}. ${m.model} (${m.compatibility}% compatibility)`)
      .join("\n");

    const prompt = `You are Sorene — a direct, warm entrepreneurship coach. Generate brief summaries for ${models.length} alternative business directions for ${firstName}.

Models (in order, do not reorder):
${modelList}

DNA scores:
- Risk: ${scores.risk_score}/10
- Uncertainty tolerance: ${scores.uncertainty_score}/10
- Energy stability: ${scores.energy_stability_score}/10
- Structure preference: ${scores.structure_score}/10 (higher = solo)
- Capacity: ${scores.constraint_score}/10
- What energizes them: ${scores.energy_source}
- Trade-off they chose: ${scores.non_negotiable}

For each model, write a concise 2-3 sentence summary (max 60 words) that:
- Describes a concrete direction within that model
- References ONE specific aspect of their DNA that fits
- Names the trade-off honestly (why this is a 2nd/3rd choice not 1st)
- No hype, no "let's", no markdown, no bullets

Output JSON only (no markdown fences):
{"summaries": ["...", "..."]}

The array must contain exactly ${models.length} strings, in the same order as the input models.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    await deductCredits(userKey, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ summaries: [] });

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { summaries?: string[] };
      const summaries = Array.isArray(parsed.summaries) ? parsed.summaries : [];
      return Response.json({ summaries });
    } catch {
      return Response.json({ summaries: [] });
    }
  } catch (err) {
    console.error("[direction-alternatives] error:", err);
    return Response.json({ summaries: [] });
  }
}
