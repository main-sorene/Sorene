"use client";

import { useRef, useEffect, useState } from "react";
import { useAssessmentFlow } from "@/hooks/useAssessmentFlow";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function SoreneMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line === "") return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-gray-900">
              {part}
            </strong>
          ) : (
            part
          )
        );
        return (
          <p
            key={i}
            className={cn(
              "text-[15px] leading-relaxed text-gray-700",
              line.startsWith("•") && "pl-1"
            )}
          >
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

function CvRequestCard({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-gray-200 p-5 space-y-3 bg-gray-50/60">
      <p className="font-semibold text-gray-900 text-[15px]">
        Would you like to share your CV, portfolio, or LinkedIn profile?
      </p>
      <p className="text-sm text-gray-600">
        This is completely optional, but it helps me understand:
      </p>
      <ul className="space-y-1.5 text-sm text-gray-600">
        <li>• What you&apos;ve done professionally</li>
        <li>• What skills and experience you bring</li>
        <li>• What patterns might exist in your career journey</li>
        <li>• What you might be moving away from or toward</li>
      </ul>
      <p className="text-sm text-gray-500 pt-1">
        If you&apos;d prefer not to share anything, that&apos;s fine too. We&apos;ll just start with questions.
      </p>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
        >
          Skip — just ask me questions
        </button>
      </div>
    </div>
  );
}

export function AssessmentChatPage() {
  const {
    messages,
    sendMessage,
    skipCv,
    isSaving,
    isDone,
    isCvRequest,
    currentChoices,
    inputType,
  } = useAssessmentFlow();
  const authUser = useAtomValue(userAtom);
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (isDone) router.push("/dna");
  }, [isDone, router]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending || isSaving) return;
    setInputValue("");
    setIsSending(true);
    await sendMessage(text.trim());
    setIsSending(false);
  };

  const showInput = !isCvRequest && !isDone && !isSaving;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
        <img src="/figmaAssets/cube.svg" alt="Sorene" className="w-7 h-7" />
        <span className="text-sm font-medium text-gray-500 tracking-wide">Sorene</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          {messages.map((msg) => {
            if (msg.type === "cv_request") return null;

            if (msg.role === "assistant") {
              return (
                <div key={msg.id}>
                  <SoreneMessage content={msg.content} />
                  {msg.id === "opening" && isCvRequest && (
                    <CvRequestCard onSkip={skipCv} />
                  )}
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[78%] bg-gray-100 rounded-2xl px-4 py-3 text-sm leading-relaxed text-gray-800">
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Building your profile…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {showInput && (
        <div className="px-6 pb-6 shrink-0 border-t border-gray-100 pt-4">
          <div className="max-w-xl mx-auto space-y-3">
            {currentChoices && currentChoices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleSend(choice)}
                    disabled={isSending}
                    className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 text-left"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {(inputType === "freetext" || !currentChoices?.length) && (
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  placeholder="Type your answer…"
                  rows={2}
                  disabled={isSending}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 bg-gray-50/50 placeholder-gray-400"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isSending}
                  className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors disabled:opacity-30 shrink-0 mb-px"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
