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
};

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
