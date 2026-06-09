// Pure PII masking utilities — no external dependencies, safe for any context.

const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]"],
  [/\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[PHONE]"],
  [/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[ID-NUMBER]"],
  [/\b(?:\d[ -]?){13,19}\b/g, "[CARD-NUMBER]"],
  [/\b(password|passwd|secret|token|api[_\s]?key)\s*[=:]\s*\S+/gi, "[CREDENTIAL]"],
];

export function maskPii(input: string): string {
  let out = input;
  for (const [pattern, replacement] of PII_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z\s'\-]/g, "").trim().slice(0, 64) || "there";
}

export function maskScores<T extends Record<string, unknown>>(scores: T): T {
  const textFields = [
    "energy_source",
    "energy_drains",
    "non_negotiable",
    "success_feeling",
    "motivation_driver",
    "strengths_summary",
  ] as const;
  const masked = { ...scores };
  for (const field of textFields) {
    if (typeof masked[field] === "string") {
      (masked as Record<string, unknown>)[field] = maskPii(masked[field] as string);
    }
  }
  return masked;
}

export function maskAnswers(answers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    masked[k] = maskPii(v);
  }
  return masked;
}
