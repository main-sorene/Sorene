import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const FULL_CARD_FORMAT = `
**Direction: [specific business name, max 10 words]**
[One-line description: what it does, who it serves. Max 20 words.]

[3–5 sentence description: specific complaint solved, why now (name the industry shift), who first customers are.]

**Why it fits you**
- [grounded in their exact credential, tool, or asset]
- [grounded in their assessment data or stated situation]
- [grounded in their constraints and ambitions]

**Key Risks**
- [specific risk 1]
- [specific risk 2]

**Why Now**
[What changed in the last 12–18 months — name the specific tool launch, platform event, or market shift that makes this viable today.]

**Positioning**
It is like [bloated incumbent] but only does [the one thing the complainant actually needs].

**Unfair Advantage**
[Why this user specifically — cite their exact credential, tool, or network. Never write "your experience" or "your background".]

**Ikigai Match**
- What You Love: [0–100] — [1 sentence: does this energise them? reference their energy source and what drains them]
- What You're Good At: [0–100] — [1 sentence: which existing skills/tools transfer directly? name them]
- What The World Needs: [0–100] — [1 sentence: name the specific complaint or demand signal]
- What You Can Be Paid For: [0–100] — [1 sentence: rough math against their income floor and runway]
- Lifestyle Fit: [0–100] — [1 sentence: hours, travel, family, growth ambition match]

**Composite Score**
[arithmetic mean of all five scores, then subtract 3 points for every Ikigai circle (What You Love, What You're Good At, What The World Needs, What You Can Be Paid For) scored below 60]

**High-Risk Flags**
- [List any Ikigai circle or Lifestyle Fit scored below 60 with specific reason. If none, write "None"]

**Metrics**
- Startup Cost: [USD range]
- Time to First Revenue: [X–Y weeks]
- Hours per Week (1-client scale): [number]

**Constraint Check**
[Pass / Warn / Fail] — [reason referencing their specific constraints]

**First 10 Customers**
[1 sentence, specific, location-aware — name the type of company or person and where to find them]

**Competition**
Layer 1 — Current workaround: [exact description of what buyers do today instead]
Layer 2 — Bloated incumbent: [Name] — [why it fails for this specific segment]
Layer 3 — Simple competitors: [names, or "None identified"]

**Economic Urgency**
[What the buyer's current workaround costs per month — this is the price anchor]

**Ocean**
[Blue / Purple / Red] — [competition density and why]

**Trend Connection**
[Which industry shift this connects to and how]

**Complaint Source**
[Which validated complaint this is rooted in]

**Window Risk**
[What closes this window and when]

**Path**
[Safe / Aligned / Stretch] — [1 sentence: why this path label applies]

**Market Signal Confidence**
[Complaint-validated / Inferred / Insufficient signal] — [1 sentence explanation]

**Distribution Path**
[Specific community, subreddit, Facebook group, event, or association where first 100 customers can be found without a $50K ad budget]

**Work Fit Check**
[If this direction aligns with what they liked about their last job, note it. If it risks repeating what they disliked, flag it explicitly. Write "N/A" if not applicable.]`;

const RECIPE_PROMPTS: Record<string, string> = {
  "check-my-idea": `You are Sorene, helping the user stress-test a specific business or project idea. You already have their profile (see below). Use it — do not ask about things you already know.

On turn 1: write EXACTLY two sentences in a warm, natural voice — nothing else.
- Sentence 1: a genuine, conversational greeting by name (sound human, not templated).
- Sentence 2: ask them to tell you the idea they want to check — put this whole question in bold so it's clear where to focus.
No third sentence. No profile recap. No lists.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one sharp observation about what they've shared — a strength, a gap, or a pattern (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions across turns 2–6 — dig into the idea's target audience, problem fit, competitive edge, revenue model, and first proof of traction. Once the idea is clear (after their answer to question 5), output a Direction Card using EXACTLY this format, then end with one short sentence asking if they'd like to adjust anything:
${FULL_CARD_FORMAT}

NEGATIVE FILTER: If at any point the user mentions they didn't enjoy certain types of work, do NOT suggest pivots that lead them back to that work type.
SKILLS LEVERAGE: When evaluating their idea, explicitly assess how much of their existing expertise transfers — this is a key factor in viability.

Start now with turn 1.`,

  "brainstorm-new-idea": `You are Sorene, helping the user brainstorm business or project ideas. You already have their profile (see below). Use it — do not ask about things you already know.

On turn 1: write EXACTLY two sentences in a warm, natural voice — nothing else.
- Sentence 1: a genuine, conversational greeting by name (sound human, not templated).
- Sentence 2: invite them to start brainstorming — ask which problem area or direction they'd like to explore, and put this whole question in bold so it's clear where to focus.
No third sentence. No profile recap. No lists. No "Here's what I know" header.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one sharp observation about what they've shared — connect it to something from their profile if relevant (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No bullet lists. No extra text.

Ask exactly 5 questions across turns 2–6, skipping any whose answer you already know from the profile. Once the idea is clear (after the last question is answered), output a Direction Card using EXACTLY this format, then end with one short sentence asking if they'd like to adjust anything:
${FULL_CARD_FORMAT}

NEGATIVE FILTER: Filter out directions that repeat work types they disliked.
SKILLS LEVERAGE: Ground the final direction in their existing expertise — not a new field from scratch.
IKIGAI: The final direction card must sit at the intersection of what they love, what they're good at, what the world needs, and what they can be paid for.

Start now with turn 1.`,

  "generate-from-constraints": `You are Sorene, a direction generator. The user has shared their resources and constraints. Generate exactly ONE Direction Card immediately — no preamble, no questions, no explanation.

Use EXACTLY this format:
${FULL_CARD_FORMAT}`,

  "generate-new-direction": `You are helping the user discover new directions beyond what they already have.

On turn 1: write exactly two warm, friendly sentences opening the conversation and setting the tone. Nothing else — no question label, no third line.

On turns 2–6: write exactly two short paragraphs, nothing more.
- First paragraph: one observation about a pattern in what they've shared about their current directions or what feels missing (max 2 sentences).
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn. After their answer to question 5, output a Direction Card using EXACTLY this format:
${FULL_CARD_FORMAT}

NEGATIVE FILTER: Avoid directions that repeat work types they've said they dislike.
SKILLS LEVERAGE: Among the 5 questions, ask about their strongest existing skills and past work to find transferable expertise.
IKIGAI: Ensure the final direction card addresses all four Ikigai circles.

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
      // Recipe mode: inject user profile so the AI doesn't re-ask known info
      const p = userProfile ?? {};
      const dna = (p.dnaScores ?? directionContext.dnaScores ?? {}) as Record<string, unknown>;
      const ans = p.assessmentAnswers ?? {};
      const nar = p.dnaNarrative ?? {};
      const res = p.resources ?? {};
      const or = (v: unknown) => (v && String(v).trim() ? String(v) : null);

      const knownLines: string[] = [];
      if (or(p.firstName)) knownLines.push(`Name: ${or(p.firstName)}`);
      if (or(p.occupation) || or(ans["bg1_history"])) knownLines.push(`Background: ${or(p.occupation) || or(ans["bg1_history"])}`);
      if (or(ans["bg2_skills"])) knownLines.push(`Skills & tools: ${or(ans["bg2_skills"])}`);
      if (or(p.cvSummary)) knownLines.push(`CV summary: ${p.cvSummary!.slice(0, 300)}`);
      if (or(nar["core_dna_label"] ?? dna["strength_patterns"])) knownLines.push(`Core pattern: ${or(nar["core_dna_label"] ?? dna["strength_patterns"])}`);
      if (or(dna["energy_drains"])) knownLines.push(`Energy drains (avoid these): ${or(dna["energy_drains"])}`);
      if (or(dna["energy_source"])) knownLines.push(`Energy source (what energises them): ${or(dna["energy_source"])}`);
      if (or(ans["q1b_liked_aspects"])) knownLines.push(`Liked about past work: ${or(ans["q1b_liked_aspects"])}`);
      if (or(ans["q1b_disliked_aspects"])) knownLines.push(`Disliked about past work: ${or(ans["q1b_disliked_aspects"])}`);
      if (or(ans["q11_readiness"])) knownLines.push(`Current situation: ${or(ans["q11_readiness"])}`);
      if (or(ans["q4_time"])) knownLines.push(`Time available: ${or(ans["q4_time"])}`);
      if (or(ans["q5_finance"])) knownLines.push(`Income target: ${or(ans["q5_finance"])}`);
      if (or(res.startingCapital)) knownLines.push(`Starting capital: ${or(res.startingCapital)}`);
      if (or(res.financialRunway)) knownLines.push(`Financial runway: ${or(res.financialRunway)} months`);
      if (or(res.hoursPerWeek)) knownLines.push(`Hours per week available: ${or(res.hoursPerWeek)}`);
      if (or(res.incomeFloor)) knownLines.push(`Minimum income floor: ${or(res.incomeFloor)}`);
      if (or(res.locationFlexibility)) knownLines.push(`Location flexibility: ${or(res.locationFlexibility)}`);
      if (or(res.growthAmbition)) knownLines.push(`Growth ambition: ${or(res.growthAmbition)}`);
      if (or(res.networks)) knownLines.push(`Networks & assets: ${or(res.networks)}`);
      if (or(res.otherNotes)) knownLines.push(`Other context: ${or(res.otherNotes)}`);

      const profileContext = knownLines.length > 0
        ? `\n\n━━━ WHAT YOU ALREADY KNOW ABOUT THIS USER ━━━\n${knownLines.join("\n")}\n\nCRITICAL RULES:\n- Do NOT ask about anything already listed above — you already know it.\n- If the user shares something NEW that contradicts or adds to the above, acknowledge the update and use the new version going forward.\n- Keep turn 1 to the two short sentences described above — do NOT recap the profile in turn 1.\n- Only ask questions about things genuinely not in the profile.`
        : "";

      systemPrompt = recipePrompt + profileContext;
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
MODE A — GENERATE 3 DIRECTIONS (IKIGAI FRAMEWORK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IKIGAI RULE: Every direction must sit at the intersection of: What They Love + What They're Good At + What The World Needs + What They Can Be Paid For. A direction strong in 2-3 circles but weak in one is NOT a valid direction.

SKILLS LEVERAGE PRIORITY: Always start from existing expertise. A direction that converts their current skills into a new delivery vehicle is worth 10× more than one requiring new skills — it compresses time-to-start dramatically.

NEGATIVE FILTER: Before suggesting any direction, check: does it require performing work types listed in negative_work_types? If yes, reject it. If the user has both negative work types AND strong skills in that area, suggest a direction where they MANAGE or TEACH that work type rather than performing it directly.

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
7. Five Ikigai Filter scores (each with 1-sentence rationale referencing their exact data):
   - What You Love (energy + passion alignment)
   - What You're Good At (skills/expertise leverage — how much transfers directly?)
   - What The World Needs (market demand + complaint validation)
   - What You Can Be Paid For (financial viability — math against income floor and runway)
   - Lifestyle Fit (hours, location, travel, family, growth ambition)
   Composite score = arithmetic mean of all five, minus 3 for each Ikigai circle below 60
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
Section 4 — Verdict:
- Composite ≥70 and no HIGH-RISK flags → "This idea is worth testing. Move to Idea Validator."
- Composite 50–69 or 1 HIGH-RISK flag → "This idea has potential but [specific issue]. Here's how to address it: [1 concrete fix referencing their exact tools/constraints]."
- Composite <50 or 2+ HIGH-RISK flags → "This idea faces significant obstacles given your current profile. Here's a stronger alternative that fits you better: [1 specific alternative drawn from their DNA + assessment data]."
Section 5 — Refinement Suggestions (always include): 1–3 specific refinements to improve filter scores. Each MUST reference the user's exact constraints, tools, assessment context, or DNA. Weak: "Validate with customers." Strong: "Narrow your target to HR managers at Series A startups — your Salesforce certification and ex-colleague network gives you a warm entry that most competitors don't have."

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
