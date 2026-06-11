import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DirectionEligibility } from "@/lib/dnaEngine";
import { maskPii, maskAnswers, maskScores, sanitizeName } from "@/lib/aiSafety";
import { verifyAuth, adminGetUserProfile, adminSaveUserProfile } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const systemPrompt = `You are Sorene — a personalized entrepreneurship navigator. Your voice is confident, grounded, and honest. You never use hype, emojis, or motivational platitudes. You speak directly and specifically.

You are writing the Direction output for a user who has just completed their DNA Assessment. The deterministic engine has already selected a structural model. Your job is to write the 7-step Direction output in a natural, conversational tone — as if Sorene is speaking directly to this person.

CRITICAL RULES:
- No bullet-point lists anywhere in the output
- No headers or markdown formatting
- Write in flowing paragraphs, as if speaking
- Every claim must trace back to something the user actually said or a score the engine produced
- Do not invent traits, ambitions, or motivations not present in the data
- One business direction only — never offer alternatives or say "another option would be"
- The safe activation step must be small, reversible, and require no capital or job change
- Forbidden phrases: "unleash your potential", "game-changer", "you've got this", "I understand", "your journey starts here", "level up"
- Tone: specific where coaching apps are vague. Quiet where productivity apps are loud.`;

function buildUserMessage(
  eligibility: DirectionEligibility,
  firstName: string,
  rawAnswers: Record<string, string>,
  cvSummary?: string,
): string {
  let cvBlock = "";
  if (cvSummary && cvSummary.trim()) {
    cvBlock = `\n\nBackground context (from their CV/portfolio):\n${cvSummary.trim()}\n\nWeave 1-2 specific references to their actual background (years, fields, role transitions) where natural — especially in the Understanding Reflection and Fit Justification. Do not list it back to them; integrate it.`;
  } else {
    // No CV — synthesize background from the 5 background questions they answered
    const bg1 = rawAnswers["bg1_history"];
    const bg2 = rawAnswers["bg2_skills"];
    const bg3 = rawAnswers["bg3_pattern"];
    const bg4 = rawAnswers["bg4_direction"];
    const bg5 = rawAnswers["bg5_turning"];
    const hasBg = bg1 || bg2 || bg3 || bg4 || bg5;
    if (hasBg) {
      const lines = [
        bg1 ? `- Current / most recent role: ${bg1}` : "",
        bg2 ? `- Years of experience and fields: ${bg2}` : "",
        bg3 ? `- Core expertise (what they're known for): ${bg3}` : "",
        bg4 ? `- Key skills and tools: ${bg4}` : "",
        bg5 ? `- Career arc: ${bg5}` : "",
      ].filter(Boolean).join("\n");
      cvBlock = `\n\nBackground context (from their own words — they did not share a CV):\n${lines}\n\nWeave 1-2 specific references to their actual history (real roles, real skills, real shifts) where natural — especially in the Understanding Reflection and Fit Justification. Do not list it back to them; integrate it.`;
    }
  }

  if (eligibility.eligible === false) {
    const { reason, scores } = eligibility;
    return `The user's name is ${firstName}.${cvBlock}

The direction engine has determined this user should receive a "Strengthen First" path, not a business direction.

Reason: ${reason}

DNA context:
- Energy source: ${scores.energy_source}
- Energy drains: ${scores.energy_drains}
- Why they left / are leaving: ${scores.quit_reason || "not provided"}
- Readiness: ${rawAnswers["q11_readiness"] || ""}
- Constraints: ${rawAnswers["q4_time"] || ""} / ${rawAnswers["q5_finance"] || ""}

Write the Strengthen First response following the 7-step protocol:
1. Reflect how they operate (motivations, energy, constraints) — 2-3 sentences
2. Name their functional positioning honestly
3. Explain why this is not the right moment for a business direction
4. Give 2-3 concrete stabilisation steps (skill consolidation, energy recovery, or identity clarification)
5. Name what they should strengthen specifically
6. Give one safe, small action for this week
7. End with what unlocks their next conversation with Sorene

Keep it under 400 words. Write as Sorene speaking directly to ${firstName}.`;
  }

  const { model, scores } = eligibility;
  return `The user's name is ${firstName}.${cvBlock}

The direction engine has selected: ${model}

DNA scores:
- Risk score: ${scores.risk_score}/10
- Uncertainty tolerance: ${scores.uncertainty_score}/10
- Energy stability: ${scores.energy_stability_score}/10
- Constraint level: ${scores.constraint_score}/10 (higher = more capacity)
- Readiness: ${scores.readiness_score}/10
- Structure preference: ${scores.structure_score}/10 (higher = more independent/solo)

What they said:
- What energizes them: ${scores.energy_source}
- What drains them: ${scores.energy_drains}
- Why they left / are leaving their last role: ${scores.quit_reason || "not provided"}
- Value trade-off they chose: ${scores.non_negotiable}
- What success feels like to them: ${scores.success_feeling}
- Motivation driver: ${scores.motivation_driver}
- Raw answers to key questions: q7=${rawAnswers["q7_uncertainty"] || ""}, q8=${rawAnswers["q8_workmode"] || ""}, q11=${rawAnswers["q11_readiness"] || ""}

NEGATIVE FILTER — NON-NEGOTIABLE:
The elements in "What drains them" and "Why they left" represent what this person is actively running away from. Any direction you suggest MUST NOT reproduce these conditions. If the quit reason or drain pattern names specific environments, dynamics, or task types (e.g. "constant reporting to management", "open-plan office politics", "reactive support work"), your suggested direction must structurally exclude them — not merely avoid mentioning them. If the selected model would naturally involve those elements, explain explicitly in the Fit Justification how this specific direction is architected to avoid them. Skill match alone is never sufficient justification if those skills were exercised in a context the person is fleeing.

Write the Direction output following the 7-step protocol:
1. Understanding Reflection (2-3 sentences): reflect how they operate — their energy, risk profile, constraints. Make them feel seen. Reference what they actually said.
2. Functional Positioning (1-2 sentences): define their operational role. Example: "You function best as a low-volatility independent specialist." Not a personality label — an operational description.
3. Structural Model (1 sentence): name the selected model and why it fits their scores.
4. One Business Direction (2-3 sentences): one specific, concrete direction within the ${model} model. Name it clearly. Do not hedge with "perhaps" or "you might consider."
5. Fit Justification (2-3 sentences): explain why this fits — reference their motivation, energy pattern, risk tolerance, and constraints specifically.
6. Execution Frictions (1-2 sentences): name 1-2 likely friction points based on their profile. Honest, not discouraging.
7. Safe Activation Step (2-3 sentences): one small, reversible action. Specific to their direction. No quitting jobs, no investment, no public identity leap. End with what this action will tell them.

Keep the total response under 500 words. Write as Sorene speaking directly to ${firstName}.`;
}

export async function POST(req: NextRequest) {
  const authedUser = await verifyAuth(req);
  if (!authedUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userKey = authedUser.email ?? authedUser.uid;
  const creditCheck = await checkCredits(userKey);
  if (!creditCheck.ok) {
    return new Response(JSON.stringify({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }), { status: 402 });
  }

  try {
    const body = await req.json() as {
      eligibility: DirectionEligibility;
      firstName: string;
      rawAnswers: Record<string, string>;
      cvSummary?: string;
    };

    const { eligibility, firstName: rawFirstName, rawAnswers, cvSummary } = body;
    const firstName = sanitizeName(rawFirstName);
    const safeAnswers = maskAnswers(rawAnswers);
    const safeCvSummary = cvSummary ? maskPii(cvSummary) : undefined;
    const safeEligibility = { ...eligibility, scores: maskScores(eligibility.scores) };
    const userMessage = buildUserMessage(safeEligibility, firstName, safeAnswers, safeCvSummary);

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const scores = safeEligibility.scores;

    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            fullText += chunk.delta.text;
          }
        }
        // Deduct after stream completes, before closing so the write finishes
        // while the serverless function is still alive
        const final = await stream.finalMessage();
        await deductCredits(userKey, calculateCredits("claude-sonnet-4-6", final.usage.input_tokens, final.usage.output_tokens));
        controller.close();

        // Fire-and-forget: extract directionRationale, value_signature, hidden_strength
        (async () => {
          // Extract directionRationale from the streamed text
          let directionRationale = "";
          const triggerPhrases = ["fits you", "because your", "your energy", "this direction"];
          let found = false;
          for (const trigger of triggerPhrases) {
            const idx = fullText.toLowerCase().indexOf(trigger);
            if (idx !== -1) {
              // Take up to 2 sentences starting from this trigger
              const segment = fullText.slice(idx);
              const sentenceMatches = segment.match(/[^.!?]*[.!?]/g);
              if (sentenceMatches) {
                directionRationale = sentenceMatches.slice(0, 2).join(" ").trim();
                found = true;
                break;
              }
            }
          }
          if (!found) {
            // Fall back to 3rd paragraph
            const paragraphs = fullText.split(/\n\n+/).filter((p) => p.trim().length > 0);
            directionRationale = paragraphs[2] ?? paragraphs[0] ?? "";
          }
          if (directionRationale.length > 200) {
            directionRationale = directionRationale.slice(0, 197) + "...";
          }

          // Haiku call for value_signature and hidden_strength
          const haiku = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{
              role: "user",
              content: `Based on this person's DNA profile, generate two short coaching identity labels.

Energy source: ${scores.energy_source}
Non-negotiable: ${scores.non_negotiable}
Strengths: ${scores.motivation_driver}
Hidden pattern: ${scores.energy_drains} (what they've been running from)
Strengths summary: ${scores.strengths_summary}

Generate exactly 2 outputs:
VALUE_SIGNATURE: [3-7 word phrase: what this person creates / stands for when at their best. Not a job title. Examples: "Clarity That Moves People", "Systems That Free Others", "Work That Heals Community"]
HIDDEN_STRENGTH: [3-7 word phrase: the undervalued strength they don't name. Often the inverse of what drains them. Examples: "Structural Calm Under Ambiguity", "Pattern Recognition Through People", "Depth That Others Rush Past"]

No explanation. Just the two labeled outputs.`,
            }],
          });

          const haikuText = haiku.content[0]?.type === "text" ? haiku.content[0].text : "";
          const vsMatch = haikuText.match(/VALUE_SIGNATURE:\s*(.+)/i);
          const hsMatch = haikuText.match(/HIDDEN_STRENGTH:\s*(.+)/i);
          const value_signature = vsMatch?.[1]?.trim() ?? "";
          const hidden_strength = hsMatch?.[1]?.trim() ?? "";

          // Merge with existing dnaScores and save
          const existingProfile = await adminGetUserProfile(authedUser.uid);
          const existingScores = existingProfile?.dnaScores ?? {};
          await adminSaveUserProfile(authedUser.uid, {
            directionRationale,
            dnaScores: { ...existingScores, value_signature, hidden_strength },
          });
        })().catch((err) => console.error("[direction] post-stream save failed:", err));
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Direction API error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
