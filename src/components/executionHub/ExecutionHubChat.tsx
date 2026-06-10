"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, isSettingsOpenAtom, executionOnboardTriggerAtom, executionNavigateTabAtom, executionStartValidateAtom, isCreditsExhaustedOpenAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { useIsCreditsExhausted } from "@/hooks/useIsCreditsExhausted";
import { ArrowUp, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DirectionCardData } from "@/lib/directionTypes";

const SUGGESTIONS: { label: string; recipeId: string }[] = [
  { label: "Where do I start?", recipeId: "start" },
  { label: "Review my progress", recipeId: "progress" },
  { label: "Help me validate my idea", recipeId: "validate" },
  { label: "What's my next step?", recipeId: "next" },
  { label: "Update business status", recipeId: "update_status" },
];

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  routeTab?: "validation" | "launchpad" | "growth";
}

const TAB_LABELS: Record<string, string> = {
  validation: "Validation",
  launchpad: "Launchpad",
  growth: "Growth",
};

let lastHandledOnboard = 0;

function gatherProjectStatus(title: string): Record<string, unknown> {
  if (!title) return {};
  const status: Record<string, unknown> = {};
  const launchpadDone: string[] = [];
  const brandAssets: Record<string, string> = {};
  const validation: Record<string, string> = {};
  try {
    const suffix = `-${title}`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.endsWith(suffix)) continue;
      const val = localStorage.getItem(key);
      if (val == null || val === "") continue;
      const base = key.slice(0, -suffix.length);
      if (base.startsWith("launchpad-status-")) {
        if (val === "done" || val === "progress") launchpadDone.push(`${base.replace("launchpad-status-", "")}:${val}`);
      } else if (base === "business-name") {
        brandAssets.businessName = val;
      } else if (base.startsWith("brand-") && !base.endsWith("-suggestions") && !base.includes("suggestions")) {
        brandAssets[base.replace("brand-", "")] = val.slice(0, 120);
      } else if (base === "painkiller-verdict") {
        validation.painkillerVerdict = val.slice(0, 200);
      } else if (base === "mvo-defined") {
        validation.offerDefined = val.slice(0, 200);
      } else if (base === "pattern-summary") {
        validation.conversationPattern = val.slice(0, 300);
      } else if (base === "experiment-validation-score") {
        validation.validationScore = val;
      } else if (base === "business-status") {
        status.latestBusinessStatus = val.slice(0, 400);
      }
    }
  } catch { /* ignore */ }
  if (launchpadDone.length) status.launchpadItems = launchpadDone;
  if (Object.keys(brandAssets).length) status.brandAssets = brandAssets;
  if (Object.keys(validation).length) status.validation = validation;
  return status;
}

function FormattedMessage({ content }: { content: string }) {
  return (
    <span className="space-y-2 block">
      {content.split(/\n\n+/).filter(Boolean).map((para, i) => (
        <span key={i} className="block">
          {para.split(/(\*\*.*?\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </span>
      ))}
    </span>
  );
}

export function ExecutionHubChat({ project, allProjects, onClose }: { project?: DirectionCardData | null; allProjects?: DirectionCardData[]; onClose?: () => void }) {
  const router = useRouter();
  const authUser = useAtomValue(userAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const setNavigateTab = useSetAtom(executionNavigateTabAtom);
  const setStartValidate = useSetAtom(executionStartValidateAtom);
  const setCreditsExhaustedOpen = useSetAtom(isCreditsExhaustedOpenAtom);
  const creditsExhausted = useIsCreditsExhausted();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [routed, setRouted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const awaitingStatusRef = useRef(false);
  const idRef = useRef(0);
  // Conversation history accumulated during onboarding for context
  const onboardHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  // Track user messages to extract project title/oneliner for "Start Validate"
  const userMsgCountRef = useRef(0);
  const onboardTitleRef = useRef("");
  const onboardOneinerRef = useRef("");
  // Whether onboard_start has been sent yet
  const onboardTurnRef = useRef(0);

  const nextId = () => `${Date.now()}-${idRef.current++}`;
  const userName = authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submitInput = () => {
    const text = (textareaRef.current?.value ?? input).trim();
    if (!text || loading || routed) return;
    setInput("");
    if (textareaRef.current) { textareaRef.current.value = ""; textareaRef.current.style.height = "auto"; }
    send(text);
  };

  const send = async (text: string, recipeId?: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { id: nextId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    // Track first/second user message for later project creation
    if (onboarding) {
      userMsgCountRef.current += 1;
      if (userMsgCountRef.current === 1) onboardTitleRef.current = text;
      if (userMsgCountRef.current === 2) onboardOneinerRef.current = text;
      onboardHistoryRef.current.push({ role: "user", content: text });
    }

    // Persist a business status update when the user replies to the update_status recipe.
    if (recipeId === "update_status") {
      awaitingStatusRef.current = true;
    } else if (awaitingStatusRef.current && project?.title) {
      try { localStorage.setItem(`business-status-${project.title}`, text); } catch { /* ignore */ }
      awaitingStatusRef.current = false;
    }

    // Determine the recipeId to send to the API
    let apiRecipeId = recipeId;
    if (onboarding && !recipeId) {
      apiRecipeId = onboardTurnRef.current === 0 ? "onboard_start" : "onboard_active";
    }

    try {
      const profile = authUser?.profile;
      const history = onboarding
        ? onboardHistoryRef.current.slice(0, -1).slice(-10) // send prior turns, not current
        : messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

      const res = await authFetch("/api/execution-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          recipeId: apiRecipeId,
          history,
          userProfile: profile ? {
            firstName: profile.firstName,
            occupation: profile.occupation,
            cvSummary: profile.cvSummary,
            dnaScores: profile.dnaScores,
            dnaNarrative: profile.dna_narrative,
            assessmentAnswers: profile.assessmentAnswers,
          } : undefined,
          project: project ? {
            title: project.title,
            oneliner: project.oneliner,
            description: project.description,
            simple_positioning: project.simple_positioning,
            path_label: project.path_label,
            first_10_customers: project.first_10_customers,
            distribution_path: project.distribution_path,
            key_competitors: project.key_competitors,
          } : null,
          projectStatus: project ? gatherProjectStatus(project.title) : null,
          allProjects: !project && allProjects?.length
            ? allProjects.map((p) => ({
                title: p.title,
                oneliner: p.oneliner,
                status: gatherProjectStatus(p.title),
              }))
            : undefined,
        }),
      });

      const msgId = nextId();
      if (res.ok) {
        const data = await res.json();
        const raw: string = data?.reply ?? "Sorry, I couldn't respond.";

        if (onboarding) {
          onboardTurnRef.current += 1;

          // Check for routing markers
          const readyMatch = /\[\[READY_TO_ROUTE\]\]/i.test(raw);
          const tabMatch = raw.match(/\[\[TAB:(validation|launchpad|growth)\]\]/i);
          const tab = tabMatch ? (tabMatch[1].toLowerCase() as "validation" | "launchpad" | "growth") : null;

          // Strip markers from displayed content
          const clean = raw
            .replace(/\[\[READY_TO_ROUTE\]\]/gi, "")
            .replace(/\[\[TAB:[^\]]*\]\]/gi, "")
            .trim();

          const assistantMsg: ChatMsg = {
            id: msgId,
            role: "assistant",
            content: clean,
            ...(readyMatch && tab ? { routeTab: tab } : {}),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          onboardHistoryRef.current.push({ role: "assistant", content: clean });

          if (readyMatch && tab) {
            setRouted(true);
          }
        } else {
          setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: raw }]);
        }
      } else {
        const errMsg = onboarding
          ? "Thanks for sharing that — let me suggest you start with the Validation tab to test your idea with real people."
          : "Sorry, I had trouble with that. Please try again.";
        setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: errMsg, ...(onboarding ? { routeTab: "validation" as const } : {}) }]);
        if (onboarding) setRouted(true);
      }
    } catch {
      const errId = nextId();
      const errMsg = onboarding
        ? "Thanks for sharing that — let me suggest you start with the Validation tab to test your idea with real people."
        : "Sorry, I had trouble reaching the coach. Please try again.";
      setMessages((prev) => [...prev, { id: errId, role: "assistant", content: errMsg, ...(onboarding ? { routeTab: "validation" as const } : {}) }]);
      if (onboarding) setRouted(true);
    } finally {
      setLoading(false);
    }
  };

  const kickoffOnboarding = () => {
    onboardHistoryRef.current = [];
    onboardTurnRef.current = 0;
    userMsgCountRef.current = 0;
    onboardTitleRef.current = "";
    onboardOneinerRef.current = "";
    setOnboarding(true);
    setRouted(false);
    setMessages([]);
    // Trigger the first AI turn — send a placeholder user message that the recipe ignores
    send("__onboard_start__", "onboard_start");
  };

  const onboardTrigger = useAtomValue(executionOnboardTriggerAtom);
  useEffect(() => {
    if (onboardTrigger > lastHandledOnboard) {
      lastHandledOnboard = onboardTrigger;
      kickoffOnboarding();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardTrigger]);

  // ── Route button handlers ──

  const handleNotYet = () => {
    setRouted(false);
    setOnboarding(false);
    setMessages((prev) => [...prev, {
      id: nextId(),
      role: "assistant",
      content: "No problem — take your time. Use the recipe buttons below whenever you're ready, or ask me anything.",
    }]);
  };

  const handleGoToTab = (tab: string) => {
    setNavigateTab(tab);
    onClose?.();
  };

  const handleCheckFit = () => {
    // Build a concept summary from the onboarding conversation so the Direction
    // card is generated around the user's actual idea, not a generic profile.
    const userMsgs = onboardHistoryRef.current.filter((m) => m.role === "user").map((m) => m.content);
    const assistantMsgs = onboardHistoryRef.current.filter((m) => m.role === "assistant").map((m) => m.content);
    const conceptParts: string[] = [];
    if (onboardTitleRef.current) conceptParts.push(`Project / idea: ${onboardTitleRef.current}`);
    if (onboardOneinerRef.current && onboardOneinerRef.current !== onboardTitleRef.current)
      conceptParts.push(`Description: ${onboardOneinerRef.current}`);
    // Append remaining user messages (stage, traction, etc.)
    userMsgs.slice(2).forEach((m) => conceptParts.push(m));
    // Append last assistant message (evaluation summary) for extra context
    const lastAI = assistantMsgs[assistantMsgs.length - 1];
    if (lastAI) conceptParts.push(`Coach evaluation: ${lastAI.slice(0, 400)}`);
    const concept = conceptParts.join("\n\n");

    try { localStorage.setItem("rcGenerationRequested", "true"); } catch { /* ignore */ }
    try { sessionStorage.setItem("autoGenerateDirection", "1"); } catch { /* ignore */ }
    if (concept) {
      try { sessionStorage.setItem("onboardConcept", concept); } catch { /* ignore */ }
    }
    onClose?.();
    router.push("/direction?autoGenerate=1");
  };

  const handleStartValidate = () => {
    const title = onboardTitleRef.current || "My Project";
    const oneliner = onboardOneinerRef.current || title;
    setStartValidate({ title, oneliner });
    onClose?.();
  };

  // ── Route buttons by tab ──
  const RouteButtons = ({ tab }: { tab: "validation" | "launchpad" | "growth" }) => {
    if (tab === "validation") {
      return (
        <div className="flex flex-col gap-2 mt-3">
          <button onClick={handleCheckFit}
            className="text-left px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all">
            Check Founder &amp; Market Fit
          </button>
          <button onClick={handleStartValidate}
            className="text-left px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all">
            Start Validate
          </button>
          <button onClick={handleNotYet}
            className="text-left px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#6B7280] hover:bg-[#F1F3F5] transition-all">
            Not yet
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => handleGoToTab(tab)}
          className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all">
          Open {TAB_LABELS[tab]}
        </button>
        <button onClick={handleNotYet}
          className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all">
          Not yet
        </button>
      </div>
    );
  };

  const showChips = !onboarding;
  const inputPlaceholder = creditsExhausted
    ? "Upgrade to keep chatting"
    : routed
    ? "Use the buttons above to continue…"
    : onboarding
    ? "Reply here…"
    : "Ask anything about your execution";

  return (
    <div className="flex flex-col h-full xl:h-[97vh] w-full bg-white xl:border-l xl:border-gray-100 xl:rounded-4xl xl:my-6 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 gap-3 shrink-0">
        {onClose
          ? <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><X size={20} /></button>
          : <div />}
        <div className="flex items-center gap-3">
          <a href="https://discord.gg/2YtvCm2SWp" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all">
            Product Feedback
          </a>
          <button onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shrink-0">
            {authUser?.profile?.photoUrl
              ? <img src={authUser.profile.photoUrl} alt="User" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#3D3D3D] flex items-center justify-center text-white text-sm font-semibold">
                  {(authUser?.profile?.firstName?.[0] || authUser?.displayName?.[0] || authUser?.email?.[0] || "U").toUpperCase()}
                </div>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0
          ? (
            <div className="flex-1 flex flex-col items-start px-6 md:px-12 pt-12">
              <img alt="Sorene" src="/figmaAssets/cube.svg" className="mb-6" />
              <h2 className="text-heading-small text-[#151515] leading-[1.1] tracking-tight mb-12">
                What are you working on today, {userName}?
              </h2>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="px-6 py-6 space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    {m.role === "user" && m.content === "__onboard_start__" ? null : (
                      <div className={m.role === "user"
                        ? "max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white text-sm leading-relaxed"
                        : "max-w-[85%] px-4 py-3 rounded-2xl bg-[#F8F9FA] text-[#111111] text-sm leading-relaxed"}>
                        <FormattedMessage content={m.content} />
                        {m.routeTab && routed && (
                          <RouteButtons tab={m.routeTab} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
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

      {/* Input */}
      <div className="px-3 pb-3 pt-0 shrink-0">
        <div className="flex flex-col gap-2 p-3 rounded-2xl border border-[#F3F4F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_10px_40px_rgb(0,0,0,0.07)] focus-within:border-[#E5E7EB] transition-all duration-200">
          {showChips && (
            <div className="grid grid-cols-2 gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s.recipeId}
                  onClick={() => creditsExhausted ? setCreditsExhaustedOpen(true) : send(s.label, s.recipeId)}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 px-2 py-[7px] rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-[11px] sm:text-[12px] font-medium text-[#111111] hover:bg-[#F1F3F5] transition-all disabled:opacity-50">
                  <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5 shrink-0" alt="" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea ref={textareaRef} value={input}
              onChange={(e) => !creditsExhausted && !routed && setInput(e.target.value)}
              onClick={creditsExhausted ? () => setCreditsExhaustedOpen(true) : undefined}
              onKeyDown={(e) => {
                if (creditsExhausted) { e.preventDefault(); setCreditsExhaustedOpen(true); return; }
                if (routed) { e.preventDefault(); return; }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitInput();
                }
              }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
              placeholder={inputPlaceholder}
              rows={1}
              disabled={loading || routed}
              className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none leading-6 max-h-24 overflow-y-auto disabled:opacity-50"
            />
            <button
              onClick={() => creditsExhausted ? setCreditsExhaustedOpen(true) : submitInput()}
              disabled={!input.trim() || loading || routed}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#9CA3AF] mt-1.5 truncate whitespace-nowrap">
          <a href="https://sorene.ai/responsible-ai" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-[#6B7280] transition-colors">
            Sorene can make mistakes. Consider checking important information.
          </a>
        </p>
      </div>
    </div>
  );
}
