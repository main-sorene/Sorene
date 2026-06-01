"use client";

import { useState, useCallback } from "react";
import {
  QUESTION_NODES,
  OPENING_MESSAGE,
  CV_REQUEST_MESSAGE,
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
  // Special message types for UI rendering
  type?: "cv_request";
};

type FlowState =
  | { phase: "cv_request" }
  | { phase: "opening" }
  | { phase: "question"; nodeId: string; awaitingFollowUp: false }
  | { phase: "question"; nodeId: string; awaitingFollowUp: true; followUpType: "condition" | "always" }
  | { phase: "closing" }
  | { phase: "done" };

function buildInitialMessages(
  firstName: string,
  hasCv: boolean,
  cvSummary?: string,
): AssessmentMessage[] {
  if (hasCv) {
    // With CV: show personalized intro + go straight to questions (first question included)
    const openingText = OPENING_MESSAGE(firstName, true, cvSummary);
    const ctx: AssessmentContext = { profile: { firstName }, answers: {}, hasCv: true };
    const firstNode = QUESTION_NODES[0];
    return [
      { id: "opening", role: "assistant", content: openingText },
      { id: "first-q", role: "assistant", content: getNodeMessage(firstNode, ctx) },
    ];
  }
  // Without CV: show intro + CV request
  const openingText = OPENING_MESSAGE(firstName, false);
  return [
    { id: "opening", role: "assistant", content: openingText },
    { id: "cv-request", role: "assistant", content: CV_REQUEST_MESSAGE, type: "cv_request" },
  ];
}

export function useAssessmentFlow() {
  const authUser = useAtomValue(userAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const firstName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";
  const hasCv = !!(authUser?.profile as any)?.cvData;

  const [messages, setMessages] = useState<AssessmentMessage[]>(() =>
    buildInitialMessages(firstName, hasCv)
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flowState, setFlowState] = useState<FlowState>(() => {
    if (hasCv) {
      return { phase: "question", nodeId: QUESTION_NODES[0].id, awaitingFollowUp: false };
    }
    return { phase: "cv_request" };
  });
  const [isSaving, setIsSaving] = useState(false);

  const addMessage = (msg: AssessmentMessage) =>
    setMessages((prev) => [...prev, msg]);

  // Called when user clicks "Skip" or "No" on CV request
  const skipCv = useCallback(() => {
    const ctx: AssessmentContext = { profile: { firstName }, answers: {}, hasCv: false };
    const firstNode = QUESTION_NODES[0];
    addMessage({ id: `first-q-${Date.now()}`, role: "assistant", content: getNodeMessage(firstNode, ctx) });
    setFlowState({ phase: "question", nodeId: QUESTION_NODES[0].id, awaitingFollowUp: false });
  }, [firstName]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (flowState.phase === "done" || flowState.phase === "closing") return;

      const userMsg: AssessmentMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      addMessage(userMsg);

      // CV request phase: any typed reply treated as "no CV, just start"
      if (flowState.phase === "cv_request" || flowState.phase === "opening") {
        skipCv();
        return;
      }

      const { nodeId, awaitingFollowUp } = flowState as {
        phase: "question";
        nodeId: string;
        awaitingFollowUp: boolean;
        followUpType?: string;
      };
      const currentNode = getNode(nodeId)!;
      let newAnswers = { ...answers };

      if (awaitingFollowUp) {
        const followUpKey = `${nodeId}_followup`;
        newAnswers = { ...newAnswers, [followUpKey]: text };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };
        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(newAnswers[nodeId] || "", ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx);
      } else {
        newAnswers = { ...newAnswers, [nodeId]: text };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };

        if (currentNode.followUp && currentNode.followUp.condition(text)) {
          const followUpMsg = getFollowUpMessage(currentNode.followUp, text);
          addMessage({ id: `fu-${Date.now()}`, role: "assistant", content: followUpMsg });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "condition" });
          return;
        }

        if (currentNode.alwaysFollowUp) {
          addMessage({ id: `afu-${Date.now()}`, role: "assistant", content: currentNode.alwaysFollowUp.message });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "always" });
          return;
        }

        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(text, ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx);
      }
    },
    [flowState, answers, firstName, hasCv, authUser, skipCv]
  );

  async function advanceToNode(
    nextId: string,
    currentAnswers: Record<string, string>,
    ctx: AssessmentContext,
  ) {
    if (nextId === "closing") {
      addMessage({ id: `closing-${Date.now()}`, role: "assistant", content: CLOSING_MESSAGE });
      setFlowState({ phase: "closing" });
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

  const currentNode = flowState.phase === "question" ? getNode(flowState.nodeId) : null;

  return {
    messages,
    sendMessage,
    skipCv,
    isSaving,
    isCvRequest: flowState.phase === "cv_request",
    isDone: flowState.phase === "done",
    currentChoices:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.choices
        : flowState.phase === "question" && flowState.awaitingFollowUp
        ? (flowState as any).followUpType === "condition"
          ? currentNode?.followUp?.choices
          : currentNode?.alwaysFollowUp?.choices
        : undefined,
    inputType:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.inputType ?? "freetext"
        : flowState.phase === "question" && flowState.awaitingFollowUp
        ? (flowState as any).followUpType === "condition"
          ? currentNode?.followUp?.inputType ?? "freetext"
          : currentNode?.alwaysFollowUp?.inputType ?? "freetext"
        : "freetext",
  };
}
