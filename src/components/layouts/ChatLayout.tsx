"use client";

import { ChatArea } from "@/chat/ChatArea";
import { useAtomValue } from "jotai";
import { isAssessmentCompleteAtom } from "@/store/atoms";
import { usePathname } from "next/navigation";

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const pathname = usePathname();

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
