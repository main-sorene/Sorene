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

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userKey = user.email ?? user.uid;
    const creditCheck = await checkCredits(userKey);
    if (!creditCheck.ok) return NextResponse.json({ error: "Credit limit reached" }, { status: 402 });

    const { prompt, system, history, maxTokens, stream: wantStream } = (await req.json()) as {
      prompt: string;
      system?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      maxTokens?: number;
      stream?: boolean;
    };
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const prior = (history ?? []).map((m) => ({ role: m.role, content: m.content }));
    const resolvedMaxTokens = Math.min(maxTokens ?? 1500, 8000);
    const defaultSystem = "You are Sorene, a sharp, practical co-founder. Follow the user's instructions exactly. When asked for JSON, return only valid JSON with no markdown fences or preamble.";

    if (wantStream) {
      // Streaming mode — returns raw Anthropic SSE so the client can show posts as they arrive
      const anthropicStream = getClient().messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: resolvedMaxTokens,
        system: system || defaultSystem,
        messages: [...prior, { role: "user", content: prompt }],
      });

      const readable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let inputTokens = 0;
          let outputTokens = 0;
          for await (const event of anthropicStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
            if (event.type === "message_start") {
              inputTokens = event.message.usage?.input_tokens ?? 0;
            }
            if (event.type === "message_delta") {
              outputTokens = event.usage?.output_tokens ?? 0;
            }
          }
          controller.close();
          // Deduct credits after stream completes (best-effort)
          deductCredits(userKey, calculateCredits("claude-sonnet-4-6", inputTokens, outputTokens)).catch(() => {});
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" },
      });
    }

    // Non-streaming (original behaviour)
    const msg = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: resolvedMaxTokens,
      system: system || defaultSystem,
      messages: [...prior, { role: "user", content: prompt }],
    });

    await deductCredits(userKey, calculateCredits("claude-sonnet-4-6", msg.usage.input_tokens, msg.usage.output_tokens));
    const block = msg.content[0];
    const reply = block && block.type === "text" ? block.text.trim() : "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[execution-assist] error:", error);
    return NextResponse.json({ error: "Failed to generate." }, { status: 500 });
  }
}
