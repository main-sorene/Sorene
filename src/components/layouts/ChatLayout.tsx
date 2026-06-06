"use client";

import { ChatArea } from "@/chat/ChatArea";
import { useAtomValue } from "jotai";
import { isAssessmentCompleteAtom } from "@/store/atoms";
import { usePathname } from "next/navigation";

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const pathname = usePathname();

  // Never show ChatArea on /chat itself (assessment page), even if isAssessmentComplete
  // just flipped true — prevents the chat UI from flashing before router navigates to /dna.
  if (!isAssessmentComplete || pathname === "/chat") {
    return <>{children}</>;
  }

  return (
    <>
      <ChatArea />
      {children}
    </>
  );
}
