import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import type { ProblemScanReport, ProblemOpportunity } from "@/types/problemScan";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sorene's Problem Scan Engine. You autonomously research real pain signals from online communities and match them to business opportunities aligned with the user's professional DNA.

Your job:
1. Use the web_search tool to scan Reddit, Quora, Twitter/X, Facebook Groups, Product Hunt, App Store reviews, and LLM communities for real complaints, frustrations, and unmet needs relevant to the user's domain and skills.
2. Extract pain signals and score each one:
   - Pain intensity: 1-5 (how severe is the suffering)
   - Frequency: 1-5 (how often it appears)
   - Market gap: 1-5 (no good existing solution)
   - DNA match: 1-5 (how well this person can solve it)
   - Qualify if total ≥ 14
3. For each qualifying signal, generate a concrete business idea aligned to the user's background.
4. Return the top 5 ranked opportunities.

After searching, output ONLY valid JSON — no markdown, no prose, no code fences.

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
- Base everything on actual search results — cite real platforms and community types
- Personalise why_fits_you to this specific user's skills, archetype, and DNA scores
- Be concrete: name specific communities, pain points, and first steps
- No hype words. Output ONLY the JSON object.`;

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

Search for real pain signals online that this person is uniquely positioned to solve, then generate a ranked list of the top 5 business opportunities. Use web_search to scan multiple channels. Return only the JSON.`;
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

    // Agentic loop with web_search tool
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    let finalText = "";
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: "web_search",
            type: "web_search_20250305" as never,
          },
        ],
        messages,
      });

      // Collect any text content
      for (const block of response.content) {
        if (block.type === "text") {
          finalText = block.text;
        }
      }

      // If end_turn or no tool use, we're done
      if (response.stop_reason === "end_turn") break;

      // Handle tool_use blocks
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      if (toolUseBlocks.length === 0) break;

      // Add assistant message
      messages.push({ role: "assistant", content: response.content });

      // Add tool results (web_search results are provided by Anthropic natively)
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => {
        if (block.type !== "tool_use") throw new Error("unexpected");
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Search completed.",
        };
      });

      messages.push({ role: "user", content: toolResults });
    }

    // Parse JSON from final text
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
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
