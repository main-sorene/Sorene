"use client";

import { useState, useCallback } from "react";
import {
  QUESTION_NODES,
  OPENING_MESSAGE,
  CLOSING_MESSAGE,
  getNode,
  getNodeMessage,
  getFollowUpMessage,
  AssessmentContext,
} from "@/lib/assessmentFlow";
import { computeDirection } from "@/lib/dnaEngine";
import { saveAssessmentResults } from "@/lib/firestore";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, isAssessmentCompleteAtom } from "@/store/atoms";

export type AssessmentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type FlowState =
  | { phase: "opening" }
  | { phase: "question"; nodeId: string; awaitingFollowUp: false }
  | { phase: "question"; nodeId: string; awaitingFollowUp: true; followUpType: "condition" | "always" }
  | { phase: "closing" }
  | { phase: "done" };

export function useAssessmentFlow() {
  const authUser = useAtomValue(userAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const firstName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";

  const [messages, setMessages] = useState<AssessmentMessage[]>([
    {
      id: "opening",
      role: "assistant",
      content: OPENING_MESSAGE(firstName),
    },
    {
      id: "first-q",
      role: "assistant",
      content: (() => {
        const node = QUESTION_NODES[0];
        const ctx: AssessmentContext = {
          profile: { firstName },
          answers: {},
          hasCv: false,
        };
        return getNodeMessage(node, ctx);
      })(),
    },
  ]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flowState, setFlowState] = useState<FlowState>({
    phase: "question",
    nodeId: QUESTION_NODES[0].id,
    awaitingFollowUp: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const addMessage = (msg: AssessmentMessage) =>
    setMessages((prev) => [...prev, msg]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (flowState.phase === "done" || flowState.phase === "closing") return;

      const userMsg: AssessmentMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      addMessage(userMsg);

      if (flowState.phase === "opening") return;

      const { nodeId, awaitingFollowUp } = flowState as { phase: "question"; nodeId: string; awaitingFollowUp: boolean; followUpType?: string };
      const currentNode = getNode(nodeId)!;

      let newAnswers = { ...answers };

      if (awaitingFollowUp) {
        // Store follow-up answer with _followup suffix
        const followUpKey = `${nodeId}_followup`;
        newAnswers = { ...newAnswers, [followUpKey]: text };
        setAnswers(newAnswers);

        // Move to next question
        const ctx: AssessmentContext = {
          profile: { firstName },
          answers: newAnswers,
          hasCv: false,
        };
        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(newAnswers[nodeId] || "", ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx);
      } else {
        // Store primary answer
        newAnswers = { ...newAnswers, [nodeId]: text };
        setAnswers(newAnswers);

        const ctx: AssessmentContext = {
          profile: { firstName },
          answers: newAnswers,
          hasCv: false,
        };

        // Check for conditional follow-up
        if (currentNode.followUp && currentNode.followUp.condition(text)) {
          const followUpMsg = getFollowUpMessage(currentNode.followUp, text);
          addMessage({ id: `fu-${Date.now()}`, role: "assistant", content: followUpMsg });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "condition" });
          return;
        }

        // Check for always follow-up
        if (currentNode.alwaysFollowUp) {
          addMessage({ id: `afu-${Date.now()}`, role: "assistant", content: currentNode.alwaysFollowUp.message });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "always" });
          return;
        }

        // Move to next node
        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(text, ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx);
      }
    },
    [flowState, answers, firstName, authUser]
  );

  async function advanceToNode(
    nextId: string,
    currentAnswers: Record<string, string>,
    ctx: AssessmentContext,
  ) {
    if (nextId === "closing") {
      addMessage({ id: `closing-${Date.now()}`, role: "assistant", content: CLOSING_MESSAGE });
      setFlowState({ phase: "closing" });

      // Compute and save
      setIsSaving(true);
      try {
        const eligibility = computeDirection(currentAnswers);
        if (authUser?.uid) {
          await saveAssessmentResults(authUser.uid, currentAnswers, eligibility);
        }
        setIsAssessmentComplete(true);
        setFlowState({ phase: "done" });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const nextNode = getNode(nextId);
    if (!nextNode) return;

    const msg = getNodeMessage(nextNode, ctx);
    addMessage({ id: `q-${nextId}-${Date.now()}`, role: "assistant", content: msg });
    setFlowState({ phase: "question", nodeId: nextId, awaitingFollowUp: false });
  }

  const currentNode =
    flowState.phase === "question" ? getNode(flowState.nodeId) : null;

  return {
    messages,
    sendMessage,
    isSaving,
    isDone: flowState.phase === "done",
    currentChoices:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.choices
        : flowState.phase === "question" && flowState.awaitingFollowUp
        ? flowState.followUpType === "condition"
          ? currentNode?.followUp?.choices
          : currentNode?.alwaysFollowUp?.choices
        : undefined,
    inputType:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.inputType ?? "freetext"
        : flowState.phase === "question" && flowState.awaitingFollowUp
        ? flowState.followUpType === "condition"
          ? currentNode?.followUp?.inputType ?? "freetext"
          : currentNode?.alwaysFollowUp?.inputType ?? "freetext"
        : "freetext",
  };
}
