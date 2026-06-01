import { ChatArea } from "@/chat/ChatArea";
import { Outlet } from "react-router-dom";
export function ChatLayout() {
  return (
    <>
      <ChatArea />
      <Outlet />
    </>
  );
}
