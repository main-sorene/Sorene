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
  "title": string,           // concise signal name
  "description": string,     // 2-3 sentences on what is shifting and why
  "category": string,        // one of: "Regulatory & Policy Shifts" | "Emerging Technology Signals" | "Consumer Behaviour Patterns" | "Startup & VC Activity" | "Labour Market Movements" | "Supply Chain Disruptions" | "Platform & Distribution Changes" | "Macro-economic Indicators"
  "velocity": "V2" | "V3",  // V2 = 4-12 weeks window, V3 = structural multi-year
  "confidence": "Medium" | "High" | "Very High",
  "relevance_to_user": string // 1-2 sentences directly connecting to this user's skills/background
}

Each opportunity:
{
  "id": string,              // slug like "opportunity-1"
  "title": string,           // clear business concept name
  "one_line": string,        // ≤12 words
  "description": string,     // 2-3 sentences explaining what the business does
  "dna_fit_score": number,   // integer 40–100
  "fit_explanation": string, // 2-3 sentences on WHY it fits this person's DNA scores
  "velocity_tier": "V1" | "V2" | "V3", // V1 = urgent act now, V2 = 4-12 weeks, V3 = multi-year
  "startup_cost": "Low" | "Medium" | "High",
  "startup_cost_range": string, // e.g. "$0–$500" or "$2k–$10k"
  "time_to_revenue": string, // e.g. "2–4 weeks"
  "first_10_customers": string, // concrete sentence on where to find first customers
  "window_risk": string,     // 1-2 sentences on what closes this window
  "underlying_signal": string // which rising signal does this opportunity derive from
}

Each horizon signal:
{
  "title": string,
  "description": string,     // 2-3 sentences on the structural shift
  "horizon": string          // e.g. "12–24 months" or "3–5 years"
}

IMPORTANT RULES:
- Personalise EVERYTHING to the specific user's DNA scores, skills, background, and constraints
- Do not produce generic advice. Every signal and opportunity must trace back to this user's actual profile
- The dna_fit_score must reflect real alignment: skill match (25%), capital fit (20%), lifestyle fit (20%), values alignment (20%), market timing (15%)
- Be specific: name actual industries, real roles, concrete first steps
- Avoid hype words: no "game-changing", "revolutionary", "disruptive potential"
- Rising signals = growing demand, emerging need, underserved market with real traction
- Falling signals = structural decline, automation, commoditisation, or regulatory pressure
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
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let report: MIEReport;
    try {
      const parsed = JSON.parse(raw);
      report = {
        ...parsed,
        generated_at: new Date().toISOString(),
      };
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
