"use client";

import { ChatArea } from "@/chat/ChatArea";
export function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChatArea />
      {children}
    </>
  );
}
