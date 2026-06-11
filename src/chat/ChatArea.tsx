"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  activeConversationAtom,
  isHistoryLoadingAtom,
  isAddMoreInfoModeAtom,
  isAssessmentCompleteAtom,
  isAssessmentInProgressAtom,
  selectedModelAtom,
  userAtom,
  ideationAtom,
  assistantThreadAtom,
  assistantThreadLoadingAtom,
} from "@/store/atoms";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  updateProfile,
  ideateSections,
  ideate,
  getChatUserId,
  toApiModel,
} from "@/lib/chatApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export function ChatArea() {
  const pathname = usePathname();
  const isAssistantPath = pathname === "/chat";

  const conversation = useAtomValue(activeConversationAtom);
  const isHistoryLoading = useAtomValue(isHistoryLoadingAtom);
  const assistantThread = useAtomValue(assistantThreadAtom);
  const assistantThreadLoading = useAtomValue(assistantThreadLoadingAtom);
  const [isAddMoreInfoMode, setIsAddMoreInfoMode] = useAtom(
    isAddMoreInfoModeAtom,
  );
  const [isAssessmentComplete, setIsAssessmentComplete] = useAtom(
    isAssessmentCompleteAtom,
  );
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const authUser = useAtomValue(userAtom);
  const setIdeation = useSetAtom(ideationAtom);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch profile to see if DNA data is already present
  const { data: profileRes } = useProfile();

  const queryClient = useQueryClient();

  // If profile exists, mark assessment as complete to hide buttons and enable chat —
  // but guard against flipping mid-session so AssessmentChatPage stays visible.
  useEffect(() => {
    if (profileRes?.dnaAssessmentComplete && !isAssessmentComplete && !isAssessmentInProgress) {
      const sessionKey = `assessment_state_${authUser?.uid || "guest"}`;
      if (!sessionStorage.getItem(sessionKey)) {
        setIsAssessmentComplete(true);
      }
    }
  }, [profileRes, isAssessmentComplete, isAssessmentInProgress, setIsAssessmentComplete, authUser?.uid]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const apiModel = toApiModel(selectedModel);
      const lastAssistantMessage =
        [...(conversation?.messages ?? [])]
          .reverse()
          .find((m) => m.role === "assistant")?.content ??
        "Complete Assessment";

      const commonPayload = {
        user_id: getChatUserId(authUser),
        user_name: authUser?.displayName || "User",
        character: "sorene",
        client: "claude",
        model: "CLAUDEH",
      };

      const result = await updateProfile({
        chat_id: conversation?.id ?? "",
        client: "claude",
        model: "CLAUDEH",
        name: authUser?.displayName ?? undefined,
        prompt: lastAssistantMessage,
        user_id: commonPayload.user_id,
      });

      // Fire-and-forget in sequence: ideateSections first, then ideate
      ideateSections(commonPayload)
        .then(() => ideate(commonPayload))
        .then((ideationRes) => setIdeation(ideationRes))
        .catch((err: unknown) => { console.error("[ideation] failed:", err); });

      return result;
    },
    onSuccess: () => {
      setIsAssessmentComplete(true);
      // Refresh profile data to ensure local state matches backend
      queryClient.invalidateQueries({ queryKey: ["profile", authUser?.uid] });
      queryClient.invalidateQueries({ queryKey: ["direction", authUser?.uid] });
      router.push("/dna");
    },
  });

  const isAssessmentDone = conversation?.done;

  const showButtons =
    isAssessmentDone && !isAddMoreInfoMode && !isAssessmentComplete;

  const setAssistantThread = useSetAtom(assistantThreadAtom);

  // On /chat, mirror settled conversation messages into assistantThreadAtom
  // so they appear in the persistent thread view after ChatInput streams them.
  useEffect(() => {
    if (!isAssistantPath || !conversation) return;
    const settled = conversation.messages.filter((m) => !m.isStreaming && !m.isHidden);
    if (settled.length === 0) return;
    setAssistantThread((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const toAdd = settled
        .filter((m) => !existingIds.has(m.id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m) => ({ ...m, createdAt: m.timestamp as any }));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, [isAssistantPath, conversation?.messages, setAssistantThread, conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    conversation?.messages?.length,
    conversation?.messages?.[conversation?.messages?.length - 1]?.content,
    assistantThread.length,
    assistantThread[assistantThread.length - 1]?.content,
  ]);

  // Assistant thread path — /chat with persistent coaching thread
  if (isAssistantPath) {
    if (assistantThreadLoading) {
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
          <ChatInput className="w-full max-w-5xl" disableNavigation segmentOverride="chat" />
        </div>
      );
    }

    if (assistantThread.length === 0) {
      return (
        <div className="flex-1 overflow-auto">
          <AssistantWelcomeScreen />
        </div>
      );
    }

    // Include any streaming messages from the temp conversation (while in-flight)
    const streamingMessages = (conversation?.messages ?? []).filter(
      (m) => m.isStreaming || !assistantThread.find((t) => t.id === m.id),
    ).filter((m) => !m.isHidden);

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-8" data-testid="assistant-thread">
            {assistantThread.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={{
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.createdAt ? (msg.createdAt as unknown as { toDate(): Date }).toDate() : new Date(),
                }}
              />
            ))}
            {streamingMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <ChatInput className="w-full max-w-4xl" disableNavigation segmentOverride="chat" />
      </div>
    );
  }

  if (!conversation || conversation.messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        <div
          className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-8"
          data-testid="message-list"
        >
          {conversation.messages
            .filter((m) => !m.isHidden)
            .map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

          {showButtons && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Button
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#111111] text-white hover:bg-[#333333] flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Complete Assessment
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddMoreInfoMode(true)}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto h-12 px-8 rounded-full border-2 border-[#111111] text-[#111111] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all hover:scale-105"
              >
                <Info size={20} />
                Add More Info
              </Button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Bottom-fixed input — only shown when there are messages */}
      <ChatInput className="w-full max-w-4xl" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function AssistantWelcomeScreen() {
  const authUser = useAtomValue(userAtom);
  const greeting = getGreeting();

  return (
    <div className="mt-20 flex flex-col items-center justify-start px-4 sm:px-8">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <img alt="Sorene logo" src="/figmaAssets/cube.svg" />
        </div>
        <div className="mb-8">
          <h1
            className="text-[32px] sm:text-[40px] font-medium text-[#111111] leading-tight mb-1"
            style={{ fontFamily: "Satoshi, Helvetica", letterSpacing: "-0.5px" }}
          >
            {greeting}, {authUser?.profile?.firstName} {authUser?.profile?.lastName}!
          </h1>
          <h2
            className="text-[32px] sm:text-[40px] font-medium text-[#111111] leading-tight"
            style={{ fontFamily: "Satoshi, Helvetica", letterSpacing: "-0.5px" }}
          >
            What&apos;s on your mind?
          </h2>
        </div>
        <ChatInput className="w-full max-w-5xl" disableNavigation segmentOverride="chat" />
      </div>
    </div>
  );
}
