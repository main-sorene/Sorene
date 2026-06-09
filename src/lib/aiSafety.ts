// Server-only — imports @anthropic-ai/sdk. Do not import from client components.
import type Anthropic from "@anthropic-ai/sdk";

export { maskPii, sanitizeName, maskScores, maskAnswers } from "./piiUtils";

/**
 * Validates that a non-streaming Anthropic response ended for the right reason.
 * Throws if the model stopped because of tool_use (silent hallucination risk).
 * Warns if truncated at max_tokens.
 */
export function assertTextCompletion(message: Anthropic.Message): string {
  if (message.stop_reason === "tool_use") {
    throw new Error(
      `Model returned stop_reason=tool_use but no tools are registered. ` +
        `Response may be fabricated. Aborting.`,
    );
  }
  if (message.stop_reason === "max_tokens") {
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
