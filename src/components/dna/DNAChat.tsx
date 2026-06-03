"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, isSettingsOpenAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { Plus, X, ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDnaEdit } from "@/hooks/useDnaEdit";

const DNA_SUGGESTIONS = [
  "Explain My Core",
  "What Drives Me",
  "How I Work",
  "My Risk & Change Style",
  "My Energy",
  "My Strength",
];

function FormattedMessage({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <span className="space-y-2 block">
      {paragraphs.map((para, i) => {
        const parts = para.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={i} className="block">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

export function DNAChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

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

  const recognitionRef = useRef<any>(null);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0]?.[0]?.transcript || "";
      if (transcript) setInputValue((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => { setIsRecording(false); };
    recognition.onerror = () => { setIsRecording(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  const handleFileUpload = useCallback(async (file: File) => {
    const isSupported = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!isSupported) return;
    setIsUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await authFetch("/api/cv-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64, mimeType: file.type }),
        });
        if (res.ok) {
          const { summary } = (await res.json()) as { summary: string };
          if (summary) await sendMessage(`Here is a summary of my uploaded file: ${summary}`);
        }
        setIsUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingFile(false);
    }
  }, [sendMessage]);

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
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {authUser?.profile?.photoUrl ? (
              <img src={authUser.profile.photoUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#3D3D3D] flex items-center justify-center text-white text-sm font-semibold">
                {(authUser?.profile?.firstName || authUser?.displayName || authUser?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-start px-6 md:px-12 pt-12">
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
                        <FormattedMessage content={message.content} />
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
          {/* Suggestion chips — always visible, wrapped rows */}
          <div className="flex flex-wrap gap-2">
            {DNA_SUGGESTIONS.map((label) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all whitespace-nowrap disabled:opacity-50"
              >
                <img src="/figmaAssets/starfour.svg" className="w-3 h-3 shrink-0" alt="" />
                {label}
              </button>
            ))}
          </div>

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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile || isProcessing}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#111111] disabled:opacity-50"
              title="Attach file (PDF or image)"
            >
              {isUploadingFile ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
            />
            <div className="flex items-center gap-1">
              <button
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isRecording ? "bg-red-100 text-red-500 hover:bg-red-200" : "hover:bg-gray-100 text-[#111111]"} disabled:opacity-50`}
                title={isRecording ? "Stop recording" : "Record voice"}
              >
                {isRecording ? <Square size={14} className="fill-current" /> : <Mic size={16} />}
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
          <a
            href="https://sorene.ai/responsible-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#6B7280] transition-colors"
          >
            Sorene can make mistakes. Consider checking important information.
          </a>
        </p>
      </div>
    </div>
  );
}
