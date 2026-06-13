import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { analytics } from "./firebase";

function getAnalytics() {
  return analytics ?? null;
}

export function trackPageView(path: string) {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "page_view", { page_path: path });
}

export function trackSignUpComplete(method: "email" | "google") {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "sign_up", { method });
}

export function trackOnboardingComplete() {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "onboarding_complete");
}

export function trackDNAAssessmentComplete() {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "dna_assessment_complete");
}

export function trackDirectionGenerated(model: string) {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "direction_generated", { model });
}

export function trackSubscriptionStarted(plan: string, duration: number) {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "purchase" as string, { item_name: plan, value: duration });
}

export function trackChatMessage() {
  const a = getAnalytics();
  if (!a) return;
  logEvent(a, "chat_message_sent");
}

export function identifyUser(uid: string, plan?: string) {
  const a = getAnalytics();
  if (!a) return;
  setUserId(a, uid);
  if (plan) setUserProperties(a, { subscription_plan: plan });
}
