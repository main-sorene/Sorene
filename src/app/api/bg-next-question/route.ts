import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The 5 signals we need to collect in the background phase
const BG_SIGNALS = [
  { key: "bg1_history", label: "current or most recent role and what it involves day-to-day" },
  { key: "bg2_skills", label: "years of professional experience and fields/industries worked in" },
  { key: "bg3_pattern", label: "core expertise — what they're genuinely known for, not just experienced with" },
  { key: "bg4_direction", label: "key skills and tools used regularly (technical, domain, interpersonal, leadership)" },
  { key: "bg5_turning", label: "career arc — roles and industries that shaped them and how they got here" },
];

const SYSTEM_PROMPT = `You are Sorene, conducting a professional background intake. Your job is to figure out what we still need to know, then generate a natural, conversational question to gather it — or decide we already have enough and move on.

Voice: direct, warm, specific. No corporate language. No flattery. No transitions like "Great!" or "Thanks for sharing that."

Rules:
- If the user has already answered the next signal in a prior answer, skip it silently — ask the next uncovered one instead, or declare done.
- Never ask for information already given. Reference what they said to make the next question feel earned.
- If all 5 signals are adequately covered across the collected answers, output DONE.
- Keep questions short. One question at a time.
- Match the depth of their answers. If they're terse, don't push for an essay.`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { answers, preferredLanguage } = (await req.json()) as {
      answers: Record<string, string>;
      preferredLanguage?: string;
    };

    // Build a summary of what we already know
    const collectedLines = BG_SIGNALS.map((sig) => {
      const val = answers[sig.key];
      return val ? `- ${sig.label}: "${val}"` : `- ${sig.label}: NOT YET COLLECTED`;
    }).join("\n");

    // Find the first uncollected signal
    const firstMissing = BG_SIGNALS.find((s) => !answers[s.key]);

    const userPrompt = `What we need to know about their professional background:
${collectedLines}

${firstMissing ? `The next signal to collect is: "${firstMissing.label}"` : "All signals appear collected."}

Review all collected answers carefully. Some signals may already be covered by answers to other questions (e.g., they mentioned their career arc while describing their role).

Task:
1. Determine which signal is ACTUALLY still missing or unclear (not just formally unanswered).
2. If something is genuinely still missing, write a single question to get it — make it feel natural and specific, not generic.
3. If all background is adequately covered across the answers, output exactly: DONE

${preferredLanguage && preferredLanguage !== "english" ? `IMPORTANT: Write your question in ${preferredLanguage}.` : ""}

Output ONLY the question text, or DONE. No preamble.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0]?.type === "text" ? message.content[0].text : "").trim();

    if (raw === "DONE" || raw.startsWith("DONE")) {
      return Response.json({ done: true });
    }

    // Find which signal this question covers (to know what nodeId to advance to)
    const nextMissing = BG_SIGNALS.find((s) => !answers[s.key]);
    return Response.json({
      done: false,
      question: raw,
      nodeId: nextMissing?.key ?? "bg5_turning",
    });
  } catch (err) {
    console.error("[bg-next-question] error:", err);
    // On error, fall back to static flow
    return Response.json({ done: false, question: null, nodeId: null });
  }
}
