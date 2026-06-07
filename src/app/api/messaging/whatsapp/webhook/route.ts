import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  consumeLinkToken,
  linkPlatformToUser,
  getUidByPlatformId,
  saveMessagingMessage,
  getRecentMessages,
  getWhatsAppCredits,
  deductWhatsAppCredit,
} from "@/lib/messagingAdmin";
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
  const safeTitle = safeDocTitle(projectTitle);
  const entry = {
    id: Date.now().toString(),
    text,
    source: "whatsapp",
    createdAt: Date.now(),
  };
  await getAdminFirestore()
    .collection("users").doc(uid)
    .collection("executionConversations").doc(safeTitle)
    .set({ entries: FieldValue.arrayUnion(entry) }, { merge: true });
}

const CUSTOMER_CONVO_KEYWORDS = [
  "talked to", "spoke with", "met with", "customer said", "they said",
  "interview", "had a call", "conversation with",
];

function isCustomerConversation(text: string): boolean {
  if (text.length < 30) return false;
  const lower = text.toLowerCase();
  return CUSTOMER_CONVO_KEYWORDS.some((kw) => lower.includes(kw));
}

async function coach(uid: string, text: string, to: string): Promise<void> {
  const [history, userData, executionState] = await Promise.all([
    getRecentMessages(uid, 10),
    getUserData(uid),
    getExecutionState(uid),
  ]);

  const profile = userData.profile ?? {};
  const projects = userData.executionProjects ?? [];
  const whatsappSettings = userData.whatsappSettings ?? {};
  const activeProjectTitle = whatsappSettings.activeProjectTitle;

  const activeProject = activeProjectTitle
    ? projects.find((p) => p.title === activeProjectTitle)
    : null;

  // Build profile note
  const profileNote = profile.firstName
    ? `User profile: name=${profile.firstName}, occupation=${profile.occupation ?? "unknown"}.`
    : "";

  // Build project context note
  let projectNote = "";
  if (activeProject) {
    projectNote = `\n\nActive project: "${activeProject.title}"${activeProject.oneliner ? ` — ${activeProject.oneliner}` : ""}.`;
    if (activeProject.path_label) {
      projectNote += ` Stage: ${activeProject.path_label}.`;
    }
    if (activeProject.description) {
      projectNote += ` Description: ${activeProject.description.slice(0, 200)}.`;
    }

    // Add relevant execution state keys
    const relevantKeys: Record<string, string> = {};
    const relevantPrefixes = ["launchpad_", "business-status", "validation_score"];
    for (const [k, v] of Object.entries(executionState)) {
      if (relevantPrefixes.some((prefix) => k.includes(prefix))) {
        relevantKeys[k] = v;
      }
    }
    if (Object.keys(relevantKeys).length > 0) {
      projectNote += ` Execution state: ${JSON.stringify(relevantKeys).slice(0, 400)}.`;
    }
  } else if (projects.length > 0) {
    projectNote = `\n\nUser has ${projects.length} project(s) but no active project selected for WhatsApp coaching.`;
  }

  // Detect customer conversation
  const isConvo = isCustomerConversation(text);
  const conversationProjectTitle = activeProjectTitle || "whatsapp_logs";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are Sorene, an AI execution coach helping entrepreneurs using the VIBE framework (Validate, Interview, Build demo, Experiment). Keep replies concise and practical — ideal for WhatsApp (short paragraphs, no markdown). ${profileNote}${projectNote}`,
    messages: [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: text },
    ],
  });

  let reply = response.content[0].type === "text" ? response.content[0].text : "I couldn't process that.";

  const ops: Promise<unknown>[] = [
    saveMessagingMessage(uid, "whatsapp", "user", text),
    saveMessagingMessage(uid, "whatsapp", "assistant", reply),
  ];

  if (isConvo) {
    reply += "\n\n✅ Saved to your Execution Hub.";
    ops.push(saveCustomerConversation(uid, conversationProjectTitle, text));
  }

  ops.push(sendWhatsApp(to, reply));

  await Promise.all(ops);
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

    if (text.startsWith("LINK-")) {
      const token = text.slice(5).trim();
      const result = await consumeLinkToken(token);
      if (result && result.platform === "whatsapp") {
        await linkPlatformToUser(result.uid, "whatsapp", from);
        await sendWhatsApp(from, "✅ Your WhatsApp is now linked to Sorene! Message me any time to log progress or get coaching.\n\nYou have 10 free messages to start. Top up credits anytime from your Execution Hub.");
      } else {
        await sendWhatsApp(from, "❌ That link is invalid or expired. Please generate a new one from your Execution Hub.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByPlatformId("whatsapp", from);
    if (!uid) {
      await sendWhatsApp(from, "I don't recognise your account yet. Go to Execution Hub → Connect → WhatsApp to link your Sorene account first.");
      return new Response("OK", { status: 200 });
    }

    const credits = await getWhatsAppCredits(uid);
    if (credits <= 0) {
      await sendWhatsApp(from, "⚠️ You've used all your WhatsApp coaching credits. Top up from your Sorene Execution Hub to continue.");
      return new Response("OK", { status: 200 });
    }

    await Promise.all([
      coach(uid, text, from),
      deductWhatsAppCredit(uid),
    ]);

    if (credits === 1) {
      await sendWhatsApp(from, "ℹ️ That was your last credit. Top up from your Execution Hub to keep coaching on WhatsApp.");
    } else if (credits <= 3) {
      await sendWhatsApp(from, `ℹ️ You have ${credits - 1} WhatsApp credit${credits - 1 === 1 ? "" : "s"} remaining.`);
    }
  } catch (err) {
    console.error("[whatsapp webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
