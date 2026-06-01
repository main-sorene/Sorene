import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You're Sorene, a personalized entrepreneurship coach.

The attached file is the user's CV, portfolio, or resume. Write a 3-5 sentence narrative summary of what you see in their background — in second person, as if speaking warmly and directly to them ("I can see you've...", "You moved from...").

Focus on:
- Concrete years and domains of experience (use real numbers)
- Notable role transitions or pivots
- 2-3 distinct skills or focus areas worth naming

Style rules:
- Flowing prose, no bullet points, no headings, no markdown
- Specific, not generic — name fields, sectors, years, transitions
- Warm and observational, like a coach noticing patterns
- Never use the words "candidate" or "applicant"
- Don't introduce yourself or restate the prompt — just output the summary directly

Output only the summary text, nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, mimeType } = (await req.json()) as {
      fileBase64?: string;
      mimeType?: string;
    };

    if (!fileBase64 || !mimeType) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");
    if (!isPdf && !isImage) {
      return Response.json(
        { error: "Only PDF and image files are supported" },
        { status: 400 },
      );
    }

    const docContent = isPdf
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: fileBase64,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: fileBase64,
          },
        };

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [docContent, { type: "text", text: PROMPT }],
        },
      ],
    });

    const block = message.content[0];
    const text = block && block.type === "text" ? block.text.trim() : "";

    return Response.json({ summary: text });
  } catch (error) {
    console.error("[cv-summary] error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
