import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { consumeLinkToken, linkPlatformToUser, getUidByPlatformId } from "@/lib/messagingAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

async function sendTelegram(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function coach(text: string, chatId: number | string, uid: string): Promise<void> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "You are Sorene, an AI execution coach helping entrepreneurs using the VIBE framework (Validate, Interview, Build demo, Experiment). Keep replies concise and practical.",
    messages: [{ role: "user", content: text }],
  });
  await deductCredits(uid, calculateCredits("claude-haiku-4-5-20251001", response.usage.input_tokens, response.usage.output_tokens));
  const reply = response.content[0].type === "text" ? response.content[0].text : "I couldn't process that.";
  await sendTelegram(chatId, reply);
}

export async function POST(req: NextRequest) {
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
      const token = text.split(" ")[1]?.trim();
      if (token) {
        const result = await consumeLinkToken(token);
        if (result && result.platform === "telegram") {
          await linkPlatformToUser(result.uid, "telegram", telegramId);
          await sendTelegram(chatId, "✅ Your Telegram is now linked to Sorene! Send me a message any time to log progress or get coaching.");
        } else {
          await sendTelegram(chatId, "❌ That link is invalid or expired. Please generate a new one from your Execution Hub.");
        }
      } else {
        await sendTelegram(chatId, "👋 Hi! I'm Sorene, your execution coach.\n\nTo link your account, go to *Execution Hub → Direct Sync → Telegram* and tap Connect.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByPlatformId("telegram", telegramId);
    if (!uid) {
      await sendTelegram(chatId, "I don't recognise your account yet. Go to *Execution Hub → Direct Sync → Telegram* to link your Sorene account first.");
      return new Response("OK", { status: 200 });
    }

    const credits = await checkCredits(uid);
    if (!credits.ok) {
      await sendTelegram(chatId, "You've used up your Sorene credits. Upgrade at sorene.ai to keep coaching.");
      return new Response("OK", { status: 200 });
    }

    await coach(text, chatId, uid);
  } catch (err) {
    console.error("[telegram webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
