export function friendlyApiError(raw: string): string {
  try {
    const jsonStart = raw.indexOf("{");
    const json = jsonStart >= 0 ? JSON.parse(raw.slice(jsonStart)) : JSON.parse(raw);
    const msg: string = json?.error?.message ?? json?.message ?? "";
    if (/api usage limits|spending limit/i.test(msg)) {
      const resetMatch = msg.match(/\d{4}-\d{2}-\d{2}/);
      const resetDate = resetMatch ? ` Your limit resets on ${resetMatch[0]}.` : "";
      return `You've reached the Anthropic API monthly usage limit.${resetDate} Go to console.anthropic.com → Settings → Limits to increase it.`;
    }
    if (/credit balance|billing/i.test(msg)) return "Anthropic API billing issue. Top up your balance at console.anthropic.com.";
    if (/invalid.*api.*key|authentication/i.test(msg)) return "Invalid Anthropic API key. Check your server environment variables.";
    if (msg) return msg;
  } catch {}
  return raw;
}
