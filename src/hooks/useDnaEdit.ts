"use client";

import { useState, useCallback } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useQueryClient } from "@tanstack/react-query";
import { saveUserProfile } from "@/lib/firestore";
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

export function useDnaEdit() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const { data: dnaData } = useDnaData();

  const [messages, setMessages] = useState<DnaEditMessage[]>([]);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const appendMessage = useCallback((msg: Omit<DnaEditMessage, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { ...msg, id }]);
  }, []);

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

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

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
        appendMessage({
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try again.",
        });
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

      await saveUserProfile(user.uid, { dnaScores: updatedScores as any });
      await queryClient.invalidateQueries({ queryKey: ["dna", user.uid] });

      setPendingEdit(null);
      appendMessage({
        role: "assistant",
        content: `Done! I've updated your ${pendingEdit.fieldLabel} to "${pendingEdit.proposed}". 🎉`,
      });
    } catch (error) {
      console.error("[useDnaEdit] confirmEdit error:", error);
      appendMessage({
        role: "assistant",
        content: "Sorry, I couldn't save that change. Please try again.",
      });
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

  return {
    messages,
    pendingEdit,
    isProcessing,
    sendMessage,
    confirmEdit,
    cancelEdit,
  };
}
