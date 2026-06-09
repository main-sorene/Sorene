"use client";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isAssessmentCompleteAtom,
  isAssessmentInProgressAtom,
  userAtom,
  authLoadingAtom,
  activeConversationIdAtom,
} from "@/store/atoms";
import { useEffect } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const setActiveId = useSetAtom(activeConversationIdAtom);

  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete && !isAssessmentInProgress) {
      const sessionKey = `assessment_state_${user.uid}`;
      const hasActiveSession = sessionStorage.getItem(sessionKey);
      if (!hasActiveSession) {
        setAssessmentComplete(true);
      }
    }
  }, [user, isAssessmentInProgress, setAssessmentComplete]);

  // Always start fresh on /chat — clear any active conversation
  useEffect(() => {
    setActiveId(null);
  }, [setActiveId]);

  if (authLoading) return null;
  if (isAssessmentComplete) return null;

  return <AssessmentChatPage />;
}
