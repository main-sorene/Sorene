import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

async function sendWhatsApp(to: string, text: string) {
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

async function firestorePatch(path: string, fields: Record<string, any>): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

function parseField(field: any): any {
  if (!field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("timestampValue" in field) return field.timestampValue;
  return null;
}

async function consumeLinkToken(token: string): Promise<{ uid: string; platform: string } | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/messagingLinkTokens/${token}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc?.fields) return null;
  const used = parseField(doc.fields.used);
  const expiresAt = parseField(doc.fields.expiresAt);
  if (used) return null;
  if (expiresAt && new Date(expiresAt) < new Date()) return null;
  const uid = parseField(doc.fields.uid);
  const platform = parseField(doc.fields.platform);
  await firestorePatch(`messagingLinkTokens/${token}`, { used: { booleanValue: true } });
  return { uid, platform };
}

async function getUidByWhatsAppId(waId: string): Promise<string | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "linkedMessaging.whatsapp" },
            op: "EQUAL",
            value: { stringValue: waId },
          },
        },
        limit: 1,
      },
    }),
  });
  if (!res.ok) return null;
  const results = await res.json();
  const doc = results?.[0]?.document;
  if (!doc) return null;
  return doc.name.split("/").pop() ?? null;
}

async function coach(uid: string, text: string, to: string): Promise<void> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "You are Sorene, an AI execution coach helping entrepreneurs using the VIBE framework. Keep replies concise and practical.",
    messages: [{ role: "user", content: text }],
  });
  const reply = response.content[0].type === "text" ? response.content[0].text : "I couldn't process that.";
  await sendWhatsApp(to, reply);
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
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if (!message) return new Response("OK", { status: 200 });

    const from: string = message.from;
    const text: string = message.text?.body ?? "";

    if (text.startsWith("LINK-")) {
      const token = text.replace(/^LINK-/, "").trim();
      const result = await consumeLinkToken(token);
      if (result && result.platform === "whatsapp") {
        await firestorePatch(`users/${result.uid}`, {
          "linkedMessaging.whatsapp": { stringValue: from },
        });
        await sendWhatsApp(from, "✅ Your WhatsApp is now linked to Sorene! Message me any time to log progress or get coaching.");
      } else {
        await sendWhatsApp(from, "❌ That link is invalid or expired. Please generate a new one from your Execution Hub.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByWhatsAppId(from);
    if (!uid) {
      await sendWhatsApp(from, "I don't recognise your account yet. Go to Execution Hub → Direct Sync → WhatsApp to link your Sorene account first.");
      return new Response("OK", { status: 200 });
    }

    await coach(uid, text, from);
  } catch (err) {
    console.error("[whatsapp webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
