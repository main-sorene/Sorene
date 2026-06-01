"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  activeConversationIdAtom,
  isAssessmentCompleteAtom,
  conversationsAtom,
} from "@/store/atoms";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomePage() {
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const conversations = useAtomValue(conversationsAtom);
  const router = useRouter();

  useEffect(() => {
    // If assessment is not complete and we have existing conversations,
    // redirect to the most recent one instead of allowing a new chat.
    if (!isAssessmentComplete && conversations.length > 0) {
      const latestConv = conversations[0];
      router.push(`/chat/${latestConv.id}`, { replace: true });
    } else {
      setActiveId(null);
    }
  }, [setActiveId, isAssessmentComplete, conversations, router]);

  return null;
}
