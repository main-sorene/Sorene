import Anthropic from "@anthropic-ai/sdk";

// PII patterns to mask before sending user input to the model
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]"],
  [/\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[PHONE]"],
  // Social security / national ID: 3-2-4 digit pattern
  [/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[ID-NUMBER]"],
  // Credit / debit card numbers (13-19 digits, optionally spaced)
  [/\b(?:\d[ -]?){13,19}\b/g, "[CARD-NUMBER]"],
  // Passwords / secrets mentioned inline: "password: xyz", "secret: xyz"
  [/\b(password|passwd|secret|token|api[_\s]?key)\s*[=:]\s*\S+/gi, "[CREDENTIAL]"],
];

/**
 * Masks PII in a string before it reaches the model.
 * Operates on a best-effort basis — not a guarantee of zero leakage.
 */
export function maskPii(input: string): string {
  let out = input;
  for (const [pattern, replacement] of PII_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Masks every value in a key→value answer map.
 */
export function maskAnswers(
  answers: Record<string, string>,
): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    masked[k] = maskPii(v);
  }
  return masked;
}

/**
 * Validates that a non-streaming Anthropic response ended for the right reason.
 * Throws if the model stopped because of tool_use (silent hallucination risk)
 * or hit max_tokens without completing.
 */
export function assertTextCompletion(message: Anthropic.Message): string {
  if (message.stop_reason === "tool_use") {
    throw new Error(
      `Model returned stop_reason=tool_use but no tools are registered. ` +
        `Response may be fabricated. Aborting.`,
    );
  }
  if (message.stop_reason === "max_tokens") {
    // Warn but don't abort — truncated text is still usable in most cases
    console.warn("[aiSafety] Response was truncated at max_tokens.");
  }
  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error(
      `Expected text content block but got: ${block?.type ?? "none"}`,
    );
  }
  return block.text.trim();
}
