"use client";

import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { Plus, X, ArrowUp, Loader2, Mic, Settings } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDnaEdit } from "@/hooks/useDnaEdit";

const DNA_SUGGESTIONS = ["Explain My Core", "My Risk & Change Style"];

export function DNAChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");

  const { messages, pendingEdit, isProcessing, sendMessage, confirmEdit, cancelEdit } = useDnaEdit();

  const userName =
    authUser?.profile?.firstName ||
    authUser?.displayName?.split(" ")[0] ||
    "there";

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, hasMessages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full xl:h-[97vh] w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl xl:my-6 overflow-hidden shrink-0">
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
          <Link href="/settings">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
              <img
                src={
                  authUser?.profile?.photoUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.displayName || "User"}`
                }
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-start px-12 pt-12">
            <img alt="Sorene logo" src="/figmaAssets/cube.svg" className="mb-6" />
            <h2 className="text-heading-small text-[#151515] leading-[1.1] tracking-tight mb-12">
              How do you feel today, {userName}?
            </h2>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-4">
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const isConfirmBubble = message.type === "confirm" && isLast && pendingEdit !== null;

                return (
                  <div key={message.id}>
                    <div className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          message.role === "user"
                            ? "max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white text-sm leading-relaxed"
                            : "max-w-[80%] px-4 py-3 rounded-2xl bg-[#F8F9FA] text-[#111111] text-sm leading-relaxed"
                        }
                      >
                        {message.content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}
                      </div>
                    </div>
                    {isConfirmBubble && (
                      <div className="flex gap-2 mt-3 ml-1">
                        <button
                          onClick={confirmEdit}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-black text-white text-sm rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Yes, update it
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isProcessing}
                          className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          No, keep it
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-[#F8F9FA]">
                    <Loader2 size={16} className="animate-spin text-[#6B7280]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 pt-0 shrink-0">
        <div className="flex flex-col gap-3 p-4 rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          {/* Suggestion chips */}
          {!hasMessages && (
            <div className="flex flex-wrap gap-2">
              {DNA_SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all whitespace-nowrap"
                >
                  <img src="/figmaAssets/starfour.svg" className="w-3 h-3" alt="" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            rows={1}
            disabled={isProcessing}
            className="w-full resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-36 overflow-y-auto disabled:opacity-50"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />

          {/* Bottom row: plus + icons + send */}
          <div className="flex items-center justify-between">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
              <Plus size={18} />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
                <Mic size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
                <Settings size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-[#9CA3AF] mt-3">
          Sorene can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
