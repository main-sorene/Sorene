"use client";

import { useState, useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, conversationsAtom, Conversation, Message } from "@/store/atoms";
import { useQueryClient } from "@tanstack/react-query";
import { saveUserProfile, clearDownstreamProfile } from "@/lib/firestore";
import { useDnaData } from "./useDnaData";

export interface DnaEditMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "confirm";
}

export interface PendingEdit {
  field: string;
  fieldLabel: string;
  current: string;
  proposed: string;
  confirmMessage: string;
}

type ApiResponse =
  | { intent: "edit"; field: string; fieldLabel: string; current: string; proposed: string; confirmMessage: string }
  | { intent: "chat"; reply: string };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useDnaEdit() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const { data: dnaData } = useDnaData();
  const setConversations = useSetAtom(conversationsAtom);

  const [messages, setMessages] = useState<DnaEditMessage[]>([]);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stable conversation ID for this session
  const convIdRef = useRef<string>(`dna-chat-${Date.now()}`);

  const persistToSidebar = useCallback((msgs: DnaEditMessage[]) => {
    const uid = user?.uid || "local";
    const convId = convIdRef.current;

    const sidebarMessages: Message[] = msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(),
      type: "chat" as const,
    }));

    const firstUserMsg = msgs.find((m) => m.role === "user")?.content || "DNA Chat";
    const title = firstUserMsg.slice(0, 50) + (firstUserMsg.length > 50 ? "..." : "");

    const conv: Conversation = {
      id: convId,
      title,
      messages: sidebarMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
      model: "sorene-1",
      segment: "dna",
      isCreatedOnBackend: false,
    };

    setConversations((prev) => {
      const existing = prev.findIndex((c) => c.id === convId);
      if (existing === -1) return [conv, ...prev];
      return prev.map((c) => (c.id === convId ? conv : c));
    });

    try {
      localStorage.setItem(`dna_chat_${uid}_${convId}`, JSON.stringify(conv));
    } catch {}
  }, [user?.uid, setConversations]);

  const appendMessage = useCallback((msg: Omit<DnaEditMessage, "id">) => {
    const id = makeId();
    const newMsg = { ...msg, id };
    setMessages((prev) => {
      const next = [...prev, newMsg];
      persistToSidebar(next);
      return next;
    });
  }, [persistToSidebar]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      appendMessage({ role: "user", content: text });
      setIsProcessing(true);

      try {
        const dnaProfile = dnaData?.dnaScores ?? {};

        const res = await fetch("/api/dna-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, dnaProfile }),
        });

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = (await res.json()) as ApiResponse;

        if (data.intent === "edit") {
          appendMessage({ role: "assistant", content: data.confirmMessage, type: "confirm" });
          setPendingEdit({
            field: data.field,
            fieldLabel: data.fieldLabel,
            current: data.current,
            proposed: data.proposed,
            confirmMessage: data.confirmMessage,
          });
        } else {
          appendMessage({ role: "assistant", content: data.reply });
        }
      } catch (error) {
        console.error("[useDnaEdit] sendMessage error:", error);
        appendMessage({ role: "assistant", content: "Sorry, I had trouble processing that. Please try again." });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, appendMessage, dnaData]
  );

  const confirmEdit = useCallback(async () => {
    if (!pendingEdit || !user?.uid) return;

    setIsProcessing(true);
    try {
      const currentScores = dnaData?.dnaScores ?? {};
      const updatedScores = { ...currentScores, [pendingEdit.field]: pendingEdit.proposed };

      // Update DNA scores, then wipe downstream Direction data (re-sync boundary)
      await saveUserProfile(user.uid, { dnaScores: updatedScores as any });
      await clearDownstreamProfile(user.uid);

      // Invalidate all downstream caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dna", user.uid] }),
        queryClient.invalidateQueries({ queryKey: ["direction"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", user.uid] }),
      ]);

      setPendingEdit(null);
      appendMessage({
        role: "assistant",
        content: `Done! I've updated your ${pendingEdit.fieldLabel} to "${pendingEdit.proposed}". Your Direction has been reset so it reflects your updated profile.`,
      });
    } catch (error) {
      console.error("[useDnaEdit] confirmEdit error:", error);
      appendMessage({ role: "assistant", content: "Sorry, I couldn't save that change. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  }, [pendingEdit, user, dnaData, queryClient, appendMessage]);

  const cancelEdit = useCallback(() => {
    if (!pendingEdit) return;
    setPendingEdit(null);
    appendMessage({
      role: "assistant",
      content: `No problem — your ${pendingEdit.fieldLabel} stays as "${pendingEdit.current}".`,
    });
  }, [pendingEdit, appendMessage]);

  return { messages, pendingEdit, isProcessing, sendMessage, confirmEdit, cancelEdit };
}
