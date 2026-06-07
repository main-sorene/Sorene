"use client";

import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, conversationsAtom, Conversation, Message, isSettingsOpenAtom, recipeDirectionsAtom, RecipeDirection, resourcesConstraintsAtom, newRecipeCardIdAtom, isCreditsExhaustedOpenAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { useIsCreditsExhausted } from "@/hooks/useIsCreditsExhausted";
import { Plus, X, ArrowUp, Loader2, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDirectionResult } from "@/hooks/useDirectionResult";
import { useDnaData } from "@/hooks/useDnaData";


const DIRECTION_RECIPES = [
  { label: "Brainstorm new idea", id: "brainstorm-new-idea" },
  { label: "Check my idea",       id: "check-my-idea" },
];

// Emitted by the recipe prompts once enough info is gathered; signals the UI to
// show a "Generate" button instead of producing the card automatically.
// Matched loosely (case/spacing/formatting tolerant) so a stray variant from the
// model still triggers the button instead of leaking into the chat bubble.
const READY_MARKER_RE = /\[\[\s*READY[_\s]*TO[_\s]*GENERATE\s*\]\]/i;

function parseDirectionCard(text: string): RecipeDirection | null {
  // Match "Direction:" with or without bold markers
  const titleMatch = text.match(/\*{0,2}Direction:\s*([^\n*]+?)\*{0,2}\n/i);
  if (!titleMatch) return null;

  const title = titleMatch[1].trim().replace(/^["'"']+|["'"']+$/g, "").trim();

  // Description: text between title line and first section header
  const afterTitle = text.slice(text.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
  const descEnd = afterTitle.search(/\*{0,2}Why it fits you\*{0,2}/i);
  const description = (descEnd > 0 ? afterTitle.slice(0, descEnd) : afterTitle.slice(0, 300)).trim();

  const whySection = afterTitle.match(/\*{0,2}Why it fits you\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}Key risks\*{0,2}|\*{0,2}Your first step\*{0,2}|$)/i);
  const risksSection = afterTitle.match(/\*{0,2}Key risks\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}Your first step\*{0,2}|$)/i);
  const stepSection = afterTitle.match(/\*{0,2}Your first step\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}|$)/i);

  const parseList = (s: string | undefined) =>
    (s ?? "").split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);

  // Extract composite score if present
  const scoreMatch = text.match(/\*{0,2}Composite Score\*{0,2}[:\s]*\n?\s*(\d+)/i);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 85;

  return {
    id: `recipe-${Date.now()}`,
    title,
    description,
    whyFitsYou: parseList(whySection?.[1]),
    keyRisks: parseList(risksSection?.[1]),
    firstStep: (stepSection?.[1] ?? "").trim(),
    score,
    rawContent: text,
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function FormattedMessage({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <span className="space-y-2 block">
      {paragraphs.map((para, i) => {
        const parts = para.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={i} className="block">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

export function DirectionChat({ onClose }: { onClose?: () => void }) {
  const authUser = useAtomValue(userAtom);
  const setConversations = useSetAtom(conversationsAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const setCreditsExhaustedOpen = useSetAtom(isCreditsExhaustedOpenAtom);
  const creditsExhausted = useIsCreditsExhausted();
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);
  const setNewRecipeCardId = useSetAtom(newRecipeCardIdAtom);
  const { model, bestCompatibility, directionText, otherDirections, primaryCard, altCards, generateRecipeCard, generatingRecipe } = useDirectionResult();
  const { data: dnaData } = useDnaData();
  const resourcesConstraints = useAtomValue(resourcesConstraintsAtom);
  const recipeDirections = useAtomValue(recipeDirectionsAtom);
  const hasDirections = !!primaryCard || altCards.length > 0 || !!directionText || recipeDirections.length > 0;

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convIdRef = useRef(`direction-chat-${Date.now()}`);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRecipePrompt, setActiveRecipePrompt] = useState<string | null>(null);
  const activeRecipePromptRef = useRef<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const userName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (hasMessages) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, hasMessages]);

  const persistToSidebar = (msgs: ChatMessage[]) => {
    const uid = authUser?.uid || "local";
    const convId = convIdRef.current;
    const sidebarMessages: Message[] = msgs.map((m) => ({
      id: m.id, role: m.role, content: m.content, timestamp: new Date(), type: "chat" as const,
    }));
    const firstUser = msgs.find((m) => m.role === "user")?.content || "Direction Chat";
    const conv: Conversation = {
      id: convId, title: firstUser.slice(0, 50) + (firstUser.length > 50 ? "..." : ""),
      messages: sidebarMessages, createdAt: new Date(), updatedAt: new Date(),
      model: "sorene-1", segment: "ideation", isCreatedOnBackend: false,
    };
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === convId);
      if (idx === -1) return [conv, ...prev];
      return prev.map((c) => (c.id === convId ? conv : c));
    });
    try { localStorage.setItem(`direction_chat_${uid}_${convId}`, JSON.stringify(conv)); } catch {}
  };

  // displayText is what appears in the chat bubble; recipeId activates recipe mode.
  const sendMessage = async (displayText: string, recipeId?: string) => {
    if (!displayText.trim() || isProcessing) return;

    // Starting a new recipe = fresh conversation
    const isNewRecipe = !!recipeId;
    const activeRecipeId = recipeId ?? activeRecipePromptRef.current ?? undefined;
    if (recipeId) {
      setActiveRecipePrompt(recipeId);
      activeRecipePromptRef.current = recipeId;
    }

    const priorMessages = isNewRecipe ? [] : messages;
    if (isNewRecipe) {
      setMessages([]);
      convIdRef.current = `direction-chat-${Date.now()}`;
    }

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", content: displayText };
    const next = [...priorMessages, userMsg];
    setMessages(next);
    persistToSidebar(next);
    setShowGenerate(false);
    setIsProcessing(true);

    const history = activeRecipeId
      ? priorMessages.map((m) => ({ role: m.role, content: m.content }))
      : undefined;

    const aiMsgId = `${Date.now()}-a`;
    // Add empty assistant message immediately so the bubble appears while streaming
    setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

    try {
      const res = await authFetch("/api/direction-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: displayText,
          directionContext: {
            recommendedModel: model,
            compatibility: bestCompatibility,
            directionText: directionText || "",
            alternatives: otherDirections.map((a: { model: string; compatibility: number; summary?: string }) => ({ model: a.model, compatibility: a.compatibility, summary: a.summary })),
            dnaScores: dnaData?.dnaScores ?? {},
          },
          userProfile: {
            firstName: authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0],
            occupation: (dnaData as Record<string, unknown>)?.occupation as string | undefined,
            cvSummary: (dnaData as Record<string, unknown>)?.cvSummary as string | undefined,
            assessmentAnswers: dnaData?.assessmentAnswers,
            dnaScores: dnaData?.dnaScores,
            dnaNarrative: dnaData?.dna_narrative,
            resources: resourcesConstraints,
          },
          ...(activeRecipeId ? { recipeId: activeRecipeId, history } : {}),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        reply += text;
        setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: reply } : m));
      }

      // If the AI signalled it's ready, strip the marker and show a Generate button.
      let displayReply = reply;
      if (READY_MARKER_RE.test(reply)) {
        displayReply = reply
          .replace(new RegExp(READY_MARKER_RE.source, "gi"), "")
          .replace(/\*\*\s*\*\*/g, "")
          .trim();
        setShowGenerate(true);
      }

      // If AI returned a Direction Card, extract it and show it in the left column
      const parsed = activeRecipePromptRef.current ? parseDirectionCard(reply) : null;
      if (parsed) {
        setRecipeDirections((prev) => {
          const updated = [...prev, parsed];
          try { localStorage.setItem("recipeDirections", JSON.stringify(updated)); } catch {}
          return updated;
        });
        setNewRecipeCardId(parsed.id);
        displayReply = `Your new direction card **"${parsed.title}"** has been added and is now open on the left. Are you happy with this direction, or would you like to brainstorm further or adjust anything?`;
      }

      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: displayReply } : m));
      const withAi = [...next, { id: aiMsgId, role: "assistant" as const, content: displayReply }];
      persistToSidebar(withAi);
    } catch {
      const errContent = "Sorry, something went wrong. Please try again.";
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: errContent } : m));
      persistToSidebar([...next, { id: aiMsgId, role: "assistant" as const, content: errContent }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(text);
  };

  // Generate the structured, staged direction card from the brainstormed idea.
  const handleGenerateRecipe = async () => {
    if (generatingRecipe || isProcessing) return;
    setShowGenerate(false);
    setIsProcessing(true);
    const concept = messages
      .map((m) => `${m.role === "user" ? "User" : "Sorene"}: ${m.content}`)
      .join("\n");
    try {
      const recipe = await generateRecipeCard(concept);
      const text = recipe
        ? `Your new direction card **"${recipe.title}"** has been added and is now open on the left — open it to load the detail, market reality, and operations sections. Want to adjust anything?`
        : "Sorry, I couldn't generate that direction. Please try again.";
      if (recipe) setNewRecipeCardId(recipe.id);
      const aiMsg: ChatMessage = { id: `${Date.now()}-a`, role: "assistant", content: text };
      const withAi = [...messages, aiMsg];
      setMessages(withAi);
      persistToSidebar(withAi);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 gap-3 shrink-0">
        {onClose ? (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <X size={20} />
          </button>
        ) : <div />}
        <div className="flex items-center gap-3">
          <a
            href="https://discord.gg/2YtvCm2SWp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            Product Feedback
          </a>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {authUser?.profile?.photoUrl ? (
              <img src={authUser.profile.photoUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#3D3D3D] flex items-center justify-center text-white text-sm font-semibold">
                {(authUser?.profile?.firstName || authUser?.displayName || authUser?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-start px-6 md:px-12 pt-12">
            <img alt="Sorene logo" src="/figmaAssets/cube.svg" className="mb-6" />
            <h2 className="text-heading-small text-[#151515] leading-[1.1] tracking-tight mb-12">
              How do you feel today, {userName}?
            </h2>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={message.role === "user"
                    ? "max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white text-sm leading-relaxed"
                    : "max-w-[80%] px-4 py-3 rounded-2xl bg-[#F8F9FA] text-[#111111] text-sm leading-relaxed"
                  }>
                    <FormattedMessage content={message.content} />
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-[#F8F9FA]">
                    <Loader2 size={16} className="animate-spin text-[#6B7280]" />
                  </div>
                </div>
              )}
              {showGenerate && !isProcessing && (
                <div className="flex justify-start">
                  <button
                    onClick={handleGenerateRecipe}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <img src="/figmaAssets/starfour.svg" className="w-3.5 h-3.5" alt="" />
                    Generate Direction
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Section */}
      <div className="px-3 pb-3 pt-0 shrink-0">
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          <div className="grid grid-cols-2 gap-1.5">
            {DIRECTION_RECIPES.map((recipe) => (
              <button
                key={recipe.label}
                onClick={() => sendMessage(recipe.label, recipe.id)}
                className="flex items-center justify-center gap-1 px-2 py-[7px] rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-[11px] sm:text-[12px] font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all"
              >
                <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5 shrink-0" alt="" />
                <span className="truncate">{recipe.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <button className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
              <Plus size={16} />
            </button>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => !creditsExhausted && setInputValue(e.target.value)}
              onClick={creditsExhausted ? () => setCreditsExhaustedOpen(true) : undefined}
              onKeyDown={creditsExhausted ? (e) => { e.preventDefault(); setCreditsExhaustedOpen(true); } : handleKeyDown}
              placeholder={creditsExhausted ? "Upgrade to keep chatting" : "Ask anything"}
              rows={1}
              disabled={isProcessing}
              className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-24 overflow-y-auto disabled:opacity-50"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
                <Mic size={14} />
              </button>
              <button
                onClick={creditsExhausted ? () => setCreditsExhaustedOpen(true) : handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] sm:text-[12px] text-[#9CA3AF] mt-2">
          <a
            href="https://sorene.ai/responsible-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#6B7280] transition-colors"
          >
            Sorene can make mistakes. Consider checking important information.
          </a>
        </p>
      </div>
    </div>
  );
}
