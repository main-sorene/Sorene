import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/firebaseAdmin";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB base64 limit

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You're Sorene, a personalized entrepreneurship coach.

The attached file is the user's CV, portfolio, or resume.

First, extract the person's full name from the CV. Then write a narrative summary of their background.

Output in this exact format (no other text before or after):
FIRST_NAME: <first name only>
LAST_NAME: <last name(s) only, or empty if not found>
SUMMARY:
<narrative summary here>

For the summary: write in second person, speaking warmly and directly ("I can see you've...", "You moved from...").

Focus on:
- Concrete years and domains of experience (use real numbers)
- Notable role transitions or pivots
- 2-3 distinct skills or focus areas worth naming

Style rules:
- Break the summary into 3-4 SHORT paragraphs separated by double newlines. Each paragraph should be 2-3 sentences max.
- Use **bold** markdown to highlight key information: job titles, company names, years, skills, and important transitions
- Specific, not generic — name fields, sectors, years, transitions
- Warm and observational, like a coach noticing patterns
- Never use the words "candidate" or "applicant"
- No bullet points, no headings in the summary`;

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [docContent, { type: "text", text: PROMPT }],
        },
      ],
    });

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
