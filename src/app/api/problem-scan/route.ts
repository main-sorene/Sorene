import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { ProblemScanReport, ProblemOpportunity } from "@/types/problemScan";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene's Problem Scan Engine. You autonomously research real pain signals from online communities and match them to business opportunities aligned with the user's professional DNA.

Your job:
1. Use the web_search tool to scan Reddit, Quora, Twitter/X, Product Hunt, and App Store reviews for real complaints, frustrations, and unmet needs relevant to the user's domain and skills.
2. After searching, extract the top pain signals and score each:
   - Pain intensity: 1-5
   - Frequency: 1-5
   - Market gap: 1-5
   - DNA match: 1-5
   - Qualify if total >= 14
3. For each qualifying signal, generate a concrete business idea aligned to the user's background.
4. Return the top 5 ranked opportunities as JSON.

Output ONLY valid JSON after your searches. No markdown, no prose, no code fences.

SCHEMA:
{
  "opportunities": [/* exactly 5, ranked by confidence descending */]
}

Each opportunity:
{
  "id": string,
  "title": string,
  "one_line": string,
  "problem": string,
  "who_suffers": string,
  "evidence": string,
  "business_idea": string,
  "revenue_model": string,
  "mvp_steps": string,
  "why_fits_you": string,
  "confidence": number
}

RULES:
- Base evidence on actual search results
- Personalise why_fits_you to this specific user's DNA scores and background
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

Search for real pain signals online that this person is uniquely positioned to solve. Use web_search to scan Reddit, Quora, X, and Product Hunt. Then output the top 5 business opportunities as JSON only.`;
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

    // web_search is a server-side tool — Anthropic executes searches automatically.
    // We run a multi-turn loop: after each response, if stop_reason is "end_turn",
    // the model has finished. If it's "tool_use" with web_search blocks, those were
    // already executed server-side; we just continue the conversation.
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    let finalText = "";
    let iterations = 0;
    const MAX_ITERATIONS = 8;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: "web_search",
            type: "web_search_20250305",
          } as unknown as Anthropic.Tool,
        ],
        messages,
      });

      // Capture any text blocks
      for (const block of response.content) {
        if (block.type === "text") {
          finalText = block.text;
        }
      }

      if (response.stop_reason === "end_turn") break;

      // For tool_use stop: web_search results are already embedded in response.content
      // as server_tool_use blocks. Continue the conversation by appending the assistant
      // turn — no need to send fake tool_results back.
      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content });
        // Continue — next call will have access to search results in context
        continue;
      }

      break;
    }

    if (!finalText) {
      return new Response(JSON.stringify({ error: "No response generated" }), { status: 500 });
    }

    const jsonStart = finalText.indexOf("{");
    const jsonEnd = finalText.lastIndexOf("}");
    const raw = jsonStart !== -1 && jsonEnd > jsonStart
      ? finalText.slice(jsonStart, jsonEnd + 1)
      : finalText.trim();

    let report: ProblemScanReport;
    try {
      const parsed = JSON.parse(raw) as { opportunities: ProblemOpportunity[] };
      report = { ...parsed, generated_at: new Date().toISOString() };
    } catch {
      console.error("Problem scan JSON parse error. Raw:", raw.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse report" }), { status: 500 });
    }

    return new Response(JSON.stringify({ report }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Problem scan API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
