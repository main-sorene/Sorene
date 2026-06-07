import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { MIEReport } from "@/types/mie";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_LIVE = `You are Sorene's Market Intelligence Engine. Research live market trends and surface personalised signals and business opportunities for a specific user — focused on niches with real demand but thin or weak supply.

STEP 1 — DEMAND SEARCH (max 3 searches): Search current trends, complaints, and workarounds relevant to the user's domain.
STEP 2 — SUPPLY CHECK (max 1 search per top candidate, max 5 total): Classify supply as Low/Medium/High.
STEP 3 — SYNTHESISE into JSON personalised to this user's DNA.

Total search budget: max 8 searches. Output ONLY valid JSON after searching. No markdown, no prose.

${SCHEMA_BLOCK()}

RULES:
- Personalise EVERYTHING to the user's DNA scores, skills, and background
- dna_fit_score: skill match (25%) + capital fit (20%) + lifestyle fit (20%) + values alignment (20%) + market timing (15%)
- Prioritise LOW and MEDIUM supply opportunities
- All text fields: max 3 sentences, use **bold** on the most important 2-4 words per field
- No hype words: no "game-changing", "revolutionary", "disruptive"
- Output ONLY the JSON object after searching.`;

const SYSTEM_PROMPT_FALLBACK = `You are Sorene's Market Intelligence Engine. Analyse a user's professional DNA and surface personalised market signals and business opportunities — focused on niches with real demand but thin or weak supply.

Output ONLY valid JSON — no markdown, no prose, no code fences.

${SCHEMA_BLOCK()}

RULES:
- Personalise EVERYTHING to the user's DNA scores, skills, background, and constraints
- dna_fit_score: skill match (25%) + capital fit (20%) + lifestyle fit (20%) + values alignment (20%) + market timing (15%)
- Prioritise Low or Medium supply opportunities
- All text fields: max 3 sentences, use **bold** on the most important 2-4 words per field
- No hype words
- Output ONLY the JSON object.`;

function SCHEMA_BLOCK() {
  return `SCHEMA:
{
  "rising_signals": [/* exactly 3 */],
  "falling_signals": [/* exactly 3 */],
  "opportunities": [/* exactly 3, sorted by dna_fit_score descending */],
  "horizon_signals": [/* exactly 2 */]
}

Each rising/falling signal: { "title": string, "description": string, "category": string, "velocity": "V2"|"V3", "confidence": "Medium"|"High"|"Very High", "relevance_to_user": string, "supply_level": "Low"|"Medium"|"High", "why_underserved": string }

Each opportunity: { "id": string, "title": string, "one_line": string, "description": string, "dna_fit_score": number, "fit_explanation": string, "velocity_tier": "V1"|"V2"|"V3", "supply_level": "Low"|"Medium"|"High", "competitor_count": number, "gap_description": string, "startup_cost": "Low"|"Medium"|"High", "startup_cost_range": string, "time_to_revenue": string, "first_10_customers": string, "window_risk": string, "underlying_signal": string }

Each horizon signal: { "title": string, "description": string, "horizon": string, "supply_level": "Low"|"Medium"|"High" }`;
}

function buildUserMessage(firstName: string, dnaScores: Record<string, unknown>, rawAnswers: Record<string, string>, cvSummary?: string, withSearch = true): string {
  const cvBlock = cvSummary?.trim() ? `\n\nCV / Portfolio Summary:\n${cvSummary.trim()}` : "";
  const answersBlock = Object.entries(rawAnswers).filter(([, v]) => v?.trim()).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  const task = withSearch
    ? "Search for live market trends relevant to this person's domain and skills. Prioritise niches with strong demand but low or medium supply. Output only the JSON."
    : "Generate a personalised Market Intelligence Report for this user with exactly 3 opportunities. Prioritise niches with strong demand but low or medium supply. Return only the JSON.";

  return `User: ${firstName}\n\nDNA Scores:\n${JSON.stringify(dnaScores, null, 2)}\n\nAssessment Answers:\n${answersBlock || "(none provided)"}${cvBlock}\n\n${task}`;
}

async function generateWithSearch(userMessage: string): Promise<string> {
  const webSearchTool: Anthropic.Messages.WebSearchTool20250305 = { name: "web_search", type: "web_search_20250305" };
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];
  let finalText = "";
  let iterations = 0;

  while (iterations < 6) {
    iterations++;
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8096,
      system: SYSTEM_PROMPT_LIVE,
      tools: [webSearchTool],
      messages,
    });

    for (const block of response.content) {
      if (block.type === "text") finalText = block.text;
    }

    if (response.stop_reason === "end_turn") break;
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: [{ type: "text", text: "Continue." }] });
      continue;
    }
    break;
  }

  return finalText;
}

async function generateFallback(userMessage: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: SYSTEM_PROMPT_FALLBACK,
    messages: [{ role: "user", content: userMessage }, { role: "assistant", content: "{" }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return "{" + text;
}

function parseReport(text: string): MIEReport {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const raw = jsonStart !== -1 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text.trim();
  const parsed = JSON.parse(raw);
  return { ...parsed, generated_at: new Date().toISOString() };
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await req.json() as { firstName: string; dnaScores: Record<string, unknown>; rawAnswers: Record<string, string>; cvSummary?: string };
    const { firstName, dnaScores, rawAnswers, cvSummary } = body;

    let report: MIEReport | null = null;

    try {
      const text = await generateWithSearch(buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, true));
      if (text) report = parseReport(text);
    } catch (searchErr) {
      console.warn("MIE web search failed, falling back:", searchErr);
    }

    if (!report) {
      const text = await generateFallback(buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, false));
      report = parseReport(text);
    }

    return new Response(JSON.stringify({ report }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Market Intelligence API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
