import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionProgress } from "./messagingAdmin";

const client = new Anthropic();

const SYSTEM = `You are Sorene, an AI execution coach helping entrepreneurs validate and launch their business ideas using the VIBE framework (Validate, Interview, Build demo, Experiment).

You are speaking to an entrepreneur via WhatsApp or Telegram. Keep replies concise (2-4 sentences) and practical — no fluff. Use the VIBE framework when relevant.

At the end of your reply, if anything the user said warrants updating their progress, output a JSON block like:
\`\`\`json
{"conversationsLogged": 5, "problemIdentified": true}
\`\`\`
Only include fields that should change. Omit the block entirely if nothing needs updating.`;

export async function processMessage(
  incomingText: string,
  progress: ExecutionProgress,
  recentHistory: { role: "user" | "assistant"; content: string }[],
): Promise<{ reply: string; progressPatch: Partial<ExecutionProgress> }> {
  const contextNote = `User progress: ${JSON.stringify(progress)}`;

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: `${contextNote}\n\n${incomingText}` },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM,
    messages,
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract optional JSON patch
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
  let progressPatch: Partial<ExecutionProgress> = {};
  if (jsonMatch) {
    try { progressPatch = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
  }

  const reply = raw.replace(/```json[\s\S]*?```/g, "").trim();

  return { reply, progressPatch };
}
