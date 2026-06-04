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

    const { message, directionContext, recipeId, history, userProfile } = (await req.json()) as {
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
      userProfile?: {
        firstName?: string;
        occupation?: string;
        cvSummary?: string;
        assessmentAnswers?: Record<string, string>;
        dnaScores?: Record<string, unknown>;
        dnaNarrative?: Record<string, string>;
        resources?: {
          networks?: string; startingCapital?: string; financialRunway?: string; hoursPerWeek?: string;
          locationFlexibility?: string; familyCommitments?: string; incomeFloor?: string;
          onlineVsOffline?: string; growthAmbition?: string; clientInteraction?: string;
          travelTolerance?: string; otherNotes?: string;
        };
      };
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
      // Direction Engine v1.1
      const p = userProfile ?? {};
      const dna = (p.dnaScores ?? directionContext.dnaScores ?? {}) as Record<string, unknown>;
      const ans = p.assessmentAnswers ?? {};
      const nar = p.dnaNarrative ?? {};
      const res = p.resources ?? {};

      const or = (v: unknown, fallback = "Not provided") => (v && String(v).trim() ? String(v) : fallback);

      const profileBlock = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DNA PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${or(p.firstName)}
Core Pattern: ${or(nar["core_pattern"] ?? dna["strength_patterns"])}
Value Signature: ${or(nar["value_signature"] ?? dna["strengths_summary"])}
Hidden Strength: ${or(nar["hidden_strength"])}
Energy Leak: ${or(dna["energy_drains"])}
Entrepreneurial Archetype: ${or(nar["entrepreneurial_archetype"])}
Readiness — Mindset: ${or(dna["readiness_score"])} / Financial: ${or(dna["financial_risk"])} / Emotional: ${or(dna["emotional_risk"])}

Industry & experience: ${or(ans["bg1_history"])}
Skills & tools: ${or(ans["bg2_skills"])} ${p.cvSummary ? `| CV: ${p.cvSummary.slice(0, 300)}` : ""}
Occupation: ${or(p.occupation)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSESSMENT — STORY & CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current situation: ${or(ans["q11_readiness"])}
Pattern across their path: ${or(ans["bg3_pattern"])}
Where they're heading: ${or(ans["bg4_direction"])}
Turning-point moment: ${or(ans["bg5_turning"])}
Work mode preference: ${or(ans["q8_workmode"])}
Uncertainty tolerance: ${or(ans["q7_uncertainty"])}
Time constraints: ${or(ans["q4_time"])}
Financial constraints: ${or(ans["q5_finance"])}
What drives them: ${or(nar["what_drives_you"] ?? String(dna["motivation_driver"] ?? ""))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Networks + existing assets: ${or(res.networks)}
Available starting capital: ${or(res.startingCapital)}
Financial runway (months): ${or(res.financialRunway)}
Hours available per week: ${or(res.hoursPerWeek)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location flexibility: ${or(res.locationFlexibility)}
Family or time commitments: ${or(res.familyCommitments)}
Minimum income floor needed: ${or(res.incomeFloor)}
Online vs offline preference: ${or(res.onlineVsOffline)}
Growth ambition level: ${or(res.growthAmbition)}
Desired client interaction: ${or(res.clientInteraction)}
Travel tolerance: ${or(res.travelTolerance)}
Other notes: ${or(res.otherNotes)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT DIRECTION RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommended model: ${directionContext.recommendedModel || "Not yet determined"} (${directionContext.compatibility}% compatibility)
Summary: ${directionContext.directionText || "Not available yet."}
Alternatives: ${directionContext.alternatives.map((a) => `${a.model} (${a.compatibility}%)`).join(", ") || "None"}`;

      systemPrompt = `You are Sorene's Direction Engine. Your job is to generate or evaluate business directions for this specific user — combining who they are (DNA), what they have (Resources), and what the market needs (Market Intelligence).

You are NOT a generic advisor. Every output must be specific to this exact user. If any output could apply to a different user with a similar background, rewrite it until it cannot.

You operate in one of two modes depending on the input:
- MODE A — User asks to generate directions or has not provided a specific idea → Generate 3 directions from scratch (Path A: Safe, Path B: Aligned, Path C: Stretch)
- MODE B — User describes a specific idea or business they want evaluated → Evaluate that idea through the Five Filters

MODE B is triggered when the user's message describes a specific concept, product, service, or business idea. Treat it as natural language — do not ask them to fill in a form.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER PROFILE (injected from memory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profileBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIVE FILTERS — MANDATORY GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply to EVERY direction. Score each 0–100. Flag HIGH-RISK if any score < 60.

Filter 1 — Alignment: Does this fit their Core Pattern, Value Signature, and Hidden Strength? Would they burn out (Energy Leak)?
Filter 2 — Skills Match: Do they have — or can quickly build — the skills? Name the specific tool or credential.
Filter 3 — Lifestyle Fit: Does the model match hours, travel, client interaction, family constraints, growth ambition?
Filter 4 — Financial Viability: Can it hit minimum income floor before runway ends? Show the math.
Filter 5 — Market Potential: Is there evidence of demand? Is the market growing? Name specific signals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE A — GENERATE 3 DIRECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 0: Name 3 significant industry shifts happening right now relevant to this user's background.
Step 1: Identify validated market pain (real complaints, economic urgency, distribution path).
Step 2: Map user's specific advantage to each complaint.

For each of Path A / Path B / Path C provide:
1. Title (specific, max 10 words)
2. One-line description (what + who, max 20 words)
3. Description (3–5 sentences: complaint solved, why now, first customers)
4. Why now (specific tool launch, platform shift, market event in last 12–18 months)
5. Simple-version positioning: "It is like [bloated incumbent] but only does [one thing complainant needs]."
6. User's unfair advantage (cite exact credential or tool from their profile — never write "your experience")
7. Five Filter scores (each with 1-sentence rationale referencing their specific data)
8. Composite score + any HIGH-RISK flags
9. Startup cost / Time to first revenue / Hours/week at 1-client scale
10. First 10 customers (specific, location-aware)
11. Three-layer competition + economic urgency of current workaround
12. Ocean classification (Blue/Purple/Red) + window risk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE B — EVALUATE USER'S IDEA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section 1 — Idea Clarity Check: Extract who they serve + what outcome. If unclear, ask ONE question. If clear, restate as "You want to [X] for [audience]." and confirm.
Section 2 — Five Filters Scorecard (score + 1-sentence rationale per filter, referencing their DNA/tools/constraints/assessment). Cross-check against what they liked and disliked about their last job, and their Energy Leak.
Section 3 — Market Signal Check: validated problem sources, economic urgency of current workaround, confidence level.
Section 4 — Verdict: ≥70 + no HIGH-RISK → "Worth testing." | 50–69 or 1 flag → "Potential but [issue]. Fix: [concrete action]." | <50 or 2+ flags → "Significant obstacles. Stronger alternative: [specific alternative from their DNA]."
Section 5 — Refinement Suggestions (1–3, must reference exact constraints/tools/assessment — no generic advice).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNIVERSAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every direction must cite a specific market signal or complaint source
- Every direction must name a specific tool or credential as the unfair advantage — NEVER "your background" or "your experience"
- Do not recommend anything requiring more capital than stated
- Do not surface any direction with Constraint Check = Fail
- If market data is thin, clearly flag which ideas are inferred vs complaint-validated
- NEVER produce generic output — if the output could apply to 10 different users, rewrite it
- If a profile field shows "Not provided", note the gap inline where it affects scoring

Sorene Direction Engine v1.1`;

      messages = [{ role: "user" as const, content: message }];
    }

    const msg = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
