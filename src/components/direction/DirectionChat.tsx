"use client";

import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, conversationsAtom, Conversation, Message, isSettingsOpenAtom, recipeDirectionsAtom, RecipeDirection } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { Plus, X, ArrowUp, Loader2, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDirectionResult } from "@/hooks/useDirectionResult";
import { useDnaData } from "@/hooks/useDnaData";


const DIRECTION_RECIPES = [
  {
    label: "Brainstorm new idea",
    prompt: `You are helping the user brainstorm business or project ideas.

Every single turn: write exactly two short paragraphs, nothing more.
- First paragraph: one observation about a pattern in what they've shared (max 2 sentences). On turn 1, write a single opening sentence about what you want to uncover.
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn. After their answer to question 5, output a Direction Card:

**Direction: [specific direction]**
[2-3 sentences on why it fits]

**Why it fits you**
- [grounded in their words]
- [grounded in their words]

**Key risks**
- [1-2 honest risks]

**Your first step**
[One small, reversible action]

Start now with turn 1.`,
  },
  {
    label: "Check my idea",
    prompt: `You are helping the user stress-test a specific business or project idea they have in mind.

Every single turn: write exactly two short paragraphs, nothing more.
- First paragraph: one sharp observation about what they've shared — a strength, a gap, or a pattern (max 2 sentences). On turn 1, write a single opening sentence inviting them to share their idea.
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn — dig into the idea's target audience, problem fit, competitive edge, revenue model, and first proof of traction. After their answer to question 5, output a Direction Card:

**Direction: [name of their idea, sharpened]**
[2-3 sentences on the idea's core potential and why it could work]

**Why it fits you**
- [grounded in what they shared about themselves]
- [grounded in their words]

**Key risks**
- [1-2 honest, specific risks for this idea]

**Your first step**
[One small, concrete action to validate the idea this week]

Start now with turn 1.`,
  },
  {
    label: "Generate new direction",
    prompt: `You are helping the user discover new directions beyond what they already have.

Every single turn: write exactly two short paragraphs, nothing more.
- First paragraph: one observation about a pattern in what they've shared about their current directions or what feels missing (max 2 sentences). On turn 1, write a single opening sentence about what you want to uncover.
- Second paragraph: one sentence leading into the question, then the bolded question on its own line: **Question?**

No labels. No "Paragraph 1" or "Paragraph 2". No bullet lists. No options. No extra text.

Ask exactly 5 questions, one per turn. After their answer to question 5, output a Direction Card:

**Direction: [specific direction]**
[2-3 sentences on why it fits]

**Why it fits you**
- [grounded in their words]
- [grounded in their words]

**Key risks**
- [1-2 honest risks]

**Your first step**
[One small, reversible action]

Start now with turn 1.`,
  },
];

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
  const stepSection = afterTitle.match(/\*{0,2}Your first step\*{0,2}[:\n]+([\s\S]*?)$/i);

  const parseList = (s: string | undefined) =>
    (s ?? "").split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);

  return {
    id: `recipe-${Date.now()}`,
    title,
    description,
    whyFitsYou: parseList(whySection?.[1]),
    keyRisks: parseList(risksSection?.[1]),
    firstStep: (stepSection?.[1] ?? "").trim(),
    score: 85,
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
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);
  const { model, bestCompatibility, directionText, otherDirections } = useDirectionResult();
  const { data: dnaData } = useDnaData();

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convIdRef = useRef(`direction-chat-${Date.now()}`);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRecipePrompt, setActiveRecipePrompt] = useState<string | null>(null);
  const activeRecipePromptRef = useRef<string | null>(null);

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

  // displayText is what appears in the chat bubble; recipePrompt activates recipe mode.
  const sendMessage = async (displayText: string, recipePrompt?: string) => {
    if (!displayText.trim() || isProcessing) return;

    // If a new recipe is starting, reset the conversation and assign a new ID
    const isNewRecipe = !!recipePrompt;
    const systemOverride = recipePrompt ?? activeRecipePromptRef.current ?? undefined;
    if (recipePrompt) {
      setActiveRecipePrompt(recipePrompt);
      activeRecipePromptRef.current = recipePrompt;
    }

    // New recipe = fresh conversation; ongoing recipe = keep prior history
    const priorMessages = isNewRecipe ? [] : messages;
    if (isNewRecipe) {
      setMessages([]);
      convIdRef.current = `direction-chat-${Date.now()}`;
    }

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", content: displayText };
    const next = [...priorMessages, userMsg];
    setMessages(next);
    persistToSidebar(next);
    setIsProcessing(true);

    // Build history for recipe mode (exclude the current user message, it's sent as `message`)
    const history = systemOverride
      ? priorMessages.map((m) => ({ role: m.role, content: m.content }))
      : undefined;

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
          ...(systemOverride ? { systemOverride, history } : {}),
        }),
      });
      const data = (await res.json()) as { reply: string };
      const reply = data.reply || "Sorry, I couldn't respond. Try again.";

      // If AI returned a Direction Card, extract it and show it in the left column
      const parsed = activeRecipePromptRef.current ? parseDirectionCard(reply) : null;
      let displayReply = reply;
      if (parsed) {
        setRecipeDirections((prev) => {
          const updated = [...prev, parsed];
          try { localStorage.setItem("recipeDirections", JSON.stringify(updated)); } catch {}
          return updated;
        });
        displayReply = `Your new direction card **"${parsed.title}"** has been added to the left panel. Click "View detail" to explore it.`;
      }

      const aiMsg: ChatMessage = { id: `${Date.now()}-a`, role: "assistant", content: displayReply };
      const withAi = [...next, aiMsg];
      setMessages(withAi);
      persistToSidebar(withAi);
    } catch {
      const errMsg: ChatMessage = { id: `${Date.now()}-e`, role: "assistant", content: "Sorry, something went wrong. Please try again." };
      const withErr = [...next, errMsg];
      setMessages(withErr);
      persistToSidebar(withErr);
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
          <button
            onClick={() => { setMessages([]); setActiveRecipePrompt(null); activeRecipePromptRef.current = null; convIdRef.current = `direction-chat-${Date.now()}`; }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus size={16} />
            New Chat
          </button>
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
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 pt-0 shrink-0">
        <div className="flex flex-col gap-3 p-4 rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          <div className="flex flex-wrap gap-2">
            {DIRECTION_RECIPES.map((recipe) => (
              <button
                key={recipe.label}
                onClick={() => sendMessage(recipe.label, recipe.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all whitespace-nowrap"
              >
                <img src="/figmaAssets/starfour.svg" className="w-3 h-3" alt="" />
                {recipe.label}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            rows={1}
            disabled={isProcessing}
            className="w-full resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-36 overflow-y-auto disabled:opacity-50"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <div className="flex items-center justify-between">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
              <Plus size={18} />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]">
                <Mic size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-[#9CA3AF] mt-3">
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
