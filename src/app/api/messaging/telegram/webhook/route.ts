import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

async function sendTelegram(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function firestoreGet(path: string): Promise<Record<string, any> | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
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
  const doc = await firestoreGet(`messagingLinkTokens/${token}`);
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

async function getUidByTelegramId(telegramId: string): Promise<string | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "linkedMessaging.telegram" },
            op: "EQUAL",
            value: { stringValue: telegramId },
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

async function coach(uid: string, text: string, chatId: number | string): Promise<void> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "You are Sorene, an AI execution coach helping entrepreneurs using the VIBE framework. Keep replies concise and practical.",
    messages: [{ role: "user", content: text }],
  });
  const reply = response.content[0].type === "text" ? response.content[0].text : "I couldn't process that.";
  await sendTelegram(chatId, reply);
}

export async function POST(req: NextRequest) {
  // Validate webhook secret
  if (WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (secret !== WEBHOOK_SECRET) return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return new Response("OK", { status: 200 });

    const chatId: number = message.chat.id;
    const text: string = message.text ?? "";
    const telegramId = String(message.from?.id ?? chatId);

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (token) {
        const result = await consumeLinkToken(token);
        if (result && result.platform === "telegram") {
          // Link telegram ID to user
          await firestorePatch(`users/${result.uid}`, {
            "linkedMessaging.telegram": { stringValue: telegramId },
          });
          await sendTelegram(chatId, "✅ Your Telegram is now linked to Sorene! Send me a message any time to log progress or get coaching.");
        } else {
          await sendTelegram(chatId, "❌ That link is invalid or expired. Please generate a new one from your Execution Hub.");
        }
      } else {
        await sendTelegram(chatId, "👋 Hi! I'm Sorene, your execution coach.\n\nTo link your account, go to *Execution Hub → Direct Sync → Telegram* and tap Connect.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByTelegramId(telegramId);
    if (!uid) {
      await sendTelegram(chatId, "I don't recognise your account yet. Go to *Execution Hub → Direct Sync → Telegram* to link your Sorene account first.");
      return new Response("OK", { status: 200 });
    }

    await coach(uid, text, chatId);
  } catch (err) {
    console.error("[telegram webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
