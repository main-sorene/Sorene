import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
  activeConversationIdAtom,
  conversationsAtom,
  userAtom,
  isHistoryLoadingAtom,
  activeConversationAtom,
  isSendingAtom,
  Conversation,
} from "@/store/atoms";
import { useQuery } from "@tanstack/react-query";
import {
  chatKeys,
  getChatUserId,
  getChatHistory,
  mapHistoryToMessages,
} from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [, setActiveId] = useAtom(activeConversationIdAtom);
  const [authUser] = useAtom(userAtom);
  const [, setConversations] = useAtom(conversationsAtom);
  const [, setIsHistoryLoading] = useAtom(isHistoryLoadingAtom);
  const [activeConversation] = useAtom(activeConversationAtom);
  const [isSending] = useAtom(isSendingAtom);
  const { toast } = useToast();
  const userId = getChatUserId(authUser);

  useEffect(() => {
    if (id) setActiveId(id);
  }, [id, setActiveId]);

  const { data, isLoading, error } = useQuery({
    queryKey: id
      ? chatKeys.history(userId, id)
      : ["chat", "history", userId, "none"],
    queryFn: () => getChatHistory({ chatId: id as string }),
    enabled:
      Boolean(id) &&
      !(
        id?.startsWith("conv-") &&
        isSending &&
        (!activeConversation ||
          activeConversation.id !== id ||
          activeConversation.isCreatedOnBackend === false)
      ) &&
      (!activeConversation ||
        activeConversation.id !== id ||
        activeConversation.isCreatedOnBackend !== false),
    retry: (failureCount, error: any) => {
      if (failureCount < 3 && error?.message?.includes("History not found")) {
        return true;
      }
      return false;
    },
    retryDelay: 1000,
  });

  useEffect(() => {
    setIsHistoryLoading(isLoading);
  }, [isLoading, setIsHistoryLoading]);

  useEffect(() => {
    if (!id || !data) return;

    const historyMessages = mapHistoryToMessages(data.history ?? []);
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === id);
      const existingTitle = prev[existingIndex]?.title;
      const firstMessage = historyMessages[0]?.content;
      const firstAssistantMessage = historyMessages.find(
        (m) => m.role === "assistant",
      )?.content;
      const isFirstMessageCV = firstMessage && firstMessage.length > 500;

      const derivedTitle =
        existingTitle && existingTitle !== "New chat"
          ? existingTitle
          : isFirstMessageCV && firstAssistantMessage
            ? firstAssistantMessage.slice(0, 50) +
              (firstAssistantMessage.length > 50 ? "..." : "")
            : firstMessage
              ? firstMessage.slice(0, 50).trim() +
                (firstMessage.length > 50 ? "..." : "")
              : "New chat";

      const flow = data.flow;

      const next: Conversation = {
        id,
        title: derivedTitle,
        messages: historyMessages,
        createdAt: prev[existingIndex]?.createdAt ?? new Date(),
        updatedAt: prev[existingIndex]?.updatedAt ?? new Date(),
        model: prev[existingIndex]?.model ?? "sorene-1",
        nquestion: flow?.nquestion ?? prev[existingIndex]?.nquestion ?? 0,
        done: flow?.done,
        segment: prev[existingIndex]?.segment,
        isCreatedOnBackend: true,
      };

      if (existingIndex === -1) return [next, ...prev];
      return prev.map((c) => (c.id === id ? next : c));
    });
  }, [data, id, setConversations]);

  useEffect(() => {
    if (!error) return;
    // toast({
    //   title: "Could not load chat history",
    //   description: "Please try again in a moment.",
    //   variant: "destructive",
    // });
  }, [error, toast]);

  return null;
}
