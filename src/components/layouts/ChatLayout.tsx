"use client";

import { ChatArea } from "@/chat/ChatArea";
import { useAtomValue } from "jotai";
import { isAssessmentCompleteAtom } from "@/store/atoms";

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);

  // During assessment, render ONLY the assessment page — skip ChatArea entirely
  if (!isAssessmentComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <ChatArea />
      {children}
    </>
  );
}
