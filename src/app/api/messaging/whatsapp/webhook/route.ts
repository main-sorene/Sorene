import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  consumeLinkToken,
  linkPlatformToUser,
  getUidByPlatformId,
  saveMessagingMessage,
  getRecentMessages,
} from "@/lib/messagingAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";

export async function sendWhatsApp(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

interface UserData {
  profile?: {
    firstName?: string;
    occupation?: string;
    dnaScores?: Record<string, number>;
    dna_narrative?: string;
  };
  executionProjects?: Array<{
    title: string;
    oneliner?: string;
    description?: string;
    path_label?: string;
  }>;
  whatsappSettings?: {
    activeProjectTitle?: string;
    reminder_freq?: string;
    reminder_hour?: number;
    reminder_day?: string;
    knowledge?: string;
    knowledge_hour?: number;
    checkin_prompt?: boolean;
    checkin_hour?: number;
  };
}

async function getUserData(uid: string): Promise<UserData> {
  try {
    const snap = await getAdminFirestore().collection("users").doc(uid).get();
    return (snap.data() ?? {}) as UserData;
  } catch {
    return {};
  }
}

async function getExecutionState(uid: string): Promise<Record<string, string>> {
  try {
    const snap = await getAdminFirestore()
      .collection("users").doc(uid)
      .collection("executionState").doc("hub")
      .get();
    return snap.data()?.entries ?? {};
  } catch {
    return {};
  }
}

function safeDocTitle(title: string) {
  return title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

async function saveCustomerConversation(uid: string, projectTitle: string, text: string) {
  const entry = {
    id: Date.now().toString(),
    text,
    source: "whatsapp",
    createdAt: Date.now(),
  };
  await getAdminFirestore()
    .collection("users").doc(uid)
    .collection("executionConversations").doc(safeDocTitle(projectTitle))
    .set({ entries: FieldValue.arrayUnion(entry) }, { merge: true });
}

const CUSTOMER_CONVO_KEYWORDS = [
  "talked to", "spoke with", "met with", "customer said", "they said",
  "interview", "had a call", "conversation with", "user said", "prospect said",
];

function isCustomerConversation(text: string): boolean {
  if (text.length < 30) return false;
  const lower = text.toLowerCase();
  return CUSTOMER_CONVO_KEYWORDS.some((kw) => lower.includes(kw));
}

// Sorene's WhatsApp system prompt — same character as the web app,
// adapted for conversational messaging (no markdown, short paragraphs).
function buildSystemPrompt(userData: UserData, executionState: Record<string, string>): string {
  const profile = userData.profile ?? {};
  const projects = userData.executionProjects ?? [];
  const activeProjectTitle = userData.whatsappSettings?.activeProjectTitle;
  const activeProject = activeProjectTitle
    ? projects.find((p) => p.title === activeProjectTitle) ?? null
    : null;

  const name = profile.firstName ? `The user's name is ${profile.firstName}.` : "";
  const occupation = profile.occupation ? `They are a ${profile.occupation}.` : "";
  const dna = profile.dna_narrative
    ? `Their entrepreneurial profile: ${profile.dna_narrative.slice(0, 300)}`
    : "";

  let projectContext = "";
  if (activeProject) {
    projectContext = `\n\nThey are working on: "${activeProject.title}"${activeProject.oneliner ? ` — ${activeProject.oneliner}` : ""}.`;
    if (activeProject.path_label) projectContext += ` Current stage: ${activeProject.path_label}.`;
    if (activeProject.description) projectContext += ` ${activeProject.description.slice(0, 200)}.`;

    const relevantState: Record<string, string> = {};
    for (const [k, v] of Object.entries(executionState)) {
      if (["launchpad_", "business-status", "validation_score", "painkiller", "pattern-summary"].some((p) => k.includes(p))) {
        relevantState[k] = v;
      }
    }
    if (Object.keys(relevantState).length > 0) {
      projectContext += `\n\nExecution progress: ${JSON.stringify(relevantState).slice(0, 500)}`;
    }
  } else if (projects.length > 0) {
    projectContext = `\n\nThey have ${projects.length} project(s) in their Hub but haven't set an active project for WhatsApp coaching yet. If relevant, encourage them to set one in the Connect tab.`;
  }

  return `You are Sorene — a sharp, warm, direct execution coach. You help founders move fast on their specific business.

Your character on WhatsApp:
- Talk like a smart friend who's also an expert — not a corporate bot
- Address them by name when natural, not every message
- Be specific to their project and where they're at — never give generic advice
- Short messages only: 2-4 sentences max per reply, plain text, no bullet points, no asterisks
- When you see a real blocker, name it directly and give one clear next move
- Celebrate wins briefly and redirect to the next thing — don't linger
- If you don't have enough context, ask one sharp question, not three vague ones

${name} ${occupation}
${dna}${projectContext}

VIBE framework context (use when relevant): Validate → Interview → Build demo → Experiment. Most early founders skip Validate and regret it.`;
}

async function coach(uid: string, text: string, to: string): Promise<void> {
  const [history, userData, executionState] = await Promise.all([
    getRecentMessages(uid, 10),
    getUserData(uid),
    getExecutionState(uid),
  ]);

  const isConvo = isCustomerConversation(text);
  const activeProjectTitle = userData.whatsappSettings?.activeProjectTitle ?? "whatsapp_logs";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: buildSystemPrompt(userData, executionState),
    messages: [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: text },
    ],
  });

  await deductCredits(uid, calculateCredits("claude-haiku-4-5-20251001", response.usage.input_tokens, response.usage.output_tokens));

  let reply = response.content[0].type === "text" ? response.content[0].text : "Something went wrong on my end — try again.";

  const ops: Promise<unknown>[] = [
    saveMessagingMessage(uid, "whatsapp", "user", text),
    saveMessagingMessage(uid, "whatsapp", "assistant", reply),
  ];

  if (isConvo) {
    reply += "\n\n(Saved to your Execution Hub ✓)";
    ops.push(saveCustomerConversation(uid, activeProjectTitle, text));
  }

  ops.push(sendWhatsApp(to, reply));
  await Promise.all(ops);
}

// Warm onboarding message sent immediately after account linking.
async function sendWelcome(uid: string, to: string): Promise<void> {
  const userData = await getUserData(uid);
  const name = userData.profile?.firstName;
  const projects = userData.executionProjects ?? [];

  let msg = "";
  if (name) {
    msg = `Hey ${name}! I'm Sorene — your execution coach, now in your pocket.`;
  } else {
    msg = `Hey! I'm Sorene — your execution coach, now in your pocket.`;
  }

  if (projects.length > 0) {
    const activeTitle = userData.whatsappSettings?.activeProjectTitle ?? projects[0].title;
    msg += `\n\nI can see you're working on ${activeTitle}. Message me any time — progress updates, customer conversations, questions, blockers. I'll keep it real and specific.\n\nHead to the Connect tab in your Hub to set up your project link and schedule reminders.`;
  } else {
    msg += `\n\nMessage me any time — progress updates, questions, blockers. I'll keep it real and specific.\n\nTo get the most out of this, create a project in your Execution Hub and link it to WhatsApp from the Connect tab.`;
  }

  await sendWhatsApp(to, msg);
}

// Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === WA_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return new Response("OK", { status: 200 });

    const from: string = message.from;
    const text: string = message.text?.body ?? "";

    // Account linking flow
    if (text.startsWith("LINK-")) {
      const token = text.slice(5).trim();
      const result = await consumeLinkToken(token);
      if (result && result.platform === "whatsapp") {
        await linkPlatformToUser(result.uid, "whatsapp", from);
        await sendWelcome(result.uid, from);
      } else {
        await sendWhatsApp(from, "That link has expired or isn't valid. Grab a fresh one from the Connect tab in your Execution Hub.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByPlatformId("whatsapp", from);
    if (!uid) {
      await sendWhatsApp(from, "I don't recognise this number yet. Go to your Execution Hub → Connect tab → WhatsApp to link your account first.");
      return new Response("OK", { status: 200 });
    }

    const credits = await checkCredits(uid);
    if (!credits.ok) {
      await sendWhatsApp(from, "You've used up your coaching credits for this month. Upgrade your plan at sorene.ai to keep going.");
      return new Response("OK", { status: 200 });
    }

    await coach(uid, text, from);
  } catch (err) {
    console.error("[whatsapp webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
