import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useSubscriptionStatus } from "./useSubscriptionStatus";

/** Returns true when the authenticated user has exhausted their credit limit. */
export function useIsCreditsExhausted(): boolean {
  const user = useAtomValue(userAtom);
  const { data: subscription } = useSubscriptionStatus();

  if (!user || !subscription) return false;

  const plan = subscription.plan ?? "free";
  const used = subscription.credits?.used ?? 0;
  const limit = (subscription.credits?.limit ?? 250) + (subscription.credits?.extra ?? 0);

  // Free users have a one-time budget; paid users reset monthly (checkCredits
  // handles the reset logic server-side, so we trust the returned used value).
  return limit > 0 && used >= limit;
}
