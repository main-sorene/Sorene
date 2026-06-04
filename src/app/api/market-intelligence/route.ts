import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { MIEReport } from "@/types/mie";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const systemPrompt = `You are Sorene's Market Intelligence Engine. Your job is to analyse a user's professional DNA and surface personalised market signals and business opportunities.

You must output ONLY valid JSON — no markdown, no prose, no code fences. The JSON must exactly match the schema below.

SCHEMA:
{
  "rising_signals": [/* exactly 3 */],
  "falling_signals": [/* exactly 3 */],
  "opportunities": [/* exactly 5, sorted by dna_fit_score descending */],
  "horizon_signals": [/* exactly 2 */]
}

Each rising/falling signal:
{
  "title": string,
  "description": string,
  "category": string,
  "velocity": "V2" | "V3",
  "confidence": "Medium" | "High" | "Very High",
  "relevance_to_user": string
}

Each opportunity:
{
  "id": string,
  "title": string,
  "one_line": string,
  "description": string,
  "dna_fit_score": number,
  "fit_explanation": string,
  "velocity_tier": "V1" | "V2" | "V3",
  "startup_cost": "Low" | "Medium" | "High",
  "startup_cost_range": string,
  "time_to_revenue": string,
  "first_10_customers": string,
  "window_risk": string,
  "underlying_signal": string
}

Each horizon signal:
{
  "title": string,
  "description": string,
  "horizon": string
}

IMPORTANT RULES:
- Personalise EVERYTHING to the specific user's DNA scores, skills, background, and constraints
- The dna_fit_score must reflect real alignment: skill match (25%), capital fit (20%), lifestyle fit (20%), values alignment (20%), market timing (15%)
- Be specific: name actual industries, real roles, concrete first steps
- Avoid hype words: no "game-changing", "revolutionary", "disruptive potential"
- Output ONLY the JSON object. Nothing else.`;

function buildUserMessage(
  firstName: string,
  dnaScores: Record<string, unknown>,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
): string {
  const cvBlock = cvSummary?.trim()
    ? `\n\nCV / Portfolio Summary:\n${cvSummary.trim()}`
    : "";

  const answersBlock = Object.entries(rawAnswers)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `User: ${firstName}

DNA Scores:
${JSON.stringify(dnaScores, null, 2)}

Assessment Answers:
${answersBlock || "(none provided)"}${cvBlock}

Generate a personalised Market Intelligence Report for this specific user. Return only the JSON.`;
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json() as {
      firstName: string;
      dnaScores: Record<string, unknown>;
      rawAnswers: Record<string, string>;
      cvSummary?: string;
    };

    const { firstName, dnaScores, rawAnswers, cvSummary } = body;
    const userMessage = buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      // Prefill forces the response to begin with "{" — guarantees pure JSON output
      messages: [
        { role: "user", content: userMessage },
        { role: "assistant", content: "{" },
      ],
    });

    // Prepend the "{" we used as prefill, then extract the outermost JSON object
    const rawText = "{" + (message.content[0].type === "text" ? message.content[0].text : "");
    const jsonStart = rawText.indexOf("{");
    const jsonEnd = rawText.lastIndexOf("}");
    const raw = jsonStart !== -1 && jsonEnd > jsonStart
      ? rawText.slice(jsonStart, jsonEnd + 1)
      : rawText.trim();

    let report: MIEReport;
    try {
      const parsed = JSON.parse(raw);
      report = { ...parsed, generated_at: new Date().toISOString() };
    } catch {
      console.error("MIE JSON parse error. Raw:", raw.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse report" }), { status: 500 });
    }

    return new Response(JSON.stringify({ report }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Market Intelligence API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
