"use client";

import { useState, useCallback } from "react";
import {
  QUESTION_NODES,
  OPENING_MESSAGE,
  CV_REQUEST_MESSAGE,
  CV_CONTEXT_MESSAGE,
  CLOSING_MESSAGE,
  getNode,
  getNodeMessage,
  getFollowUpMessage,
  AssessmentContext,
} from "@/lib/assessmentFlow";
import { computeDirection } from "@/lib/dnaEngine";
import { saveAssessmentResults } from "@/lib/firestore";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { userAtom, isAssessmentCompleteAtom } from "@/store/atoms";
import { saveUserProfile } from "@/lib/firestore";

export type AssessmentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "cv_request";
};

type FlowState =
  | { phase: "cv_request" }
  | { phase: "opening" }
  | { phase: "question"; nodeId: string; awaitingFollowUp: false }
  | { phase: "question"; nodeId: string; awaitingFollowUp: true; followUpType: "condition" | "always" }
  | { phase: "closing" }
  | { phase: "done" };

async function fetchReflection(
  answer: string,
  signal: string,
  questionText: string,
  nextQuestion?: string,
): Promise<{ reflection: string; translatedQuestion: string; detectedLanguage: string }> {
  try {
    const res = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, signal, questionText, nextQuestion }),
    });
    if (!res.ok) return { reflection: "", translatedQuestion: "", detectedLanguage: "" };
    const data = await res.json();
    return {
      reflection: data.reflection || "",
      translatedQuestion: data.translatedQuestion || "",
      detectedLanguage: data.detectedLanguage || "",
    };
  } catch {
    return { reflection: "", translatedQuestion: "", detectedLanguage: "" };
  }
}

async function translateText(text: string, language: string): Promise<string> {
  if (!language || language === "en" || language === "english") return text;
  try {
    const res = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Pass an empty answer so Claude only translates the nextQuestion
      body: JSON.stringify({ answer: "...", signal: "", questionText: "", nextQuestion: text, forceLanguage: language }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translatedQuestion || text;
  } catch {
    return text;
  }
}

function buildInitialMessages(
  firstName: string,
  hasCv: boolean,
  cvSummary?: string,
): AssessmentMessage[] {
  const opening: AssessmentMessage = {
    id: "opening",
    role: "assistant",
    content: OPENING_MESSAGE(firstName),
  };

  if (hasCv) {
    const ctx: AssessmentContext = { profile: { firstName }, answers: {}, hasCv: true };
    const firstNode = QUESTION_NODES[0];
    const messages: AssessmentMessage[] = [opening];
    if (cvSummary && cvSummary.trim()) {
      messages.push({
        id: "cv-context",
        role: "assistant",
        content: CV_CONTEXT_MESSAGE(cvSummary.trim()),
      });
    }
    messages.push({
      id: "first-q",
      role: "assistant",
      content: getNodeMessage(firstNode, ctx),
    });
    return messages;
  }

  return [
    opening,
    { id: "cv-request", role: "assistant", content: CV_REQUEST_MESSAGE, type: "cv_request" },
  ];
}

export function useAssessmentFlow() {
  const [authUser, setAuthUser] = useAtom(userAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const firstName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";
  const hasCv = !!(authUser?.profile as any)?.cvData;
  const cvSummary = (authUser?.profile as any)?.cvSummary as string | undefined;

  const [messages, setMessages] = useState<AssessmentMessage[]>(() =>
    buildInitialMessages(firstName, hasCv, cvSummary)
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flowState, setFlowState] = useState<FlowState>(() =>
    hasCv
      ? { phase: "question", nodeId: QUESTION_NODES[0].id, awaitingFollowUp: false }
      : { phase: "cv_request" }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isProcessingCv, setIsProcessingCv] = useState(false);
  // Detected from first user answer; used to translate follow-up messages
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");

  const addMessage = (msg: AssessmentMessage) =>
    setMessages((prev) => [...prev, msg]);

  // Skip path: route into the 4 background questions (bg1_history)
  const skipCv = useCallback(() => {
    const ctx: AssessmentContext = { profile: { firstName }, answers: {}, hasCv: false };
    const bgNode = getNode("bg1_history")!;
    addMessage({
      id: `bg1-${Date.now()}`,
      role: "assistant",
      content: getNodeMessage(bgNode, ctx),
    });
    setFlowState({ phase: "question", nodeId: "bg1_history", awaitingFollowUp: false });
  }, [firstName]);

  // Upload path: user attaches PDF/image during CV request
  const uploadCv = useCallback(
    async (file: File) => {
      if (!authUser?.uid) return;
      setIsProcessingCv(true);

      // Echo the upload to the chat as a user "message"
      addMessage({
        id: `user-cv-${Date.now()}`,
        role: "user",
        content: `Uploaded: ${file.name}`,
      });

      try {
        const buf = await file.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const fileBase64 = btoa(binary);

        const res = await fetch("/api/cv-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64, mimeType: file.type }),
        });

        let summary = "";
        if (res.ok) {
          const data = await res.json();
          summary = (data?.summary || "").trim();
        }

        const cvDataPayload = {
          file_name: file.name,
          file_path: "",
          status: "uploaded",
          text_length: file.size,
        };

        // Persist to Firestore and local atom
        await saveUserProfile(authUser.uid, {
          cvData: cvDataPayload,
          ...(summary ? { cvSummary: summary } : {}),
        } as any);

        setAuthUser({
          ...authUser,
          profile: {
            ...(authUser.profile as any),
            cvData: cvDataPayload,
            ...(summary ? { cvSummary: summary } : {}),
          },
        });

        // Show CV context (if we got a summary) + first energy question
        if (summary) {
          addMessage({
            id: `cv-context-${Date.now()}`,
            role: "assistant",
            content: CV_CONTEXT_MESSAGE(summary),
          });
        }
        const ctx: AssessmentContext = { profile: { firstName }, answers: {}, hasCv: true };
        addMessage({
          id: `first-q-${Date.now()}`,
          role: "assistant",
          content: getNodeMessage(QUESTION_NODES.find((n) => n.id === "q1_energy")!, ctx),
        });
        setFlowState({ phase: "question", nodeId: "q1_energy", awaitingFollowUp: false });
      } catch (e) {
        console.warn("CV upload failed:", e);
        // On failure, fall through to background questions so the assessment continues
        skipCv();
      } finally {
        setIsProcessingCv(false);
      }
    },
    [authUser, firstName, setAuthUser, skipCv],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (flowState.phase === "done" || flowState.phase === "closing") return;

      addMessage({ id: `user-${Date.now()}`, role: "user", content: text });

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
        newAnswers = { ...newAnswers, [`${nodeId}_followup`]: text };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };
        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(newAnswers[nodeId] || "", ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx, currentNode.signal, text);
      } else {
        newAnswers = { ...newAnswers, [nodeId]: text };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };

        // Conditional follow-up (no reflection before it — it's part of the same question)
        if (currentNode.followUp && currentNode.followUp.condition(text)) {
          const rawFollowUpMsg = getFollowUpMessage(currentNode.followUp, text);
          const followUpMsg = detectedLanguage
            ? await translateText(rawFollowUpMsg, detectedLanguage)
            : rawFollowUpMsg;
          addMessage({ id: `fu-${Date.now()}`, role: "assistant", content: followUpMsg });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "condition" });
          return;
        }

        if (currentNode.alwaysFollowUp) {
          const rawAlwaysMsg = currentNode.alwaysFollowUp.message;
          const alwaysMsg = detectedLanguage
            ? await translateText(rawAlwaysMsg, detectedLanguage)
            : rawAlwaysMsg;
          addMessage({ id: `afu-${Date.now()}`, role: "assistant", content: alwaysMsg });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "always" });
          return;
        }

        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(text, ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx, currentNode.signal, text);
      }
    },
    [flowState, answers, firstName, hasCv, authUser, skipCv, detectedLanguage]
  );

  async function advanceToNode(
    nextId: string,
    currentAnswers: Record<string, string>,
    ctx: AssessmentContext,
    questionSignal: string,
    userAnswer: string,
  ) {
    if (nextId === "closing") {
      // Get reflection for final answer, then closing
      setIsReflecting(true);
      const { reflection: closingReflection, translatedQuestion: translatedClosing } =
        await fetchReflection(userAnswer, questionSignal, "", CLOSING_MESSAGE);
      setIsReflecting(false);
      if (closingReflection) {
        addMessage({ id: `reflect-closing-${Date.now()}`, role: "assistant", content: closingReflection });
      }
      addMessage({
        id: `closing-${Date.now()}`,
        role: "assistant",
        content: translatedClosing || CLOSING_MESSAGE,
      });
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

    setIsReflecting(true);
    const nextQuestion = getNodeMessage(nextNode, ctx);
    const { reflection, translatedQuestion, detectedLanguage: lang } = await fetchReflection(
      userAnswer,
      questionSignal,
      nextQuestion,
      nextQuestion,
    );
    setIsReflecting(false);
    if (lang && lang.toLowerCase() !== "english" && !detectedLanguage) {
      setDetectedLanguage(lang);
    }

    const questionToShow = translatedQuestion || nextQuestion;
    addMessage({
      id: `q-${nextId}-${Date.now()}`,
      role: "assistant",
      content: reflection ? `${reflection}\n\n${questionToShow}` : questionToShow,
    });
    setFlowState({ phase: "question", nodeId: nextId, awaitingFollowUp: false });
  }

  const currentNode = flowState.phase === "question" ? getNode(flowState.nodeId) : null;
  const isWaiting = isReflecting || isSaving || isProcessingCv;

  return {
    messages,
    sendMessage,
    skipCv,
    uploadCv,
    isProcessingCv,
    isSaving,
    isWaiting,
    isCvRequest: flowState.phase === "cv_request",
    isDone: flowState.phase === "done",
    currentChoices:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.choices
        : flowState.phase === "question" && (flowState as any).awaitingFollowUp
        ? (flowState as any).followUpType === "condition"
          ? currentNode?.followUp?.choices
          : currentNode?.alwaysFollowUp?.choices
        : undefined,
    inputType:
      flowState.phase === "question" && !flowState.awaitingFollowUp
        ? currentNode?.inputType ?? "freetext"
        : flowState.phase === "question" && (flowState as any).awaitingFollowUp
        ? (flowState as any).followUpType === "condition"
          ? currentNode?.followUp?.inputType ?? "freetext"
          : currentNode?.alwaysFollowUp?.inputType ?? "freetext"
        : "freetext",
  };
}
