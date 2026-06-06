import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { checkCredits, deductCredits, calculateCredits } from "@/lib/credits";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB base64 limit

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `Extract the person's full name and write a brief background summary from the attached CV/resume.

Output in this exact format (no other text before or after):
FIRST_NAME: <first name only>
LAST_NAME: <last name(s) only, or empty if not found>
SUMMARY:
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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [docContent, { type: "text", text: PROMPT }],
        },
      ],
    });

    void deductCredits(user.uid, calculateCredits("claude-haiku-4-5-20251001", message.usage.input_tokens, message.usage.output_tokens));

    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text.trim() : "";

    // Parse structured output
    const firstNameMatch = raw.match(/^FIRST_NAME:\s*(.+)$/m);
    const lastNameMatch = raw.match(/^LAST_NAME:\s*(.*)$/m);
    const summaryMatch = raw.match(/^SUMMARY:\s*\n([\s\S]+)$/m);

    const extractedFirstName = firstNameMatch?.[1]?.trim() || "";
    const extractedLastName = lastNameMatch?.[1]?.trim() || "";
    const summary = summaryMatch?.[1]?.trim() || raw;

    return Response.json({ summary, firstName: extractedFirstName, lastName: extractedLastName });
  } catch (error) {
    console.error("[cv-summary] error:", error);
    return Response.json(
      { error: "Failed to process file" },
      { status: 500 },
    );
  }
}
