import { NextRequest } from "next/server";
import {
  consumeLinkToken,
  linkPlatformToUser,
  getUidByPlatformId,
  saveMessagingMessage,
  getRecentMessages,
  updateExecutionProgress,
  getExecutionProgress,
} from "@/lib/messagingAdmin";
import { processMessage } from "@/lib/executionCoach";

async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const messageObj = value?.messages?.[0];
    if (!messageObj) return new Response("OK", { status: 200 });

    const from: string = messageObj.from;
    const text: string = messageObj.text?.body ?? "";

    if (text.startsWith("LINK-")) {
      const token = text.slice(5).trim();
      const result = await consumeLinkToken(token);
      if (result) {
        await linkPlatformToUser(result.uid, "whatsapp", from);
        await sendWhatsAppMessage(
          from,
          "✅ Your WhatsApp is now linked to your Sorene account. Send me a message to get started.",
        );
      } else {
        await sendWhatsAppMessage(
          from,
          "That link is invalid or has expired. Please go to your Sorene app and tap 'Chat on WhatsApp' to get a new link.",
        );
      }
      return new Response("OK", { status: 200 });
    }

    const uid = await getUidByPlatformId("whatsapp", from);
    if (!uid) {
      await sendWhatsAppMessage(
        from,
        "Please link your account first by going to the Sorene app and tapping 'Chat on WhatsApp'.",
      );
      return new Response("OK", { status: 200 });
    }

    const [progress, recentHistory] = await Promise.all([
      getExecutionProgress(uid),
      getRecentMessages(uid, 10),
    ]);

    const { reply, progressPatch } = await processMessage(uid, text, progress, recentHistory);

    await Promise.all([
      saveMessagingMessage(uid, "whatsapp", "user", text),
      saveMessagingMessage(uid, "whatsapp", "assistant", reply),
    ]);

    if (Object.keys(progressPatch).length > 0) {
      await updateExecutionProgress(uid, progressPatch);
    }

    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error("[whatsapp/webhook] error:", err);
  }

  return new Response("OK", { status: 200 });
}
