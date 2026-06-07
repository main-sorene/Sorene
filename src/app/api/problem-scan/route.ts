import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { ProblemScanReport, ProblemOpportunity } from "@/types/problemScan";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_LIVE = `You are Sorene's Problem Scan Engine. Research real pain signals from online communities and match them to business opportunities aligned with the user's professional DNA — targeting problems where demand is real but existing solutions are absent, weak, or built for a different audience.

STEP 1 — DEMAND SCAN (max 3 searches): Search Reddit, Quora, Twitter/X, Product Hunt, and App Store reviews for real complaints and unmet needs relevant to the user's domain.
STEP 2 — SUPPLY CHECK (max 1 search per candidate, max 5 total): For each candidate, search "[problem] tool". Count credible solutions.
STEP 3 — SCORE each candidate: Pain intensity 1-5, Frequency 1-5, Market gap 1-5, DNA match 1-5. Qualify if total >= 14 AND market_gap >= 3.
STEP 4 — OUTPUT top 3 qualifying opportunities as JSON only.

Total search budget: max 8 searches. Output ONLY valid JSON after searching. No markdown, no prose.

${SCHEMA_BLOCK()}

RULES:
- Every opportunity must have market_gap_score >= 3
- All text fields: max 3 sentences, use **bold** on the most important 2-4 words per field
- Personalise why_fits_you to this user's DNA scores and background
- Output ONLY the JSON object after searching.`;

const SYSTEM_PROMPT_FALLBACK = `You are Sorene's Problem Scan Engine. Identify real business problems aligned with the user's professional DNA — targeting problems where demand is clear but existing solutions are absent, weak, or built for a different audience.

Output ONLY valid JSON — no markdown, no prose, no code fences.

${SCHEMA_BLOCK()}

RULES:
- Every opportunity must have market_gap_score >= 3
- All text fields: max 3 sentences, use **bold** on the most important 2-4 words per field
- Personalise why_fits_you to this user's DNA scores and background
- confidence is the total score out of 20
- Output ONLY the JSON object.`;

function SCHEMA_BLOCK() {
  return `SCHEMA:
{ "opportunities": [/* exactly 3, ranked by confidence descending */] }

Each opportunity: { "id": string, "title": string, "one_line": string, "problem": string, "who_suffers": string, "evidence": string, "existing_solutions": string, "competitor_count": number, "market_gap_score": number, "business_idea": string, "revenue_model": string, "mvp_steps": string, "why_fits_you": string, "confidence": number }`;
}

function buildUserMessage(firstName: string, dnaScores: Record<string, unknown>, rawAnswers: Record<string, string>, cvSummary?: string, withSearch = true): string {
  const cvBlock = cvSummary?.trim() ? `\n\nCV / Portfolio Summary:\n${cvSummary.trim()}` : "";
  const answersBlock = Object.entries(rawAnswers).filter(([, v]) => v?.trim()).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  const task = withSearch
    ? "Search for real pain signals online that this person is uniquely positioned to solve. Then output exactly 3 business opportunities as JSON only."
    : "Identify the top 3 business problems this person is uniquely positioned to solve, where demand is real but existing solutions are weak. Output only the JSON.";

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

function parseReport(text: string): ProblemScanReport {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const raw = jsonStart !== -1 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text.trim();
  const parsed = JSON.parse(raw) as { opportunities: ProblemOpportunity[] };
  return { ...parsed, generated_at: new Date().toISOString() };
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await req.json() as { firstName: string; dnaScores: Record<string, unknown>; rawAnswers: Record<string, string>; cvSummary?: string };
    const { firstName, dnaScores, rawAnswers, cvSummary } = body;

    let report: ProblemScanReport | null = null;

    try {
      const text = await generateWithSearch(buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, true));
      if (text) report = parseReport(text);
    } catch (searchErr) {
      console.warn("Problem scan web search failed, falling back:", searchErr);
    }

    if (!report) {
      const text = await generateFallback(buildUserMessage(firstName, dnaScores, rawAnswers, cvSummary, false));
      report = parseReport(text);
    }

    return new Response(JSON.stringify({ report }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Problem scan API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
