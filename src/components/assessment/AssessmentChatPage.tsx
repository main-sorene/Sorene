"use client";

import { useRef, useEffect, useState } from "react";
import { useAssessmentFlow } from "@/hooks/useAssessmentFlow";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Mic, Plus, Settings, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function SoreneMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line === "") return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-[#151515]">
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
              "text-[15px] leading-7 text-[#111111]",
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
      <p className="font-semibold text-[#151515] text-[15px]">
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

function UserMessage({ content }: { content: string }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ description: "Copied to clipboard" });
  };
  return (
    <div className="flex justify-end group">
      <div className="max-w-[75%] sm:max-w-[65%] flex flex-col items-end gap-2">
        <div className="bg-[#F2F2F2] rounded-2xl rounded-tr-md px-4 py-3">
          <p className="text-[#111111] text-[15px] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Copy"
          >
            <Copy size={14} />
          </button>
        </div>
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
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (isDone) router.push("/dna");
  }, [isDone, router]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [inputValue]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending || isSaving) return;
    setInputValue("");
    setIsSending(true);
    await sendMessage(text.trim());
    setIsSending(false);
  };

  const showInput = !isCvRequest && !isDone && !isSaving;
  const canSend = inputValue.trim().length > 0 && !isSending;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="max-w-2xl mx-auto space-y-6">
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
            return <UserMessage key={msg.id} content={msg.content} />;
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

      {/* Input area */}
      {showInput && (
        <div className="px-4 sm:px-6 pb-4 shrink-0">
          <div className="max-w-2xl mx-auto">
            {/* Choice buttons */}
            {currentChoices && currentChoices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Composer */}
            {(inputType === "freetext" || !currentChoices?.length) && (
              <div className="rounded-2xl border border-[#ECEDEE] bg-white px-4 pt-3 pb-2 shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  placeholder="Ask anything"
                  rows={1}
                  disabled={isSending}
                  className="w-full resize-none bg-transparent text-[16px] leading-[1.45] text-[#111111] placeholder:text-[#6B7280] focus:outline-none min-h-[28px] max-h-[160px]"
                />
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#111111]"
                    title="Attach"
                    disabled
                  >
                    <Plus size={20} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#111111] disabled:opacity-40"
                      title="Voice input"
                      disabled
                    >
                      <Mic size={20} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#111111] disabled:opacity-40"
                      title="Settings"
                      disabled
                    >
                      <Settings size={20} />
                    </button>
                    <button
                      onClick={() => handleSend(inputValue)}
                      disabled={!canSend}
                      className={cn(
                        "ml-1 w-9 h-9 rounded-md flex items-center justify-center transition-all",
                        canSend
                          ? "bg-[#111111] text-white hover:bg-black shadow-sm active:scale-95"
                          : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                      )}
                    >
                      {isSending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ArrowUp size={20} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer disclaimer */}
            <p className="text-center text-xs text-[#62646A] mt-3">
              Sorene can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
