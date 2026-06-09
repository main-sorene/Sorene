"use client";

import { useRef, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, isSettingsOpenAtom } from "@/store/atoms";
import { ArrowUp, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authFetch } from "@/lib/authFetch";

const SUGGESTIONS = [
  { label: "Employee to founder mindset", recipeId: "mindset" },
  { label: "How to validate an idea", recipeId: "validate" },
  { label: "Building social presence", recipeId: "social" },
  { label: "Talking to customers", recipeId: "customers" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function FormattedMessage({ content }: { content: string }) {
  return (
    <span className="space-y-2 block">
      {content.split(/\n\n+/).filter(Boolean).map((para, i) => (
        <span key={i} className="block">
          {para.split(/(\*\*.*?\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </span>
      ))}
    </span>
  );
}

export function EducationChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userName =
    authUser?.profile?.firstName ||
    authUser?.displayName?.split(" ")[0] ||
    "there";

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: "education",
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          userProfile: authUser?.profile ? {
            firstName: authUser.profile.firstName,
            occupation: authUser.profile.occupation,
            cvSummary: authUser.profile.cvSummary,
            dnaScores: authUser.profile.dnaScores,
            dnaNarrative: (authUser.profile as any).dna_narrative,
            assessmentAnswers: authUser.profile.assessmentAnswers,
          } : undefined,
        }),
      });
      const reply = res.ok
        ? ((await res.json())?.reply ?? "I'm here to help with your entrepreneurial journey.")
        : "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: "Sorry, I couldn't reach Sorene. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [loading, messages, authUser?.profile]);

  const submitInput = () => {
    const text = (textareaRef.current?.value ?? input).trim();
    if (!text) return;
    setInput("");
    if (textareaRef.current) { textareaRef.current.value = ""; textareaRef.current.style.height = "auto"; }
    send(text);
  };

  const avatarInitial = (
    authUser?.profile?.firstName ||
    authUser?.displayName ||
    authUser?.email ||
    "U"
  ).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full xl:h-[97vh] w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl xl:my-6 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 gap-3 shrink-0">
        {onClose
          ? <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><X size={20} /></button>
          : <div />}
        <div className="flex items-center gap-3">
          <a
            href="https://discord.gg/2YtvCm2SWp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            Product Feedback
          </a>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {authUser?.profile?.photoUrl
              ? <img src={authUser.profile.photoUrl} alt="User" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#3D3D3D] flex items-center justify-center text-white text-sm font-semibold">{avatarInitial}</div>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-start px-6 md:px-12 pt-12">
            <img alt="Sorene" src="/figmaAssets/cube.svg" className="mb-6" />
            <h2 className="text-heading-small text-[#151515] leading-[1.1] tracking-tight mb-12">
              What would you like to learn, {userName}?
            </h2>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={m.role === "user"
                    ? "max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white text-sm leading-relaxed"
                    : "max-w-[85%] px-4 py-3 rounded-2xl bg-[#F8F9FA] text-[#111111] text-sm leading-relaxed"}>
                    <FormattedMessage content={m.content} />
                  </div>
                </div>
              ))}
              {loading && (
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

      {/* Input */}
      <div className="px-3 pb-3 pt-0 shrink-0">
        <div className="flex flex-col gap-2 p-3 rounded-2xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          {/* 2-column suggestion chips */}
          <div className="grid grid-cols-2 gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.recipeId}
                onClick={() => send(s.label)}
                disabled={loading}
                className="flex items-center justify-center gap-1 px-2 py-[7px] rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-[11px] sm:text-[12px] font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all disabled:opacity-50"
              >
                <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5 shrink-0" alt="" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitInput();
                }
              }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
              placeholder="Ask anything about education"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-24 overflow-y-auto disabled:opacity-50"
            />
            <button
              onClick={submitInput}
              disabled={!input.trim() || loading}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#9CA3AF] mt-1.5 truncate whitespace-nowrap">
          <a href="https://sorene.ai/responsible-ai" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-[#6B7280] transition-colors">
            Sorene can make mistakes. Consider checking important information.
          </a>
        </p>
      </div>
    </div>
  );
}
