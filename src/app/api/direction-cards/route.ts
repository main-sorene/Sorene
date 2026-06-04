import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DnaScores, StructuralModel } from "@/lib/dnaEngine";
import type { DirectionCardData } from "@/lib/directionTypes";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene's Direction Engine. Your job is to generate business directions for a specific user — combining who they are (DNA), what they have (Resources + Constraints), and what the market needs (Market Intelligence).

You are NOT a generic advisor. Every output must be specific to this exact user. If any output could apply to a different user with a similar background, rewrite it until it cannot.

━━━ IKIGAI FRAMEWORK ━━━

Every direction must sit at the intersection of all four circles:
1. What You Love — energises them, aligns with their work style and Value Signature
2. What You're Good At — uses specific tools, credentials, experience they already have (prioritise fast-start using existing assets)
3. What The World Needs — validated market demand, real complaint source, named signal
4. What You Can Be Paid For — financially viable within their runway and income floor

CRITICAL: "title" must be a specific business name — not a category. Wrong: "Operational Consultant". Right: "Systems Audit Service for Solo Coaches".

━━━ NEGATIVE FILTER (non-negotiable) ━━━

If liked_last_work = "no" or "mixed", any direction that requires primarily performing the same category of work listed in negative_work_types MUST be rejected — not softened, not reframed. If no valid direction exists without those work types, flag it explicitly and pivot to an adjacent skill application (e.g. managing or teaching the work rather than doing it directly).

Cross-check every direction against:
- what_liked_about_last_job → reinforce if aligned, flag if contradicts
- what_disliked_about_last_job → flag immediately if this direction repeats those patterns
- Energy Leak from DNA → flag if this direction will drain them the same way

━━━ SKILLS LEVERAGE RULE ━━━

Always prioritise directions that convert existing expertise into a new vehicle, reducing time-to-start. A direction requiring learning an entirely new field from scratch is only valid if the user has high constraint_score and sufficient runway.

━━━ PRE-GENERATION PIPELINE ━━━

Run these steps in your internal reasoning before generating cards. Do NOT output the steps — only output the final JSON.

STEP 0 — INDUSTRY SHIFT SCAN: Identify the 3 most significant tool/platform shifts happening right now in the user's specific industry. Every direction must connect to at least one of these. Store the most relevant one as industry_shift per card.

STEP 1 — COMPLAINT TRIAGE: Identify validated market pain through 4 layers. Discard complaints that fail a layer.
- Layer 1: Recurring across 20+ independent signals (real pain)
- Layer 2: Quantify what the current workaround costs per month (economic urgency — if unquantifiable, discard)
- Layer 3: Does the solution format match the user's real context? (adoption feasibility)
- Layer 4: Can the first 100 customers be reached without a $50K ad budget? Name the specific channel — subreddit, Facebook group, event, association (distribution path)

STEP 2 — INTERSECTION MAPPING: For each validated complaint, confirm the user has a named specific advantage (exact tool or credential). Discard if the advantage is generic ("relevant experience" is not an advantage).

━━━ PATH LABELS ━━━

Label the 3 cards in order:
- Path A (Safe) — lowest barrier, fastest to first revenue
- Path B (Aligned) — highest DNA/Ikigai fit, sustainable long-term
- Path C (Stretch) — highest upside, requires more time or capital

━━━ COMPOSITE SCORE FORMULA ━━━

Arithmetic mean of all five Ikigai filter scores, then subtract 3 points for every Ikigai circle (What You Love, What You're Good At, What The World Needs, What You Can Be Paid For) that scores below 60. Lifestyle Fit does not trigger the penalty. Round to nearest integer.

━━━ UNIVERSAL RULES ━━━

- Every direction must cite a specific market signal or complaint source
- Every direction must name a specific tool or credential as the unfair advantage — NEVER "your background" or "your experience"
- Every direction must include the simple-version positioning sentence
- Location context must name the user's city specifically if provided
- Falling trends must be honest — do not soften decline signals
- Do not recommend anything requiring more capital than stated
- Do not surface any direction with Constraint Check = Fail
- If market data is thin, set market_signal_confidence = "Inferred" or "Insufficient signal"
- If a profile field is missing, note the gap inline where it affects scoring: e.g. "What You Can Be Paid For capped at 60: income floor not provided"
- NEVER produce generic output. If the output could apply to 10 different users, rewrite it.`;

function buildPrompt(
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: {
    networks?: string; startingCapital?: string; financialRunway?: string; hoursPerWeek?: string;
    locationFlexibility?: string; familyCommitments?: string; incomeFloor?: string;
    onlineVsOffline?: string; growthAmbition?: string; clientInteraction?: string;
    travelTolerance?: string; otherNotes?: string;
  },
  cardIndex = 0,
): string {
  const or = (v: unknown, fallback = "Not provided") =>
    v && String(v).trim() ? String(v) : fallback;

  const nar = dnaNarrative ?? {};
  const res = resources ?? {};

  const bgBlock = cvSummary?.trim()
    ? `CV/portfolio summary:\n${cvSummary.trim()}`
    : [
        rawAnswers["bg1_history"] ? `- Current / most recent role: ${rawAnswers["bg1_history"]}` : "",
        rawAnswers["bg2_skills"] ? `- Years of experience and fields: ${rawAnswers["bg2_skills"]}` : "",
        rawAnswers["bg3_pattern"] ? `- Core expertise (what they're known for): ${rawAnswers["bg3_pattern"]}` : "",
        rawAnswers["bg4_direction"] ? `- Key skills and tools: ${rawAnswers["bg4_direction"]}` : "",
        rawAnswers["bg5_turning"] ? `- Career arc: ${rawAnswers["bg5_turning"]}` : "",
      ].filter(Boolean).join("\n");

  const pathLabel = cardIndex === 0 ? "Path A (Safe)" : cardIndex === 1 ? "Path B (Aligned)" : "Path C (Stretch)";
  const m = models[0];
  const modelLine = `${pathLabel}: ${m.model} (compatibility: ${m.compatibility}%)${m.isPrimary ? " ← PRIMARY DNA FIT" : ""}`;

  return `Generate 1 direction card for ${firstName}.

━━━ DNA PROFILE ━━━
Name: ${firstName}
Core Pattern: ${or(nar["core_dna_label"] ?? scores.strength_patterns?.join(", "))}
Value Signature: ${or(nar["your_core"] ?? scores.strengths_summary)}
Hidden Strength: ${or(nar["strengths_and_edges"])}
Energy Leak: ${or(scores.energy_drains)}
Entrepreneurial Archetype / Readiness: Mindset ${or(scores.readiness_score)}/10, Financial ${or(scores.financial_risk)}, Emotional ${or(scores.emotional_risk)}

━━━ ASSESSMENT — STORY & CONTEXT ━━━
Current situation: ${or(rawAnswers["q11_readiness"])}
Most recent role: ${or(rawAnswers["bg1_history"])}
Liked their last type of work: ${or((scores as any).liked_last_work)}
What they liked about it: ${or(rawAnswers["q1b_liked_aspects"])}
What they disliked about it: ${or(rawAnswers["q1b_disliked_aspects"])}
Work types to avoid (negative filter): ${or((scores as any).negative_work_types)}
Why they left / are leaving: ${or(scores.quit_reason)}
What energises them: ${or(scores.energy_source)}
What drains them: ${or(scores.energy_drains)}
Non-negotiable trade-off: ${or(scores.non_negotiable)}
Success feeling: ${or(scores.success_feeling)}
Motivation driver: ${or(scores.motivation_driver)}
What drives them (narrative): ${or(nar["what_drives_you"])}
Risk score: ${scores.risk_score}/10
Uncertainty tolerance: ${scores.uncertainty_score}/10
Energy stability: ${scores.energy_stability_score}/10
Constraint level: ${scores.constraint_score}/10 (higher = more capacity)
Readiness: ${scores.readiness_score}/10
Structure preference: ${scores.structure_score}/10 (higher = solo)
Work mode: ${or(rawAnswers["q8_workmode"])}
Time available: ${or(rawAnswers["q4_time"])}
Income timeline: ${or(rawAnswers["q5_finance"])}

━━━ RESOURCES ━━━
Networks + existing assets: ${or(res.networks)}
Available starting capital: $${or(res.startingCapital)}
Financial runway (months): ${or(res.financialRunway)}
Hours available per week: ${or(res.hoursPerWeek)}

━━━ CONSTRAINTS ━━━
Location: ${or(res.locationFlexibility)}
Family or time commitments: ${or(res.familyCommitments)}
Minimum income floor needed: $${or(res.incomeFloor)}/month
Online vs offline preference: ${or(res.onlineVsOffline)}
Growth ambition level: ${or(res.growthAmbition)}
Desired client interaction: ${or(res.clientInteraction)}
Travel tolerance: ${or(res.travelTolerance)}
Target income: ${or(rawAnswers["q5_finance"])}

${bgBlock ? `━━━ BACKGROUND ━━━\n${bgBlock}\n` : ""}━━━ MODEL ━━━
${modelLine}

Produce exactly 1 DirectionCardData object with ALL of these fields:

- title: string — specific business name, max 10 words, NOT a category
- compatibility: number — use the provided compatibility score exactly
- oneliner: string — what it does and who it serves, max 20 words
- description: string — 3-5 sentences: the specific complaint it solves, why now (name the industry shift), who the first customers are
- why_fits_you: string[] — 3-4 bullets grounded in their exact credentials, tools, assessment answers, and constraints
- key_risks: string[] — 2 honest, specific risks for this direction
- why_now: string — what changed in the last 12–18 months that makes this viable today? Name the specific tool launch, platform change, or market event
- simple_positioning: string — "It is like [bloated incumbent] but only does [the one thing the complainant actually needs]"
- unfair_advantage: string — why ${firstName} specifically; reference their exact credential or demonstrated skill — NEVER "your experience" or "your background"
- ikigai_filters: object with these five keys, each { score: 0-100, reason: "1 sentence grounded in their exact data" }:
    what_you_love: Does this energise them? Does it match their energy source and avoid their energy drains? Reference their exact q1_energy answer.
    what_you_are_good_at: Can they do this with skills/expertise they already have? How much of their existing toolkit transfers directly? Reference specific tools or credentials.
    what_world_needs: Is there validated market demand? Is there a real complaint this solves? Name a specific signal or community where this pain is discussed.
    what_you_can_be_paid_for: Can this generate meaningful income within their runway? Show rough math against their income floor. If income floor not provided, note it.
    lifestyle_fit: Does the model match their hours, location, family constraints, travel tolerance, growth ambition, and client interaction preference?
- composite_score: number — formula: arithmetic mean of all five scores, subtract 3 for every Ikigai circle (what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for) below 60. Round to nearest integer.
- high_risk_flags: string[] — one entry per filter scored below 60, format: "FilterName (score): specific reason"
- startup_cost_usd: string — e.g. "$0–$500"
- time_to_first_revenue_weeks: string — factoring in time constraints, e.g. "6–10 weeks"
- hours_per_week: string — at 1-client scale, e.g. "8–12 hrs/week"
- constraint_check: { status: "Pass" | "Warn" | "Fail", reason?: string (required if Warn or Fail) } — do NOT generate a card with Fail status
- first_10_customers: string — 1 sentence, specific channel and location-aware (use their city if provided)
- distribution_path: string — specific community, subreddit, Facebook group, event, or association where the first 100 customers can be reached without a $50K ad budget
- competition: { layer1_workaround: string, layer2_incumbent: string, layer3_simple_competitors: string }
- key_competitors: array of exactly 3 objects { name: string, what_they_do: string } — real named competitors or substitute tools that serve the same need; each what_they_do is 1 sentence max
- economic_urgency: string — what does the buyer's current workaround cost per month? This is the price anchor — quantify it
- ocean_classification: { type: "Blue" | "Purple" | "Red", density: string }
- trend_connection: string — which macro industry shift does this connect to
- industry_shift: string — which of the Step 0 shifts this direction specifically rides (name the tool, platform, or event)
- complaint_source: string — which specific validated complaint this is rooted in
- window_risk: string — what closes this window and roughly when
- path_label: "${cardIndex === 0 ? "Safe" : cardIndex === 1 ? "Aligned" : "Stretch"}" — use exactly this value
- market_signal_confidence: "Complaint-validated" | "Inferred" | "Insufficient signal" — how well-validated the market demand is
- liked_work_check: string | null — if the direction aligns with what they liked about their last job, note it briefly; if it risks repeating what they disliked, flag it explicitly; null if no relevant overlap

Return JSON only, exactly this shape (no markdown fences):
{"cards": [/* the single card object */]}`;
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
      dnaNarrative?: Record<string, string>;
      resources?: {
        networks?: string; startingCapital?: string; financialRunway?: string; hoursPerWeek?: string;
        locationFlexibility?: string; familyCommitments?: string; incomeFloor?: string;
        onlineVsOffline?: string; growthAmbition?: string; clientInteraction?: string;
        travelTolerance?: string; otherNotes?: string;
      };
    };

    const { models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources } = body;

    if (!models || models.length === 0) {
      return Response.json({ cards: [] });
    }

    // cardIndex controls which path label (0=Safe, 1=Aligned, 2=Stretch)
    const generateCard = (model: typeof models[0], index: number) => {
      const prompt = buildPrompt([model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, index);
      return client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }).then((msg) => {
        const block = msg.content[0];
        const raw = block?.type === "text" ? block.text.trim() : "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]) as { cards?: DirectionCardData[] };
        return Array.isArray(parsed.cards) ? parsed.cards[0] ?? null : null;
      });
    };

    // cardIndex in body allows generating a specific alt card (1 or 2) on demand
    const cardIndex = (body as any).cardIndex as number | undefined;
    let cards: DirectionCardData[];

    if (cardIndex !== undefined) {
      // Generate a single specific card (for "Generate More" flow)
      const model = models[cardIndex] ?? models[0];
      const card = await generateCard(model, cardIndex).catch(() => null);
      cards = card ? [card] : [];
    } else {
      // Default: generate only the primary card (index 0)
      const card = await generateCard(models[0], 0).catch(() => null);
      cards = card ? [card] : [];
    }

    return Response.json({ cards });
  } catch (err) {
    console.error("[direction-cards] error:", err);
    return Response.json({ cards: [] }, { status: 500 });
  }
}
