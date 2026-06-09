import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const RECIPES: Record<string, string> = {
  mindset: `The user wants to learn about the mindset shift from employee to founder. Using their DNA profile and Direction, give them concrete, personalised insight on the psychological and tactical shifts they'll face — what their specific strengths will help with and what pitfalls to watch for. Be direct and specific to this person. 3-5 sentences.`,
  validate: `The user wants to understand how to validate an idea properly. Using their DNA and Direction, explain the core principle (talk to real people, not desks) and the specific validation approach that fits their style. Reference their actual business direction if available. 3-5 sentences.`,
  social: `The user wants to learn how to create social posts and messages. Using their DNA and Direction, advise on the right voice, platform, and type of content that fits their strengths and target audience. Be specific to their actual business concept. 3-5 sentences.`,
  customers: `The user wants to learn how to talk to customers. Using their DNA profile and Direction, give them a framework for those first conversations: who to approach, what to say, what to listen for. Personalise it to their communication style from DNA. 3-5 sentences.`,
};

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ reply: "Please sign in to continue." }, { status: 401 });

    const userKey = user.email ?? user.uid;
    const creditCheck = await checkCredits(userKey);
    if (!creditCheck.ok) return NextResponse.json({ error: "credits_exhausted" }, { status: 402 });

    const { message, recipeId, history, userProfile, direction } = (await req.json()) as {
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
      direction?: {
        title?: string;
        oneliner?: string;
        description?: string;
        simple_positioning?: string;
        path_label?: string;
        first_10_customers?: string;
      } | null;
    };

    const p = userProfile ?? {};
    const dna = (p.dnaScores ?? {}) as Record<string, unknown>;
    const nar = p.dnaNarrative ?? {};
    const or = (v: unknown, fb = "Not provided") => (v && String(v).trim() ? String(v) : fb);

    const dnaBlock = `DNA PROFILE
Name: ${or(p.firstName)}
Occupation: ${or(p.occupation)}
Core pattern: ${or(nar["core_pattern"] ?? (Array.isArray(dna["strength_patterns"]) ? (dna["strength_patterns"] as string[]).join(", ") : dna["strength_patterns"]))}
What drives them: ${or(nar["what_drives_you"] ?? dna["motivation_driver"])}
How they work: ${or(nar["how_you_work"] ?? dna["structure_preference"])}
Energy source: ${or(dna["energy_source"])}
Risk profile: ${or(dna["risk_score"])} / 10
Readiness: ${or(dna["readiness_label"] ?? dna["readiness_score"])}
${p.cvSummary ? `Background: ${p.cvSummary.slice(0, 300)}` : ""}`;

    const directionBlock = direction?.title
      ? `THEIR CHOSEN DIRECTION / BUSINESS IDEA
Title: ${or(direction.title)}
One-liner: ${or(direction.oneliner)}
Positioning: ${or(direction.simple_positioning)}
Path: ${or(direction.path_label)}
First 10 customers: ${or(direction.first_10_customers)}
${direction.description ? `Description: ${String(direction.description).slice(0, 300)}` : ""}`
      : `DIRECTION: Not yet chosen — encourage them to explore their Direction section after this conversation.`;

    const systemPrompt = `You are Sorene, an entrepreneurship education coach. Your role is to teach founders the skills and mindset they need to make the leap from employee to founder and build something that works.

You have the user's full DNA profile (who they are, how they think, what drives them) and their chosen Direction (what they're building). Use BOTH to make every answer personal and concrete. Generic advice is not acceptable — tailor every response to this specific person and their situation.

TOPICS YOU COVER (always relate back to their DNA + Direction):
- The psychological and tactical shift from employee to founder
- How to validate an idea the right way (customer conversations, not desk research)
- How to create social content and outreach messages
- How to talk to customers (who to approach, what to ask, how to listen)

RESPONSE STYLE:
- 2-5 sentences per response
- **Bold** the key insight or action
- Warm but direct — no fluff
- Always personal to this person, never generic
- If they ask something outside education topics, gently redirect to what Sorene teaches

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dnaBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${directionBlock}`;

    const recipe = recipeId ? RECIPES[recipeId] : null;
    const userContent = recipe ? `${recipe}\n\n(User's message: "${message}")` : message;

    const prior = (history ?? []).slice(-10).map((m) => ({ role: m.role, content: m.content }));
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...prior,
      { role: "user", content: userContent },
    ];

    const msg = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    await deductCredits(userKey, calculateCredits("claude-haiku-4-5-20251001", msg.usage.input_tokens, msg.usage.output_tokens));
    const block = msg.content[0];
    const reply = block?.type === "text" ? block.text.trim() : "Sorry, I couldn't respond. Try again.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[education-chat] error:", error);
    return NextResponse.json({ reply: "Sorry, I had trouble with that. Please try again." }, { status: 500 });
  }
}
