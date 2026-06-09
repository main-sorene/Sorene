import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The 5 signals we need to collect in the background phase
const BG_SIGNALS = [
  { key: "bg1_history", label: "current or most recent role and what it involves day-to-day" },
  { key: "bg2_skills", label: "years of professional experience and fields/industries worked in" },
  { key: "bg3_pattern", label: "core expertise — what they're genuinely known for, not just experienced with" },
  { key: "bg4_direction", label: "key skills and tools used regularly (technical, domain, interpersonal, leadership)" },
  { key: "bg5_turning", label: "career arc — roles and industries that shaped them and how they got here" },
];

const SYSTEM_PROMPT = `You are Sorene, conducting a professional background intake. Your job is to briefly acknowledge what the user just said, then ask the next question to fill in what's still missing — or decide we already have enough.

Voice: direct, warm, specific. No corporate language. No hollow praise like "Great!" or "Thanks for sharing that." Reference something specific from their answer if you acknowledge it.

Output format (two parts, separated by exactly "---"):
1. One sentence reflection on their last answer — something specific you noticed or that's worth naming. Do NOT start with "I" or compliment words.
2. The next question (if still needed), or DONE if all background is covered.

Rules:
- If the user has already answered the next signal in a prior answer, skip it — ask the next uncovered one instead, or output DONE.
- Never ask for information already given.
- Keep questions short. One question at a time.
- Match the depth of their answers.
- If all 5 signals are adequately covered, output: [one reflection sentence]---DONE`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userKey = user.email ?? user.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) return Response.json({ error: "Credit limit reached" }, { status: 402 });

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

    // Find the most recent user answer for the reflection
    const lastAnswerKey = BG_SIGNALS.slice().reverse().find((s) => answers[s.key])?.key;
    const lastAnswer = lastAnswerKey ? answers[lastAnswerKey] : "";

    const userPrompt = `Their most recent answer: "${lastAnswer}"

What we know about their professional background so far:
${collectedLines}

${firstMissing ? `The next signal to collect is: "${firstMissing.label}"` : "All signals appear collected."}

Review all collected answers. Some signals may already be covered by earlier answers.

Task:
1. Write one brief reflection sentence on their most recent answer — specific, not generic.
2. Determine which signal is ACTUALLY still missing. If something is genuinely missing, write a single question to get it.
3. If all background is adequately covered, the question part should be DONE.

${preferredLanguage && preferredLanguage !== "english" ? `IMPORTANT: Write everything in ${preferredLanguage}.` : ""}

Output format: [reflection sentence]---[question or DONE]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    await deductCredits(userKey, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));
    const raw = (message.content[0]?.type === "text" ? message.content[0].text : "").trim();

    const [reflectionPart, questionPart] = raw.split("---").map((s) => s.trim());
    const reflection = reflectionPart || "";
    const questionOrDone = questionPart || raw;

    if (!questionPart || questionOrDone === "DONE" || questionOrDone.startsWith("DONE")) {
      return Response.json({ done: true, reflection });
    }

    // Find which signal this question covers (to know what nodeId to advance to)
    const nextMissing = BG_SIGNALS.find((s) => !answers[s.key]);
    return Response.json({
      done: false,
      reflection,
      question: questionOrDone,
      nodeId: nextMissing?.key ?? "bg5_turning",
    });
  } catch (err) {
    console.error("[bg-next-question] error:", err);
    // On error, fall back to static flow
    return Response.json({ done: false, question: null, nodeId: null });
  }
}
