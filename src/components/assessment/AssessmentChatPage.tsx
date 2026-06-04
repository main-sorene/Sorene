"use client";

import { useRef, useEffect, useState } from "react";
import { useAssessmentFlow } from "@/hooks/useAssessmentFlow";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Mic, Plus, Copy, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";

function renderInline(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, j) =>
    j % 2 === 1 ? <strong key={j} className="font-semibold text-[#151515]">{part}</strong> : part
  );
}

function SoreneMessage({ content }: { content: string }) {
  // Split into paragraphs; if the last paragraph ends with '?' treat it as the question
  const paragraphs = content.split(/\n\n+/);
  const lastPara = paragraphs[paragraphs.length - 1].trimEnd();
  const hasQuestion = lastPara.endsWith("?") && paragraphs.length > 1;

  const reflectionParas = hasQuestion ? paragraphs.slice(0, -1) : paragraphs;
  const questionPara = hasQuestion ? lastPara : null;

  return (
    <div className="space-y-3">
      {/* Reflection / context lines */}
      {reflectionParas.map((para, pi) => (
        <div key={pi} className="space-y-1.5">
          {para.split("\n").map((line, li) => {
            if (line === "") return <div key={li} className="h-0.5" />;
            return (
              <p key={li} className={cn("text-[15px] leading-7 text-[#4B5563]", line.startsWith("•") && "pl-1")}>
                {renderInline(line)}
              </p>
            );
          })}
        </div>
      ))}

      {/* Question — visually prominent */}
      {questionPara && (
        <p className="text-[16px] leading-7 font-medium text-[#111111] pt-1">
          {renderInline(questionPara)}
        </p>
      )}
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

// Maps internal signal names → warm, human-readable phase labels
const PHASE_LABELS: Record<string, string> = {
  "Profile Setup": "Setting up your profile",
  "Professional Profile": "Exploring your background",
  "Energy Pattern": "Exploring your work energy",
  "Negative Filter": "Understanding what to leave behind",
  "Values + Motivation": "Understanding what drives you",
  "Constraints": "Mapping your constraints",
  "Constraints + Risk Comfort": "Mapping your constraints",
  "Non-Negotiables": "Finding your non-negotiables",
  "Decision-Making Style + Risk Comfort": "Understanding your risk comfort",
  "Work Structure Preference": "How you like to work",
  "Definition of Success": "Defining your success",
  "Risk Tolerance + Decision-Making Style": "Calibrating your risk tolerance",
  "Readiness Mode": "Almost there — last question",
};

function PhaseIndicator({ signal, progressPercent }: { signal: string; progressPercent: number }) {
  const label = PHASE_LABELS[signal] || signal;
  const isNearEnd = progressPercent >= 50;
  const displayLabel = isNearEnd && signal !== "Readiness Mode" && signal !== "Profile Setup"
    ? "Almost there — keep going"
    : label;

  return (
    <div className="shrink-0 px-4 sm:px-6 pt-4 pb-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-[13px] font-medium tracking-wide transition-colors duration-500",
            isNearEnd ? "text-[#111111]" : "text-[#6B7280]"
          )}>
            {displayLabel}
          </span>
          {isNearEnd && (
            <span className="text-[11px] font-semibold text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
              ✦ Almost there
            </span>
          )}
        </div>
        {/* Progress bar — thicker, gradient fill */}
        <div className="w-full h-[3px] rounded-full bg-[#EBEBEB] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(4, progressPercent)}%`,
              background: isNearEnd
                ? "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)"
                : "linear-gradient(90deg, #9CA3AF 0%, #6B7280 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AssessmentChatPage() {
  const {
    messages, sendMessage, skipCv, uploadCv, completeAssessment, isSaving, isWaiting, isProcessingCv,
    isDone, isCvRequest, currentChoices, canonicalChoices, currentSignal, progressPercent,
  } = useAssessmentFlow();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAtomValue(userAtom);
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

  const handleExploreDna = () => {
    // Navigate first — completeAssessment flips isAssessmentCompleteAtom which
    // immediately re-renders this page to HomePage, causing a flash before /dna loads.
    queryClient.invalidateQueries({ queryKey: ["direction-profile", user?.uid] });
    router.push("/dna");
    completeAssessment();
  };

  // When done, textarea is disabled but input area stays visible for the DNA button
  const isDisabled = isSending || isWaiting || isDone;
  const canSend = inputValue.trim().length > 0 && !isDisabled;

  // Phase indicator: show during active question phases only
  const showPhaseLabel = !!currentSignal && !isCvRequest && !isDone;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* "Conversation saved" note — sits just above the phase bar */}
      {showPhaseLabel && (
        <div className="shrink-0 px-4 sm:px-6 pt-3 pb-0">
          <div className="max-w-2xl mx-auto">
            <span className="flex items-center gap-1 text-[11px] text-[#9B9B9B]">
              <CheckCircle2 size={11} className="shrink-0" />
              Your conversation is saved automatically
            </span>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      {showPhaseLabel && (
        <PhaseIndicator signal={currentSignal} progressPercent={progressPercent} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-4">
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

          {isWaiting && !isSaving && <ThinkingDots />}

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Building your profile…
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — always visible */}
      <div className="px-4 sm:px-6 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* DNA button shown when done, otherwise choice buttons */}
          {isDone && !isWaiting ? (
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleExploreDna}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium active:scale-95"
              >
                <Sparkles size={14} />
                Explore the DNA Page
              </button>
            </div>
          ) : currentChoices && currentChoices.length > 0 && !isWaiting ? (
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
          ) : null}

          {/* Composer */}
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
                isDone
                  ? "Is there anything you'd like to add?"
                  : isProcessingCv
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
    </div>
  );
}
