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

7. primary_motivation_label — A 2-4 word evocative label for their primary motivation. Examples: "Creative Expression", "Purpose & Impact", "Craft & Mastery", "Freedom Through Work", "Building With Meaning". No verbs, no "I", not a sentence — just the label itself.

8. strength_patterns_labels — Exactly 4-5 distinct strength labels, comma-separated, each 2-5 words. These should read like beautiful, ownable strengths — specific to what this person actually said. Examples: "Systems Thinking", "Creative Depth", "Empathic Leadership", "Strategic Patience", "Execution Under Pressure". No raw quotes from the user. No generic words like "hardworking" or "motivated". Each label should feel like something this specific person would be proud to own.

9. what_drives_you_strengths — Exactly 3-4 motivation-related strength labels, comma-separated, each 2-5 words. These should reflect what specifically drives this person — their values, longing, or purpose signal. Examples: "Values-Led Ambition", "Meaning Over Metrics", "Sustainable Impact Drive", "Autonomy & Craft". No raw quotes. Beautiful and ownable.

10. how_you_work_strengths — Exactly 3-4 work-style strength labels, comma-separated, each 2-5 words. Reflect how this person actually operates — their collaboration style, pace, creative approach, or working environment. Examples: "Deep Focus Builder", "Intentional Collaborator", "Creative Problem Solver", "Trusted Circle Operator", "Pace-Aware Creator". No raw quotes. Specific and ownable.

11. risk_and_change_strengths — Exactly 3-4 risk-related strength labels, comma-separated, each 2-5 words. Reflect their specific relationship with risk, uncertainty, and change — not generic. Examples: "Calculated Risk Taker", "Grounded Under Pressure", "Clarity-Seeking Strategist", "Emotionally Honest Mover", "Deliberate Change Maker". No raw quotes. Ownable and honest.

12. success_vision_label — A beautiful 3-6 word phrase that captures what success truly means for this person, reworded from their raw answer into something aspirational and elegant. Examples: "Work That Restores & Sustains", "Creative Freedom With Income", "Building Something That Matters", "Stability Through Meaningful Craft". Not a quote — a distilled vision.

13. non_negotiable_label — A beautiful 3-6 word phrase that names what this person refuses to trade away, reworded from their raw answer. Examples: "Moral Integrity Over Revenue", "Wellbeing Above Output", "Autonomy at All Costs", "Creativity Without Compromise". Not a quote — a principled stance.

14. energy_source_label — A beautiful 2-5 word label that captures what gives this person energy, distilled from their answer. Examples: "Creative Craft & Making", "Solving Real Problems", "Building With Purpose", "Painting & Creative Flow". Not a raw quote — an elegant label.

15. energy_drain_label — A beautiful 2-5 word label naming what drains this person, distilled from their answer. Examples: "Political Toxicity", "Bureaucratic Friction", "Values Misalignment", "Chaotic Environments". Not a raw quote — a crisp label.

16. your_energy_strengths — Exactly 3-4 energy-related strength labels, comma-separated, each 2-5 words. Reflect what this person brings when energized — their creative output, focus quality, or impact style. Examples: "Creative Flow State", "Sustained Deep Work", "Craft-First Thinking", "Purpose-Driven Output". No raw quotes. Ownable and beautiful.

17. strengths_edges_strengths — Exactly 3-4 core strength labels, comma-separated, each 2-5 words. These are the real, specific strengths that show up across their entire profile — not generic. Examples: "Operational Creative Depth", "Values-Driven Execution", "Strategic Clarity Under Pressure", "Integrity-First Leadership". No raw quotes. These should feel like something only this person could own.

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

[2-3 sentences]
---SECTION---
TITLE: primary_motivation_label

[2-4 words only]
---SECTION---
TITLE: strength_patterns_labels

[4-5 labels, comma-separated]
---SECTION---
TITLE: what_drives_you_strengths

[3-4 labels, comma-separated]
---SECTION---
TITLE: how_you_work_strengths

[3-4 labels, comma-separated]
---SECTION---
TITLE: risk_and_change_strengths

[3-4 labels, comma-separated]
---SECTION---
TITLE: success_vision_label

[3-6 words only]
---SECTION---
TITLE: non_negotiable_label

[3-6 words only]
---SECTION---
TITLE: energy_source_label

[2-5 words only]
---SECTION---
TITLE: energy_drain_label

[2-5 words only]
---SECTION---
TITLE: your_energy_strengths

[3-4 labels, comma-separated]
---SECTION---
TITLE: strengths_edges_strengths

[3-4 labels, comma-separated]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4600,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";

    const sections = raw.split(/---SECTION---|---section---/).map((s) => s.trim()).filter(Boolean);

    const KNOWN_KEYS = new Set(["core_dna_label","your_core","what_drives_you","how_you_work","risk_and_change","your_energy","strengths_and_edges","primary_motivation_label","strength_patterns_labels","what_drives_you_strengths","how_you_work_strengths","risk_and_change_strengths","success_vision_label","non_negotiable_label","energy_source_label","energy_drain_label","your_energy_strengths","strengths_edges_strengths"]);
    const narrative: Record<string, string> = {};
    for (let si = 0; si < sections.length; si++) {
      const lines = sections[si].split("\n").filter(l => l.trim() !== "");
      let titleKey = "";
      let contentStartIdx = 0;
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const m = lines[i].match(/TITLE:\s*(.+)/i);
        if (m) {
          const val = m[1].trim();
          if (KNOWN_KEYS.has(val)) {
            titleKey = val;
          } else if (si === 0) {
            // Model used label text as title value — capture it directly
            narrative["core_dna_label"] = val;
            titleKey = "__skip__";
          } else {
            titleKey = val.split(/\s+/)[0].toLowerCase();
          }
          contentStartIdx = i + 1;
          break;
        }
      }
      if (titleKey && titleKey !== "__skip__") {
        narrative[titleKey] = lines.slice(contentStartIdx).join("\n").trim();
      }
    }

    return Response.json({ narrative });
  } catch (err) {
    console.error("[dna-narrative] error:", err);
    return Response.json({ narrative: {} });
  }
}
