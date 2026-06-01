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
      setAssessmentComplete(true);
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
