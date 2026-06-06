import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Lightweight, general-purpose assist endpoint for Execution Hub helpers
// (target customer profiles, opening scripts, etc). Unlike /api/direction-chat
// this does NOT inject the Direction Engine system prompt, so callers get back
// exactly what their own prompt asks for.
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creditCheck = await checkCredits(user.uid);
    if (!creditCheck.ok) return NextResponse.json({ error: "Credit limit reached" }, { status: 402 });

    const { prompt, system, history } = (await req.json()) as {
      prompt: string;
      system?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const prior = (history ?? []).map((m) => ({ role: m.role, content: m.content }));

    const msg = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: system || "You are Sorene, a sharp, practical co-founder. Follow the user's instructions exactly. When asked for JSON, return only valid JSON with no markdown fences or preamble.",
      messages: [...prior, { role: "user", content: prompt }],
    });

    void deductCredits(user.uid, calculateCredits("claude-sonnet-4-6", msg.usage.input_tokens, msg.usage.output_tokens));
    const block = msg.content[0];
    const reply = block && block.type === "text" ? block.text.trim() : "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[execution-assist] error:", error);
    return NextResponse.json({ error: "Failed to generate." }, { status: 500 });
  }
}
