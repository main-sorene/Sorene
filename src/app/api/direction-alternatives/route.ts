import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DnaScores } from "@/lib/dnaEngine";
import { assertTextCompletion, sanitizeName, maskScores } from "@/lib/aiSafety";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { models, scores, firstName } = (await req.json()) as {
      models: { model: string; compatibility: number }[];
      scores: DnaScores;
      firstName: string;
    };

    if (!Array.isArray(models) || models.length === 0) {
      return Response.json({ summaries: [] });
    }

    const safeName = sanitizeName(firstName);
    const safeScores = maskScores(scores);

    const modelList = models
      .map((m, i) => `${i + 1}. ${m.model} (${m.compatibility}% compatibility)`)
      .join("\n");

    const prompt = `You are Sorene — a direct, warm entrepreneurship coach. Generate brief summaries for ${models.length} alternative business directions for ${safeName}.

Models (in order, do not reorder):
${modelList}

DNA scores:
- Risk: ${scores.risk_score}/10
- Uncertainty tolerance: ${scores.uncertainty_score}/10
- Energy stability: ${scores.energy_stability_score}/10
- Structure preference: ${scores.structure_score}/10 (higher = solo)
- Capacity: ${scores.constraint_score}/10
- What energizes them: ${safeScores.energy_source}
- Trade-off they chose: ${safeScores.non_negotiable}

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
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = assertTextCompletion(message);

    // Extract JSON from the response, tolerating any surrounding whitespace
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("[direction-alternatives] No JSON object found in response");
      return Response.json({ summaries: [] });
    }

    try {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { summaries?: string[] };
      const summaries = Array.isArray(parsed.summaries) ? parsed.summaries : [];
      if (summaries.length !== models.length) {
        console.error(
          `[direction-alternatives] Expected ${models.length} summaries, got ${summaries.length}`,
        );
      }
      return Response.json({ summaries });
    } catch (parseErr) {
      console.error("[direction-alternatives] JSON parse error:", parseErr);
      return Response.json({ summaries: [] });
    }
  } catch (err) {
    console.error("[direction-alternatives] error:", err);
    return Response.json({ summaries: [] });
  }
}
