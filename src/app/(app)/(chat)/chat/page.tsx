"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { isAssessmentCompleteAtom, isAssessmentInProgressAtom, userAtom, authLoadingAtom } from "@/store/atoms";
import { useEffect } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { HomePage } from "@/pages-gitlab/HomePage";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);

  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete && !isAssessmentInProgress) {
      const sessionKey = `assessment_state_${user.uid}`;
      const hasActiveSession = sessionStorage.getItem(sessionKey);
      if (!hasActiveSession) {
        setAssessmentComplete(true);
      }
    }
  }, [user, isAssessmentInProgress, setAssessmentComplete]);

  // Still loading auth
  if (authLoading) return null;

  // Only use the atom for the render decision.
  // The useEffect above guards against flipping the atom while a session is live,
  // so this correctly shows AssessmentChatPage until the user explicitly clicks
  // "Explore My DNA" (which calls completeAssessment → flips the atom).
  if (!isAssessmentComplete) {
    return <AssessmentChatPage />;
  }

  return <HomePage />;
}
