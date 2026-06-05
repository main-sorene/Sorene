"use client";

import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, isSettingsOpenAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { ArrowUp, Loader2, MessageCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUGGESTIONS = [
  "Where do I start?",
  "Review my progress",
  "Help me validate my idea",
  "What's my next step?",
];

interface ChatMsg { id: string; role: "user" | "assistant"; content: string }

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

export function ExecutionHubChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const res = await authFetch("/api/direction-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: "execution_hub",
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        const id = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id, role: "assistant", content: "" }]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, { stream: true });
            setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: full } : m));
          }
        }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const initials = (
    authUser?.profile?.firstName?.[0] ||
    authUser?.displayName?.[0] ||
    authUser?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <div className="flex flex-col h-full xl:h-[97vh] w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl xl:my-6 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 gap-3 shrink-0">
        {onClose
          ? <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><X size={20} /></button>
          : <div />}
        <div className="flex items-center gap-3">
          <a href="https://discord.gg/2YtvCm2SWp" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all">
            Product Feedback
          </a>
          <button onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0">
            {authUser?.profile?.photoUrl
              ? <img src={authUser.profile.photoUrl} alt="User" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#3D3D3D] flex items-center justify-center text-white text-sm font-semibold">{initials}</div>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0
          ? (
            <div className="flex-1 flex flex-col items-start px-6 md:px-12 pt-12">
              <img alt="Sorene" src="/figmaAssets/cube.svg" className="mb-6" />
              <h2 className="text-heading-small text-[#151515] leading-[1.1] tracking-tight mb-12">
                What are you working on today, {userName}?
              </h2>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="px-6 py-6 space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={m.role === "user"
                      ? "max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white text-sm leading-relaxed"
                      : "max-w-[80%] px-4 py-3 rounded-2xl bg-[#F8F9FA] text-[#111111] text-sm leading-relaxed"}>
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
      <div className="p-6 pt-0 shrink-0">
        <div className="flex flex-col gap-3 p-4 rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all whitespace-nowrap disabled:opacity-50">
                <img src="/figmaAssets/starfour.svg" className="w-3 h-3 shrink-0" alt="" />
                {s}
              </button>
            ))}
          </div>
          <textarea ref={textareaRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
            placeholder="Ask anything about your execution"
            rows={1} disabled={loading}
            className="w-full resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-36 overflow-y-auto disabled:opacity-50"
          />
          <div className="flex items-center justify-end">
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-[#9CA3AF] mt-3">
          <a href="https://sorene.ai/responsible-ai" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-[#6B7280] transition-colors">
            Sorene can make mistakes. Consider checking important information.
          </a>
        </p>
      </div>
    </div>
  );
}
