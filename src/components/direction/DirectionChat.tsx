"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  userAtom,
  activeConversationAtom,
  activeConversationIdAtom,
  inputValueAtom,
} from "@/store/atoms";
import { Plus, X } from "lucide-react";
import { ChatInput } from "@/chat/ChatInput";
import { MessageBubble } from "@/chat/MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecipePreset } from "@/hooks/useRecipePreset";

export function DirectionChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const conversation = useAtomValue(activeConversationAtom);
  const [, setActiveId] = useAtom(activeConversationIdAtom);
  const [, setInputValue] = useAtom(inputValueAtom);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userName = authUser?.displayName?.split(" ")[0] || "Justin";
  const hasMessages = conversation && conversation.messages.length > 0;

  const { suggestionLabels, handleRecipeClick } = useRecipePreset({
    segment: "ideation",
  });

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    conversation?.messages?.length,
    conversation?.messages?.[conversation?.messages?.length - 1]?.content,
    hasMessages,
  ]);

  useEffect(() => {
    setActiveId(null);
    setInputValue("");
  }, [setActiveId, setInputValue]);

  const handleNewChat = () => {
    setActiveId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 gap-3 shrink-0">
        {onClose ? (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus size={16} />
            New Chat
          </button>
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
            <img
              src={
                authUser?.profile?.photoUrl ||
                "https://i.pravatar.cc/150?u=justin"
              }
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-start px-12 pt-12">
            <img
              alt="Sorene logo"
              src="/figmaAssets/cube.svg"
              className="mb-6"
            />
            <h2 className="text-heading-medium text-gray-900 leading-[1.1] tracking-tight mb-12">
              How do you feel today, {userName}?
            </h2>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-8">
              {conversation.messages
                .filter((m) => !m.isHidden)
                .map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 pt-0 shrink-0">
        <ChatInput
          suggestions={!hasMessages ? suggestionLabels : undefined}
          onSuggestionClick={!hasMessages ? handleRecipeClick : undefined}
          segmentOverride="ideation"
          disableNavigation={true}
        />
      </div>
    </div>
  );
}
