import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const creditCheck = await checkCredits(user.uid);
  if (!creditCheck.ok) return Response.json({ error: "Credit limit reached" }, { status: 402 });

  try {
    const { answers, mode } = (await req.json()) as { answers: Record<string, string>; mode?: string };

    if (mode === "energy") {
      const energy = answers["q1_energy"] || "";
      const energyDrain = answers["q1_followup"] || "";
      const quitReason = answers["q1b_quit_reason"] || "";

      const prompt = `You are Sorene, a sharp and warm entrepreneurship coach. Based on these raw answers, generate three outputs about this person's energy profile.

Their energy source (what they enjoy/energizes them): "${energy}"
Their energy drain (what drains them): "${energyDrain}"
Their quit reason: "${quitReason}"

Generate exactly 3 outputs, each on its own line:
ENERGY_SOURCE: [2-5 word elegant label for what gives them energy. Examples: "Creative Craft & Making", "Solving Real Problems", "Building With Purpose". Not a quote.]
ENERGY_DRAIN: [2-5 word elegant label for what drains them. Examples: "Political Toxicity", "Values Misalignment", "Chaotic Environments". Not a quote.]
ENERGY_STRENGTHS: [3-4 strength labels comma-separated, each 2-5 words, reflecting what they bring when energized. Examples: "Creative Flow State, Sustained Deep Work, Craft-First Thinking". Not quotes. Ownable.]

No explanation. No extra lines. Just the three labeled outputs.`;

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 180,
        messages: [{ role: "user", content: prompt }],
      });

      await deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
      const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
      const sourceMatch = raw.match(/ENERGY_SOURCE:\s*(.+)/i);
      const drainMatch = raw.match(/ENERGY_DRAIN:\s*(.+)/i);
      const strengthsMatch = raw.match(/ENERGY_STRENGTHS:\s*(.+)/i);

      return Response.json({
        energy_source_label: sourceMatch?.[1]?.trim() || null,
        energy_drain_label: drainMatch?.[1]?.trim() || null,
        your_energy_strengths: strengthsMatch?.[1]?.trim() || null,
      });
    }

    if (mode === "strengths") {
      const energy = answers["q1_energy"] || "";
      const success = answers["q9_success"] || "";
      const nonNeg = (answers["q6_tradeoff"] || "") + " " + (answers["q6_tradeoff_followup"] || "");
      const workMode = answers["q8_workmode"] || "";
      const quit = answers["q1b_quit_reason"] || "";

      const prompt = `You are Sorene, a sharp entrepreneurship coach. Based on these answers, generate 3-4 core strength labels that reflect what this person genuinely brings.

Their energy source: "${energy}"
Their success vision: "${success}"
Their non-negotiable: "${nonNeg.trim()}"
Their work mode: "${workMode}"
Their quit reason: "${quit}"

Generate exactly 1 output:
STRENGTHS_EDGES: [3-4 strength labels comma-separated, each 2-5 words, specific to this person. Examples: "Operational Creative Depth, Values-Driven Execution, Strategic Clarity Under Pressure". Not generic. Not quotes. Ownable.]

No explanation. No extra lines. Just the one labeled output.`;

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      });

      await deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
      const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
      const match = raw.match(/STRENGTHS_EDGES:\s*(.+)/i);
      return Response.json({ strengths_edges_strengths: match?.[1]?.trim() || null });
    }

    // Default mode: success + non-negotiable labels
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

    await deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
    const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    const successMatch = raw.match(/SUCCESS_VISION:\s*(.+)/i);
    const nonNegMatch = raw.match(/NON_NEGOTIABLE:\s*(.+)/i);

    return Response.json({
      success_vision_label: successMatch?.[1]?.trim() || null,
      non_negotiable_label: nonNegMatch?.[1]?.trim() || null,
    });
  } catch (err) {
    console.error("[dna-labels] error:", err);
    return Response.json({});
  }
}
