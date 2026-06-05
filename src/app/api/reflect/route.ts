import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { answer, signal, questionText, nextQuestion, nextChoices, forceLanguage, preferredLanguage, previousAnswers, cvSummary } =
      (await req.json()) as {
        answer: string;
        signal: string;
        questionText: string;
        nextQuestion?: string;
        nextChoices?: string[];
        forceLanguage?: string;
        preferredLanguage?: string;
        previousAnswers?: Record<string, string>;
        cvSummary?: string;
      };

    // Build context from what we know about the user so far
    const priorContext = (() => {
      const parts: string[] = [];
      if (cvSummary) parts.push(`Background from their CV: ${cvSummary}`);
      if (previousAnswers && Object.keys(previousAnswers).length > 0) {
        const answerLines = Object.entries(previousAnswers)
          .map(([key, val]) => `- ${key}: "${val}"`)
          .join("\n");
        parts.push(`Their previous answers in this assessment:\n${answerLines}`);
      }
      return parts.length > 0 ? parts.join("\n\n") : "";
    })();

    const hasNextQuestion = nextQuestion && nextQuestion.trim().length > 0;
    const hasChoices = Array.isArray(nextChoices) && nextChoices.length > 0;
    const choicesBlock = hasChoices
      ? nextChoices!.map((c, i) => `${i + 1}. ${c}`).join("\n")
      : "";

    // Translation-only mode: skip reflection, just translate nextQuestion (+ choices)
    if (forceLanguage && hasNextQuestion) {
      const prompt = hasChoices
        ? `Translate into ${forceLanguage}. Preserve formatting, line breaks, and bullet points. Output exactly two parts separated by a single line "---CHOICES---".

Part 1 — Translated question:
"""${nextQuestion}"""

Part 2 — Translated choices (one per line, in the same order, no numbering):
${choicesBlock}

Output only the translated question, then the separator line "---CHOICES---", then each translated choice on its own line.`
        : `Translate the following text into ${forceLanguage}. Preserve all formatting, line breaks, and bullet points. Output only the translated text, nothing else.\n\n"""${nextQuestion}"""`;

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content[0];
      const raw = block && block.type === "text" ? block.text.trim() : "";
      if (hasChoices) {
        const [qPart, cPart] = raw.split("---CHOICES---");
        const translatedQuestion = (qPart || "").trim() || nextQuestion;
        const translatedChoices = (cPart || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        return Response.json({ reflection: "", translatedQuestion, translatedChoices });
      }
      return Response.json({
        reflection: "",
        translatedQuestion: raw || nextQuestion,
        translatedChoices: [],
      });
    }

    const languageContext = preferredLanguage
      ? `The user has been communicating in ${preferredLanguage} in this session. Use their CURRENT message to determine the language. If their current message is in English, respond in English. If their current message is in ${preferredLanguage}, respond in ${preferredLanguage}. Always follow the language of the CURRENT message.`
      : `Detect the language the user wrote in based on their current message.`;

    const prompt = hasNextQuestion
      ? `You are Sorene — a direct, warm entrepreneurship coach who truly sees people. The user is going through an assessment and just answered a question.

${priorContext ? `What you already know about this person:\n${priorContext}\n` : ""}
Signal being measured: ${signal}
Their answer: "${answer}"
Next question to ask (in English): """${nextQuestion}"""${
          hasChoices
            ? `\nMultiple-choice options to translate (one per line, in order):\n${choicesBlock}`
            : ""
        }

${languageContext} Your output must have exactly ${hasChoices ? "four" : "three"} parts separated by blank lines:

Part 1 — The language name you will respond in (e.g. "English", "Vietnamese", "Spanish"). One word or two words only.

Part 2 — ONE short sentence (max 20 words) in that language that:
- Connects their answer to a deeper pattern you've noticed from their background or previous answers
- Shows you genuinely understand something about who they are — name specific details from their CV or prior answers when relevant
- Feels like a perceptive friend noticing something they might not have seen about themselves
- If they mention struggle, honor it — don't rush past it
- If you see a contradiction or tension between answers, gently name it
- Never starts with "I see", "Great", "Thanks", "Got it", "Interesting"
- No punctuation at the end except a period
- Use **bold** (markdown double asterisks) to highlight the single most important phrase — the specific energy, drive, or insight you're naming about them. Only bold one phrase per sentence, max 4 words.

Part 3 — The next question, translated/adapted into that language. Preserve the full meaning and tone. Keep all line breaks and bullet points intact. If responding in English, output the original question unchanged.${
          hasChoices
            ? `

Part 4 — The multiple-choice options translated into that language, one per line, in the same order, no numbering or bullets. If responding in English, output the original choices unchanged.`
            : ""
        }

Output only these parts separated by blank lines. No labels, no extra text.`
      : `You are Sorene — a direct, warm entrepreneurship coach who truly sees people. The user just answered the final assessment question.

${priorContext ? `What you know about this person:\n${priorContext}\n` : ""}
Signal being measured: ${signal}
Their answer: "${answer}"

${languageContext} Respond in that same language.

Write ONE short sentence (max 20 words) that:
- Connects their answer to a deeper pattern you've noticed across their journey — reference specific things they've shared
- Feels like someone who has been truly listening and sees them clearly
- If you see a thread connecting multiple answers, name it
- Never starts with "I see", "Great", "Thanks", "Got it", "Interesting"
- No punctuation at the end except a period

Output only that one sentence. Nothing else.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: hasNextQuestion ? (hasChoices ? 700 : 400) : 80,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";

    if (!hasNextQuestion) {
      return Response.json({
        reflection: raw,
        translatedQuestion: "",
        translatedChoices: [],
        detectedLanguage: "",
      });
    }

    const parts = raw.split(/\n\n+/);
    if (parts.length < 3) {
      const reflection = parts[0]?.trim() ?? "";
      const translatedQuestion = parts[1]?.trim() ?? "";
      return Response.json({
        reflection,
        translatedQuestion,
        translatedChoices: [],
        detectedLanguage: "",
      });
    }
    const detectedLanguage = parts[0].trim();
    const reflection = parts[1].trim();

    let translatedQuestion: string;
    let translatedChoices: string[] = [];
    if (hasChoices && parts.length >= 4) {
      translatedQuestion = parts.slice(2, parts.length - 1).join("\n\n").trim();
      const choicesPart = parts[parts.length - 1];
      translatedChoices = choicesPart
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      // Sanity check: if count mismatch, fall back to English choices
      if (translatedChoices.length !== nextChoices!.length) {
        translatedChoices = [];
      }
    } else {
      translatedQuestion = parts.slice(2).join("\n\n").trim();
    }

    return Response.json({
      reflection,
      translatedQuestion,
      translatedChoices,
      detectedLanguage,
    });
  } catch (err) {
    console.error("[reflect] error:", err);
    return Response.json({
      reflection: "",
      translatedQuestion: "",
      translatedChoices: [],
      detectedLanguage: "",
    });
  }
}
