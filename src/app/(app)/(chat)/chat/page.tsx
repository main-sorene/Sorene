"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { isAssessmentCompleteAtom, userAtom, authLoadingAtom } from "@/store/atoms";
import { useEffect } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { HomePage } from "@/pages-gitlab/HomePage";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);

  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete) {
      // Don't flip while the assessment session is still live in sessionStorage —
      // doing so would replace AssessmentChatPage with HomePage mid-session.
      const sessionKey = `assessment_state_${user.uid}`;
      const hasActiveSession = sessionStorage.getItem(sessionKey);
      if (!hasActiveSession) {
        setAssessmentComplete(true);
      }
    }
  }, [user, setAssessmentComplete]);

  // Still loading auth
  if (authLoading) return null;

  // Assessment not done — show the 12-question flow
  if (!isAssessmentComplete && !user?.profile?.dnaAssessmentComplete) {
    return <AssessmentChatPage />;
  }

  return <HomePage />;
}
