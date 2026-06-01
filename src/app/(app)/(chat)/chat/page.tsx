"use client";
import { useAtomValue } from "jotai";
import { isAssessmentCompleteAtom, userAtom } from "@/store/atoms";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { HomePage } from "@/pages-gitlab/HomePage";

export default function Page() {
  const user = useAtomValue(userAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);

  // Sync assessment complete state from Firestore profile on mount
  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete) {
      setAssessmentComplete(true);
    }
  }, [user, setAssessmentComplete]);

  if (!isAssessmentComplete && user && !user.profile?.dnaAssessmentComplete) {
    return <AssessmentChatPage />;
  }

  return <HomePage />;
}
