import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits } from "@/lib/credits";
import type { MIEReport } from "@/types/mie";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_LIVE = `You are Sorene's Market Intelligence Engine. Your job is to research live market trends and surface personalised signals and business opportunities for a specific user — focused on niches with real demand but thin or weak supply.

Your process (stay within the search budget below):

STEP 1 — DEMAND SEARCH (max 3 searches):
Search for current trends, demand signals, complaints, and workarounds relevant to the user's domain and skills. Search across news, Reddit, LinkedIn, Product Hunt, and industry publications. Look for repeated frustration patterns and "does anyone know a tool for X" signals.

STEP 2 — SUPPLY CHECK (max 1 search per top-5 candidate, max 5 searches total):
For each strong demand signal, search "[problem] tool" or "[problem] software". Classify supply as:
- LOW: fewer than 3 credible solutions, or only generic/expensive ones
- MEDIUM: 3–8 solutions but with clear gaps (price, niche, UX, audience)
- HIGH: well-served, multiple mature products, big incumbents present
Deprioritise HIGH supply opportunities.

STEP 3 — SYNTHESISE into the JSON report personalised to this user's DNA profile.

Total search budget: max 8 searches across all steps. Stop searching and synthesise once budget is reached.

Output ONLY valid JSON after searching. No markdown, no prose, no code fences.

${SCHEMA_BLOCK()}

RULES:
- Base signals on actual search results — cite real trends you found
- Personalise EVERYTHING to the specific user's DNA scores, skills, and background
- dna_fit_score: skill match (25%) + capital fit (20%) + lifestyle fit (20%) + values alignment (20%) + market timing (15%)
- Penalise HIGH supply opportunities in dna_fit_score even if skill match is strong
- Prioritise LOW and MEDIUM supply opportunities in ranking
- Be specific: name actual industries, real roles, real competitor names, concrete first steps
- No hype words: no "game-changing", "revolutionary", "disruptive potential"
- Output ONLY the JSON object after searching. Nothing else.`;

const SYSTEM_PROMPT_FALLBACK = `You are Sorene's Market Intelligence Engine. Your job is to analyse a user's professional DNA and surface personalised market signals and business opportunities — focused on niches with real demand but thin or weak supply.

You must output ONLY valid JSON — no markdown, no prose, no code fences. The JSON must exactly match the schema below.

${SCHEMA_BLOCK()}

RULES:
- Personalise EVERYTHING to the specific user's DNA scores, skills, background, and constraints
- dna_fit_score: skill match (25%) + capital fit (20%) + lifestyle fit (20%) + values alignment (20%) + market timing (15%)
- Prioritise opportunities where supply_level is Low or Medium — deprioritise well-saturated markets
- Penalise HIGH supply opportunities in dna_fit_score even if skill match is strong
- Be specific: name actual industries, real roles, real competitor names, concrete first steps
- No hype words: no "game-changing", "revolutionary", "disruptive potential"
- Output ONLY the JSON object. Nothing else.`;

function SCHEMA_BLOCK() {
  return `SCHEMA:
{
  "rising_signals": [/* exactly 3 */],
  "falling_signals": [/* exactly 3 */],
  "opportunities": [/* exactly 3, sorted by dna_fit_score descending */],
  "horizon_signals": [/* exactly 2 */]
}

Each rising/falling signal:
{
  "title": string,
  "description": string,
  "category": string,
  "velocity": "V2" | "V3",
  "confidence": "Medium" | "High" | "Very High",
  "relevance_to_user": string,
  "supply_level": "Low" | "Medium" | "High",
  "why_underserved": string
}

Each opportunity (all text fields: max 3 sentences, use **bold** on the most important 2–4 words per field to help users scan):
{
  "id": string,
  "title": string,
  "one_line": string,
  "description": string,
  "dna_fit_score": number,
  "fit_explanation": string,
  "velocity_tier": "V1" | "V2" | "V3",
  "supply_level": "Low" | "Medium" | "High",
  "competitor_count": number,
  "gap_description": string,
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
  "horizon": string,
  "supply_level": "Low" | "Medium" | "High"
}`;
}

function buildUserMessage(
  firstName: string,
  dnaScores: Record<string, unknown>,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
  withSearch = true,
): string {
  const cvBlock = cvSummary?.trim() ? `\n\nCV / Portfolio Summary:\n${cvSummary.trim()}` : "";
  const answersBlock = Object.entries(rawAnswers)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const task = withSearch
    ? "Search for live market trends and signals relevant to this person's domain and skills. Prioritise niches with strong demand but low or medium supply. Then generate a personalised Market Intelligence Report with exactly 3 opportunities. Output only the JSON."
    : "Generate a personalised Market Intelligence Report for this specific user with exactly 3 opportunities. Prioritise niches with strong demand but low or medium supply. Return only the JSON.";

  return `User: ${firstName}

DNA Scores:
${JSON.stringify(dnaScores, null, 2)}

Assessment Answers:
${answersBlock || "(none provided)"}${cvBlock}

${task}`;
}

async function generateWithSearch(userMessage: string): Promise<string> {
  const webSearchTool: Anthropic.Messages.WebSearchTool20250305 = {
    name: "web_search",
    type: "web_search_20250305",
  };

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
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: "{" },
    ],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return "{" + text;
}

function parseReport(text: string): MIEReport {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const raw =
    jsonStart !== -1 && jsonEnd > jsonStart
      ? text.slice(jsonStart, jsonEnd + 1)
      : text.trim();
  const parsed = JSON.parse(raw);
  return { ...parsed, generated_at: new Date().toISOString() };
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const userKey = authedUser.email ?? authedUser.uid;
  try {
    const creditCheck = await checkCredits(userKey);
    if (!creditCheck.ok) return new Response(JSON.stringify({ error: "Credit limit reached" }), { status: 402 });
  } catch (err) {
    console.error("[market-intelligence] credit check failed, allowing through:", err);
  }

  try {
    const body = await req.json() as {
      firstName: string;
      dnaScores: Record<string, unknown>;
      rawAnswers: Record<string, string>;
      cvSummary?: string;
    };

    const { firstName, dnaScores, rawAnswers, cvSummary } = body;

    let report: MIEReport | null = null;

    // Try live web search first; fall back to training-data generation on any error
    try {
      const userMessage = buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, true);
      const text = await generateWithSearch(userMessage);
      if (text) report = parseReport(text);
    } catch (searchErr) {
      console.warn("MIE web search failed, falling back to training data:", searchErr);
    }

    if (!report) {
      const userMessage = buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, false);
      const text = await generateFallback(userMessage);
      report = parseReport(text);
    }

    // Deduct a flat cost for this agentic Sonnet call (multi-turn web search)
    await deductCredits(userKey, 150);
    return new Response(JSON.stringify({ report }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Market Intelligence API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
