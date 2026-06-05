import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DNA_FIELDS = [
  { key: "primary_motivation", label: "Primary Motivation" },
  { key: "collaboration_mode", label: "Collaboration Mode" },
  { key: "structure_preference", label: "Structure Preference" },
  { key: "ambiguity_tolerance", label: "Ambiguity Tolerance" },
  { key: "emotional_risk", label: "Emotional Risk" },
  { key: "financial_risk", label: "Financial Risk" },
  { key: "time_availability", label: "Time Availability" },
  { key: "readiness_label", label: "Readiness Label" },
  { key: "strength_patterns", label: "Strength Patterns" },
];

type EditResponse = {
  intent: "edit";
  field: string;
  fieldLabel: string;
  current: string;
  proposed: string;
  confirmMessage: string;
};

type ChatResponse = {
  intent: "chat";
  reply: string;
};

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCheck = await checkCredits(user.uid);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }, { status: 402 });
  }

  try {
    const { message, dnaProfile } = (await req.json()) as {
      message: string;
      dnaProfile: Record<string, unknown>;
    };

    const fieldsDescription = DNA_FIELDS.map(
      (f) => `- ${f.key} (label: "${f.label}"): current value = ${JSON.stringify(dnaProfile[f.key] ?? null)}`
    ).join("\n");

    const prompt = `You are Sorene, a warm and insightful entrepreneurship coach. A user is viewing their DNA profile and has sent you a message.

The user's current DNA profile fields:
${fieldsDescription}

User message: "${message}"

Your task:
1. Detect if the user wants to change, update, or edit any of the 9 DNA profile fields listed above.
2. If YES (edit intent detected):
   - Identify which field key they want to change (e.g. "collaboration_mode")
   - Identify the human label (e.g. "Collaboration Mode")
   - Identify the current value
   - Identify the proposed new value the user wants
   - Write a friendly confirmation question like "Should I update your Collaboration Mode from Small Team to Independent?"
3. If NO (just chatting, asking questions, or exploring):
   - Reply as Sorene in short paragraphs (2-4 sentences each), separated by blank lines.
   - Bold key phrases or terms using **text** markdown syntax to help the reader scan.
   - No bullet lists, no headers. Just short flowing paragraphs with strategic bold.

Respond ONLY with valid JSON in one of these two formats:
If edit intent: {"intent":"edit","field":"<field_key>","fieldLabel":"<human_label>","current":"<current_value>","proposed":"<proposed_value>","confirmMessage":"<confirmation_question>"}
If just chatting: {"intent":"chat","reply":"<your_reply>"}

Do not include markdown, code fences, or anything outside the JSON object.`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    void deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", msg.usage.input_tokens, msg.usage.output_tokens));

    const block = msg.content[0];
    let raw = block && block.type === "text" ? block.text.trim() : "{}";
    // Strip markdown code fences if Claude wraps the JSON
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: EditResponse | ChatResponse;
    try {
      parsed = JSON.parse(raw) as EditResponse | ChatResponse;
    } catch {
      parsed = { intent: "chat", reply: raw };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[dna-edit] Error:", error);
    return NextResponse.json(
      { intent: "chat", reply: "Sorry, I had trouble processing that. Please try again." },
      { status: 500 }
    );
  }
}
