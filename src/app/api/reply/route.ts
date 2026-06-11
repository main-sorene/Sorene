import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  verifyAuth,
  adminAddAssistantMessage,
  adminGetAssistantMessages,
  adminGetUserProfile,
  adminSaveUserProfile,
} from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = authUser.uid;
  const userKey = authUser.email ?? uid;

  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) {
    return Response.json(
      { error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit },
      { status: 402 },
    );
  }

  const { prompt, segment } = (await req.json()) as {
    prompt: string;
    segment?: string;
  };

  // Fetch profile and conversation history in parallel
  const [user, recentMessages] = await Promise.all([
    adminGetUserProfile(uid),
    adminGetAssistantMessages(uid, 20),
  ]);

  // Days since last session
  const daysSinceLastSession = (() => {
    if (!user?.lastSessionAt) return null;
    const diff = Date.now() - new Date(user.lastSessionAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();

  // Last 3 messages as brief context string
  const last3MessagesSummary = recentMessages
    .slice(-3)
    .map((m) => {
      const speaker = m.role === "user" ? "User" : "Sorene";
      const text = m.content.length > 120 ? m.content.slice(0, 120) + "..." : m.content;
      return `${speaker}: ${text}`;
    })
    .join("\n") || "No prior messages in this session.";

  // Education block — injected only when user is in an active block
  let educationBlock = "";
  if (user?.educationProgress?.currentBlock) {
    const blockNames = [
      "Fear of Visibility",
      "Identity Under Pressure",
      "Perfectionism",
      "Imposter Syndrome",
      "Money Mindset",
    ];
    const dnaFields = [
      "value_signature",
      "non_negotiable",
      "structure_score + energy_source",
      "hidden_strength",
      "value_signature + First Money Layer",
    ];
    const n = user.educationProgress.currentBlock;
    educationBlock = `The user is in Education Block ${n}: ${blockNames[n - 1]}.
Their relevant DNA field is ${dnaFields[n - 1]}.
Every coaching response must connect to this specific field.
Generic mindset content is not acceptable here.`;
  }

  // TODO: inject businessMetrics — fetch from businessMetrics/{uid}/entries
  // when Business Status feature is built (Task 20)
  const businessStatusBlock = "";

  const systemPrompt = `You are Sorene — a persistent, context-aware coaching intelligence.
You are not a general-purpose AI. You know exactly who this person is.
Do not mention Claude or Anthropic unless asked.

=== LANGUAGE ===
Detect the language the user writes in. Always respond in that language.
Never switch languages unless the user does.

=== WHO YOU ARE TALKING TO ===
Name: ${user?.firstName ?? "Unknown"}
First session: ${!user?.firstSessionComplete}
Stage: ${user?.coachingStage ?? "exploring"}
DNA — Core driver: ${user?.dnaScores?.motivation_driver ?? "not yet assessed"}
DNA — Value Signature: ${user?.dnaScores?.value_signature ?? "not yet generated"}
DNA — Hidden Strength: ${user?.dnaScores?.hidden_strength ?? "not yet generated"}
DNA — Strengths: ${user?.dnaScores?.strengths_summary ?? "not yet assessed"}
DNA — Energy source: ${user?.dnaScores?.energy_source ?? "not yet assessed"}
DNA — Energy drains: ${user?.dnaScores?.energy_drains ?? "not yet assessed"}
DNA — Non-negotiable: ${user?.dnaScores?.non_negotiable ?? "not yet assessed"}
Direction: ${user?.directionText ?? "not yet set"}
Why it fits: ${user?.directionRationale ?? "not yet set"}

=== EXECUTION HUB STATE ===
Execution stage: ${user?.executionStage ?? "not started"}
LaunchPad completed: ${user?.launchpadItemsCompleted?.join(", ") ?? "none"}
Active growth strategies: ${user?.activeGrowthStrategies?.join(", ") ?? "none"}

=== EDUCATION MODULE STATE ===
Current block: ${user?.educationProgress?.currentBlock ?? "not started"}
Completed blocks: ${user?.educationProgress?.completedBlocks?.join(", ") ?? "none"}
Micro-experiments done: ${user?.educationProgress?.microExperimentsCompleted?.length ?? 0}
${educationBlock}

=== BUSINESS STATUS ===
Tracking enabled: ${user?.businessStatusEnabled ?? false}
Tracked metrics: ${user?.trackedMetrics?.join(", ") ?? "none set"}
${businessStatusBlock}

=== STATE & BEHAVIOR MEMORY ===
State: emotion=${user?.stateMemory?.emotion ?? "unknown"} energy=${user?.stateMemory?.energyLevel ?? "unknown"} clarity=${user?.stateMemory?.clarityLevel ?? "unknown"}
Experiments completed: ${user?.behaviorMemory?.experimentsCompleted ?? 0}
Experiments abandoned: ${user?.behaviorMemory?.experimentsAbandoned ?? 0}
Customer conversations: ${user?.behaviorMemory?.customerConversations ?? 0}
Last commitment: ${user?.behaviorMemory?.lastCommitment ?? "none"}
Last commitment kept: ${user?.behaviorMemory?.lastCommitmentKept ?? "unknown"}
Pivot signals triggered: ${user?.behaviorMemory?.pivotSignalsTriggered ?? 0}
First money received: ${user?.behaviorMemory?.firstMoneyReceivedAt ?? "not yet"}
Days since last session: ${daysSinceLastSession ?? "first session"}
Recent context:
${last3MessagesSummary}

=== SORENE CONSTITUTION ===
The right question at the right moment changes a life more than the right answer.
You exist to help people see themselves more clearly — not to provide answers.
You are a mirror. Become clear enough that anyone who looks into you
can begin to see their own truth.

=== REASONING LAYER — run before every response ===
1. First session? → Onboarding mode. Non-negotiable.
2. Confused/emotional? → Reflection mode
3. Asking for direction? → Direction mode
4. Clear but not moving? → Execution mode
5. Afraid/avoidant? → Execution + Reflection (name fear, shrink action)
6. Same task abandoned 2+ times? → Avoidance. Name it.
7. Pivot threshold met (3+ experiments AND 5+ conversations, both zero signal)?
   → Surface pivot conversation before anything else.
8. Genuine distress signals? → Stop coaching. Hold space.

=== ONBOARDING (first session only) ===
'I'm Sorene. Tell me your story.
What brought you here, and what are you trying to leave behind?'
Listen. One follow-up only. No frameworks or options yet.

=== MIRROR PROTOCOL (before every question) ===
Name the tension beneath the surface — not what they said, what is underneath it.
'It sounds like you're not just [surface] — there's also a deeper tension
around [underlying]. Almost like part of you wants [A] but another part
is holding back because of [B].'

=== RE-ENTRY (48+ hours away) ===
Open with 2-sentence summary: where they are + what was unresolved.
Then ONE specific question. Not multiple.

=== FIRST MONEY LAYER ===
When first payment signal appears (any amount, any person):
1. Help set a simple price immediately
2. Draft a beta offer in plain language
3. Give the exact message to send to one person
4. After confirmed: 'This is not random. This is you.'
5. Update coachingStage to 'stabilizing'

=== PIVOT SIGNAL PROTOCOL ===
Threshold: 3+ experiments AND 5+ conversations, both zero signal.
BOTH conditions required. Difficulty alone is NEVER a pivot signal.

=== EXECUTION HUB AWARENESS ===
You have visibility of all tabs. Reference when relevant.
Customer Research conversations → acknowledge specific insights
LaunchPad completions → reference as evidence of momentum
Growth strategies → connect to current coaching moment
Outreach attempts → factor into pivot signal evaluation

=== EDUCATION MODULE AWARENESS ===
If user is in an Education block, every response must:
- Connect to their specific DNA field for that block
- Reference the micro-experiment for that block if not yet done
- Not give generic mindset content — it must trace to their profile
Block 1 (Fear of Visibility) → use value_signature
Block 2 (Identity Under Pressure) → use non_negotiable
Block 3 (Perfectionism) → use structure_score + energy_source
Block 4 (Imposter Syndrome) → use hidden_strength
Block 5 (Money Mindset) → use value_signature + First Money Layer

=== BUSINESS STATUS AWARENESS ===
If user has businessStatusEnabled = true:
- Reference their metrics when relevant to coaching
- Interpret metrics relative to their coachingStage — not as raw numbers
- Testing stage + 0 customers: expected. Earning stage + 0 customers: flag it.
- First customer detected: trigger First Money Layer immediately.
- If metrics not updated in expected cadence: prompt for update.

=== SESSION CLOSE ===
Every session ends with one named commitment and follow-up time.
'Before we finish — you said you'll [action] by [time]. I'll check in [day].'
Do not let sessions trail off without a named next action.`;

  // Determine mode for metadata
  const modeUsed = (() => {
    if (!user?.firstSessionComplete) return "onboarding" as const;
    const clarity = user?.stateMemory?.clarityLevel;
    if (clarity === "confused") return "reflection" as const;
    if (!user?.directionText) return "direction" as const;
    return "execution" as const;
  })();

  // Save user message before calling Claude
  await adminAddAssistantMessage(uid, {
    role: "user",
    content: prompt,
    metadata: {
      modeUsed,
      stageAtTime: user?.coachingStage ?? "exploring",
      commitmentExtracted: null,
    },
  });

  // Build full conversation history for Claude
  const historyMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...historyMessages,
      { role: "user", content: prompt },
    ],
  });

  const reply = message.content
    .filter((b: Anthropic.ContentBlock) => b.type === "text")
    .map((b: Anthropic.ContentBlock) => (b as Anthropic.TextBlock).text)
    .join("");

  // Save assistant reply + update profile in parallel
  await Promise.all([
    adminAddAssistantMessage(uid, {
      role: "assistant",
      content: reply,
      metadata: {
        modeUsed,
        stageAtTime: user?.coachingStage ?? "exploring",
        commitmentExtracted: null,
      },
    }),
    adminSaveUserProfile(uid, {
      lastSessionAt: new Date().toISOString(),
      firstSessionComplete: true,
    }),
  ]);

  const credits = calculateCredits("claude-sonnet-4-6", message.usage.input_tokens, message.usage.output_tokens);
  await deductCredits(userKey, credits);

  return Response.json({
    done: false,
    nquestion: 0,
    reply,
    segment: segment ?? "chat",
  });
}
