import { auth } from "@/lib/firebase";
import { CREDITS_EXHAUSTED_EVENT } from "@/lib/queryClient";

export async function authFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });

  // Surface the upgrade modal for any 402 — covers callers that use authFetch
  // directly without their own error handling (e.g. ExecutionHubChat).
  if (res.status === 402 && typeof window !== "undefined") {
    window.dispatchEvent(new Event(CREDITS_EXHAUSTED_EVENT));
  }

  return res;
}
