import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DnaScores, StructuralModel } from "@/lib/dnaEngine";
import type { DirectionCardData } from "@/lib/directionTypes";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene's direction engine. You output structured JSON only — no prose, no markdown, no commentary outside the JSON object.

Every field must be grounded in the user's actual DNA data and answers. Do not invent credentials, industries, or circumstances not evidenced in the data.

IKIGAI FRAMEWORK: Every direction must sit at the intersection of all four circles:
1. What You Love — energizes them, aligns with their passion and work style
2. What You're Good At — leverages skills, expertise, and experience they already have (prioritise fast-start paths using existing assets)
3. What The World Needs — validated market demand, real complaint sources
4. What You Can Be Paid For — financially viable within their runway and income floor

CRITICAL: "title" must be a specific business name — not a category. Wrong: "Operational Consultant". Right: "Systems Audit Service for Solo Coaches".

NEGATIVE FILTER (non-negotiable): If the user did NOT enjoy their last type of work (liked_last_work = "no" or "mixed"), any direction that requires them to primarily perform that same category of work MUST be rejected — not softened, not reframed. Structurally avoid work types listed in negative_work_types. If no valid direction exists without that work type, flag it explicitly and pivot toward an adjacent skill application.

SKILLS LEVERAGE RULE: Always prioritise directions that convert existing expertise into a new vehicle, reducing time-to-start. A direction that requires learning an entirely new field from scratch is only valid if the user has high constraint_score and runway.`;

function buildPrompt(
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
): string {
  const bgBlock = cvSummary?.trim()
    ? `CV/portfolio summary:\n${cvSummary.trim()}`
    : [
        rawAnswers["bg1_history"] ? `- Current / most recent role: ${rawAnswers["bg1_history"]}` : "",
        rawAnswers["bg2_skills"] ? `- Years of experience and fields: ${rawAnswers["bg2_skills"]}` : "",
        rawAnswers["bg3_pattern"] ? `- Core expertise (what they're known for): ${rawAnswers["bg3_pattern"]}` : "",
        rawAnswers["bg4_direction"] ? `- Key skills and tools: ${rawAnswers["bg4_direction"]}` : "",
        rawAnswers["bg5_turning"] ? `- Career arc: ${rawAnswers["bg5_turning"]}` : "",
      ].filter(Boolean).join("\n");

  const modelList = models
    .map((m, i) => `${i + 1}. ${m.model} (compatibility: ${m.compatibility}%)${m.isPrimary ? " ← PRIMARY" : ""}`)
    .join("\n");

  return `Generate ${models.length} direction card(s) for ${firstName}.

USER DNA:
- What energizes them: ${scores.energy_source}
- What drains them: ${scores.energy_drains}
- Why they left / are leaving: ${scores.quit_reason || "not provided"}
- Non-negotiable trade-off: ${scores.non_negotiable}
- Success feeling: ${scores.success_feeling}
- Motivation driver: ${scores.motivation_driver}
- Risk score: ${scores.risk_score}/10
- Uncertainty tolerance: ${scores.uncertainty_score}/10
- Energy stability: ${scores.energy_stability_score}/10
- Constraint level: ${scores.constraint_score}/10 (higher = more capacity)
- Readiness: ${scores.readiness_score}/10
- Structure preference: ${scores.structure_score}/10 (higher = solo)
- Time available: ${rawAnswers["q4_time"] || "unknown"}
- Income timeline: ${rawAnswers["q5_finance"] || "unknown"}
- Work mode: ${rawAnswers["q8_workmode"] || "unknown"}
- Readiness state: ${rawAnswers["q11_readiness"] || "unknown"}
- Liked their last type of work: ${(scores as any).liked_last_work || "not captured"}
- Work types to avoid (negative filter): ${(scores as any).negative_work_types || "none specified"}
- What pushed them out: ${scores.quit_reason || "not provided"}

${bgBlock ? `BACKGROUND:\n${bgBlock}\n` : ""}
MODELS TO GENERATE:
${modelList}

For EACH model, produce a DirectionCardData object with ALL of these fields:

- title: string — specific business name, max 10 words, NOT a category
- compatibility: number — use the provided compatibility score exactly
- oneliner: string — what it does and who it serves, max 20 words
- description: string — 3-5 sentences covering: the specific complaint it solves, why now (name the industry shift), who the first customers are
- why_fits_you: string[] — 3-4 bullets grounded in their exact credentials, tools, assessment answers, and constraints
- key_risks: string[] — 2 honest, specific risks for this direction
- why_now: string — what changed in the last 12–18 months that makes this viable today? Name the specific tool launch, platform change, or market event
- simple_positioning: string — "It is like [bloated incumbent] but only does [the one thing the complainant actually needs]"
- unfair_advantage: string — why ${firstName} specifically; reference their exact credential or demonstrated skill
- ikigai_filters: object with these five keys, each { score: 0-100, reason: "1 sentence grounded in their exact data" }:
    what_you_love: Does this direction energise them? Does it match their energy source and avoid their energy drains? Reference their q1_energy answer.
    what_you_are_good_at: Can they do this with skills/expertise they already have? How much of their existing toolkit transfers directly? Reference specific tools or credentials.
    what_world_needs: Is there validated market demand? Is there a real complaint this solves? Name a specific signal.
    what_you_can_be_paid_for: Can this generate meaningful income within their runway? Show rough math against their income floor.
    lifestyle_fit: Does the model match their hours, location, travel, family constraints, and growth ambition?
- composite_score: number — Ikigai intersection score. Formula: arithmetic mean of all five scores, then subtract 3 points for every Ikigai circle (what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for) that scores below 60. A direction must be strong across ALL four Ikigai circles to score high. Round to nearest integer.
- high_risk_flags: string[] — one entry per filter scored below 60, format: "FilterName (score): specific reason"
- startup_cost_usd: string — e.g. "$0–$500"
- time_to_first_revenue_weeks: string — factoring in time constraints from DNA, e.g. "6–10 weeks"
- hours_per_week: string — at 1-client scale, e.g. "8–12 hrs/week"
- constraint_check: { status: "Pass" | "Warn" | "Fail", reason?: string (required if Warn or Fail) }
- first_10_customers: string — 1 sentence, specific channel and location-aware
- competition: { layer1_workaround: string, layer2_incumbent: string, layer3_simple_competitors: string }
- economic_urgency: string — what does the buyer's current workaround cost per month? This is the price anchor
- ocean_classification: { type: "Blue" | "Purple" | "Red", density: string }
- trend_connection: string — which macro industry shift does this connect to
- complaint_source: string — which specific validated complaint is this rooted in
- window_risk: string — what closes this window and roughly when

Return JSON only, exactly this shape (no markdown fences):
{"cards": [/* one object per model */]}`;
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[];
      scores: DnaScores;
      firstName: string;
      rawAnswers: Record<string, string>;
      cvSummary?: string;
    };

    const { models, scores, firstName, rawAnswers, cvSummary } = body;

    if (!models || models.length === 0) {
      return Response.json({ cards: [] });
    }

    const prompt = buildPrompt(models, scores, firstName, rawAnswers, cvSummary);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block?.type === "text" ? block.text.trim() : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[direction-cards] no JSON in response:", raw.slice(0, 200));
      return Response.json({ cards: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { cards?: DirectionCardData[] };
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    return Response.json({ cards });
  } catch (err) {
    console.error("[direction-cards] error:", err);
    return Response.json({ cards: [] }, { status: 500 });
  }
}
