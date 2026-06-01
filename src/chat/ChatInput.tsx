import { useAtom, useAtomValue } from "jotai";
import {
  inputValueAtom,
  isSendingAtom,
  activeConversationIdAtom,
  conversationsAtom,
  activeConversationAtom,
  selectedModelAtom,
  Message,
  Conversation,
  userAtom,
  cvTextAtom,
  isAddMoreInfoModeAtom,
  isAssessmentCompleteAtom,
} from "@/store/atoms";
import { Plus, Mic, ArrowUp, Settings } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  chatKeys,
  getChatUserId,
  sendReply,
  addProfileInfo,
  toApiModel,
} from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { transcribeAudio } from "@/lib/chatApi";
import { motion, AnimatePresence } from "framer-motion";
import { X, Square, Check, Loader2 } from "lucide-react";
import { useState } from "react";

export interface ChatInputProps {
  showFooter?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
  segmentOverride?: string;
  disableNavigation?: boolean;
}

export function ChatInput({
  showFooter = true,
  suggestions,
  onSuggestionClick,
  className,
  segmentOverride,
  disableNavigation,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [isSending, setIsSending] = useAtom(isSendingAtom);
  const [activeId, setActiveId] = useAtom(activeConversationIdAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const activeConversation = useAtomValue(activeConversationAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const [authUser] = useAtom(userAtom);
  const [cvText, setCvText] = useAtom(cvTextAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = getChatUserId(authUser);
  const [isAddMoreInfoMode, setIsAddMoreInfoMode] = useAtom(
    isAddMoreInfoModeAtom,
  );
  const [isAssessmentComplete] = useAtom(isAssessmentCompleteAtom);
  const apiModel = toApiModel(selectedModel);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const bioName = authUser?.profile
    ? `${authUser.profile.firstName} ${authUser.profile.lastName}`.trim() || undefined
    : (authUser?.displayName ?? undefined);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudioBlob,
    audioBlob,
  } = useVoiceRecorder();

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        toast({
          title: "Only PDF files supported",
          description: "Please attach a PDF file.",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
    },
    [toast],
  );

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      setIsDragging(true);
    };
    const onDragLeave = () => {
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setIsDragging(false);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) handleFileSelect(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleFileSelect]);

  const handleTranscription = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      try {
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        const { transcript } = await transcribeAudio(file);
        if (transcript) {
          setInputValue((prev) =>
            prev ? `${prev} ${transcript}` : transcript,
          );
        }
      } catch (error) {
        toast({
          title: "Transcription failed",
          description:
            "Could not convert your voice to text. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
      }
    },
    [setInputValue, toast],
  );

  useEffect(() => {
    if (audioBlob && !isTranscribing) {
      handleTranscription(audioBlob);
      clearAudioBlob();
    }
  }, [audioBlob, isTranscribing, handleTranscription, clearAudioBlob]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sendReplyMutation = useMutation({
    mutationFn: async ({
      prompt,
      chatId,
      nquestion,
      segment,
    }: {
      prompt: string;
      chatId: string;
      segment: string;
      nquestion?: number;
    }) =>
      sendReply({
        user_id: userId,
        prompt,
        chat_id: chatId,
        character: "sorene",
        client: apiModel.client,
        model: apiModel.model,
        name: bioName,
        nquestion: nquestion,
        segment: segmentOverride ?? segment,
        token: 300,
      }),
  });

  const addProfileInfoMutation = useMutation({
    mutationFn: async ({
      prompt,
      chatId,
    }: {
      prompt: string;
      chatId: string;
    }) =>
      addProfileInfo({
        user_id: userId,
        prompt,
        chat_id: chatId,
        client: apiModel.client,
        model: apiModel.model,
        name: bioName,
        token: 300,
      }),
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  // Focus input when inputValue changes from suggestion click
  useEffect(() => {
    if (inputValue && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [inputValue]);

  // Handle auto-send from CV upload
  useEffect(() => {
    if (cvText && !isSending && !activeId) {
      const text = cvText;
      setCvText(null); // Clear first to avoid re-triggering
      handleSend(text);
    }
  }, [cvText, isSending, activeId]);

  const handleSend = async (overrideContent?: string) => {
    const content = (overrideContent ?? inputValue).trim();
    if (!content || isSending) return;

    if (!overrideContent) setInputValue("");
    setIsSending(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      isHidden: !!overrideContent,
      attachedFileName: attachedFile?.name,
    };
    setAttachedFile(null);

    let convId = activeId;

    if (!convId) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: !!overrideContent
          ? "New chat"
          : content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [userMsg],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: selectedModel.id,
        nquestion: 0,
        segment: segmentOverride,
        isCreatedOnBackend: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      convId = newConv.id;
      if (!disableNavigation) {
        navigate(`/chat/${newConv.id}`);
      }
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
                updatedAt: new Date(),
              }
            : c,
        ),
      );
    }

    const streamingMsg: Message = {
      id: `msg-${Date.now()}-ai`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      type:
        segmentOverride === "dna" || segmentOverride === "ideation"
          ? "chat"
          : isAssessmentComplete
            ? "chat"
            : "psychometric",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, streamingMsg] } : c,
      ),
    );

    try {
      const currentNQuestion = activeConversation?.nquestion ?? 0;
      const isActuallyDone =
        activeConversation?.done ||
        isAssessmentComplete ||
        segmentOverride === "dna" ||
        segmentOverride === "ideation";
      let data;

      if (isAddMoreInfoMode) {
        data = await addProfileInfoMutation.mutateAsync({
          prompt: content,
          chatId: convId as string,
        });
        setIsAddMoreInfoMode(false);
      } else {
        data = await sendReplyMutation.mutateAsync({
          prompt: content,
          chatId: convId as string,
          nquestion: !isActuallyDone ? currentNQuestion : undefined,
          segment: isActuallyDone ? "chat" : "psychometric",
        });
      }

      const fullReply = data.reply || "No response received.";
      let currentText = "";

      // Update metadata first (nquestion, etc.)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                nquestion: data.nquestion,
                done: data.done,
                updatedAt: new Date(),
                isCreatedOnBackend: true,
              }
            : c,
        ),
      );

      // Typewriter animation
      for (let i = 0; i < fullReply.length; i++) {
        currentText += fullReply[i];
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === streamingMsg.id
                      ? { ...m, content: currentText }
                      : m,
                  ),
                }
              : c,
          ),
        );
        // Speed control: adjust for longer messages if needed
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Finalize message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === streamingMsg.id
                    ? {
                        ...m,
                        content: fullReply,
                        isStreaming: false,
                        done: data.done,
                      }
                    : m,
                ),
                updatedAt: new Date(),
                title:
                  c.messages[0]?.isHidden && c.title === "New chat"
                    ? fullReply.slice(0, 50) +
                      (fullReply.length > 50 ? "..." : "")
                    : c.title,
              }
            : c,
        ),
      );

      // Wait briefly to allow backend to persist history
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: chatKeys.history(userId, convId as string),
        });
      }, 1000);
    } catch (error) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.filter((m) => m.id !== streamingMsg.id),
                updatedAt: new Date(),
              }
            : c,
        ),
      );
      toast({
        title: "Message failed to send",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentNQuestion = activeConversation?.nquestion ?? 0;

  const isAssessmentDone = activeConversation?.done;

  const isInputDisabled =
    isAssessmentDone && !isAddMoreInfoMode && !isAssessmentComplete;

  const canSend =
    inputValue.trim().length > 0 && !isSending && !isInputDisabled;

  return (
    <div className={cn("w-full max-w-[680px] mx-auto", className)}>
      <div
        className={cn(
          "flex flex-col gap-4 p-6 rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
          "focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200",
        )}
      >
        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar -mx-6 px-6 gap-2 pb-2 scroll-smooth sm:flex-wrap sm:overflow-x-visible sm:mx-0 sm:px-0">
            {(showAllSuggestions ? suggestions : suggestions.slice(0, 3)).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick ? onSuggestionClick(suggestion) : setInputValue(suggestion)}
                className="text-body-xsmall-medium flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#111111] hover:bg-[#F1F3F5] active:bg-[#E5E7EB] transition-all whitespace-nowrap shrink-0"
              >
                <img
                  src="/figmaAssets/starfour.svg"
                  className="w-3.5 h-3.5"
                  alt=""
                />
                {suggestion}
              </button>
            ))}
            {suggestions.length > 3 && (
              <button
                onClick={() => setShowAllSuggestions((prev) => !prev)}
                className="text-body-xsmall-medium flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ECEDEE] bg-white text-xs font-medium text-[#6B7280] hover:bg-[#F1F3F5] hover:text-[#111111] active:bg-[#E5E7EB] transition-all whitespace-nowrap shrink-0"
              >
                {showAllSuggestions ? "View less" : "View all"}
              </button>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="relative min-h-[44px]">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between w-full bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-red-100 rounded-full"
                    />
                    <div className="relative z-10 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-[#111111] font-medium tabular-nums">
                    {formatTime(recordingTime)}
                  </span>
                  <div className="flex items-center gap-1 h-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [8, Math.random() * 16 + 8, 8],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + Math.random() * 0.5,
                          ease: "easeInOut",
                        }}
                        className="w-1 bg-[#111111] rounded-full"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelRecording}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-2 rounded-full bg-[#111111] text-white hover:bg-black transition-colors"
                    title="Stop and Transcribe"
                  >
                    <Square size={18} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ) : isTranscribing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 w-full bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB]"
              >
                <Loader2 className="w-5 h-5 text-[#111111] animate-spin" />
                <span className="text-[#111111] font-medium">
                  Transcribing your voice...
                </span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <textarea
                  ref={textareaRef}
                  data-testid="chat-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  rows={1}
                  disabled={isInputDisabled}
                  className="w-full resize-none bg-transparent text-[17px] leading-[1.45] text-[#111111] placeholder:text-[#6B7280] focus:outline-none min-h-0 sm:min-h-[44px] max-h-[160px] pr-14"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Attached file preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-1 -mt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-lg text-sm text-[#111111] max-w-full">
              <span className="max-w-65 truncate">{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-[#6B7280] hover:text-[#111111] shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between -mx-1 mt-1">
          <div className="flex items-center gap-1">
            <button
              data-testid="attach-button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              title="Attach PDF"
            >
              <Plus size={22} className="text-[#111111]" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              data-testid="voice-button"
              onClick={startRecording}
              disabled={isRecording || isTranscribing || isInputDisabled}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                isRecording
                  ? "bg-red-50 text-red-600"
                  : "hover:bg-gray-100 text-[#111111]",
                (isTranscribing || isInputDisabled) &&
                  "opacity-50 cursor-not-allowed",
              )}
              title="Voice Input"
            >
              <Mic size={22} />
            </button>

            <button
              data-testid="settings-button"
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              title="Sorene Settings"
            >
              <Settings size={22} className="text-[#111111]" />
            </button>

            <button
              data-testid="send-button"
              onClick={() => handleSend()}
              disabled={!canSend}
              className={cn(
                "ml-2 w-10 h-10 rounded-md flex items-center justify-center transition-all",
                canSend
                  ? "bg-[#111111] text-white hover:bg-black shadow-sm active:scale-95"
                  : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed",
              )}
            >
              <ArrowUp size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {showFooter && (
        <button
          onClick={() => navigate("/responsible-ai")}
          className="w-full text-center text-xs text-[#62646A] mt-2 hover:text-black transition-colors"
        >
          Sorene can make mistakes. Consider checking important information.
        </button>
      )}

      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <img
              src="/figmaAssets/drag-and-drop.svg"
              alt="Drag file here to add to chat"
              className="w-58 h-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
