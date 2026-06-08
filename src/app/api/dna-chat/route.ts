import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Streaming-only chat endpoint for recipe suggestions (always chat intent, never edit).
// Returns text/event-stream so the first tokens appear in ~300-500ms.
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { message, dnaProfile } = (await req.json()) as {
    message: string;
    dnaProfile: Record<string, unknown>;
  };

  const prompt = `You are Sorene, a warm and insightful entrepreneurship coach. A user is viewing their Entrepreneurial DNA profile and clicked a quick-explore button: "${message}".

Their DNA profile:
${JSON.stringify(dnaProfile, null, 2)}

Respond in 2-4 short paragraphs (2-4 sentences each), separated by blank lines.
Bold key phrases using **text** markdown to help the reader scan.
No bullet lists, no headers. Direct, warm, insightful. Max 180 words.`;

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Transfer-Encoding": "chunked",
    },
  });
}
