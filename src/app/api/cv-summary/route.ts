import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB base64 limit

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `Extract the person's full name and write a brief background summary from the attached CV/resume.

Output in this exact format — the first line must be exactly as shown, then the summary:
NAMES:<first name>|<last name or empty>
<summary here>

Summary rules:
- 2-3 short paragraphs separated by double newlines, 2 sentences each max
- Second person, warm and direct ("You moved from...", "Your background spans...")
- Use **bold** for key titles, companies, skills, and transitions
- Specific: name real roles, sectors, years
- Never use "candidate" or "applicant", no bullet points`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCheck = await checkCredits(user.uid);
  if (!creditCheck.ok) {
    return Response.json({ error: "credits_exhausted", used: creditCheck.used, limit: creditCheck.limit }, { status: 402 });
  }

  try {
    const { fileBase64, mimeType } = (await req.json()) as {
      fileBase64?: string;
      mimeType?: string;
    };

    if (!fileBase64 || !mimeType) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    if (fileBase64.length > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");
    if (!isPdf && !isImage) {
      return Response.json({ error: "Only PDF and image files are supported" }, { status: 400 });
    }

    const docContent = isPdf
      ? {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: fileBase64 },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: fileBase64,
          },
        };

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: [docContent, { type: "text", text: PROMPT }] }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        const final = await stream.finalMessage();
        // Must await before close — serverless freezes once the response ends,
        // killing any fire-and-forget write.
        await deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", final.usage.input_tokens, final.usage.output_tokens));
        controller.close();
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    console.error("[cv-summary] error:", error);
    return Response.json({ error: "Failed to process file" }, { status: 500 });
  }
}
