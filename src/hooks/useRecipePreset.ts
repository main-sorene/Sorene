import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  userAtom,
  conversationsAtom,
  isSendingAtom,
  selectedModelAtom,
  activeConversationIdAtom,
  isCreditsExhaustedOpenAtom,
  Conversation,
  Message,
} from "@/store/atoms";
import { useIsCreditsExhausted } from "./useIsCreditsExhausted";
import { useQuery } from "@tanstack/react-query";
import {
  getRecipeList,
  sendRecipePreset,
  getChatUserId,
  toApiModel,
} from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";

export function useRecipePreset({
  segment,
  onConversationCreated,
}: {
  segment: string;
  onConversationCreated?: (convId: string) => void;
}) {
  const authUser = useAtomValue(userAtom);
  const creditsExhausted = useIsCreditsExhausted();
  const setCreditsExhaustedOpen = useSetAtom(isCreditsExhaustedOpenAtom);
  const [, setConversations] = useAtom(conversationsAtom);
  const [isSending, setIsSending] = useAtom(isSendingAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const [, setActiveId] = useAtom(activeConversationIdAtom);
  const { toast } = useToast();

  const userId = getChatUserId(authUser);
  const apiModel = toApiModel(selectedModel);

  const { data: recipeData } = useQuery({
    queryKey: ["recipe", "list"],
    queryFn: getRecipeList,
    staleTime: Infinity,
  });

  const recipes = recipeData?.recipes ?? [];
  const suggestionLabels = recipes.map((r) => r.label);

  const handleRecipeClick = async (label: string) => {
    if (creditsExhausted) { setCreditsExhaustedOpen(true); return; }
    const recipe = recipes.find((r) => r.label === label);
    if (!recipe || isSending) return;

    setIsSending(true);

    const convId = `conv-${Date.now()}`;
    const streamingMsgId = `msg-${Date.now()}-ai`;

    const streamingMsg: Message = {
      id: streamingMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      type: "chat",
    };

    const newConv: Conversation = {
      id: convId,
      title: label,
      messages: [streamingMsg],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: selectedModel.id,
      nquestion: 0,
      segment,
      isCreatedOnBackend: false,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(convId);
    onConversationCreated?.(convId);

    try {
      const data = await sendRecipePreset({
        user_id: userId,
        client: apiModel.client,
        model: "CLAUDEO",
        token: 800,
        recipe: recipe.key,
      });

      const fullReply = data.response || "No response received.";
      let currentText = "";

      for (let i = 0; i < fullReply.length; i++) {
        currentText += fullReply[i];
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === streamingMsgId
                      ? { ...m, content: currentText }
                      : m,
                  ),
                }
              : c,
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === streamingMsgId
                    ? { ...m, content: fullReply, isStreaming: false }
                    : m,
                ),
                updatedAt: new Date(),
              }
            : c,
        ),
      );
    } catch (error) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.filter((m) => m.id !== streamingMsgId),
                updatedAt: new Date(),
              }
            : c,
        ),
      );
      toast({
        title: "Failed to load recipe",
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

  return { suggestionLabels, handleRecipeClick };
}
