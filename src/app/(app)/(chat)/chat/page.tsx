"use client";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isAssessmentCompleteAtom,
  isAssessmentInProgressAtom,
  userAtom,
  authLoadingAtom,
  assistantThreadAtom,
  assistantThreadLoadingAtom,
} from "@/store/atoms";
import { useEffect, useRef } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { getAssistantMessages } from "@/lib/firestore";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const setThread = useSetAtom(assistantThreadAtom);
  const setThreadLoading = useSetAtom(assistantThreadLoadingAtom);
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

  if (authLoading) return null;
  // ChatLayout renders ChatArea for completed users — no WelcomeScreen
  if (isAssessmentComplete) return null;

  return <AssessmentChatPage />;
}
