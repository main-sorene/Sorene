import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { MIEReport } from "@/types/mie";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene's Market Intelligence Engine. Your job is to research live market trends and surface personalised signals and business opportunities for a specific user.

Your job:
1. Use the web_search tool to scan for current market trends, industry shifts, emerging tools, and demand signals relevant to the user's domain and skills. Search across news, Reddit, LinkedIn, Product Hunt, and industry publications.
2. After searching, synthesise the live data into a structured report personalised to this user's DNA profile.

Output ONLY valid JSON after searching. No markdown, no prose, no code fences.

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

RULES:
- Base signals on actual search results — cite real trends you found
- Personalise EVERYTHING to the specific user's DNA scores, skills, and background
- dna_fit_score: skill match (25%) + capital fit (20%) + lifestyle fit (20%) + values alignment (20%) + market timing (15%)
- Be specific: name actual industries, real roles, concrete first steps
- No hype words: no "game-changing", "revolutionary", "disruptive potential"
- Output ONLY the JSON object after searching. Nothing else.`;

function buildUserMessage(
  firstName: string,
  dnaScores: Record<string, unknown>,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
): string {
  const cvBlock = cvSummary?.trim() ? `\n\nCV / Portfolio Summary:\n${cvSummary.trim()}` : "";
  const answersBlock = Object.entries(rawAnswers)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `User: ${firstName}

DNA Scores:
${JSON.stringify(dnaScores, null, 2)}

Assessment Answers:
${answersBlock || "(none provided)"}${cvBlock}

Search for live market trends and signals relevant to this person's domain and skills. Then generate a personalised Market Intelligence Report. Output only the JSON.`;
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

    const webSearchTool: Anthropic.Messages.WebSearchTool20250305 = {
      name: "web_search",
      type: "web_search_20250305",
    };

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    let finalText = "";
    let iterations = 0;
    const MAX_ITERATIONS = 6;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        tools: [webSearchTool],
        messages,
      });

      for (const block of response.content) {
        if (block.type === "text") {
          finalText = block.text;
        }
      }

      if (response.stop_reason === "end_turn") break;

      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: [{ type: "text", text: "Continue." }] });
        continue;
      }

      break;
    }

    if (!finalText) {
      return new Response(JSON.stringify({ error: "No response generated" }), { status: 500 });
    }

    const jsonStart = finalText.indexOf("{");
    const jsonEnd = finalText.lastIndexOf("}");
    const raw =
      jsonStart !== -1 && jsonEnd > jsonStart
        ? finalText.slice(jsonStart, jsonEnd + 1)
        : finalText.trim();

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
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
