import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DnaScores, StructuralModel } from "@/lib/dnaEngine";
import type { DirectionCardData } from "@/lib/directionTypes";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_TEXT = `You are Sorene's Direction Engine. Your job is to generate business directions for a specific user — combining who they are (DNA), what they have (Resources + Constraints), and what the market needs (Market Intelligence).

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

// System prompt with prompt caching
const SYSTEM_PROMPT_CACHED = [
  {
    type: "text" as const,
    text: SYSTEM_PROMPT_TEXT,
    cache_control: { type: "ephemeral" as const },
  },
];

function buildUserContext(
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

  return `━━━ DNA PROFILE ━━━
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
${modelLine}`;
}

function buildConceptPhase1Prompt(
  concept: string,
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
): string {
  const or = (v: unknown, fallback = "Not provided") => v && String(v).trim() ? String(v) : fallback;
  const nar = dnaNarrative ?? {};
  const res = resources ?? {};
  const bgBlock = cvSummary?.trim() || [
    rawAnswers["bg1_history"] ? `- Most recent role: ${rawAnswers["bg1_history"]}` : "",
    rawAnswers["bg2_skills"] ? `- Experience: ${rawAnswers["bg2_skills"]}` : "",
    rawAnswers["bg4_direction"] ? `- Key skills: ${rawAnswers["bg4_direction"]}` : "",
  ].filter(Boolean).join("\n");

  return `Generate 1 direction card for ${firstName} based on this opportunity concept: "${concept}".

━━━ DNA PROFILE ━━━
Name: ${firstName}
Core Pattern: ${or(nar["core_dna_label"] ?? scores.strength_patterns?.join(", "))}
Value Signature: ${or(nar["your_core"] ?? scores.strengths_summary)}
Risk score: ${scores.risk_score}/10
Constraint level: ${scores.constraint_score}/10
Readiness: ${scores.readiness_score}/10

━━━ RESOURCES ━━━
Networks: ${or(res.networks)}
Capital: $${or(res.startingCapital)}
Runway (months): ${or(res.financialRunway)}
Hours/week: ${or(res.hoursPerWeek)}
Income floor: $${or(res.incomeFloor)}/month

${bgBlock ? `━━━ BACKGROUND ━━━\n${bgBlock}\n` : ""}
Adapt the concept to fit this user's DNA, skills, and constraints. Make it concrete and specific to them.

Return exactly 1 DirectionCardData object with ONLY these fields (JSON, no markdown):
{"cards": [{
  "title": "<specific business name based on the concept, max 10 words>",
  "compatibility": <estimated 0-100 fit score based on DNA>,
  "oneliner": "<what it does and who it serves, max 20 words>",
  "description": "<3–5 sentences: specific complaint solved, why now, first customers>",
  "why_fits_you": ["<bullet 1 — reference their exact credential/tool>", "<bullet 2>", "<bullet 3>"],
  "key_risks": ["<risk 1>", "<risk 2>"],
  "why_now": "<1 sentence: what market shift makes this timely>",
  "constraint_check": { "status": "Pass" | "Warn" | "Fail", "reason": "<why, if not Pass>" }
}]}`;
}

function buildPhase1Prompt(
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
  cardIndex = 0,
): string {
  const context = buildUserContext(models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
  const pathLabel = cardIndex === 0 ? "Safe" : cardIndex === 1 ? "Aligned" : "Stretch";

  return `Generate 1 direction card summary for ${firstName}.

${context}

Return exactly 1 DirectionCardData object with ONLY these fields (JSON, no markdown):
{"cards": [{
  "title": "<specific business name, max 10 words, NOT a category>",
  "compatibility": <exact compatibility score from MODEL line>,
  "oneliner": "<what it does and who it serves, max 20 words>",
  "description": "<3–5 sentences: specific complaint solved, why now, first customers>",
  "why_fits_you": ["<bullet 1 — reference their exact credential/tool>", "<bullet 2>", "<bullet 3>"],
  "key_risks": ["<risk 1 — specific>", "<risk 2 — specific>"],
  "startup_cost_usd": "<e.g. $0–$500>",
  "time_to_first_revenue_weeks": "<e.g. 6–10 weeks>",
  "hours_per_week": "<at 1-client scale, e.g. 8–12 hrs/week>",
  "constraint_check": {"status": "Pass"|"Warn"|"Fail", "reason": "<required if Warn or Fail>"},
  "first_10_customers": "<1 sentence, specific channel and city if provided>",
  "unfair_advantage": "<why ${firstName} specifically — reference exact credential or tool, NEVER 'your experience'>",
  "path_label": "${pathLabel}"
}]}`;
}

function buildPhase2Prompt(
  phase1Card: Partial<DirectionCardData>,
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
  cardIndex = 0,
): string {
  const context = buildUserContext(models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);

  return `Perform fit analysis for this direction for ${firstName}.

Direction: "${phase1Card.title}"
Summary: ${phase1Card.oneliner}
${phase1Card.description}

${context}

Return JSON {"cards": [{ "title": "${phase1Card.title}", ...fields }]} with ONLY these fields (no other fields):
- why_fits_you: string[] — 3 specific bullets referencing exact credentials/tools from their profile
- ikigai_filters: object with five keys (what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for, lifestyle_fit), each { score: 0-100, reason: "1 sentence grounded in their exact data" }
- composite_score: arithmetic mean of all five ikigai scores, subtract 3 for each circle (what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for) below 60. Exclude lifestyle_fit from penalty. Round to nearest integer.
- high_risk_flags: string[] — one entry per filter scored below 60, format "FilterName (score): specific reason"
- unfair_advantage: why ${firstName} specifically — reference exact credential or tool, NEVER "your background"
- simple_positioning: "It is like [bloated incumbent] but only does [the one thing the complainant actually needs]"

Return JSON only, no markdown fences.`;
}

function buildPhase3Prompt(
  phase1Card: Partial<DirectionCardData>,
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
  cardIndex = 0,
): string {
  const context = buildUserContext(models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);

  return `Perform market reality analysis for this direction for ${firstName}.

Direction: "${phase1Card.title}"
Summary: ${phase1Card.oneliner}
${phase1Card.description}

${context}

Return JSON {"cards": [{ "title": "${phase1Card.title}", ...fields }]} with ONLY these fields (no other fields):
- key_risks: string[] — 2 specific risks for this direction
- trend_connection: which macro industry shift does this connect to
- ocean_classification: { type: "Blue"|"Purple"|"Red", density: string }
- key_competitors: array of exactly 3 objects { name: string, what_they_do: string }
- economic_urgency: what does the buyer's current workaround cost per month?
- industry_shift: which specific tool/platform/event this direction rides
- complaint_source: which specific validated complaint this is rooted in
- window_risk: what closes this window and roughly when
- market_signal_confidence: "Complaint-validated"|"Inferred"|"Insufficient signal"
- liked_work_check: null or brief note on alignment/conflict with what they liked/disliked about last job

Return JSON only, no markdown fences.`;
}

function buildPhase4Prompt(
  phase1Card: Partial<DirectionCardData>,
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
  cardIndex = 0,
): string {
  const context = buildUserContext(models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);

  return `Perform operations analysis for this direction for ${firstName}.

Direction: "${phase1Card.title}"
Summary: ${phase1Card.oneliner}
${phase1Card.description}

${context}

Return JSON {"cards": [{ "title": "${phase1Card.title}", ...fields }]} with ONLY these fields (no other fields):
- startup_cost_usd: string — e.g. "$0–$500"
- time_to_first_revenue_weeks: string — e.g. "6–10 weeks"
- hours_per_week: string — at 1-client scale, e.g. "8–12 hrs/week"
- first_10_customers: string — 1 sentence, specific channel
- distribution_path: string — specific community/subreddit/group

Return JSON only, no markdown fences.`;
}

function buildFullPrompt(
  models: { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
  scores: DnaScores,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  dnaNarrative?: Record<string, string>,
  resources?: Record<string, string>,
  cardIndex = 0,
): string {
  const context = buildUserContext(models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
  const pathLabel = cardIndex === 0 ? "Safe" : cardIndex === 1 ? "Aligned" : "Stretch";

  return `Generate 1 direction card for ${firstName}.

${context}

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
    what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for, lifestyle_fit
- composite_score: number — arithmetic mean of all five scores, subtract 3 for every Ikigai circle (what_you_love, what_you_are_good_at, what_world_needs, what_you_can_be_paid_for) below 60. Round to nearest integer.
- high_risk_flags: string[] — one entry per filter scored below 60, format: "FilterName (score): specific reason"
- startup_cost_usd: string — e.g. "$0–$500"
- time_to_first_revenue_weeks: string — e.g. "6–10 weeks"
- hours_per_week: string — at 1-client scale, e.g. "8–12 hrs/week"
- constraint_check: { status: "Pass" | "Warn" | "Fail", reason?: string (required if Warn or Fail) } — do NOT generate a card with Fail status
- first_10_customers: string — 1 sentence, specific channel and location-aware
- distribution_path: string — specific community, subreddit, Facebook group, event, or association
- competition: { layer1_workaround: string, layer2_incumbent: string, layer3_simple_competitors: string }
- key_competitors: array of exactly 3 objects { name: string, what_they_do: string }
- economic_urgency: string — what does the buyer's current workaround cost per month?
- ocean_classification: { type: "Blue" | "Purple" | "Red", density: string }
- trend_connection: string — which macro industry shift does this connect to
- industry_shift: string — which of the Step 0 shifts this direction specifically rides
- complaint_source: string — which specific validated complaint this is rooted in
- window_risk: string — what closes this window and roughly when
- path_label: "${pathLabel}" — use exactly this value
- market_signal_confidence: "Complaint-validated" | "Inferred" | "Insufficient signal"
- liked_work_check: string | null

Return JSON only, exactly this shape (no markdown fences):
{"cards": [/* the single card object */]}`;
}

function parseCard(text: string): DirectionCardData | null {
  const raw = text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { cards?: DirectionCardData[] };
    return Array.isArray(parsed.cards) ? parsed.cards[0] ?? null : null;
  } catch {
    return null;
  }
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
      resources?: Record<string, string>;
      cardIndex?: number;
      phase?: 1 | 2 | 3 | 4;
      phase1Card?: Partial<DirectionCardData>;
      concept?: string;
    };

    const { models, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources } = body;

    // Concept-based card: generate a direction from an opportunity concept (no model required)
    if (body.concept && (!models || models.length === 0)) {
      const conceptPrompt = buildConceptPhase1Prompt(body.concept, scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources);
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: SYSTEM_PROMPT_CACHED,
        messages: [{ role: "user", content: conceptPrompt }],
      });
      const block = msg.content[0];
      const raw = block?.type === "text" ? block.text : "";
      const card = parseCard(raw);
      return Response.json({ cards: card ? [card] : [] });
    }

    if (!models || models.length === 0) {
      return Response.json({ cards: [] });
    }

    const cardIndex = body.cardIndex ?? 0;
    const phase = body.phase;

    // Alt cards (index 1 and 2) use Haiku — faster and cheaper
    const isAltCard = cardIndex > 0;
    const fastModel = "claude-haiku-4-5-20251001";
    const deepModel = "claude-sonnet-4-6";

    const model = body.models[cardIndex] ?? body.models[0];

    if (phase === 1) {
      // Phase 1: fast summary using Haiku
      const prompt = buildPhase1Prompt([model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
      const msg = await client.messages.create({
        model: fastModel,
        max_tokens: 700,
        system: SYSTEM_PROMPT_CACHED,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const raw = block?.type === "text" ? block.text : "";
      const card = parseCard(raw);
      return Response.json({ cards: card ? [card] : [] });
    }

    if (phase === 2) {
      // Phase 2: deep analysis using Sonnet (or Haiku for alt cards)
      const phase1Card = body.phase1Card ?? {};
      const prompt = buildPhase2Prompt(phase1Card, [model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
      const selectedModel = isAltCard ? fastModel : deepModel;
      const msg = await client.messages.create({
        model: selectedModel,
        max_tokens: 1500,
        system: SYSTEM_PROMPT_CACHED,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const raw = block?.type === "text" ? block.text : "";
      const card = parseCard(raw);
      return Response.json({ cards: card ? [card] : [] });
    }

    if (phase === 3) {
      // Phase 3: market reality using Haiku
      const phase1Card = body.phase1Card ?? {};
      const prompt = buildPhase3Prompt(phase1Card, [model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
      const msg = await client.messages.create({
        model: fastModel,
        max_tokens: 1000,
        system: SYSTEM_PROMPT_CACHED,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const raw = block?.type === "text" ? block.text : "";
      const card = parseCard(raw);
      return Response.json({ cards: card ? [card] : [] });
    }

    if (phase === 4) {
      // Phase 4: operations using Haiku
      const phase1Card = body.phase1Card ?? {};
      const prompt = buildPhase4Prompt(phase1Card, [model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
      const msg = await client.messages.create({
        model: fastModel,
        max_tokens: 600,
        system: SYSTEM_PROMPT_CACHED,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const raw = block?.type === "text" ? block.text : "";
      const card = parseCard(raw);
      return Response.json({ cards: card ? [card] : [] });
    }

    // Legacy single-phase path (used for generate-more without two-phase)
    const selectedModel = isAltCard ? fastModel : deepModel;
    const prompt = buildFullPrompt([model], scores, firstName, rawAnswers, cvSummary, dnaNarrative, resources, cardIndex);
    const msg = await client.messages.create({
      model: selectedModel,
      max_tokens: 2000,
      system: SYSTEM_PROMPT_CACHED,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    const raw = block?.type === "text" ? block.text : "";
    const card = parseCard(raw);
    return Response.json({ cards: card ? [card] : [] });
  } catch (err) {
    console.error("[direction-cards] error:", err);
    return Response.json({ cards: [] }, { status: 500 });
  }
}
