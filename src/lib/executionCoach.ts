import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionProgress } from "./messagingAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function processMessage(
  uid: string,
  incomingText: string,
  progress: ExecutionProgress,
  recentHistory: Array<{ role: "user" | "assistant"; text: string }>,
): Promise<{ reply: string; progressPatch: Partial<ExecutionProgress> }> {
  const systemPrompt = `You are Sorene — a direct, warm entrepreneurship coach. You know the VIBE framework (Validate → Interview → Build → Experiment) and guide founders through their execution journey.

The user's current progress:
${JSON.stringify(progress, null, 2)}

Steps in the Execution Hub:
1. Conversations Logged (target: 10 customer interviews)
2. Problem Identified — painkiller problem locked in
3. MVO Created — minimum viable offer built
4. Paying Customers (gate: 3 paying customers)

Guide the user through their next step based on their progress. Be direct, warm, and actionable.

After your conversational reply, append a fenced JSON block with ONLY the progress keys that changed based on what the user shared. Format:
\`\`\`json
{ "conversationsLogged": 5 }
\`\`\`
Only include keys that actually changed. If nothing changed, output an empty object: \`\`\`json\n{}\n\`\`\``;

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    })),
    { role: "user", content: incomingText },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  const raw = block && block.type === "text" ? block.text.trim() : "";

  // Extract JSON patch block
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
  let progressPatch: Partial<ExecutionProgress> = {};
  if (jsonMatch) {
    try {
      progressPatch = JSON.parse(jsonMatch[1].trim());
    } catch {
      progressPatch = {};
    }
  }

  // Remove the JSON block from the reply
  const reply = raw.replace(/```json[\s\S]*?```/, "").trim();

  return { reply, progressPatch };
}
