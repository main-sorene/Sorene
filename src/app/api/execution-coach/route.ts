import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Recipe instructions — each answers using the live project status passed in.
const RECIPES: Record<string, string> = {
  start: `The user clicked "Where do I start?". Look at their project status below. Identify the single most important next action given what they've already completed. If they're brand new (nothing done), point them to the Validation tab and the first concrete step. Be specific to THIS project and THIS user's DNA. 2-4 short sentences, end with one clear action.`,
  progress: `The user clicked "Review my progress". Summarise what they've completed across Validation, Launchpad, Growth using the status below — be concrete (name the items done). Then call out the most important gap and what to tackle next. Warm, specific, 3-5 sentences. No generic praise.`,
  validate: `The user clicked "Help me validate my idea". Using their project, DNA and current validation status, give them a focused validation plan: who exactly to talk to, what to ask, and the signal that means "keep going". If they've already logged conversations or a pattern summary, build on it rather than restarting. 3-5 sentences, end with the next validation action.`,
  next: `The user clicked "What's my next step?". From the status below, find the next incomplete, highest-leverage task and tell them exactly what to do and where in the Hub to do it (Validation / Launchpad / Growth / Connect tab). One clear step, 2-4 sentences.`,
  update_status: `The user clicked "Update business status". Invite them, in a warm and specific way, to tell you what's changed since last time — new conversations, a launched asset, revenue, a blocker. Reference where they currently are (from the status below) so the ask feels informed. Then say you'll fold it into their plan and next steps. Keep it to 2-3 sentences ending with a clear, friendly question.`,
  onboard: `The user clicked "Create My Project". The chat UI is handling questions step-by-step — do not ask any questions. This recipe is not used anymore; use onboard_evaluate instead.`,
  onboard_evaluate: `You've collected the user's project info through a structured onboarding flow. Here's what was captured:
- Project name
- Description
- Status they self-selected (just_an_idea / validating / ready_to_launch / launched_growing)
- Traction details (users, waitlist, customers, revenue)

Your job: evaluate their ACTUAL stage based on the traction evidence, not just what they self-reported. Apply smart correction:
- If they said "ready_to_launch" or "launched_growing" but reported 0 users, 0 customers, 0 revenue, no waitlist → gently correct them. Explain that without validation evidence, they're likely at the idea or validation stage, and pushing ahead risks building the wrong thing. Route them to Validation tab.
- If they said "validating" and have some conversations but no clear pattern → keep them in Validation, focus on finding the pattern and Go/No-Go check.
- If traction evidence matches their claim → confirm it and route accordingly.

Routing map:
- Idea / no evidence → Validation tab: VIBE framework customer interviews, log conversations, find the pattern.
- Validating with some evidence → Validation tab: Go / No-Go readiness check.
- Validated + evidence of demand → Launchpad tab: business name, tagline, pricing, logo, domain, website, social.
- Launched with real traction → Growth tab: business plan, marketing plan, GTM, sales playbook, financial model, metrics, pitch deck.

Format your reply in THREE parts:
1. Your assessment: acknowledge the project by name, state where they actually are, and if correcting, explain the WHY warmly in one sentence.
2. The suggested next step: the single first action and which tab it lives in.
3. The closing depends on the route:
   - If routing to VALIDATION (new / unvalidated idea): tell them they have two good ways to start — they can check their founder–market fit first (to see if the idea fits them and the market), OR jump straight into validating with real users. End by inviting them to pick one of the two options below. Do NOT ask a yes/no question here.
   - If routing to LAUNCHPAD or GROWTH: end with a short yes/no question like "Want to start there?".
Keep it to 3-5 short sentences total.

CRITICAL: On the VERY LAST line, append a machine-readable routing tag on its own line in this exact format (one of validation, launchpad, growth): [[TAB:validation]]. This tag will be stripped from what the user sees — never reference it in your prose.`,
};

// Where each kind of work lives — used so the coach routes users accurately.
const SECTIONS_GUIDE = `EXECUTION HUB SECTIONS (route users here):
- Validation tab — validate the idea from the beginning: customer interviews via the VIBE framework, log conversations, find the pattern, then a Go / No-Go readiness check. For anyone at idea or validation stage.
- Launchpad tab — Brand & Digital Presence: finalise business name, tagline, benefit, offerings, pricing, logo, brand colours, domain, website, hosting, social profiles. For when the idea is validated and they're setting up to launch.
- Growth tab — strategic deliverables: business plan, marketing plan, go-to-market strategy, sales playbook, financial model & projections, growth metrics / North Star, pitch deck. For launched/growing businesses.
- Agents tab — AI agents that automate parts of execution (coming soon).
- Connect tab — link WhatsApp/Telegram for coaching on the go, and join the founder community.`;

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ reply: "Please sign in to use the coach." }, { status: 401 });

    const { message, recipeId, history, userProfile, project, projectStatus } = (await req.json()) as {
      message: string;
      recipeId?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      userProfile?: {
        firstName?: string;
        occupation?: string;
        cvSummary?: string;
        dnaScores?: Record<string, unknown>;
        dnaNarrative?: Record<string, string>;
        assessmentAnswers?: Record<string, string>;
      };
      project?: {
        title?: string;
        oneliner?: string;
        description?: string;
        simple_positioning?: string;
        path_label?: string;
        first_10_customers?: string;
        distribution_path?: string;
        key_competitors?: { name: string; what_they_do: string }[];
      } | null;
      projectStatus?: Record<string, unknown> | null;
    };

    const p = userProfile ?? {};
    const dna = (p.dnaScores ?? {}) as Record<string, unknown>;
    const nar = p.dnaNarrative ?? {};
    const or = (v: unknown, fb = "Not provided") => (v && String(v).trim() ? String(v) : fb);

    // ── DNA block ──
    const dnaBlock = `DNA PROFILE
Name: ${or(p.firstName)}
Occupation: ${or(p.occupation)}
Core pattern: ${or(nar["core_pattern"] ?? (Array.isArray(dna["strength_patterns"]) ? (dna["strength_patterns"] as string[]).join(", ") : dna["strength_patterns"]))}
Strengths: ${or(nar["value_signature"] ?? dna["strengths_summary"])}
What drives them: ${or(nar["what_drives_you"] ?? dna["motivation_driver"])}
Energy source: ${or(dna["energy_source"])}
Energy drains (avoid): ${or(dna["energy_drains"])}
Readiness: ${or(dna["readiness_label"] ?? dna["readiness_score"])}
${p.cvSummary ? `CV: ${p.cvSummary.slice(0, 300)}` : ""}`;

    // ── Direction / project block ──
    const directionBlock = project
      ? `CURRENT PROJECT (their chosen Direction)
Title: ${or(project.title)}
One-liner: ${or(project.oneliner)}
Positioning: ${or(project.simple_positioning)}
Path: ${or(project.path_label)}
First 10 customers: ${or(project.first_10_customers)}
Distribution path: ${or(project.distribution_path)}
Competitors: ${(project.key_competitors ?? []).map((c) => c.name).join(", ") || "Not provided"}
${project.description ? `Description: ${String(project.description).slice(0, 400)}` : ""}`
      : `CURRENT PROJECT: None selected. Encourage them to pick or create a project, or choose a Direction first.`;

    // ── Live execution status ──
    const statusBlock = projectStatus && Object.keys(projectStatus).length > 0
      ? `LIVE EXECUTION STATUS (what they've done so far)\n${JSON.stringify(projectStatus, null, 2)}`
      : `LIVE EXECUTION STATUS: No progress recorded yet — they're at the very beginning.`;

    const systemPrompt = `You are Sorene, a sharp, warm, practical execution coach inside the user's Execution Hub. You help them move their specific business forward — from validation to launch to growth.

You have FULL ACCESS to who they are (DNA), what they're building (their chosen Direction/Project), and exactly how far they've got (Live Execution Status). USE all three in every answer. Never give generic advice — everything must be specific to this person and this project. If you reference a next step, name the exact Hub location (Validation, Launchpad, Growth, Agents, or Connect tab).

Keep replies concise and skimmable (2-5 sentences, short paragraphs, **bold** the key action). No fluff, no restating their whole profile back to them. If the project or status is empty, gently guide them to the right starting point.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${SECTIONS_GUIDE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dnaBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${directionBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusBlock}`;

    const recipe = recipeId ? RECIPES[recipeId] : null;
    const userContent = recipe ? `${recipe}\n\n(User's button text: "${message}")` : message;

    const prior = (history ?? []).map((m) => ({ role: m.role, content: m.content }));
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...prior,
      { role: "user", content: userContent },
    ];

    const msg = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      messages,
    });

    const block = msg.content[0];
    const reply = block && block.type === "text" ? block.text.trim() : "Sorry, I couldn't respond. Try again.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[execution-coach] error:", error);
    return NextResponse.json({ reply: "Sorry, I had trouble with that. Please try again." }, { status: 500 });
  }
}
