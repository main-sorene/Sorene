"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  activeConversationIdAtom,
  isAssessmentCompleteAtom,
  conversationsAtom,
  userAtom,
} from "@/store/atoms";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomePage() {
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const user = useAtomValue(userAtom);
  const conversations = useAtomValue(conversationsAtom);
  const router = useRouter();

  const assessmentDone = isAssessmentComplete || !!user?.profile?.dnaAssessmentComplete;

  useEffect(() => {
    // If assessment is not complete and we have existing conversations,
    // redirect to the most recent one instead of allowing a new chat.
    if (!assessmentDone && conversations.length > 0) {
      const latestConv = conversations[0];
      router.replace(`/chat/${latestConv.id}`);
    } else {
      setActiveId(null);
    }
  }, [setActiveId, assessmentDone, conversations, router]);

  return null;
}
