import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { consumeLinkToken, linkPlatformToUser, getUidByPlatformId } from "@/lib/messagingAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";

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

async function coach(text: string, to: string): Promise<void> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "You are Sorene, an AI execution coach helping entrepreneurs using the VIBE framework (Validate, Interview, Build demo, Experiment). Keep replies concise and practical.",
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
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return new Response("OK", { status: 200 });

    const from: string = message.from;
    const text: string = message.text?.body ?? "";

    if (text.startsWith("LINK-")) {
      const token = text.slice(5).trim();
      const result = await consumeLinkToken(token);
      if (result && result.platform === "whatsapp") {
        await linkPlatformToUser(result.uid, "whatsapp", from);
        await sendWhatsApp(from, "✅ Your WhatsApp is now linked to Sorene! Message me any time to log progress or get coaching.");
      } else {
        await sendWhatsApp(from, "❌ That link is invalid or expired. Please generate a new one from your Execution Hub.");
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByPlatformId("whatsapp", from);
    if (!uid) {
      await sendWhatsApp(from, "I don't recognise your account yet. Go to Execution Hub → Direct Sync → WhatsApp to link your Sorene account first.");
      return new Response("OK", { status: 200 });
    }

    await coach(text, from);
  } catch (err) {
    console.error("[whatsapp webhook]", err);
  }

  return new Response("OK", { status: 200 });
}
