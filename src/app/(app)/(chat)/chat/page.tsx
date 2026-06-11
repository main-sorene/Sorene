"use client";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isAssessmentCompleteAtom,
  isAssessmentInProgressAtom,
  userAtom,
  authLoadingAtom,
  assistantThreadAtom,
  assistantThreadLoadingAtom,
  reEntryMessageAtom,
} from "@/store/atoms";
import { useEffect, useRef } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { getAssistantMessages } from "@/lib/firestore";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const assistantThreadLoading = useAtomValue(assistantThreadLoadingAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const setThread = useSetAtom(assistantThreadAtom);
  const setThreadLoading = useSetAtom(assistantThreadLoadingAtom);
  const setReEntryMessage = useSetAtom(reEntryMessageAtom);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete && !isAssessmentInProgress) {
      const sessionKey = `assessment_state_${user.uid}`;
      const hasActiveSession = sessionStorage.getItem(sessionKey);
      if (!hasActiveSession) {
        setAssessmentComplete(true);
      }
    }
  }, [user, isAssessmentInProgress, setAssessmentComplete]);

  // Load persistent assistant thread from Firestore on mount (once per page visit)
  useEffect(() => {
    if (!user?.uid || !isAssessmentComplete || loadedRef.current) return;
    loadedRef.current = true;
    setThreadLoading(true);
    getAssistantMessages(user.uid, 50)
      .then((messages) => setThread(messages))
      .finally(() => setThreadLoading(false));
  }, [user?.uid, isAssessmentComplete, setThread, setThreadLoading]);

  // Re-entry opening: show once per session if user was away 48+ hours
  useEffect(() => {
    if (!user?.uid || !isAssessmentComplete || assistantThreadLoading) return;
    const lastSession = user.profile?.lastSessionAt;
    if (!lastSession) return;
    const hoursSince = (Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 48) return;
    const reEntryKey = `re_entry_shown_${user.uid}`;
    if (sessionStorage.getItem(reEntryKey)) return;
    sessionStorage.setItem(reEntryKey, "1");

    import("@/lib/authFetch").then(({ authFetch }) => {
      authFetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/re-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      })
        .then((res) => res.json())
        .then((data: { message?: string }) => {
          if (data.message) setReEntryMessage(data.message);
        })
        .catch((err: unknown) => { console.error("[re-entry]", err); });
    });
  }, [user?.uid, user?.profile?.lastSessionAt, isAssessmentComplete, assistantThreadLoading, setReEntryMessage]);

  if (authLoading) return null;
  // ChatLayout renders ChatArea for completed users — no WelcomeScreen
  if (isAssessmentComplete) return null;

  return <AssessmentChatPage />;
}
