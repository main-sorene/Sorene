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

async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function formatProgressSummary(uid: string): Promise<string> {
  const p = await getExecutionProgress(uid);
  return [
    "Your Execution Progress:",
    `Step 1 — Customer interviews: ${p.conversationsLogged}/10`,
    `Step 2 — Problem identified: ${p.problemIdentified ? "Yes" : "No"}`,
    `Step 3 — MVO created: ${p.mvoCreated ? "Yes" : "No"}`,
    `Step 4 — Paying customers: ${p.payingCustomers}/3`,
    p.elevatorPitch ? `Elevator pitch: ${p.elevatorPitch}` : null,
    p.lastCheckIn ? `Last check-in: ${p.lastCheckIn}` : null,
    `Weekly streak: ${p.weeklyStreakDays} days`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  // Validate secret header
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return new Response("OK", { status: 200 });

    const chatId: number = message.chat?.id;
    const text: string = message.text ?? "";
    const telegramUserId = String(message.from?.id ?? chatId);

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();
      if (token) {
        const result = await consumeLinkToken(token);
        if (result) {
          await linkPlatformToUser(result.uid, "telegram", telegramUserId);
          await sendTelegramMessage(
            chatId,
            "✅ Your Telegram is now linked to your Sorene account. Send me a message to get started.",
          );
        } else {
          await sendTelegramMessage(
            chatId,
            "That link is invalid or has expired. Please go to your Sorene app and tap 'Chat on Telegram' to get a new link.",
          );
        }
      } else {
        await sendTelegramMessage(
          chatId,
          "Welcome to Sorene! To link your account, go to the Execution Hub in the Sorene app and tap 'Chat on Telegram'.",
        );
      }
      return new Response("OK", { status: 200 });
    }

    if (text === "/progress") {
      const uid = await getUidByPlatformId("telegram", telegramUserId);
      if (!uid) {
        await sendTelegramMessage(
          chatId,
          "Please link your account first by going to the Sorene app and tapping 'Chat on Telegram'.",
        );
      } else {
        const summary = await formatProgressSummary(uid);
        await sendTelegramMessage(chatId, summary);
      }
      return new Response("OK", { status: 200 });
    }

    // Regular message
    const uid = await getUidByPlatformId("telegram", telegramUserId);
    if (!uid) {
      await sendTelegramMessage(
        chatId,
        "Please link your account first by going to the Sorene app and tapping 'Chat on Telegram'.",
      );
      return new Response("OK", { status: 200 });
    }

    const [progress, recentHistory] = await Promise.all([
      getExecutionProgress(uid),
      getRecentMessages(uid, 10),
    ]);

    const { reply, progressPatch } = await processMessage(uid, text, progress, recentHistory);

    await Promise.all([
      saveMessagingMessage(uid, "telegram", "user", text),
      saveMessagingMessage(uid, "telegram", "assistant", reply),
    ]);

    if (Object.keys(progressPatch).length > 0) {
      await updateExecutionProgress(uid, progressPatch);
    }

    await sendTelegramMessage(chatId, reply);
  } catch (err) {
    console.error("[telegram/webhook] error:", err);
  }

  return new Response("OK", { status: 200 });
}
