"use client";

import { useRef, useEffect, useState } from "react";
import { useAssessmentFlow } from "@/hooks/useAssessmentFlow";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AssessmentChatPage() {
  const { messages, sendMessage, isSaving, isDone, currentChoices, inputType } = useAssessmentFlow();
  const authUser = useAtomValue(userAtom);
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const firstName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (isDone) {
      router.push("/dna");
    }
  }, [isDone, router]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending || isSaving) return;
    setInputValue("");
    setIsSending(true);
    await sendMessage(text.trim());
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/figmaAssets/cube.svg" alt="Sorene" className="w-8 h-8" />
          <span className="font-medium text-gray-900">Sorene Assessment</span>
        </div>
        <div className="text-sm text-gray-500">{firstName}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-50 text-gray-900"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSaving && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Building your profile...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 max-w-2xl mx-auto w-full">
        {/* Choice buttons */}
        {currentChoices && currentChoices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {currentChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleSend(choice)}
                disabled={isSending || isSaving}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {/* Text input (always shown for freetext, also shown for choice with allowCustom) */}
        {(inputType === "freetext" || !currentChoices?.length) && (
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
              placeholder="Type your answer..."
              rows={2}
              disabled={isSending || isSaving}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isSending || isSaving}
              className="w-10 h-10 self-end rounded-xl bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
