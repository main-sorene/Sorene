"use client";

import { useState, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import {
  QUESTION_NODES,
  OPENING_MESSAGE,
  CV_REQUEST_MESSAGE,
  CV_CONTEXT_MESSAGE,
  getNode,
  getNodeMessage,
  getFollowUpMessage,
  AssessmentContext,
} from "@/lib/assessmentFlow";
import { computeDirection } from "@/lib/dnaEngine";
import { saveAssessmentResults } from "@/lib/firestore";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { userAtom, isAssessmentCompleteAtom, conversationsAtom, type Conversation } from "@/store/atoms";
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
  nextChoices?: string[],
  preferredLanguage?: string,
  previousAnswers?: Record<string, string>,
  cvSummary?: string,
): Promise<{
  reflection: string;
  translatedQuestion: string;
  translatedChoices: string[];
  detectedLanguage: string;
}> {
  try {
    const res = await authFetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, signal, questionText, nextQuestion, nextChoices, preferredLanguage, previousAnswers, cvSummary }),
    });
    if (!res.ok) return { reflection: "", translatedQuestion: "", translatedChoices: [], detectedLanguage: "" };
    const data = await res.json();
    return {
      reflection: data.reflection || "",
      translatedQuestion: data.translatedQuestion || "",
      translatedChoices: data.translatedChoices || [],
      detectedLanguage: data.detectedLanguage || "",
    };
  } catch {
    return { reflection: "", translatedQuestion: "", translatedChoices: [], detectedLanguage: "" };
  }
}

async function translateFollowUp(text: string, userAnswer: string, preferredLanguage?: string): Promise<string> {
  // Detect language from the user's actual answer and translate the follow-up into it
  try {
    const res = await authFetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: userAnswer, signal: "", questionText: "", nextQuestion: text, preferredLanguage }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    // If detected language is English, return original; otherwise return translated
    const lang = (data.detectedLanguage || "").toLowerCase();
    if (!lang || lang === "english") return text;
    return data.translatedQuestion || text;
  } catch {
    return text;
  }
}

async function fetchClosingSummary(
  firstName: string,
  answers: Record<string, string>,
  hasCv: boolean,
): Promise<string> {
  try {
    const res = await authFetch("/api/closing-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, answers, hasCv }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.summary || "";
  } catch {
    return "";
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
    const firstNode = getNode("q1_energy")!;
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
  const setConversations = useSetAtom(conversationsAtom);
  const firstName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";
  const hasCv = !!(authUser?.profile as any)?.cvData;
  const cvSummary = (authUser?.profile as any)?.cvSummary as string | undefined;

  const SESSION_KEY = `assessment_state_${authUser?.uid || "guest"}`;

  const [messages, setMessagesRaw] = useState<AssessmentMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) return parsed.messages;
      }
    } catch {}
    return buildInitialMessages(firstName, hasCv, cvSummary);
  });
  const [answers, setAnswersRaw] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved).answers || {};
    } catch {}
    return {};
  });
  const [flowState, setFlowStateRaw] = useState<FlowState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.flowState) return parsed.flowState;
      }
    } catch {}
    return hasCv
      ? { phase: "question", nodeId: QUESTION_NODES[0].id, awaitingFollowUp: false }
      : { phase: "cv_request" };
  });

  // Wrap setters to also persist to sessionStorage
  const persist = (update: Partial<{ messages: AssessmentMessage[]; answers: Record<string, string>; flowState: FlowState }>) => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      const current = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...update }));
    } catch {}
  };

  const setMessages = (updater: AssessmentMessage[] | ((prev: AssessmentMessage[]) => AssessmentMessage[])) => {
    setMessagesRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ messages: next });
      return next;
    });
  };
  const setAnswers = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    setAnswersRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ answers: next });
      return next;
    });
  };
  const setFlowState = (next: FlowState) => {
    persist({ flowState: next });
    setFlowStateRaw(next);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isProcessingCv, setIsProcessingCv] = useState(false);
  // For non-English flows: translated choice labels parallel to currentNode.choices.
  // Index N in translatedChoices corresponds to index N in currentNode.choices.
  const [translatedChoices, setTranslatedChoices] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState("");

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

        const res = await authFetch("/api/cv-summary", {
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
    // `text` is shown in chat as the user's message.
    // `canonicalAnswer` (optional) is the English version stored for scoring/branching.
    // For choice buttons in a translated language: text = translated label, canonicalAnswer = English.
    // For free-text or English choices: only `text` is needed.
    async (text: string, canonicalAnswer?: string) => {
      if (flowState.phase === "done" || flowState.phase === "closing") return;

      addMessage({ id: `user-${Date.now()}`, role: "user", content: text });

      if (flowState.phase === "cv_request" || flowState.phase === "opening") {
        skipCv();
        return;
      }

      const answerForLogic = canonicalAnswer ?? text;

      const { nodeId, awaitingFollowUp } = flowState as {
        phase: "question";
        nodeId: string;
        awaitingFollowUp: boolean;
        followUpType?: string;
      };
      const currentNode = getNode(nodeId)!;
      let newAnswers = { ...answers };

      if (awaitingFollowUp) {
        newAnswers = { ...newAnswers, [`${nodeId}_followup`]: answerForLogic };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };
        const nextId = typeof currentNode.next === "function"
          ? currentNode.next(newAnswers[nodeId] || "", ctx)
          : currentNode.next;
        await advanceToNode(nextId, newAnswers, ctx, currentNode.signal, text);
      } else {
        newAnswers = { ...newAnswers, [nodeId]: answerForLogic };
        setAnswers(newAnswers);
        const ctx: AssessmentContext = { profile: { firstName }, answers: newAnswers, hasCv };

        // Conditional follow-up — translate into same language as user's answer
        if (currentNode.followUp && currentNode.followUp.condition(answerForLogic)) {
          const rawFollowUpMsg = getFollowUpMessage(currentNode.followUp, answerForLogic);
          setIsReflecting(true);
          const followUpMsg = await translateFollowUp(rawFollowUpMsg, text, preferredLanguage);
          setIsReflecting(false);
          addMessage({ id: `fu-${Date.now()}`, role: "assistant", content: followUpMsg });
          setFlowState({ phase: "question", nodeId, awaitingFollowUp: true, followUpType: "condition" });
          return;
        }

        if (currentNode.alwaysFollowUp) {
          setIsReflecting(true);
          const alwaysMsg = await translateFollowUp(currentNode.alwaysFollowUp.message, text, preferredLanguage);
          setIsReflecting(false);
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
    [flowState, answers, firstName, hasCv, authUser, skipCv]
  );

  async function advanceToNode(
    nextId: string,
    currentAnswers: Record<string, string>,
    ctx: AssessmentContext,
    questionSignal: string,
    userAnswer: string,
  ) {
    if (nextId === "closing") {
      setIsReflecting(true);
      // Fetch reflection for final answer + closing summary in parallel
      const [{ reflection: closingReflection }, summary] = await Promise.all([
        fetchReflection(userAnswer, questionSignal, "", undefined, undefined, preferredLanguage, currentAnswers, (authUser?.profile as any)?.cvSummary),
        fetchClosingSummary(firstName, currentAnswers, hasCv),
      ]);
      setIsReflecting(false);

      if (closingReflection) {
        addMessage({ id: `reflect-closing-${Date.now()}`, role: "assistant", content: closingReflection });
      }
      // "Give me a moment" bridge line
      addMessage({
        id: `closing-bridge-${Date.now()}`,
        role: "assistant",
        content: "Thank you for being honest with me. Give me a moment to bring this together.",
      });
      if (summary) {
        addMessage({ id: `closing-summary-${Date.now()}`, role: "assistant", content: summary });
      }

      setFlowState({ phase: "closing" });
      setIsSaving(true);
      try {
        const eligibility = computeDirection(currentAnswers);
        if (authUser?.uid) {
          // Generate AI narrative in parallel with saving
          const narrativeResult = await authFetch("/api/dna-narrative", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: currentAnswers,
              cvSummary: (authUser?.profile as any)?.cvSummary,
            }),
          }).then((r) => r.json()).catch(() => ({ narrative: {} }));
          await saveAssessmentResults(authUser.uid, currentAnswers, eligibility, narrativeResult.narrative);
        }
        // Note: do NOT flip isAssessmentCompleteAtom here — that would unmount
        // this component and the user would never see the summary or nav buttons.
        // The atom flips when the user clicks a nav button (see AssessmentChatPage).
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
    const { reflection, translatedQuestion, translatedChoices: nextTranslatedChoices, detectedLanguage } =
      await fetchReflection(
        userAnswer,
        questionSignal,
        nextQuestion,
        nextQuestion,
        nextNode.choices,
        preferredLanguage,
        answers,
        (authUser?.profile as any)?.cvSummary,
      );
    if (detectedLanguage) setPreferredLanguage(detectedLanguage);
    setIsReflecting(false);

    const questionToShow = translatedQuestion || nextQuestion;
    addMessage({
      id: `q-${nextId}-${Date.now()}`,
      role: "assistant",
      content: reflection ? `${reflection}\n\n${questionToShow}` : questionToShow,
    });
    setTranslatedChoices(nextTranslatedChoices);
    setFlowState({ phase: "question", nodeId: nextId, awaitingFollowUp: false });
  }

  const currentNode = flowState.phase === "question" ? getNode(flowState.nodeId) : null;
  const isWaiting = isReflecting || isSaving || isProcessingCv;

  // Canonical (English) choices for the current node — used for scoring/branching
  const canonicalChoices: string[] | undefined =
    flowState.phase === "question" && !flowState.awaitingFollowUp
      ? currentNode?.choices
      : flowState.phase === "question" && (flowState as any).awaitingFollowUp
      ? (flowState as any).followUpType === "condition"
        ? currentNode?.followUp?.choices
        : currentNode?.alwaysFollowUp?.choices
      : undefined;

  // Display choices — translated if we have them, otherwise canonical English
  const displayChoices: string[] | undefined =
    canonicalChoices && translatedChoices.length === canonicalChoices.length && !((flowState as any).awaitingFollowUp)
      ? translatedChoices
      : canonicalChoices;

  const completeAssessment = useCallback(() => {
    const uid = authUser?.uid || "local";
    const assessmentConv: Conversation = {
      id: `assessment-${uid}`,
      title: "User Assessment Phase",
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(),
      })) as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      model: "sorene-1",
      done: true,
      segment: "assessment",
      isCreatedOnBackend: false, // prevents ChatPage from trying to fetch from backend
    };
    // Persist to localStorage so it survives page refreshes
    try {
      localStorage.setItem(`assessment_conv_${uid}`, JSON.stringify(assessmentConv));
    } catch {}
    setConversations((prev) => {
      if (prev.some((c) => c.segment === "assessment")) return prev;
      return [assessmentConv, ...prev];
    });
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setIsAssessmentComplete(true);
  }, [authUser?.uid, messages, setConversations, setIsAssessmentComplete, SESSION_KEY]);

  return {
    messages,
    sendMessage,
    skipCv,
    uploadCv,
    completeAssessment,
    isProcessingCv,
    isSaving,
    isWaiting,
    isCvRequest: flowState.phase === "cv_request",
    isDone: flowState.phase === "done",
    currentChoices: displayChoices,
    canonicalChoices,
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
