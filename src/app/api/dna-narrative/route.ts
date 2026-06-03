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
    const { answers, cvSummary } = (await req.json()) as {
      answers: Record<string, string>;
      cvSummary?: string;
    };

    const answersBlock = Object.entries(answers)
      .map(([k, v]) => `${k}: "${v}"`)
      .join("\n");

    const prompt = `You are Sorene, a warm and perceptive entrepreneurship coach. You've just finished a deep assessment with someone. Based on their answers below${cvSummary ? " and their background" : ""}, generate a rich DNA profile narrative.

${cvSummary ? `Their background:\n${cvSummary}\n\n` : ""}Their assessment answers:
${answersBlock}

Generate EXACTLY 7 sections, each separated by "---SECTION---". Each section has a TITLE line, then a blank line, then the content. The sections must be in this exact order:

1. core_dna_label — A 3-5 word identity that names their #1 entrepreneurial strength. This is the headline of their Entrepreneurial DNA — bold, specific, and ownable. Examples: "The Precision-Driven Builder", "The Deep-Work Founder", "The Mission-First Operator". Do NOT use generic words like "Visionary", "Leader", "Entrepreneur", "Creative". It must name the actual pattern you see in their answers.

2. your_core — First sentence: name the single strongest entrepreneurial signal you see across all their answers — the one thing that most defines how they're wired to build. Second sentence: connect it to something specific they said (quote or echo their exact words). Third sentence: name what this means for the kind of venture or role that will actually work for them.

2. what_drives_you — 2-3 sentences on their deepest motivation. What lights them up. What kind of success would actually satisfy them. Pull directly from their words — name the tension or longing they expressed.

3. how_you_work — 2-3 sentences on how they operate best. Their ideal environment, pace, and collaboration style. Be specific and human — avoid corporate words like "synergy" or "leverage".

4. risk_and_change — 2-3 sentences on their relationship with risk, uncertainty, and change. Name the specific trade-off they said matters most. Don't generalize — quote or echo their actual phrasing where it fits.

5. your_energy — 2-3 sentences on what gives them energy and what drains it. Be vivid and specific. The first sentence should feel like something only they could have said.

6. strengths_and_edges — 2-3 sentences on their real strengths (not generic ones) and what they genuinely won't compromise on. End with an honest observation about where they may hit limits.

Rules:
- Write in second person ("You", "Your")
- Be specific — name what they said, echo their language, name contradictions if you see them
- Warm but honest — this is a coach who sees them, not a cheerleader
- No bullet points, no headers within sections
- Each section: 2-3 sentences only
- No filler phrases like "It's clear that", "This shows", "As an entrepreneur"

Output format (use exactly these separators):
TITLE: core_dna_label

[3-5 words only]
---SECTION---
TITLE: your_core

[3 sentences]
---SECTION---
TITLE: what_drives_you

[2-3 sentences]
---SECTION---
TITLE: how_you_work

[2-3 sentences]
---SECTION---
TITLE: risk_and_change

[2-3 sentences]
---SECTION---
TITLE: your_energy

[2-3 sentences]
---SECTION---
TITLE: strengths_and_edges

[2-3 sentences]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1400,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";

    const sections = raw.split("---SECTION---").map((s) => s.trim()).filter(Boolean);

    const narrative: Record<string, string> = {};
    for (const section of sections) {
      const lines = section.split("\n");
      const titleLine = lines[0]?.match(/^TITLE:\s*(\S+)/);
      if (titleLine) {
        const key = titleLine[1].trim();
        const content = lines.slice(1).join("\n").trim();
        narrative[key] = content;
      }
    }

    return Response.json({ narrative });
  } catch (err) {
    console.error("[dna-narrative] error:", err);
    return Response.json({ narrative: {} });
  }
}
