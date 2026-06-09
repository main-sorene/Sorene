"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { isAssessmentCompleteAtom, isAssessmentInProgressAtom, userAtom, authLoadingAtom } from "@/store/atoms";
import { useEffect } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { WelcomeScreen } from "@/chat/WelcomeScreen";

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

  if (authLoading) return null;
  if (isAssessmentComplete) return <WelcomeScreen />;

  return <AssessmentChatPage />;
}
