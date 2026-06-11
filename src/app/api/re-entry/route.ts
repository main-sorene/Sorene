import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, adminGetAssistantMessages, adminGetUserProfile } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const uid = authUser.uid;
  const [user, recentMessages] = await Promise.all([
    adminGetUserProfile(uid),
    adminGetAssistantMessages(uid, 6),
  ]);

  const lastExchange = recentMessages
    .slice(-4)
    .map((m) => `${m.role === "user" ? "User" : "Sorene"}: ${m.content.slice(0, 120)}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `You are Sorene. This user has been away for 2+ days. Write a re-entry opening: 2 sentences maximum.

Sentence 1: where they left off (specific, from the exchange below — not generic).
Sentence 2: one direct question that picks up exactly where they stopped.

Their coaching stage: ${user?.coachingStage ?? "exploring"}
Last exchange:
${lastExchange || "No previous exchange."}

Rules: No "Welcome back". No "I hope you're well". No fluff. Speak as if no time passed.
Output only the 2 sentences.`,
    }],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  return Response.json({ message: text });
}
