"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  QUESTION_NODES,
  OPENING_MESSAGE,
  CLOSING_MESSAGE,
  getNode,
  getNodeMessage,
  type AssessmentContext,
  type QuestionNode,
} from "@/lib/assessmentFlow";

type MessageRole = "sorene" | "user";

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
}

type TurnState =
  | { phase: "idle" }
  | { phase: "thinking" }
  | {
      phase: "awaiting_input";
      node: QuestionNode;
      isFollowUp: boolean;
      followUpMessage?: string;
      followUpChoices?: string[];
    }
  | { phase: "closing" }
  | { phase: "done" };

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-2 max-w-[75%]">
      <div className="bg-slate-100 text-slate-800 rounded-lg rounded-tl-none px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "sorene") {
    return (
      <div className="flex items-start gap-2 max-w-[75%]">
        <div className="bg-slate-100 text-slate-800 rounded-lg rounded-tl-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 max-w-[75%] self-end">
      <div className="bg-slate-900 text-white rounded-lg rounded-tr-none px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {message.text}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turnState, setTurnState] = useState<TurnState>({ phase: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [profile, setProfile] = useState<{ firstName: string; cvFileName?: string | null } | null>(null);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answersRef = useRef<Record<string, string>>({});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, turnState, scrollToBottom]);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    const onboardingKey = `sorene_onboarding_complete_${user.uid}`;
    if (!localStorage.getItem(onboardingKey)) {
      router.replace("/onboarding");
      return;
    }
    const profileKey = `sorene_profile_${user.uid}`;
    const raw = localStorage.getItem(profileKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProfile(parsed);
      } catch {
        setProfile({ firstName: "there" });
      }
    } else {
      setProfile({ firstName: "there" });
    }
  }, [user, loading, router]);

  // Initialize flow once profile is ready
  useEffect(() => {
    if (!profile || initialized) return;
    setInitialized(true);

    const openingText = OPENING_MESSAGE(profile.firstName);
    const openingMsg: ChatMessage = {
      id: "opening",
      role: "sorene",
      text: openingText,
    };
    setMessages([openingMsg]);

    // Show first question after delay
    setTimeout(() => {
      const firstNode = QUESTION_NODES[0];
      const ctx: AssessmentContext = {
        profile,
        answers: {},
        hasCv: !!profile.cvFileName,
      };
      const nodeMsg = getNodeMessage(firstNode, ctx);
      setMessages((prev) => [
        ...prev,
        { id: `sorene_${firstNode.id}`, role: "sorene", text: nodeMsg },
      ]);
      setTurnState({
        phase: "awaiting_input",
        node: firstNode,
        isFollowUp: false,
      });
    }, 1200);
  }, [profile, initialized]);

  const buildCtx = useCallback(
    (currentAnswers: Record<string, string>): AssessmentContext => ({
      profile: profile!,
      answers: currentAnswers,
      hasCv: !!profile?.cvFileName,
    }),
    [profile]
  );

  const persistAnswers = useCallback(
    (newAnswers: Record<string, string>) => {
      if (!user) return;
      localStorage.setItem(
        `sorene_dna_answers_${user.uid}`,
        JSON.stringify(newAnswers)
      );
    },
    [user]
  );

  const proceedToNextNode = useCallback(
    (nextId: string, currentAnswers: Record<string, string>) => {
      if (nextId === "closing") {
        setTurnState({ phase: "closing" });
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: "closing", role: "sorene", text: CLOSING_MESSAGE },
          ]);
          setTurnState({ phase: "done" });
          // Save completion flag
          if (user) {
            localStorage.setItem(`sorene_dna_complete_${user.uid}`, "true");
          }
          setTimeout(() => {
            router.push("/assessment/complete");
          }, 2500);
        }, 1200);
        return;
      }

      const nextNode = getNode(nextId);
      if (!nextNode) return;

      setTimeout(() => {
        const ctx = buildCtx(currentAnswers);
        const nodeMsg = getNodeMessage(nextNode, ctx);
        setMessages((prev) => [
          ...prev,
          { id: `sorene_${nextNode.id}_${Date.now()}`, role: "sorene", text: nodeMsg },
        ]);
        setTurnState({
          phase: "awaiting_input",
          node: nextNode,
          isFollowUp: false,
        });
        setSelectedChoice(null);
        setShowCustomInput(false);
        setCustomText("");
      }, 1200);
    },
    [buildCtx, router, user]
  );

  const handleAnswerSubmit = useCallback(
    (answerText: string) => {
      if (!answerText.trim() || turnState.phase !== "awaiting_input") return;
      const { node, isFollowUp } = turnState;

      // Add user message
      const userMsg: ChatMessage = {
        id: `user_${node.id}_${isFollowUp ? "followup" : "main"}_${Date.now()}`,
        role: "user",
        text: answerText.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Store answer
      const answerKey = isFollowUp ? `${node.id}_followup` : node.id;
      const newAnswers = { ...answersRef.current, [answerKey]: answerText.trim() };
      answersRef.current = newAnswers;
      setAnswers(newAnswers);
      persistAnswers(newAnswers);

      // Update progress count (only main questions)
      if (!isFollowUp) {
        setAnsweredCount((c) => c + 1);
      }

      setTextInput("");
      setSelectedChoice(null);
      setShowCustomInput(false);
      setCustomText("");
      setTurnState({ phase: "thinking" });

      // Check for follow-up
      if (!isFollowUp) {
        // Check alwaysFollowUp first
        if (node.alwaysFollowUp) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `sorene_followup_${node.id}_${Date.now()}`,
                role: "sorene",
                text: node.alwaysFollowUp!.message,
              },
            ]);
            setTurnState({
              phase: "awaiting_input",
              node,
              isFollowUp: true,
              followUpMessage: node.alwaysFollowUp!.message,
              followUpChoices: node.alwaysFollowUp!.choices,
            });
          }, 1200);
          return;
        }

        // Check conditional followUp
        if (node.followUp && node.followUp.condition(answerText)) {
          const rawMsg = node.followUp.message as string | ((a: string) => string);
          const followUpMsg =
            typeof rawMsg === "function" ? rawMsg(answerText) : rawMsg;

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `sorene_followup_${node.id}_${Date.now()}`,
                role: "sorene",
                text: followUpMsg,
              },
            ]);
            setTurnState({
              phase: "awaiting_input",
              node,
              isFollowUp: true,
              followUpMessage: followUpMsg,
              followUpChoices: node.followUp!.choices,
            });
          }, 1200);
          return;
        }
      }

      // No follow-up or follow-up already done — proceed to next
      const nextId =
        typeof node.next === "function"
          ? node.next(answerText, buildCtx(newAnswers))
          : node.next;

      proceedToNextNode(nextId, newAnswers);
    },
    [turnState, persistAnswers, buildCtx, proceedToNextNode]
  );

  const handleChoiceSelect = useCallback(
    (choice: string) => {
      if (turnState.phase !== "awaiting_input") return;
      setSelectedChoice(choice);
      handleAnswerSubmit(choice);
    },
    [turnState, handleAnswerSubmit]
  );

  const handleTextSend = useCallback(() => {
    const text = showCustomInput ? customText : textInput;
    handleAnswerSubmit(text);
  }, [showCustomInput, customText, textInput, handleAnswerSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleTextSend();
      }
    },
    [handleTextSend]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [textInput]);

  if (loading || !user || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  const totalQuestions = 11;
  const currentPhase = turnState.phase;

  // Determine what input to show
  const isAwaitingInput = currentPhase === "awaiting_input";
  const currentNode = isAwaitingInput ? turnState.node : null;
  const isFollowUp = isAwaitingInput ? turnState.isFollowUp : false;
  const followUpChoices = isAwaitingInput ? turnState.followUpChoices : undefined;

  // What input type to show
  let activeInputType: "freetext" | "choice" = "freetext";
  let activeChoices: string[] | undefined;
  let activeAllowCustom = false;

  if (isAwaitingInput && currentNode) {
    if (isFollowUp) {
      const fu = currentNode.alwaysFollowUp || currentNode.followUp;
      activeInputType = fu?.inputType ?? "freetext";
      activeChoices = followUpChoices;
      activeAllowCustom = false;
    } else {
      activeInputType = currentNode.inputType;
      activeChoices = currentNode.choices;
      activeAllowCustom = currentNode.allowCustom ?? false;
    }
  }

  const canSendText =
    showCustomInput ? customText.trim().length > 0 : textInput.trim().length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <span className="text-lg font-semibold text-slate-900 tracking-tight">
          Sorene
        </span>
        <span className="text-sm text-slate-400">
          {answeredCount > 0
            ? `Question ${Math.min(answeredCount + (isAwaitingInput && !isFollowUp ? 0 : 0), totalQuestions)} of ${totalQuestions}`
            : `Question 1 of ${totalQuestions}`}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {currentPhase === "thinking" && <ThinkingBubble />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {isAwaitingInput && (
        <div className="flex-none border-t border-slate-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl">
            {activeInputType === "choice" && activeChoices ? (
              <div className="flex flex-col gap-2">
                {activeChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={selectedChoice !== null}
                    className={`w-full text-left px-4 py-3 rounded-md border text-sm text-slate-800 transition-colors ${
                      selectedChoice === choice
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {choice}
                  </button>
                ))}
                {activeAllowCustom && !showCustomInput && (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 mt-1 text-left transition-colors"
                  >
                    or type your own
                  </button>
                )}
                {showCustomInput && (
                  <div className="flex gap-2 mt-2">
                    <textarea
                      className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:border-slate-400"
                      rows={2}
                      placeholder="Type your own answer..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          if (customText.trim()) handleAnswerSubmit(customText);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customText.trim()) handleAnswerSubmit(customText);
                      }}
                      disabled={!customText.trim()}
                      className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed self-end"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:border-slate-400 min-h-[42px] max-h-[120px]"
                  placeholder="Type your answer... (Cmd+Enter to send)"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  onClick={handleTextSend}
                  disabled={!canSendText}
                  className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed h-[42px]"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentPhase === "done" && (
        <div className="flex-none border-t border-slate-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm text-slate-400 text-center">
              Building your DNA profile...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
