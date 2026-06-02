"use client";

import { useRef, useEffect, useState } from "react";
import { useAssessmentFlow } from "@/hooks/useAssessmentFlow";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Mic, Plus, Settings, Copy, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSetAtom } from "jotai";
import { isSettingsOpenAtom } from "@/store/atoms";

function SoreneMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line === "") return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-[#151515]">{part}</strong>
          ) : part
        );
        return (
          <p key={i} className={cn("text-[15px] leading-7 text-[#111111]", line.startsWith("•") && "pl-1")}>
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

function CvRequestCard({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-gray-200 p-5 space-y-3 bg-gray-50/60">
      <p className="font-semibold text-[#151515] text-[15px]">
        Would you like to share your CV or portfolio?
      </p>
      <p className="text-sm text-gray-600">This is completely optional, but it helps me understand:</p>
      <ul className="space-y-1.5 text-sm text-gray-600">
        <li>• What you&apos;ve done professionally</li>
        <li>• What skills and experience you bring</li>
        <li>• What patterns might exist in your career journey</li>
        <li>• What you might be moving away from or toward</li>
      </ul>
      <p className="text-sm text-gray-500 pt-1">
        If you&apos;d prefer not to share anything, that&apos;s fine too. We&apos;ll just start with questions.
      </p>
      <button
        onClick={onSkip}
        className="mt-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
      >
        Skip — just ask me questions
      </button>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  const { toast } = useToast();
  return (
    <div className="flex justify-end group">
      <div className="max-w-[75%] sm:max-w-[65%] flex flex-col items-end gap-1.5">
        <div className="bg-[#F2F2F2] rounded-2xl rounded-tr-md px-4 py-3">
          <p className="text-[#111111] text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(content); toast({ description: "Copied" }); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-gray-400"
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
}

function NavButtons({ onDna, onDirection }: { onDna: () => void; onDirection: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
      <button
        onClick={onDna}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-medium hover:bg-black transition-colors shadow-sm active:scale-95 whitespace-nowrap"
      >
        <Sparkles size={15} />
        Explore your DNA
      </button>
      <button
        onClick={onDirection}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[#111111] text-sm font-medium hover:bg-gray-50 transition-colors active:scale-95 whitespace-nowrap"
      >
        <ArrowRight size={15} />
        Explore your Direction
      </button>
    </div>
  );
}

export function AssessmentChatPage() {
  const {
    messages, sendMessage, skipCv, uploadCv, completeAssessment, isSaving, isWaiting, isProcessingCv,
    isDone, isCvRequest, currentChoices, canonicalChoices, inputType,
  } = useAssessmentFlow();
  const router = useRouter();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isWaiting, isDone]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [inputValue]);

  const handleSend = async (text: string, canonical?: string) => {
    if (!text.trim() || isSending || isWaiting) return;
    setInputValue("");
    setIsSending(true);
    await sendMessage(text.trim(), canonical);
    setIsSending(false);
  };

  const isDisabled = isSending || isWaiting || isDone;
  const canSend = inputValue.trim().length > 0 && !isDisabled;
  const showInput = !isDone;

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
                  {msg.id === "opening" && isCvRequest && <CvRequestCard onSkip={skipCv} />}
                </div>
              );
            }
            return <UserMessage key={msg.id} content={msg.content} />;
          })}

          {/* Thinking indicator while reflection is loading */}
          {isWaiting && !isSaving && <ThinkingDots />}

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Building your profile…
            </div>
          )}

          {/* Navigation buttons shown once assessment is complete */}
          {isDone && (
            <NavButtons
              onDna={() => { completeAssessment(); router.push("/dna"); }}
              onDirection={() => { completeAssessment(); router.push("/direction"); }}
            />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — always visible while questions are active */}
      {showInput && (
        <div className="px-4 sm:px-6 pb-4 shrink-0">
          <div className="max-w-2xl mx-auto">
            {/* Choice buttons */}
            {currentChoices && currentChoices.length > 0 && !isWaiting && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentChoices.map((choice, i) => (
                  <button
                    key={`${i}-${choice}`}
                    onClick={() => handleSend(choice, canonicalChoices?.[i])}
                    disabled={isDisabled}
                    className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40 text-left"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Composer — always shown */}
            <div className={cn(
              "rounded-2xl border border-[#ECEDEE] bg-white px-4 pt-3 pb-2 shadow-sm transition-opacity",
              isDisabled && "opacity-60"
            )}>
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
                placeholder={
                  isProcessingCv
                    ? "Reading your CV…"
                    : isWaiting
                    ? "Sorene is thinking…"
                    : isCvRequest
                    ? "Type a reply, or skip with the button above"
                    : "Type your answer"
                }
                rows={1}
                disabled={isDisabled}
                className="w-full resize-none bg-transparent text-[16px] leading-[1.45] text-[#111111] placeholder:text-[#6B7280] focus:outline-none min-h-[28px] max-h-[160px] disabled:cursor-not-allowed"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCv(f);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isCvRequest || isProcessingCv}
                  title={isCvRequest ? "Attach CV (PDF or image)" : "Attachments unavailable"}
                  className={cn(
                    "p-2 rounded-xl transition-colors text-[#111111]",
                    isCvRequest && !isProcessingCv
                      ? "hover:bg-gray-100"
                      : "opacity-40 cursor-not-allowed",
                  )}
                >
                  <Plus size={20} />
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#111111] opacity-40" disabled>
                    <Mic size={20} />
                  </button>
                  <button type="button" onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#111111]">
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
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#62646A] mt-3">
              <a
                href="/responsible"
                className="underline underline-offset-2 hover:text-[#101010] transition-colors"
              >
                Sorene can make mistakes. Consider checking important information.
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
