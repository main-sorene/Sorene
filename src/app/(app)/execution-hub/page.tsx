"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronDown,
  Users,
  Search,
  Lightbulb,
  DollarSign,
  Rocket,
  MessageCircle,
  BarChart3,
  Lock,
  Loader2,
  FolderOpen,
  Plus,
  Paperclip,
  Phone,
  Mail,
  User,
  FileText,
  Trash2,
  ChevronUp,
  Settings,
  Archive,
  AlertTriangle,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { userAtom, selectedExecutionProjectAtom, executionOnboardTriggerAtom, executionNavigateTabAtom, executionStartValidateAtom } from "@/store/atoms";
import { auth } from "@/lib/firebase";
import { ExecutionHubChat } from "@/components/executionHub/ExecutionHubChat";
import { getUserProfile } from "@/lib/firestore";
import { hydrateExecutionState, installExecutionStateAutosave } from "@/lib/executionStateSync";
import type { DirectionCardData } from "@/lib/directionTypes";

// ─────────────────────────────────────────────
// Idea Validator
// ─────────────────────────────────────────────

const VIBE_STEPS = [
  {
    id: 1, vibe: "V + I", title: "Talk to as many potential customers as you can", icon: Users, duration: "~1–2 weeks",
    whatIs: "You cannot validate an idea at a desk — this step forces you into real conversations with real people so you know whether the problem you are solving actually matters.",
    soreneDoes: [
      "3 tailored interview questions (generated from DNA + idea)",
      "Script for opening the conversation",
      "Debrief form after each conversation",
      "Pattern summary as responses are logged",
      "Suggested conversation length: 30 minutes",
    ],
    userDoes: [
      "Have 10 conversations (minimum)",
      "Focus on their problems, not your solution",
      "Listen more than you talk",
      "Record real quotes and exact language used",
      "Log responses back into the platform",
    ],
    insight: "The 3 questions Sorene generates: (1) What is your biggest challenge with [problem area]? (2) What have you already tried to fix it? (3) What would you pay to solve this completely?",
  },
  {
    id: 2, vibe: "I", title: "Identify the painkiller problem", icon: Search, duration: "~2–3 days",
    whatIs: "Most ideas fail because founders build for the wrong problem — this step forces you to find the one pain that is frequent, severe, and people will already pay to fix.",
    soreneDoes: [
      "Pattern summary from logged responses",
      "Frequency count per problem theme",
      "Flagging which problems people already spend money on",
      "Problem ranking by pain level + frequency",
      "Recommendation: is there a painkiller problem?",
    ],
    userDoes: [
      "The single problem that came up most often",
      "The problem that causes the most frustration",
      "Problems people are already spending money to solve",
      "One clear painkiller problem to build around",
    ],
    insight: null,
  },
  {
    id: 3, vibe: "B", title: "Create a minimum viable offer", icon: Lightbulb, duration: "~3–5 days",
    whatIs: "Spending months building before a single sale is the most common founder mistake — this step gets something real in front of buyers without writing a line of code.",
    soreneDoes: [
      "One-sentence offer builder template",
      "Suggested price range from DNA + interview data",
      "MVO format options: workshop / PDF / session / manual service",
      "Offer clarity checklist (who, what, outcome, price)",
    ],
    userDoes: [
      "The simplest version of the solution that delivers real value",
      "Could be: workshop, PDF guide, 1-on-1 session, manual service",
      "Simple landing page OR pitch to 3 people directly",
      "Sorene does not build this — you do",
    ],
    insight: null,
  },
  {
    id: 4, vibe: "E", title: "Get paying customers", icon: DollarSign, duration: "~1 week",
    whatIs: "Interest and sign-ups are not validation — money is, and getting three paying customers before building anything is the only proof your idea deserves to exist.",
    soreneDoes: [
      "Validation score updated from real customer responses",
      "Tracker: 0 / 3 paying customers",
      "Unlock signal: 3 paying customers = proceed to Business Plan Builder",
      "If 0 of 3: Sorene prompts to revisit idea or offer framing",
    ],
    userDoes: [
      "Make the real offer to real people",
      "Ask for real money (not just interest or sign-up)",
      "Record: yes / no / maybe responses",
      "3 paying customers = the only true validation that matters",
      "Log result in platform to unlock next feature",
    ],
    insight: "3 paying customers before investing significant time or money is the validation gate. This is non-negotiable — it unlocks the Business Plan Builder.",
  },
];

function toggleStep(id: number, isOpen: boolean, setter: (v: number | null) => void) {
  setter(isOpen ? null : id);
}

function IdeaValidatorContent() {
  const [openStep, setOpenStep] = useState<number | null>(null);
  return (
    <div className="p-6 space-y-8">
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">The VIBE Framework</h4>
        <Separator className="bg-gray-100 mb-5" />
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ letter: "V", label: "Validate" }, { letter: "I", label: "Interview" }, { letter: "B", label: "Build demo" }, { letter: "E", label: "Experiment" }].map(({ letter, label }) => (
            <div key={letter} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#32C382] bg-[#F5FFD9] text-[#151515] text-body-small-medium shadow-sm">
              <span className="font-bold">{letter}</span>
              <span className="text-[#62646A]">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-label-medium text-[#62646A] leading-relaxed">
          AI cannot validate your idea — only real people can. Sorene makes that process structured, fast, and interpretable. 4 steps · 2–4 weeks · zero code required.
        </p>
      </section>
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">4-Step Process</h4>
        <Separator className="bg-gray-100 mb-4" />
        <div className="space-y-2">
          {VIBE_STEPS.map((step) => {
            const Icon = step.icon;
            const isOpen = openStep === step.id;
            return (
              <div key={step.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => toggleStep(step.id, isOpen, setOpenStep)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-[#9A9A9A] mr-2 uppercase tracking-wide">Step {step.id} · {step.vibe}</span>
                    <span className="text-body-small-medium text-[#151515]">{step.title}</span>
                  </div>
                  <span className="text-[11px] text-[#9A9A9A] shrink-0 mr-2">{step.duration}</span>
                  <ChevronDown size={14} className={cn("text-[#9A9A9A] shrink-0 transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-2">Sorene provides</p>
                          <ul className="space-y-2">
                            {step.soreneDoes.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-label-medium text-[#151515]">
                                <CheckCircle2 size={13} className="text-[#32C382] shrink-0 mt-0.5" />{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-2">You must do</p>
                          <ul className="space-y-2">
                            {step.userDoes.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-label-medium text-[#62646A]">
                                <Circle size={13} className="text-gray-300 shrink-0 mt-0.5" />{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {step.insight && (
                          <div className="sm:col-span-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                            <p className="text-label-medium text-[#62646A] leading-relaxed">{step.insight}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Go/No-Go
// ─────────────────────────────────────────────

const GO_CHECKS = [
  {
    id: "problem",
    label: "Problem & Solution Clarity",
    description: "Problem and solution defined from real market conversations — not AI-generated assumptions.",
    icon: Search,
    items: [
      { key: "problem_defined",   label: "Painkiller problem identified from interviews",   autoKey: "painkiller-verdict-" },
      { key: "conversations_done", label: "At least 10 conversations completed",             autoKey: "conversations-count-" },
      { key: "solution_tested",   label: "Solution tested with at least one real person",   autoKey: null },
      { key: "customer_clear",    label: "Clear who the target customer is",                autoKey: "target-customers-" },
    ],
  },
  {
    id: "market",
    label: "Market Validation",
    description: "Real market signal — paying customers, not just sign-ups or interest.",
    icon: BarChart3,
    items: [
      { key: "paying_customers",  label: "3 paying customers secured",                     autoKey: "experiment-customers-" },
      { key: "offer_built",       label: "Minimum viable offer defined and pitched",        autoKey: "mvo-defined-" },
      { key: "validation_score",  label: "Validation score generated",                      autoKey: "experiment-validation-score-" },
      { key: "responses_logged",  label: "Customer yes/no/maybe responses logged",          autoKey: "experiment-customers-" },
      { key: "feedback_quality",  label: "Specific feedback notes collected",               autoKey: null },
    ],
  },
  {
    id: "learning",
    label: "Foundation Learning",
    description: "Completion of the core learning module that prepares you to run a business.",
    icon: CheckCircle2,
    items: [
      { key: "vibe_completed",    label: "Completed all 4 VIBE stages",                    autoKey: null },
      { key: "vibe_understood",   label: "Understand the VIBE framework",                  autoKey: null },
      { key: "mvo_understood",    label: "Understand MVO (minimum viable offer)",          autoKey: "mvo-defined-" },
      { key: "dna_direction",     label: "Know your DNA + Direction",                      autoKey: null },
    ],
  },
  {
    id: "finance",
    label: "Finance Readiness",
    description: "A basic assessment of whether you are financially positioned to commit.",
    icon: DollarSign,
    items: [
      { key: "runway",            label: "Personal runway assessed",                        autoKey: null },
      { key: "startup_cost",      label: "Startup cost estimate done",                      autoKey: null },
      { key: "revenue_target",    label: "First revenue target set",                        autoKey: null },
      { key: "funding_path",      label: "Funding / bootstrap path chosen",                autoKey: null },
    ],
  },
];

function useGoNoGoAutoDetect(project: DirectionCardData | null) {
  const title = project?.title ?? "";
  const [auto, setAuto] = useState<Record<string, boolean>>({});
  const titleRef = useRef(title);
  titleRef.current = title;

  const detect = useRef(() => {
    const t = titleRef.current;
    if (!t) return;
    const result: Record<string, boolean> = {};
    try {
      // problem_defined — painkiller-verdict-<title> (Interview stage)
      result["problem_defined"] = !!(localStorage.getItem(`painkiller-verdict-${t}`) ?? "").trim();

      // conversations_done — convlog-<title> has ≥ 10 entries (Validate stage)
      try {
        const convRaw = localStorage.getItem(`convlog-${t}`) ?? "[]";
        result["conversations_done"] = JSON.parse(convRaw).length >= 10;
      } catch { result["conversations_done"] = false; }

      // solution_tested — painkiller-analysis-<title> generated (Interview stage)
      result["solution_tested"] = !!(localStorage.getItem(`painkiller-analysis-${t}`) ?? "").trim();

      // customer_clear — target-customers-<title> saved (Validate stage)
      result["customer_clear"] = !!(localStorage.getItem(`target-customers-${t}`) ?? "").trim();

      // paying_customers, responses_logged, feedback_quality (Experiment stage)
      try {
        const customers: { response: string; note?: string }[] = JSON.parse(localStorage.getItem(`experiment-customers-${t}`) ?? "[]");
        result["paying_customers"]  = customers.filter((c) => c.response === "yes").length >= 3;
        result["responses_logged"]  = customers.length > 0;
        result["feedback_quality"]  = customers.some((c) => (c.note ?? "").trim().length > 0);
      } catch { result["paying_customers"] = false; result["responses_logged"] = false; result["feedback_quality"] = false; }

      // offer_built — mvo-defined-<title> (Build Demo stage)
      result["offer_built"] = !!(localStorage.getItem(`mvo-defined-${t}`) ?? "").trim();

      // validation_score — experiment-validation-score-<title> (Experiment stage)
      result["validation_score"] = !!(localStorage.getItem(`experiment-validation-score-${t}`) ?? "").trim();

      // vibe_understood — pattern-summary-<title> generated (Validate stage)
      result["vibe_understood"] = !!(localStorage.getItem(`pattern-summary-${t}`) ?? "").trim();

      // mvo_understood — mvo-defined-<title> (Build Demo stage)
      result["mvo_understood"] = !!(localStorage.getItem(`mvo-defined-${t}`) ?? "").trim();

      // dna_direction — target-customers-<title> (Validate stage)
      result["dna_direction"] = !!(localStorage.getItem(`target-customers-${t}`) ?? "").trim();

      // vibe_completed — reached stage 5
      try { result["vibe_completed"] = parseInt(localStorage.getItem(`validation-stage-${t}`) ?? "1", 10) >= 5; } catch { result["vibe_completed"] = false; }

      // finance fields — auto-check when user has typed something
      result["runway"]          = !!(localStorage.getItem(`finance-runway-${t}`) ?? "").trim();
      result["startup_cost"]    = !!(localStorage.getItem(`finance-startup_cost-${t}`) ?? "").trim();
      result["revenue_target"]  = !!(localStorage.getItem(`finance-revenue_target-${t}`) ?? "").trim();
      result["funding_path"]    = !!(localStorage.getItem(`finance-funding_path-${t}`) ?? "").trim();
    } catch { /* ignore */ }
    setAuto(result);
  });

  useEffect(() => {
    detect.current();
    const timer = setInterval(() => detect.current(), 2000);
    return () => clearInterval(timer);
  }, [title]);

  return auto;
}

const FINANCE_FIELDS = [
  { key: "runway",         label: "Personal runway",          placeholder: "How many months / $ do you have?" },
  { key: "startup_cost",   label: "Startup cost estimate",    placeholder: "What will it cost to get started?" },
  { key: "revenue_target", label: "First revenue target",     placeholder: "What's your 90-day revenue goal?" },
  { key: "funding_path",   label: "Funding / bootstrap path", placeholder: "How will you fund this?" },
];

function FinanceField({ fieldKey, label, placeholder, suggestion, projectTitle }: {
  fieldKey: string; label: string; placeholder: string; suggestion: string; projectTitle: string;
}) {
  const storageKey = `finance-${fieldKey}-${projectTitle}`;
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectTitle) return;
    try { setVal(localStorage.getItem(storageKey) ?? ""); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const handleChange = (v: string) => {
    setVal(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!projectTitle) return;
      try { localStorage.setItem(storageKey, v); } catch { /* ignore */ }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
  };

  return (
    <div className="rounded-xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <p className="text-[12px] font-semibold text-[#151515]">{label}</p>
        {saved && <span className="flex items-center gap-1 text-[10px] font-medium text-[#32C382]"><CheckCircle2 size={10} /> Saved</span>}
      </div>
      {suggestion && (
        <div className="px-4 pt-3 pb-0 flex gap-2 items-start">
          <span className="text-[10px] font-semibold text-[#32C382] shrink-0 mt-0.5 uppercase tracking-wide">Sorene</span>
          <p className="text-[12px] text-[#62646A] leading-relaxed italic">{suggestion}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <input
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={suggestion ? "Your actual answer…" : placeholder}
          className="w-full text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
        />
      </div>
    </div>
  );
}

function FinanceInputCard({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const suggestionsKey = `finance-suggestions-${title}`;
  type SugState = "idle" | "loading" | "done";
  const [sugState, setSugState] = useState<SugState>("idle");
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(suggestionsKey);
      if (raw) { setSuggestions(JSON.parse(raw)); setSugState("done"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const generateSuggestions = async () => {
    if (!title) return;
    setSugState("loading");
    const painkiller     = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const offer          = localStorage.getItem(`mvo-defined-${title}`) ?? "";
    const validationScore = localStorage.getItem(`experiment-validation-score-${title}`) ?? "";
    const targetRaw      = localStorage.getItem(`target-customers-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(targetRaw)?.main?.label ?? ""; } catch { /* ignore */ }
    let customerSummary = "";
    try {
      const customers: { response: string }[] = JSON.parse(localStorage.getItem(`experiment-customers-${title}`) ?? "[]");
      if (customers.length > 0) {
        const yes = customers.filter((c) => c.response === "yes").length;
        customerSummary = `${customers.length} conversations, ${yes} paying customers`;
      }
    } catch { /* ignore */ }

    const system = `You are Sorene, a direct startup coach. Respond in JSON only — a single object with keys: runway, startup_cost, revenue_target, funding_path. Each value is a short, specific, realistic suggestion (1-2 sentences max). No extra keys, no explanation outside the JSON object.`;
    const prompt = `Based on this founder's journey, suggest realistic finance figures.

Project: "${title}"${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}${customerSummary ? `\nCustomer traction: ${customerSummary}` : ""}${validationScore ? `\nValidation signal: "${validationScore}"` : ""}

Return JSON with:
- runway: how many months of personal savings/runway they realistically need before first revenue
- startup_cost: realistic startup cost estimate for this type of business
- revenue_target: a specific first 90-day revenue target based on their offer and traction
- funding_path: whether they should bootstrap, pre-sell, or seek funding, and why`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        try {
          const match = reply.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setSuggestions(parsed);
            setSugState("done");
            try { localStorage.setItem(suggestionsKey, JSON.stringify(parsed)); } catch { /* ignore */ }
          } else { setSugState("idle"); }
        } catch { setSugState("idle"); }
      } else { setSugState("idle"); }
    } catch { setSugState("idle"); }
  };

  return (
    <div className="space-y-3">
      {/* Generate suggestions button */}
      {sugState === "idle" && (
        <button onClick={generateSuggestions} disabled={!title}
          className="w-full py-2 rounded-xl border border-dashed border-[#32C382]/50 text-[12px] text-[#32C382] hover:border-[#32C382] hover:bg-[#F5FFD9] transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5">
          <img src="/figmaAssets/starfour.svg" className="w-3 h-3" alt="" />
          Get Sorene's suggestions based on your journey
        </button>
      )}
      {sugState === "loading" && (
        <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]">
          <Loader2 size={12} className="animate-spin" /> Analysing your project to suggest figures…
        </div>
      )}
      {sugState === "done" && (
        <div className="flex items-center justify-between py-1">
          <p className="text-[11px] text-[#32C382] font-medium">Sorene's suggestions shown · Fill in your actual answers below</p>
          <button onClick={generateSuggestions} className="text-[10px] text-[#9A9A9A] hover:text-[#151515] transition-colors">Refresh</button>
        </div>
      )}
      {FINANCE_FIELDS.map((f) => (
        <FinanceField
          key={`${f.key}-${title}`}
          fieldKey={f.key}
          label={f.label}
          placeholder={f.placeholder}
          suggestion={suggestions[f.key] ?? ""}
          projectTitle={title}
        />
      ))}
    </div>
  );
}

function GoNoGoContent({ project, onConfirmLaunch }: { project: DirectionCardData | null; onConfirmLaunch?: () => void }) {
  const auto = useGoNoGoAutoDetect(project);
  const storageKey = `go-nogo-manual-${project?.title ?? ""}`;
  const [manual, setManual] = useState<Record<string, boolean>>({});

  // Load manual overrides
  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setManual(JSON.parse(raw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  const toggle = (key: string) => {
    setManual((prev) => {
      const updated = { ...prev, [key]: !(prev[key] ?? auto[key] ?? false) };
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  const isChecked = (key: string) => manual[key] ?? auto[key] ?? false;
  const isAuto = (key: string) => (auto[key] ?? false) && !(key in manual);

  // Exclude "coming soon" learning items from score — they can never be checked
  const scorableItems = GO_CHECKS.filter((c) => c.id !== "learning").flatMap((c) => c.items);
  const allItems      = GO_CHECKS.flatMap((c) => c.items);
  const total   = scorableItems.length;
  const checked = scorableItems.filter((i) => isChecked(i.key)).length;
  const pct     = total > 0 ? Math.round((checked / total) * 100) : 0;
  const ready   = pct >= 80;
  const scoreColor = ready ? "#32C382" : pct >= 50 ? "#F5B100" : "#151515";

  // AI readiness analysis
  type AStage = "idle" | "loading" | "done";
  const projectTitle = project?.title ?? "";

  const analysisKey   = projectTitle ? `go-nogo-analysis-${projectTitle}` : null;
  const [analysisStage, setAnalysisStage] = useState<AStage>("idle");
  const [analysis, setAnalysis] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    if (!analysisKey) return;
    try {
      const raw = localStorage.getItem(analysisKey);
      if (raw) { setAnalysis(raw); setAnalysisStage("done"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const generateAnalysis = async () => {
    const t = projectTitle;
    if (!t) { setAnalysisError("No project selected. Please select a project first."); return; }
    setAnalysisError("");
    setAnalysisStage("loading");

    // ── Stage 1: Validate ──
    let convSummary = "No conversations logged.";
    try {
      const convs = JSON.parse(localStorage.getItem(`convlog-${t}`) ?? "[]");
      if (convs.length > 0) convSummary = `${convs.length} conversations logged.`;
    } catch { /* ignore */ }
    const patternSummary = localStorage.getItem(`pattern-summary-${t}`) ?? "";
    const targetCustomersRaw = localStorage.getItem(`target-customers-${t}`) ?? "";
    let targetCustomer = "";
    try { const tc = JSON.parse(targetCustomersRaw); targetCustomer = tc?.main?.label ?? ""; } catch { /* ignore */ }

    // ── Stage 2: Interview ──
    const painkillerAnalysis = localStorage.getItem(`painkiller-analysis-${t}`) ?? "";
    const painkillerVerdict  = localStorage.getItem(`painkiller-verdict-${t}`) ?? "";
    const confidenceLevel    = localStorage.getItem(`confidence-level-${t}`) ?? "";

    // ── Stage 3: Build Demo ──
    const offer = localStorage.getItem(`mvo-defined-${t}`) ?? "";
    const offerOfferings = ["one_sentence_offer","price_range","best_format","offer_clarity","first_pitch"]
      .map((k) => localStorage.getItem(`mvo-offering-${k}-${t}`) ?? "").filter(Boolean).join(" | ");

    // ── Stage 4: Experiment ──
    let experimentSummary = "No customer responses.";
    try {
      const customers = JSON.parse(localStorage.getItem(`experiment-customers-${t}`) ?? "[]");
      if (customers.length > 0) {
        const yes = customers.filter((c: { response: string }) => c.response === "yes").length;
        const no  = customers.filter((c: { response: string }) => c.response === "no").length;
        const mb  = customers.filter((c: { response: string }) => c.response === "maybe").length;
        experimentSummary = `${customers.length} conversations: ${yes} paid, ${no} declined, ${mb} maybe`;
      }
    } catch { /* ignore */ }
    const validationScore = localStorage.getItem(`experiment-validation-score-${t}`) ?? "";

    // ── Stage 5: Finance ──
    const runway        = localStorage.getItem(`finance-runway-${t}`) ?? "";
    const startupCost   = localStorage.getItem(`finance-startup_cost-${t}`) ?? "";
    const revenueTarget = localStorage.getItem(`finance-revenue_target-${t}`) ?? "";
    const fundingPath   = localStorage.getItem(`finance-funding_path-${t}`) ?? "";

    const checkedItems   = allItems.filter((i) => isChecked(i.key)).map((i) => i.label);
    const uncheckedItems = allItems.filter((i) => !isChecked(i.key)).map((i) => i.label);

    const system = `You are Sorene, a direct startup coach assessing whether a founder is ready to launch. Respond in plain prose only — no JSON, no code blocks. Be honest, specific, and direct.`;
    const prompt = `Give an honest, comprehensive launch readiness verdict for this founder based on their full journey across all 5 VIBE stages.

PROJECT: "${t}"
${targetCustomer ? `Target customer: "${targetCustomer}"` : ""}

STAGE 1 — Validate:
${convSummary}${patternSummary ? `\nPattern summary: "${patternSummary}"` : ""}

STAGE 2 — Interview:
${painkillerVerdict ? `Painkiller problem: "${painkillerVerdict}"` : "No painkiller identified yet."}${painkillerAnalysis ? `\nAnalysis: "${painkillerAnalysis.slice(0, 300)}…"` : ""}${confidenceLevel ? `\nConfidence level: "${confidenceLevel}"` : ""}

STAGE 3 — Build Demo:
${offer ? `MVO defined: "${offer}"` : "No offer defined yet."}${offerOfferings ? `\nOfferings: "${offerOfferings.slice(0, 200)}"` : ""}

STAGE 4 — Experiment:
${experimentSummary}${validationScore ? `\nValidation score: "${validationScore}"` : ""}

STAGE 5 — Finance:
${runway ? `Runway: "${runway}"` : "Runway not assessed."}${startupCost ? `\nStartup cost: "${startupCost}"` : ""}${revenueTarget ? `\nRevenue target: "${revenueTarget}"` : ""}${fundingPath ? `\nFunding path: "${fundingPath}"` : ""}

Readiness score: ${pct}% (${checked}/${total} criteria met)
Completed: ${checkedItems.length > 0 ? checkedItems.join(", ") : "none"}
Not yet done: ${uncheckedItems.length > 0 ? uncheckedItems.join(", ") : "none"}

Write exactly 4 short paragraphs (one sentence each), separated by a blank line:
1. **Verdict:** overall verdict — ready, close, or not ready, and the single most important reason why.
2. **Biggest strength:** the strongest signal from their journey so far.
3. **Critical gap:** the single most important thing still missing.
4. **This week:** one specific action to take this week.

Use **bold** for the most important 2-4 words in each paragraph. Plain prose only — no lists, no headers, no JSON.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        setAnalysis(reply);
        setAnalysisStage("done");
        if (analysisKey) { try { localStorage.setItem(analysisKey, reply); } catch { /* ignore */ } }
      } else {
        setAnalysisStage("idle");
        setAnalysisError("Analysis failed. Please try again.");
      }
    } catch (err) {
      setAnalysisStage("idle");
      setAnalysisError("Network error. Please try again.");
      console.error("generateAnalysis error:", err);
    }
  };

  // Launching Strategy — structured finalized profile
  interface LaunchProfile {
    audienceMain: string;
    audienceSecondary: string;
    problem: string;
    solution: string;
    benefits: string;
    offerings: string;
    pricing: string;
  }
  const strategyKey = projectTitle ? `launch-strategy-${projectTitle}` : null;
  type SStage = "idle" | "loading" | "done";
  const [strategyStage, setStrategyStage] = useState<SStage>("idle");
  const [profile, setProfile] = useState<LaunchProfile>({ audienceMain: "", audienceSecondary: "", problem: "", solution: "", benefits: "", offerings: "", pricing: "" });
  const [editingField, setEditingField] = useState<keyof LaunchProfile | null>(null);
  const [strategyError, setStrategyError] = useState("");
  const [strategyFeedback, setStrategyFeedback] = useState("");
  const [revisingStrategy, setRevisingStrategy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!strategyKey) return;
    try {
      const raw = localStorage.getItem(strategyKey);
      if (raw) { setProfile(JSON.parse(raw) as LaunchProfile); setStrategyStage("done"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const saveProfile = (p: LaunchProfile) => {
    if (!strategyKey) return;
    try { localStorage.setItem(strategyKey, JSON.stringify(p)); } catch { /* ignore */ }
  };

  const updateField = (field: keyof LaunchProfile, value: string) => {
    setProfile((prev) => { const updated = { ...prev, [field]: value }; saveProfile(updated); return updated; });
  };

  const generateStrategy = async (feedback?: string) => {
    if (!projectTitle) return;
    setStrategyError("");
    feedback ? setRevisingStrategy(true) : setStrategyStage("loading");

    // Collect full validation history
    let convSummary = "";
    try { const c = JSON.parse(localStorage.getItem(`convlog-${projectTitle}`) ?? "[]"); convSummary = c.length > 0 ? `${c.length} customer conversations logged` : ""; } catch { /* ignore */ }
    const patternSummary     = localStorage.getItem(`pattern-summary-${projectTitle}`) ?? "";
    const painkillerVerdict  = localStorage.getItem(`painkiller-verdict-${projectTitle}`) ?? "";
    const confidenceLevel    = localStorage.getItem(`confidence-level-${projectTitle}`) ?? "";
    const offer              = localStorage.getItem(`mvo-defined-${projectTitle}`) ?? "";
    const offerOfferings     = ["one_sentence_offer","price_range","best_format","offer_clarity","first_pitch"].map((k) => localStorage.getItem(`mvo-offering-${k}-${projectTitle}`) ?? "").filter(Boolean).join(" | ");
    const revenueTarget      = localStorage.getItem(`finance-revenue_target-${projectTitle}`) ?? "";
    const runway             = localStorage.getItem(`finance-runway-${projectTitle}`) ?? "";
    const fundingPath        = localStorage.getItem(`finance-funding_path-${projectTitle}`) ?? "";
    const analysisText       = analysisKey ? (localStorage.getItem(analysisKey) ?? "") : "";
    let targetCustomer = ""; let secondaryCustomer = "";
    try { const tc = JSON.parse(localStorage.getItem(`target-customers-${projectTitle}`) ?? "{}"); targetCustomer = tc?.main?.label ?? ""; secondaryCustomer = tc?.secondary?.label ?? ""; } catch { /* ignore */ }
    let experimentSummary = "";
    try {
      const customers = JSON.parse(localStorage.getItem(`experiment-customers-${projectTitle}`) ?? "[]");
      if (customers.length) { const yes = customers.filter((c: { response: string }) => c.response === "yes").length; experimentSummary = `${customers.length} outreach: ${yes} paid`; }
    } catch { /* ignore */ }

    const currentProfile = feedback ? `\nCurrent profile:\n${JSON.stringify(profile, null, 2)}` : "";
    const feedbackLine = feedback ? `\nFounder feedback: "${feedback}"` : "";

    const system = `You are Sorene. Based on the founder's full validation history, synthesize their finalized business profile. Return ONLY valid JSON — no markdown, no commentary.`;
    const prompt = `Synthesize the finalized launch profile for this founder based on their complete validation journey.

Project: "${projectTitle}"
${targetCustomer ? `Primary customer discovered: ${targetCustomer}` : ""}
${secondaryCustomer ? `Secondary customer: ${secondaryCustomer}` : ""}
${convSummary ? `Validation: ${convSummary}` : ""}
${patternSummary ? `Pattern summary: ${patternSummary.slice(0, 300)}` : ""}
${painkillerVerdict ? `Core problem identified: ${painkillerVerdict}` : ""}
${confidenceLevel ? `Problem confidence: ${confidenceLevel}` : ""}
${offer ? `Offer defined: ${offer}` : ""}
${offerOfferings ? `Offering details: ${offerOfferings.slice(0, 300)}` : ""}
${experimentSummary ? `Experiment results: ${experimentSummary}` : ""}
${revenueTarget ? `Revenue target: ${revenueTarget}` : ""}
${runway ? `Runway: ${runway}` : ""}
${fundingPath ? `Funding: ${fundingPath}` : ""}
${analysisText ? `Readiness verdict: ${analysisText.slice(0, 400)}` : ""}
${currentProfile}${feedbackLine}

Return a JSON object with exactly these keys:
{
  "audienceMain": "1-2 sentences: primary target audience — who they are, their role/situation",
  "audienceSecondary": "1-2 sentences: secondary audience, or empty string if none",
  "problem": "1-2 sentences: the core problem this solves, grounded in validation findings",
  "solution": "1-2 sentences: what the product/service does to solve it",
  "benefits": "2-3 key benefits as a short paragraph — outcomes the customer gets",
  "offerings": "What's included — main product/service tiers or packages",
  "pricing": "Pricing model and specific numbers if known, or recommended range"
}`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      if (res.ok) {
        const data = await res.json() as { reply?: string };
        const raw = (data.reply ?? "").trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(raw) as LaunchProfile;
        setProfile(parsed);
        saveProfile(parsed);
        setStrategyStage("done");
        setStrategyFeedback("");
        setConfirmed(false);
      } else {
        setStrategyStage(strategyStage === "done" ? "done" : "idle");
        setStrategyError("Generation failed. Please try again.");
      }
    } catch {
      setStrategyStage(strategyStage === "done" ? "done" : "idle");
      setStrategyError("Network error. Please try again.");
    }
    setRevisingStrategy(false);
  };

  const confirmLaunch = async () => {
    if (!projectTitle) return;
    setConfirming(true);
    try {
      // Pre-fill LaunchPad Brand & Digital Presence fields
      localStorage.setItem(`brand-benefit-${projectTitle}`, profile.benefits);
      localStorage.setItem(`brand-offerings-${projectTitle}`, profile.offerings);
      localStorage.setItem(`brand-pricing-${projectTitle}`, profile.pricing);
      // Target audience — write as { main: { label }, secondary: { label } } to match Validate stage format
      const audienceObj: Record<string, { label: string }> = {};
      if (profile.audienceMain.trim()) audienceObj.main = { label: profile.audienceMain.trim() };
      if (profile.audienceSecondary.trim()) audienceObj.secondary = { label: profile.audienceSecondary.trim() };
      if (Object.keys(audienceObj).length > 0) {
        localStorage.setItem(`target-customers-${projectTitle}`, JSON.stringify(audienceObj));
      }
      localStorage.setItem(`launch-profile-confirmed-${projectTitle}`, JSON.stringify(profile));
      setConfirmed(true);
    } catch { /* ignore */ }
    setConfirming(false);
    onConfirmLaunch?.();
  };

  return (
    <div className="p-6 space-y-8">

      {/* What is this? */}
      <section>
        <h4 className="text-base font-semibold text-[#151515] mb-3">What is this?</h4>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <p className="text-[15px] font-medium text-[#151515] leading-relaxed">
          Launching too early wastes money and credibility — this gives you a clear, honest score across problem clarity, market validation, learning, and finance so you know exactly where you stand before you commit.
        </p>
      </section>

      {/* Score bar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-medium text-[#151515]">Readiness Score</h4>
          <span className="text-[28px] font-medium leading-none" style={{ color: scoreColor }}>{pct}%</span>
        </div>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: scoreColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className={cn("rounded-xl px-4 py-3 text-label-medium font-medium flex items-center gap-2", ready ? "bg-[#CEF2E2] text-[#196141]" : "bg-gray-50 text-[#62646A]")}>
          {ready ? <CheckCircle2 size={14} /> : <Lock size={14} />}
          {ready ? "You're ready to launch. All core criteria are met." : `Complete ${total - checked} more criteria to unlock your Go / No-Go verdict.`}
        </div>
      </section>

      {/* Check groups */}
      {GO_CHECKS.map((check, idx) => {
        const Icon = check.icon;
        const isLearning = check.id === "learning";
        const isFinance  = check.id === "finance";
        const groupChecked = isLearning ? 0 : check.items.filter((i) => isChecked(i.key)).length;

        return (
          <motion.section key={check.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#62646A]" />
                <h5 className="text-body-small-medium text-[#151515]">{check.label}</h5>
                {isLearning && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#9A9A9A]">Coming soon</span>}
              </div>
              {!isLearning && <span className="text-[12px] text-[#9A9A9A]">{groupChecked}/{check.items.length}</span>}
            </div>
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-3">{check.description}</p>
            <Separator className="bg-gray-100 mb-3" />

            {/* Foundation Learning — coming soon placeholder */}
            {isLearning && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                <p className="text-[12px] text-[#9A9A9A]">Foundation learning tracking is coming soon. This section will automatically reflect your completed modules.</p>
              </div>
            )}

            {/* Finance Readiness — input cards only, no checkboxes */}
            {isFinance && <FinanceInputCard project={project} />}

            {/* Problem / Market — normal checklist */}
            {!isLearning && !isFinance && (
              <div className="space-y-2.5">
                {check.items.map((item) => {
                  const on = isChecked(item.key);
                  const autoDetected = isAuto(item.key);
                  return (
                    <button key={item.key} onClick={() => toggle(item.key)} className="w-full flex items-center gap-3 text-left group">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        on ? "bg-[#151515] border-[#151515]" : "border-gray-200 group-hover:border-[#151515]")}>
                        {on && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={cn("text-label-medium transition-colors flex-1", on ? "text-[#9A9A9A] line-through" : "text-[#151515]")}>{item.label}</span>
                      {autoDetected && <span className="text-[10px] font-medium text-[#32C382] shrink-0">auto-detected</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.section>
        );
      })}

      {/* AI readiness analysis */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-medium text-[#151515]">Readiness Analysis</h4>
          {analysisStage === "done" && (
            <button onClick={generateAnalysis} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Refresh</button>
          )}
        </div>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
            <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
              <img src="/figmaAssets/starfour.svg" className="w-4 h-4" alt="" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#151515]">Sorene's verdict</p>
              <p className="text-[11px] text-[#9A9A9A]">AI analysis based on your full journey — conversations, offer, paying customers, and scores</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {analysisError && (
              <p className="text-[11px] text-[#DF2E16]">{analysisError}</p>
            )}
            {analysisStage === "idle" && (
              <button onClick={generateAnalysis} disabled={!projectTitle}
                className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] text-[#9A9A9A] hover:border-[#151515] hover:text-[#151515] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {projectTitle ? "Analyse my readiness across all stages" : "Select a project first"}
              </button>
            )}
            {analysisStage === "loading" && (
              <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
                <Loader2 size={13} className="animate-spin" /> Reviewing your full journey…
              </div>
            )}
            {analysisStage === "done" && analysis && (
              <div className="text-[14px] text-[#151515] leading-[1.75] space-y-3 [&_strong]:font-semibold [&_strong]:text-[#151515]">
                <MarkdownText text={analysis} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Launching Strategy */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-medium text-[#151515]">Launching Strategy</h4>
          {strategyStage === "done" && !revisingStrategy && (
            <button onClick={() => generateStrategy()} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Regenerate</button>
          )}
        </div>
        <Separator className="bg-[#D8D9DB] mb-4" />

        {strategyStage === "idle" && (
          <button onClick={() => generateStrategy()} disabled={!projectTitle}
            className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-[13px] text-[#9A9A9A] hover:border-[#151515] hover:text-[#151515] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {projectTitle ? "Generate my launching strategy →" : "Select a project first"}
          </button>
        )}

        {strategyStage === "loading" && (
          <div className="flex items-center gap-2 text-[13px] text-[#9A9A9A] py-4">
            <Loader2 size={14} className="animate-spin" /> Synthesising your validation history…
          </div>
        )}

        {strategyError && <p className="text-[12px] text-[#DF2E16] mt-2">{strategyError}</p>}

        {strategyStage === "done" && (() => {
          const FIELDS: { key: keyof LaunchProfile; label: string; rows: number }[] = [
            { key: "audienceMain",      label: "Target Audience — Primary",   rows: 2 },
            { key: "audienceSecondary", label: "Target Audience — Secondary",  rows: 2 },
            { key: "problem",           label: "Problem",                      rows: 2 },
            { key: "solution",          label: "Solution",                     rows: 2 },
            { key: "benefits",          label: "Benefits",                     rows: 3 },
            { key: "offerings",         label: "Product Offerings",            rows: 3 },
            { key: "pricing",           label: "Pricing",                      rows: 2 },
          ];
          return (
            <div className="space-y-3">
              {FIELDS.map(({ key, label, rows }) => (
                <div key={key} className="rounded-2xl border border-[#ECEDEE] overflow-hidden group">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
                    <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wide">{label}</p>
                    <button onClick={() => setEditingField(editingField === key ? null : key)}
                      className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium opacity-0 group-hover:opacity-100">
                      {editingField === key ? "Done" : "Edit"}
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    {editingField === key ? (
                      <textarea value={profile[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        rows={rows}
                        autoFocus
                        className="w-full text-[13px] text-[#151515] leading-relaxed resize-none focus:outline-none bg-transparent" />
                    ) : (
                      <p className="text-[13px] text-[#151515] leading-relaxed whitespace-pre-wrap">
                        {profile[key] || <span className="text-[#9A9A9A] italic">Not specified</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Feedback to revise */}
              <div className="rounded-2xl border border-[#ECEDEE] p-4 space-y-2">
                <p className="text-[12px] font-medium text-[#151515]">Not quite right?</p>
                <p className="text-[11px] text-[#9A9A9A]">Give feedback and Sorene will revise based on your validation history.</p>
                <textarea
                  value={strategyFeedback}
                  onChange={(e) => setStrategyFeedback(e.target.value)}
                  placeholder="e.g. the pricing should be higher, audience is more senior"
                  rows={3}
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-[13px] text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors resize-none"
                />
                <button onClick={() => generateStrategy(strategyFeedback)} disabled={!strategyFeedback.trim() || revisingStrategy}
                  className="w-full py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                  {revisingStrategy ? <Loader2 size={12} className="animate-spin" /> : null}
                  Revise
                </button>
              </div>

              {/* Confirm to launch */}
              {confirmed ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F0FBF5] border border-[#32C382]">
                  <CheckCircle2 size={14} className="text-[#32C382]" />
                  <p className="text-[13px] font-semibold text-[#32C382]">Confirmed — Brand & Digital Presence in LaunchPad is now pre-filled.</p>
                </div>
              ) : (
                <button onClick={confirmLaunch} disabled={confirming}
                  className="w-full py-3.5 rounded-2xl bg-[#151515] text-white text-[13px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {confirming ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                  Confirm to launch
                </button>
              )}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Validation Progress Bar
// ─────────────────────────────────────────────

const VALIDATION_STAGES = [
  { id: 1, label: "Validate", shortLabel: "V" },
  { id: 2, label: "Interview", shortLabel: "I" },
  { id: 3, label: "Build demo", shortLabel: "B" },
  { id: 4, label: "Experiment", shortLabel: "E" },
  { id: 5, label: "Launch Readiness", shortLabel: "LR" },
];

function ValidationProgress({ project, onCreateProject, onConfirmLaunch }: { project: DirectionCardData | null; onCreateProject: () => void; onConfirmLaunch?: () => void }) {
  const stageKey = `validation-stage-${project?.title ?? ""}`;
  const [activeStage, setActiveStageRaw] = useState<number>(() => {
    if (!project?.title) return 1;
    try { return parseInt(localStorage.getItem(`validation-stage-${project.title}`) ?? "1", 10) || 1; } catch { return 1; }
  });

  const setActiveStage = (val: number | ((prev: number) => number)) => {
    setActiveStageRaw((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(stageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Sync when project changes (user switches projects)
  useEffect(() => {
    if (!project?.title) return;
    try {
      const saved = parseInt(localStorage.getItem(`validation-stage-${project.title}`) ?? "1", 10);
      setActiveStageRaw(saved || 1);
    } catch { setActiveStageRaw(1); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  if (!project) {
    return (
      <div className="p-5 flex flex-col items-center text-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Rocket size={18} className="text-[#9A9A9A]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-body-medium-medium text-[#151515]">Start your validation journey</h3>
          <p className="text-label-medium text-[#62646A] max-w-sm leading-relaxed">
            Choose a direction Sorene has generated for you, or describe your own project to begin.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a href="/direction"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors">
            Choose a Direction
          </a>
          <button onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[#151515] text-sm font-medium hover:bg-gray-50 transition-colors">
            Create My Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-gray-100 mx-8" />
        <div className="flex justify-between relative z-10">
          {VALIDATION_STAGES.map((stage) => {
            const isActive = stage.id === activeStage;
            const isCompleted = stage.id < activeStage;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 border-2",
                  isActive
                    ? "bg-[#151515] border-[#151515] text-white shadow-md scale-110"
                    : isCompleted
                    ? "bg-[#32C382] border-[#32C382] text-white"
                    : "bg-white border-gray-200 text-[#9A9A9A] group-hover:border-[#151515] group-hover:text-[#151515]"
                )}>
                  {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : stage.shortLabel}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold text-center leading-tight max-w-[60px] transition-colors",
                  isActive ? "text-[#151515]" : isCompleted ? "text-[#32C382]" : "text-[#9A9A9A]"
                )}>
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeStage <= 4 ? (
            <VibeStageContent step={VIBE_STEPS[activeStage - 1]} project={project} onAdvance={() => setActiveStage((s) => Math.min(s + 1, 5))} />
          ) : (
            <GoNoGoContent project={project} onConfirmLaunch={onConfirmLaunch} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStage((s) => Math.max(1, s - 1))}
          disabled={activeStage === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#62646A] hover:text-[#151515] hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-[11px] text-[#9A9A9A]">Stage {activeStage} of {VALIDATION_STAGES.length}</span>
        <button
          onClick={() => setActiveStage((s) => Math.min(5, s + 1))}
          disabled={activeStage === 5}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#62646A] hover:text-[#151515] hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Opening Script Card
// ─────────────────────────────────────────────

function OpeningScriptCard({ project }: { project: DirectionCardData | null }) {
  const authUser = useAtomValue(userAtom);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  // Track which project+user combo we've already run for
  const ranFor = useRef("");

  const cacheKey = `opening-script-${project?.title ?? ""}`;

  const generate = async (projectArg: DirectionCardData, uid: string) => {
    const runKey = `${uid}::${projectArg.title}`;
    if (ranFor.current === runKey) return;
    ranFor.current = runKey;

    // Check cache first — migrate any old value that was saved as raw JSON
    try {
      const cached = localStorage.getItem(`opening-script-${projectArg.title}`);
      if (cached) {
        const clean = cached.trim().startsWith("{") ? (() => {
          try { return JSON.parse(cached).reply ?? cached; } catch { return cached; }
        })() : cached;
        if (clean.trim().startsWith("{")) {
          // Still looks like junk — drop it and regenerate
          localStorage.removeItem(`opening-script-${projectArg.title}`);
        } else {
          setScript(clean);
          return;
        }
      }
    } catch { /* ignore */ }

    setLoading(true);
    setScript("");

    const dna = authUser?.profile?.dnaScores;
    const dnaContext = dna ? [
      dna.strengths_summary && `Strengths: ${dna.strengths_summary}`,
      dna.motivation_driver && `Motivation: ${dna.motivation_driver}`,
      dna.collaboration_mode && `Collaboration style: ${dna.collaboration_mode}`,
      dna.energy_source && `Energy source: ${dna.energy_source}`,
      dna.non_negotiable && `Non-negotiables: ${dna.non_negotiable}`,
    ].filter(Boolean).join("\n") : null;

    const prompt = `You are Sorene. Write a personalized outreach script for someone validating their idea.

Project: "${projectArg.title}"
${projectArg.oneliner ? `One-liner: ${projectArg.oneliner}` : ""}
${projectArg.description ? `Description: ${projectArg.description}` : ""}
${projectArg.first_10_customers ? `Target customer: ${projectArg.first_10_customers}` : ""}
${dnaContext ? `\nFounder DNA:\n${dnaContext}` : ""}

Write a short, natural-sounding opening message (2-4 sentences) they can use to reach out to potential customers. It must:
- Feel authentic to this founder's personality and strengths
- Not pitch or sell — only request a conversation
- Mention the problem area naturally, not the solution
- Be warm, direct, and human

Use the template as a guide but make it genuinely personal:
"Hi [name], I'm working on something and trying to understand [specific problem area] better — not selling anything. Would you be open to a 30-minute chat? I want to hear about your experience."

Output only the script text, in quotes. No explanation, no preamble.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const full: string = (data?.reply ?? "").trim();
      if (full) {
        setScript(full);
        try { localStorage.setItem(`opening-script-${projectArg.title}`, full); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Fire when both project and authenticated user are ready
  useEffect(() => {
    if (project?.title && authUser?.uid) {
      generate(project, authUser.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title, authUser?.uid]);

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <MessageCircle size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Script for opening the conversation</p>
            <p className="text-[11px] text-[#9A9A9A]">Tailored to your project and personality</p>
          </div>
        </div>
        {script && !loading && project && authUser?.uid && (
          <button onClick={() => {
            try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
            ranFor.current = "";
            generate(project, authUser.uid!);
          }}
            className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors underline shrink-0">
            Regenerate
          </button>
        )}
      </div>
      <div className="px-5 py-4">
      {loading && !script && (
        <div className="flex items-center gap-2 text-[#9A9A9A] text-[13px]">
          <Loader2 size={13} className="animate-spin" /> Generating your script…
        </div>
      )}
      {script && (
        <p className="text-[13px] text-[#62646A] leading-relaxed italic whitespace-pre-wrap">{script}</p>
      )}
      {!loading && !script && (
        <p className="text-[13px] text-[#62646A] leading-relaxed italic">
          "Hi [name], I'm working on something and trying to understand [problem area] better — not selling anything. Would you be open to a 30-minute chat? I want to hear about your experience."
        </p>
      )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Target Customer Card — identifies main + secondary profiles
// ─────────────────────────────────────────────

type CustomerProfile = {
  label: string;
  who: string;
  pains: string;
  where: string;
};

// Shared hook: generates + caches main/secondary customer profiles so both
// the Mission wording and the TargetCustomerCard stay in sync reactively.
function useTargetCustomers(project: DirectionCardData | null) {
  const authUser = useAtomValue(userAtom);
  const [main, setMain] = useState<CustomerProfile | null>(null);
  const [secondary, setSecondary] = useState<CustomerProfile | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const ranFor = useRef("");

  const generate = async (projectArg: DirectionCardData, uid: string) => {
    const runKey = `${uid}::${projectArg.title}`;
    if (ranFor.current === runKey) return;
    ranFor.current = runKey;

    try {
      const cached = localStorage.getItem(`target-customers-${projectArg.title}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only trust cache if it has a valid main profile AND questions (older
        // caches lacked questions / stored the raw {reply:...} object)
        if (parsed?.main?.label && Array.isArray(parsed?.questions) && parsed.questions.length >= 3) {
          setMain(parsed.main ?? null);
          setSecondary(parsed.secondary ?? null);
          setQuestions(parsed.questions);
          return;
        }
        localStorage.removeItem(`target-customers-${projectArg.title}`);
      }
    } catch { /* ignore */ }

    setLoading(true);
    setMain(null);
    setSecondary(null);
    setQuestions([]);

    const prompt = `You are Sorene, an expert at customer discovery interviews. For this validation project, identify who to interview and craft the questions to ask them.

Project: "${projectArg.title}"
${projectArg.oneliner ? `One-liner: ${projectArg.oneliner}` : ""}
${projectArg.description ? `Description: ${projectArg.description}` : ""}
${projectArg.first_10_customers ? `Initial customer notes: ${projectArg.first_10_customers}` : ""}
${projectArg.simple_positioning ? `Positioning: ${projectArg.simple_positioning}` : ""}

Provide:
1. TWO customer profiles — MAIN (primary, feels the pain most acutely and pays first) and SECONDARY (adjacent fallback/expansion).
2. THREE interview questions tailored to this specific project. They must:
   - Read smoothly and naturally — like a real human asking, never a template with a pasted product description.
   - Focus on the customer's problems, current behaviour, and willingness to pay — NOT pitch the solution.
   - Be open-ended (no yes/no questions).
   - Each be a single clean sentence under 20 words.

Return ONLY valid JSON, no markdown, no preamble, in exactly this shape:
{
  "main": { "label": "short profile name (3-5 words)", "who": "one sentence describing who they are", "pains": "one sentence on their core pain", "where": "one sentence on where to find/reach them" },
  "secondary": { "label": "short profile name (3-5 words)", "who": "one sentence", "pains": "one sentence", "where": "one sentence" },
  "questions": ["question 1", "question 2", "question 3"]
}`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const reply: string = data?.reply ?? "";
      // Parse the JSON object out of the reply text
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setMain(parsed.main ?? null);
        setSecondary(parsed.secondary ?? null);
        if (Array.isArray(parsed.questions)) setQuestions(parsed.questions);
        try { localStorage.setItem(`target-customers-${projectArg.title}`, JSON.stringify(parsed)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (project?.title && authUser?.uid) {
      generate(project, authUser.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title, authUser?.uid]);

  const regenerate = () => {
    if (!project?.title || !authUser?.uid) return;
    try { localStorage.removeItem(`target-customers-${project.title}`); } catch { /* ignore */ }
    ranFor.current = "";
    generate(project, authUser.uid);
  };

  return { main, secondary, questions, loading, regenerate, canRegenerate: !!(project && authUser?.uid) };
}

function TargetCustomerCard({
  project,
  main,
  secondary,
  loading,
  regenerate,
  canRegenerate,
}: {
  project: DirectionCardData | null;
  main: CustomerProfile | null;
  secondary: CustomerProfile | null;
  loading: boolean;
  regenerate: () => void;
  canRegenerate: boolean;
}) {
  const ProfileBlock = ({ profile, tone }: { profile: CustomerProfile; tone: "main" | "secondary" }) => (
    <div className={cn(
      "flex-1 rounded-2xl border px-4 py-4",
      tone === "main" ? "border-[#151515]/15 bg-[#F5FFD9]/40" : "border-[#ECEDEE] bg-[#FAFAFA]"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full",
          tone === "main" ? "bg-[#151515] text-white" : "bg-[#ECEDEE] text-[#62646A]"
        )}>
          {tone === "main" ? "Main" : "Secondary"}
        </span>
        <p className="text-[13px] font-semibold text-[#151515]">{profile.label}</p>
      </div>
      <div className="space-y-1.5">
        <p className="text-[12px] text-[#62646A] leading-relaxed"><span className="font-semibold text-[#151515]">Who:</span> {profile.who}</p>
        <p className="text-[12px] text-[#62646A] leading-relaxed"><span className="font-semibold text-[#151515]">Pain:</span> {profile.pains}</p>
        <p className="text-[12px] text-[#62646A] leading-relaxed"><span className="font-semibold text-[#151515]">Where:</span> {profile.where}</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Users size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Target customer profiles</p>
            <p className="text-[11px] text-[#9A9A9A]">Who to interview first — and who's next</p>
          </div>
        </div>
        {(main || secondary) && !loading && canRegenerate && (
          <button onClick={regenerate}
            className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors underline shrink-0">
            Regenerate
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {loading && !main && (
          <div className="flex items-center gap-2 text-[#9A9A9A] text-[13px]">
            <Loader2 size={13} className="animate-spin" /> Identifying your customer profiles…
          </div>
        )}
        {(main || secondary) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {main && <ProfileBlock profile={main} tone="main" />}
            {secondary && <ProfileBlock profile={secondary} tone="secondary" />}
          </div>
        )}
        {!loading && !main && !secondary && project?.first_10_customers && (
          <p className="text-[13px] text-[#62646A] leading-relaxed">{project.first_10_customers}</p>
        )}
      </div>
    </div>
  );
}

// Renders AI output that may contain light markdown or the structured plain-text
// format we request (section titles, • bullets, **bold**).
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    // Skip blank lines and dividers
    if (!line || /^-{2,}$/.test(line) || /^\*{2,}$/.test(line)) { i++; continue; }
    // Markdown headings
    if (line.startsWith("### ")) {
      elements.push(<p key={i} className="text-[13px] font-semibold text-[#151515] mt-5 mb-1">{line.slice(4)}</p>);
    } else if (line.startsWith("## ")) {
      elements.push(<p key={i} className="text-[13px] font-semibold text-[#151515] mt-5 mb-1">{line.slice(3)}</p>);
    // Plain section header: a line with no bullet/number that is short and ends without a period
    } else if (!line.startsWith("•") && !line.startsWith("-") && !line.startsWith("*") && !/^\d+\./.test(line) && line.length < 60 && !line.endsWith(".") && !line.includes("—")) {
      elements.push(<p key={i} className="text-[13px] font-semibold text-[#151515] mt-5 mb-1">{renderInline(line)}</p>);
    // Bullet: • or - or *
    } else if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.replace(/^[•\-*]\s+/, "");
      elements.push(
        <div key={i} className="flex gap-2 items-start mb-1">
          <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-[#9A9A9A]" />
          <p className="text-[13px] text-[#62646A] leading-relaxed">{renderInline(content)}</p>
        </div>
      );
    // Numbered list
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)?.[1] ?? "";
      const content = line.replace(/^\d+\.\s+/, "");
      elements.push(
        <div key={i} className="flex gap-2.5 items-start mb-1">
          <span className="text-[11px] font-bold text-[#9A9A9A] shrink-0 mt-0.5 w-4">{num}.</span>
          <p className="text-[13px] text-[#62646A] leading-relaxed">{renderInline(content)}</p>
        </div>
      );
    } else {
      elements.push(<p key={i} className="text-[13px] text-[#62646A] leading-relaxed mb-1">{renderInline(line)}</p>);
    }
    i++;
  }
  return <div>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and remove stray * characters
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-[#151515]">{part.slice(2, -2)}</strong>
      : part.replace(/\*/g, "")
  );
}



function PatternSummaryCard({ projectTitle }: { projectTitle: string }) {
  const authUser = useAtomValue(userAtom);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [output, setOutput] = useState("");
  const [clarifyInput, setClarifyInput] = useState("");
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, history]);

  // Load persisted summary — localStorage first (instant), then Firestore (cross-device)
  useEffect(() => {
    if (!projectTitle || !authUser?.uid || loaded) return;

    const cacheKey = `pattern-summary-${projectTitle}`;

    // Helper: restore state from a saved history array (only assistant messages stored)
    const restore = (saved: { role: string; content: string }[]) => {
      if (!saved?.length) return false;
      const display = saved.filter((m) => m.role === "assistant");
      if (!display.length) return false;
      setHistory(saved as { role: "user" | "assistant"; content: string }[]);
      setOutput(display[display.length - 1].content);
      setStage("done");
      setLoaded(true);
      return true;
    };

    // 1. Try localStorage (same device, survives refresh)
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (restore(parsed?.history ?? parsed)) return;
      }
    } catch { /* ignore */ }

    // 2. Fall back to Firestore (cross-device / after logout)
    import("@/lib/authFetch").then(({ authFetch }) =>
      authFetch(`/api/execution-projects/pattern-summary?project=${encodeURIComponent(projectTitle)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          const saved = data?.history ?? data;
          if (restore(saved)) {
            try { localStorage.setItem(cacheKey, JSON.stringify({ history: saved })); } catch { /* ignore */ }
          } else {
            setLoaded(true); // nothing saved yet — mark as checked so we don't retry
          }
        })
        .catch(() => { setLoaded(true); })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle, authUser?.uid]);

  const persist = (newHistory: { role: "user" | "assistant"; content: string }[]) => {
    // Save only assistant turns — skip the giant system prompt (index 0) to keep storage lean
    const toSave = newHistory.filter((m, i) => m.role === "assistant" || i > 0);
    const cacheKey = `pattern-summary-${projectTitle}`;
    try { localStorage.setItem(cacheKey, JSON.stringify({ history: toSave })); } catch { /* ignore */ }
    try { localStorage.setItem(`pattern-done-${projectTitle}`, "1"); } catch { /* ignore */ }
    import("@/lib/authFetch").then(({ authFetch }) =>
      authFetch("/api/execution-projects/pattern-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTitle, history: toSave }),
      }).catch(() => {})
    );
  };

  const clearPersisted = () => {
    const cacheKey = `pattern-summary-${projectTitle}`;
    try { localStorage.removeItem(cacheKey); localStorage.removeItem(`pattern-done-${projectTitle}`); } catch { /* ignore */ }
    setLoaded(false);
    import("@/lib/authFetch").then(({ authFetch }) =>
      authFetch("/api/execution-projects/pattern-summary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTitle }),
      }).catch(() => {})
    );
  };

  const getConversations = (): ConversationEntry[] => {
    try {
      const raw = localStorage.getItem(`convlog-${projectTitle}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const stream = async (messages: { role: "user" | "assistant"; content: string }[]) => {
    const { authFetch } = await import("@/lib/authFetch");
    const res = await authFetch("/api/execution-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: messages[messages.length - 1].content,
        history: messages.slice(0, -1),
        system: "You are Sorene, an execution coach helping an entrepreneur validate their idea. Be direct, specific, and practical. Surface real patterns and ask sharp clarifying questions.",
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const full: string = (data?.reply ?? "").trim();
    setOutput(full);
    return full;
  };

  // prevHistory = saved Q&A from a previous run (carried over on Regenerate)
  const handleAnalyze = async (prevHistory: { role: "user" | "assistant"; content: string }[] = []) => {
    const entries = getConversations();
    setStage("loading");
    setOutput("");
    const summary = entries.length === 0
      ? "No conversations have been logged yet for this project."
      : entries.map((e, i) =>
          `Conversation ${i + 1} — ${e.name || "Anonymous"} (${e.createdAt})\nNotes: ${e.notes || "no notes"}`
        ).join("\n\n");
    const prompt = `You are Sorene, an execution coach helping an entrepreneur validate their idea: "${projectTitle}".

Here are their customer conversation logs:

${summary}

Analyze the patterns and write your response in plain prose with clear section titles. Do NOT use markdown symbols like ##, ###, **, --, or ---. Use this exact structure:

Most Common Problems
List the top 2-3 problems customers mentioned, one per line, starting with a bullet •

Repeating Language
List exact words or phrases that appear in multiple conversations, one per line with •, and explain what each signals

Pain Signals
Rate the frequency and intensity: how often did it come up, how urgent did it feel?

Paying to Solve It
Are people already spending money on workarounds? What does that tell us?

Strongest Signal
One sentence: the single most actionable insight from these conversations.

Then ask 2-3 sharp clarifying questions to go deeper. Be direct and specific. Write like a sharp co-founder, not a consultant.${
  prevHistory.length > 0
    ? `\n\nContext from previous analysis session (the user already answered some of your earlier questions — factor this in and don't repeat questions they've already answered):\n${prevHistory.map((m) => `${m.role === "user" ? "Founder" : "Sorene"}: ${m.content}`).join("\n\n")}`
    : ""
}`;
    const msgs = [{ role: "user" as const, content: prompt }];
    const reply = await stream(msgs);
    // Store only the assistant reply in history (not the giant system prompt)
    const displayHistory = [{ role: "assistant" as const, content: reply }];
    setHistory(displayHistory);
    setStage("done");
    setLoaded(true);
    persist(displayHistory);
  };

  const handleClarify = async () => {
    if (!clarifyInput.trim() || clarifyLoading) return;
    setClarifyLoading(true);
    const userMsg = { role: "user" as const, content: clarifyInput.trim() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setClarifyInput("");
    setOutput("");
    const reply = await stream(newHistory);
    const finalHistory = [...newHistory, { role: "assistant" as const, content: reply }];
    setHistory(finalHistory);
    setOutput("");
    setClarifyLoading(false);
    persist(finalHistory);
  };

  return (
    <div className="rounded-2xl border border-[#32C382]/40 bg-[#F5FFD9] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#32C382] shrink-0" />
          <p className="text-body-small-medium text-[#151515]">Pattern summary</p>
        </div>
        {stage === "idle" && (
          <button onClick={() => handleAnalyze()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors">
            <BarChart3 size={12} /> Summarise Patterns
          </button>
        )}
        {stage === "done" && (
          <button
            onClick={() => {
              const prev = history;
              setOutput("");
              setHistory([]);
              clearPersisted();
              handleAnalyze(prev);
            }}
            className="flex items-center gap-1.5 text-[11px] text-[#62646A] hover:text-[#151515] transition-colors underline">
            Regenerate
          </button>
        )}
      </div>

      {/* Idle hint */}
      {stage === "idle" && (
        <div className="px-4 pb-4">
          <p className="text-label-medium text-[#62646A] leading-relaxed">
            Log your conversations and click <strong className="text-[#151515]">Summarise Patterns</strong> — Sorene will surface recurring themes, pain frequency, and the strongest signal to build on.
          </p>
        </div>
      )}

      {/* Loading / streaming output */}
      {(stage === "loading" || (stage === "done" && history.length > 0)) && (
        <div className="border-t border-[#32C382]/20 bg-white">
          {/* Full conversation thread */}
          <div className="px-4 py-4 space-y-4 max-h-[420px] overflow-y-auto">
            {history.map((msg, i) => (
              msg.role === "assistant" ? (
                <div key={i}>
                  <MarkdownText text={msg.content} />
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-[#151515] text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )
            ))}
            {stage === "loading" && (
              output
                ? <div><MarkdownText text={output} /></div>
                : <div className="flex items-center gap-2 text-[#9A9A9A] text-sm"><Loader2 size={14} className="animate-spin" /> Analysing patterns…</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Clarify input */}
          {stage === "done" && (
            <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
              <input value={clarifyInput} onChange={(e) => setClarifyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleClarify(); } }}
                placeholder="Answer a question or ask for more detail…"
                disabled={clarifyLoading}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors disabled:opacity-50" />
              <button onClick={handleClarify} disabled={!clarifyInput.trim() || clarifyLoading}
                className="px-3 py-2 rounded-xl bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30">
                {clarifyLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Conversation Logger
// ─────────────────────────────────────────────

interface ConversationEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  fileName?: string;
  createdAt: string;
}

function ConversationLogger({ projectTitle }: { projectTitle: string }) {
  const authUser = useAtomValue(userAtom);
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [, forceRender] = useState(0);
  const expandedId = _expandedIds[projectTitle] ?? null;
  const setExpandedId = (id: string | null) => {
    _expandedIds[projectTitle] = id;
    forceRender((n) => n + 1);
  };
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", fileName: "" });

  const getToken = () => import("@/lib/firebase").then((m) => m.auth?.currentUser?.getIdToken()).catch(() => null);

  // Load from Firestore, fall back to localStorage while fetching
  useEffect(() => {
    if (!projectTitle) { setLoading(false); return; }
    // Show localStorage data immediately while fetching
    try {
      const raw = localStorage.getItem(`convlog-${projectTitle}`);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }

    getToken().then((token) => {
      if (!token) { setLoading(false); return; }
      fetch(`/api/execution-projects/conversations?project=${encodeURIComponent(projectTitle)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.entries?.length) {
            setEntries(data.entries);
            try { localStorage.setItem(`convlog-${projectTitle}`, JSON.stringify(data.entries)); } catch { /* ignore */ }
          }
        })
        .finally(() => setLoading(false));
    });
  }, [projectTitle]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setForm((prev) => ({ ...prev, fileName: f.name }));
  };

  const handleAdd = async () => {
    if (!form.name.trim() && !form.notes.trim()) return;
    setSaving(true);
    const entry: ConversationEntry = {
      id: Date.now().toString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      fileName: form.fileName || undefined,
      createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    try { localStorage.setItem(`convlog-${projectTitle}`, JSON.stringify(updated)); } catch { /* ignore */ }
    // Persist to Firestore
    const token = await getToken();
    if (token) {
      fetch("/api/execution-projects/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectTitle, entry }),
      }).catch(() => {});
    }
    setForm({ name: "", phone: "", email: "", notes: "", fileName: "" });
    if (fileRef.current) fileRef.current.value = "";
    setAddOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    try { localStorage.setItem(`convlog-${projectTitle}`, JSON.stringify(updated)); } catch { /* ignore */ }
    if (expandedId === id) setExpandedId(null);
    const token = await getToken();
    if (token) {
      fetch("/api/execution-projects/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectTitle, entryId: id }),
      }).catch(() => {});
    }
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Users size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">
              Customer conversations
              {entries.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-[10px] font-semibold text-[#62646A]">{entries.length} logged</span>}
            </p>
            <p className="text-[11px] text-[#9A9A9A]">Log each conversation after it happens</p>
          </div>
        </div>
        <button onClick={() => setAddOpen((v) => !v)}
          className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all",
            addOpen ? "bg-gray-100 text-[#62646A]" : "bg-[#151515] text-white hover:bg-[#2a2a2a]")}>
          <Plus size={13} />{addOpen ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence initial={false}>
        {addOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
            className="overflow-hidden border-b border-gray-100">
            <div className="p-4 space-y-3 bg-[#FAFAFA]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Name" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                </div>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone number" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                </div>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                  <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email address" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                </div>
              </div>
              <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes from the conversation — what problems did they mention? What words did they use? How much pain?"
                rows={4} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-dashed border-gray-200 hover:border-[#151515] transition-colors text-sm text-[#62646A] hover:text-[#151515]">
                  <Paperclip size={13} />
                  {form.fileName ? <span className="text-[#151515] font-medium truncate max-w-[200px]">{form.fileName}</span> : "Attach recap (Word / PDF)"}
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFile} />
                </label>
                <button onClick={handleAdd} disabled={!form.name.trim() && !form.notes.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Save conversation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      {entries.length === 0 && !addOpen && (
        <div className="px-4 py-6 text-center">
          {loading
            ? <Loader2 size={16} className="animate-spin text-[#9A9A9A] mx-auto" />
            : <>
                <p className="text-label-medium text-[#9A9A9A]">No conversations logged yet.</p>
                <p className="text-[11px] text-[#9A9A9A] mt-0.5">Click <strong>Add</strong> after each customer chat.</p>
              </>}
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {entries.map((entry) => {
          const isOpen = expandedId === entry.id;
          return (
            <div key={entry.id}>
              <button onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#62646A]">
                  {(entry.name?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-small-medium text-[#151515] truncate">{entry.name || "Anonymous"}</p>
                  <p className="text-[11px] text-[#9A9A9A] truncate">{entry.email || entry.phone || entry.createdAt}</p>
                </div>
                {entry.fileName && <FileText size={13} className="text-[#9A9A9A] shrink-0" />}
                <span className="text-[11px] text-[#9A9A9A] shrink-0">{entry.createdAt}</span>
                {isOpen ? <ChevronUp size={14} className="text-[#9A9A9A] shrink-0" /> : <ChevronDown size={14} className="text-[#9A9A9A] shrink-0" />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                    className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 bg-[#FAFAFA]">
                      <div className="flex flex-wrap gap-4 pt-2 text-[12px]">
                        {entry.phone && <span className="flex items-center gap-1.5 text-[#62646A]"><Phone size={11} />{entry.phone}</span>}
                        {entry.email && <span className="flex items-center gap-1.5 text-[#62646A]"><Mail size={11} />{entry.email}</span>}
                      </div>
                      {entry.notes && (
                        <div className="rounded-xl bg-white border border-gray-100 px-3 py-2.5">
                          <p className="text-label-medium text-[#151515] leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                      )}
                      {entry.fileName && (
                        <div className="flex items-center gap-2 text-[12px] text-[#62646A]">
                          <Paperclip size={12} />{entry.fileName}
                        </div>
                      )}
                      <button onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1.5 text-[12px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Validate → Interview Readiness Bar
// ─────────────────────────────────────────────

function ValidateReadinessBar({ projectTitle, onAdvance }: { projectTitle: string; onAdvance: () => void }) {
  const [convCount, setConvCount] = useState(0);
  const [hasNotes, setHasNotes] = useState(false);
  const [patternDone, setPatternDone] = useState(false);
  const [hasClarity, setHasClarity] = useState(false);

  const refresh = () => {
    try {
      const raw = localStorage.getItem(`convlog-${projectTitle}`);
      const entries: { notes?: string }[] = raw ? JSON.parse(raw) : [];
      setConvCount(entries.length);
      setHasNotes(entries.some((e) => e.notes && e.notes.trim().length > 20));
    } catch { /* ignore */ }
    try {
      setPatternDone(!!localStorage.getItem(`pattern-done-${projectTitle}`));
    } catch { /* ignore */ }
    // Clarity = user has replied to at least one clarifying question in the pattern summary
    try {
      const raw = localStorage.getItem(`pattern-summary-${projectTitle}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const saved: { role: string }[] = parsed?.history ?? parsed ?? [];
        // Summary starts with an assistant message; clarity requires a user follow-up
        setHasClarity(saved.filter((m) => m.role === "user").length >= 1);
      } else {
        setHasClarity(false);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    const timer = setInterval(refresh, 3000);
    return () => { window.removeEventListener("storage", handler); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  // Score (out of 100):
  // Conversations: 0→0, 1-4→15, 5-9→30, 10-19→50, 20-29→60, 30+→70
  // Detailed notes: +10
  // Clear signal (pattern done): +10
  // Clarified sharp questions: +10
  const convScore =
    convCount === 0  ? 0  :
    convCount <= 4   ? 15 :
    convCount <= 9   ? 30 :
    convCount <= 19  ? 50 :
    convCount <= 29  ? 60 : 70;
  const score = Math.min(100, convScore + (hasNotes ? 10 : 0) + (patternDone ? 10 : 0) + (hasClarity ? 10 : 0));

  const { label, sublabel, color, textColor } =
    score === 0  ? { label: "Not started",      sublabel: "Log your first customer conversation to begin",                  color: "bg-[#ECEDEE]",  textColor: "text-[#9A9A9A]"  } :
    score <= 20  ? { label: "Just starting",    sublabel: "Keep going — aim for at least 10 conversations",                 color: "bg-[#FFA94D]",  textColor: "text-[#C85B00]"  } :
    score <= 40  ? { label: "Building signals", sublabel: "Good momentum — add notes and keep talking to customers",         color: "bg-[#FFD43B]",  textColor: "text-[#7B5D00]"  } :
    score <= 60  ? { label: "Strong signals",   sublabel: "Run the Pattern Summary to identify your clearest signal",       color: "bg-[#74C0FC]",  textColor: "text-[#1864AB]"  } :
    score <= 80  ? { label: "Almost ready",     sublabel: "Answer the clarifying questions to sharpen your signal",         color: "bg-[#63E6BE]",  textColor: "text-[#0B7A52]"  } :
                   { label: "Ready for Interview", sublabel: "You have a clear signal. Move to Interview stage.",            color: "bg-[#32C382]",  textColor: "text-[#0B5E35]"  };

  const checkItems = [
    { done: convCount >= 10, text: `${convCount} conversation${convCount !== 1 ? "s" : ""} logged (target: 10–50)` },
    { done: hasNotes,        text: "Detailed notes captured" },
    { done: patternDone,     text: "Have clear signal of problem to solve" },
    { done: hasClarity,      text: "Answered clarifying questions sharply" },
  ];

  return (
    <div className="rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#151515]">Readiness to advance to Interview</p>
          <span className={cn("text-[13px] font-bold", textColor)}>{score}%</span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#F0F1F2] overflow-hidden mb-3">
          <div
            className={cn("h-full rounded-full transition-all duration-700", color)}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("text-[12px] font-semibold", textColor)}>{label}</span>
          <span className="text-[11px] text-[#9A9A9A]">— {sublabel}</span>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px]",
                item.done ? "bg-[#32C382] text-white" : "border border-[#ECEDEE] bg-[#FAFAFA]"
              )}>
                {item.done && "✓"}
              </div>
              <p className={cn("text-[12px]", item.done ? "text-[#151515]" : "text-[#9A9A9A]")}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Start Interview CTA — unlocks at 60%, gets more prominent as score rises */}
        {score >= 60 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 pt-4 border-t border-[#ECEDEE]"
          >
            <button
              onClick={onAdvance}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-semibold transition-all",
                score >= 100
                  ? "bg-[#32C382] text-white hover:bg-[#27a36d]"
                  : score >= 80
                  ? "bg-[#151515] text-white hover:bg-[#2a2a2a]"
                  : "bg-[#F0F1F2] text-[#62646A] hover:bg-[#E5E6E8]"
              )}
            >
              Start Interview <ArrowRight size={15} />
            </button>
            {score < 80 && (
              <p className="text-center text-[11px] text-[#9A9A9A] mt-2">
                You have enough signal to start — more conversations will sharpen it
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Module-level store so expandedId survives ConversationLogger remounts
const _expandedIds: Record<string, string | null> = {};

// Collapsible section header shared across stage 1
function CollapseSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h4 className="text-base font-semibold text-[#151515]">{title}</h4>
        <ChevronDown
          size={16}
          className={cn("text-[#9A9A9A] transition-transform duration-200 group-hover:text-[#151515]", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      <Separator className="bg-[#D8D9DB]" />
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ValidateStage1({
  step,
  project,
  customers,
  missionWho,
  interviewQuestions,
  onAdvance,
}: {
  step: typeof VIBE_STEPS[number];
  project: DirectionCardData | null;
  customers: ReturnType<typeof useTargetCustomers>;
  missionWho: string;
  interviewQuestions: string[];
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">

      {/* ── What is this? ── */}
      <section>
        <h4 className="text-base font-semibold text-[#151515] mb-3">What is this?</h4>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <p className="text-[15px] font-medium text-[#151515] leading-relaxed">{step.whatIs}</p>
      </section>

      {/* ── Your Project (collapsible) ── */}
      {project && (
        <CollapseSection title="Your Project">
          <p className="text-[15px] font-semibold text-[#151515] mb-1">{project.title}</p>
          {project.oneliner && <p className="text-[13px] text-[#62646A] leading-relaxed mb-4">{project.oneliner}</p>}
          {project.simple_positioning && (
            <div className="rounded-2xl border border-[#ECEDEE] bg-[#FAFAFA] px-4 py-3 mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A] mb-1">Positioning</p>
              <p className="text-[13px] text-[#151515] leading-relaxed">{project.simple_positioning}</p>
            </div>
          )}
          <TargetCustomerCard
            project={project}
            main={customers.main}
            secondary={customers.secondary}
            loading={customers.loading}
            regenerate={customers.regenerate}
            canRegenerate={customers.canRegenerate}
          />
        </CollapseSection>
      )}

      {/* ── Your Mission (collapsible) ── */}
      <CollapseSection title="Your Mission">
        <p className="text-[13px] text-[#62646A] leading-relaxed mb-5">
          Have <strong className="text-[#151515] font-semibold">as many conversations as you can</strong> (aim for 30 minutes each) with {missionWho}. The goal is not to pitch — it is to listen deeply and understand their world.
        </p>
        <div className="space-y-3">
          {[
            "Focus on their problems, not your solution",
            "Listen more than you talk",
            "Record real quotes and exact language used",
            "Log responses here — we will analyze the pattern together",
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#151515] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
              <p className="text-[13px] text-[#151515] leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </CollapseSection>

      {/* ── Questions & Script (collapsible) ── */}
      <CollapseSection title="Questions & Script">
        <div className="space-y-4">

          {/* Interview questions */}
          <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
              <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
                <Search size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#151515]">3 tailored interview questions</p>
                <p className="text-[11px] text-[#9A9A9A]">Based on your project's problem area</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {customers.loading && customers.questions.length === 0 && (
                <div className="flex items-center gap-2 text-[#9A9A9A] text-[13px]">
                  <Loader2 size={13} className="animate-spin" /> Tailoring your questions…
                </div>
              )}
              {(!customers.loading || customers.questions.length > 0) && interviewQuestions.map((q, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[11px] font-bold text-[#9A9A9A] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-[13px] text-[#62646A] leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opening Script */}
          <OpeningScriptCard project={project} />
        </div>
      </CollapseSection>

      {/* ── Customer conversations (collapsible, separate section) ── */}
      <CollapseSection title="Customer conversations">
        <ConversationLogger projectTitle={project?.title ?? ""} />
        <div className="mt-4">
          <PatternSummaryCard projectTitle={project?.title ?? ""} />
        </div>
      </CollapseSection>

      {/* ── Readiness score ── */}
      <ValidateReadinessBar projectTitle={project?.title ?? ""} onAdvance={onAdvance} />

    </div>
  );
}

function VibeStageContent({ step, project, onAdvance }: { step: typeof VIBE_STEPS[number]; project: DirectionCardData | null; onAdvance: () => void }) {
  const Icon = step.icon;
  const customers = useTargetCustomers(project);

  // Derive mission wording reactively from customers.main — using state so it
  // persists even if parent re-renders for unrelated reasons
  const [missionWho, setMissionWho] = useState("real people who live this problem every day");
  useEffect(() => {
    const m = customers.main;
    if (!m) return;
    if (m.label && m.who) {
      const who = m.who.replace(/\.$/, "").trim();
      setMissionWho(`${m.label} — ${who.charAt(0).toLowerCase()}${who.slice(1)}`);
    } else if (m.label) {
      setMissionWho(m.label);
    }
  }, [customers.main]);

  // Stage 1 gets the full guided experience
  if (step.id === 1) {
    // Smooth, AI-tailored interview questions — fall back to clean generic ones
    const fallbackQuestions = [
      "What's the most frustrating part of how you handle this today?",
      "What have you already tried to fix it, and how did that go?",
      "If a perfect solution existed, what would it be worth to you?",
    ];
    const interviewQuestions = customers.questions.length >= 3 ? customers.questions.slice(0, 3) : fallbackQuestions;

    return <ValidateStage1
      step={step}
      project={project}
      customers={customers}
      missionWho={missionWho}
      interviewQuestions={interviewQuestions}
      onAdvance={onAdvance}
    />;
  }

  if (step.id === 2) {
    return <InterviewStage2 step={step} project={project} onAdvance={onAdvance} />;
  }

  if (step.id === 3) {
    return <BuildDemoStage3 step={step} project={project} onAdvance={onAdvance} />;
  }

  if (step.id === 4) {
    return <ExperimentStage4 step={step} project={project} onAdvance={onAdvance} />;
  }

  return null;
}

// ─────────────────────────────────────────────
// Interview Stage 2 — Painkiller Problem
// ─────────────────────────────────────────────

type ConfidenceLevel = "High" | "Medium-High" | "Medium" | "Medium-Low" | "Low";

function parseConfidenceLevel(text: string): ConfidenceLevel | null {
  const lower = text.toLowerCase();
  const idx = lower.indexOf("confidence level");
  if (idx === -1) return null;
  const slice = text.slice(idx, idx + 120);
  if (/medium-high/i.test(slice)) return "Medium-High";
  if (/medium-low/i.test(slice))  return "Medium-Low";
  if (/\bhigh\b/i.test(slice))    return "High";
  if (/\bmedium\b/i.test(slice))  return "Medium";
  if (/\blow\b/i.test(slice))     return "Low";
  return null;
}

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { bg: string; text: string; border: string }> = {
  "High":        { bg: "bg-[#D3F9E3]", text: "text-[#0B5E35]", border: "border-[#32C382]" },
  "Medium-High": { bg: "bg-[#DBF0FF]", text: "text-[#1864AB]", border: "border-[#74C0FC]" },
  "Medium":      { bg: "bg-[#FFF3CD]", text: "text-[#7B5D00]", border: "border-[#FFD43B]" },
  "Medium-Low":  { bg: "bg-[#FFE8CC]", text: "text-[#C85B00]", border: "border-[#FFA94D]" },
  "Low":         { bg: "bg-[#FFE0E0]", text: "text-[#9B1C1C]", border: "border-[#FF6B6B]" },
};

function isConfidenceHighEnough(level: ConfidenceLevel | null): boolean {
  return level === "High" || level === "Medium-High";
}

function PainkillerAnalysisCard({ projectTitle }: { projectTitle: string }) {
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [output, setOutput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const cacheKey = `painkiller-analysis-${projectTitle}`;

  useEffect(() => {
    if (!projectTitle || loaded) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) { setOutput(raw); setStage("done"); }
    } catch { /* ignore */ }
    setLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const handleAnalyze = async () => {
    const convRaw = localStorage.getItem(`convlog-${projectTitle}`);
    const convs: { name?: string; notes?: string; createdAt?: string }[] = convRaw ? JSON.parse(convRaw) : [];
    const patternRaw = localStorage.getItem(`pattern-summary-${projectTitle}`);
    let patternText = "";
    try {
      const p = JSON.parse(patternRaw ?? "");
      const hist: { role: string; content: string }[] = p?.history ?? p ?? [];
      patternText = hist.filter((m) => m.role === "assistant").map((m) => m.content).join("\n\n");
    } catch { /* ignore */ }

    setStage("loading");
    setOutput("");

    const convSummary = convs.length === 0
      ? "No conversations logged yet."
      : convs.map((e, i) => `Conversation ${i + 1} — ${e.name || "Anonymous"} (${e.createdAt || ""})\nNotes: ${e.notes || "no notes"}`).join("\n\n");

    const prompt = `You are Sorene, an execution coach helping an entrepreneur identify their painkiller problem.

Project: "${projectTitle}"

Customer conversations (${convs.length} total):
${convSummary}

${patternText ? `Pattern summary from stage 1:\n${patternText}` : ""}

Based on the conversations above, provide a sharp painkiller problem analysis with these sections:

**Most Frequent Pain** — which problem came up the most, and how many times
**Severity Signal** — which pain causes the most frustration and disruption to their life
**Spending Signal** — which problems are people already paying (or willing to pay) to solve
**Painkiller Verdict** — one clear sentence: "The painkiller problem is [X] because [Y]"

Be direct. Use real examples from the conversations. Bold the most important phrases. No fluff.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: "You are Sorene, a sharp execution coach. Be direct and specific. Surface real patterns from the data provided." }),
      });
      if (!res.ok) { setStage("idle"); return; }
      const data = await res.json();
      const full: string = (data?.reply ?? "").trim();
      setOutput(full);
      setStage("done");
      try { localStorage.setItem(cacheKey, full); } catch { /* ignore */ }
    } catch { setStage("idle"); }
  };

  const handleReset = () => {
    try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
    setOutput("");
    setStage("idle");
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Search size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Painkiller Analysis</p>
            <p className="text-[11px] text-[#9A9A9A]">Sorene finds the sharpest signal from your conversations</p>
          </div>
        </div>
        {stage === "done" && (
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#9A9A9A] hover:text-[#151515] border border-[#ECEDEE] hover:border-[#151515] transition-all">
            Regenerate
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-[13px] text-[#9A9A9A] leading-relaxed max-w-sm">
              Sorene will scan all your logged conversations and pattern summary to surface the clearest painkiller signal.
            </p>
            <button onClick={handleAnalyze}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151515] text-white text-[13px] font-semibold hover:bg-[#2a2a2a] transition-colors">
              <Search size={14} /> Analyse my conversations
            </button>
          </div>
        )}
        {stage === "loading" && (
          <div className="flex items-center gap-2 py-6 justify-center text-[#9A9A9A] text-[13px]">
            <Loader2 size={14} className="animate-spin" /> Analysing patterns…
          </div>
        )}
        {stage === "done" && output && (
          <div className="text-[13px] text-[#151515] leading-relaxed">
            <MarkdownText text={output} />
          </div>
        )}
      </div>
    </div>
  );
}

function PainkillerVerdictCard({ projectTitle }: { projectTitle: string }) {
  const verdictKey = `painkiller-verdict-${projectTitle}`;
  const [verdict, setVerdict] = useState("");
  const [savedIndicator, setSavedIndicator] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectTitle) return;
    try { setVerdict(localStorage.getItem(verdictKey) ?? ""); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const handleChange = (val: string) => {
    setVerdict(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(verdictKey, val); } catch { /* ignore */ }
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Lightbulb size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Your painkiller problem</p>
            <p className="text-[11px] text-[#9A9A9A]">Define it in one clear sentence — this becomes your north star</p>
          </div>
        </div>
        {savedIndicator && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#32C382]">
            <CheckCircle2 size={12} /> Saved
          </span>
        )}
      </div>
      <div className="px-5 py-4 space-y-3">
        <textarea
          value={verdict}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="The painkiller problem is… because customers are already…"
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#9A9A9A]">Auto-saves as you type</p>
          <button
            onClick={() => {
              try { localStorage.setItem(verdictKey, verdict); } catch { /* ignore */ }
              setSavedIndicator(true);
              setTimeout(() => setSavedIndicator(false), 1500);
            }}
            disabled={!verdict.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfidenceLevelCard({ projectTitle }: { projectTitle: string }) {
  const cacheKey = `confidence-level-${projectTitle}`;
  type CStage = "idle" | "waiting" | "loading" | "done";
  const [stage, setStage] = useState<CStage>("idle");
  const stageRef = useRef<CStage>("idle");
  const setStageSync = (s: CStage) => { stageRef.current = s; setStage(s); };
  const [output, setOutput] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!projectTitle || loaded) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) { setOutput(raw); setStageSync("done"); setLoaded(true); return; }
    } catch { /* ignore */ }
    setLoaded(true);
    const hasAnalysis = !!localStorage.getItem(`painkiller-analysis-${projectTitle}`);
    const hasVerdict = !!(localStorage.getItem(`painkiller-verdict-${projectTitle}`) ?? "").trim();
    if (hasAnalysis && hasVerdict) setStageSync("waiting");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (stageRef.current === "done" || stageRef.current === "loading") return;
      const hasAnalysis = !!localStorage.getItem(`painkiller-analysis-${projectTitle}`);
      const hasVerdict = !!(localStorage.getItem(`painkiller-verdict-${projectTitle}`) ?? "").trim();
      if (hasAnalysis && hasVerdict) setStageSync("waiting");
    }, 2000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const handleGenerate = async () => {
    const analysisText = localStorage.getItem(`painkiller-analysis-${projectTitle}`) ?? "";
    const verdictText = localStorage.getItem(`painkiller-verdict-${projectTitle}`) ?? "";
    const convRaw = localStorage.getItem(`convlog-${projectTitle}`);
    const convs: { name?: string; notes?: string; createdAt?: string }[] = convRaw ? JSON.parse(convRaw) : [];
    const convSummary = convs.length === 0
      ? "No conversations logged."
      : convs.map((e, i) => `Conversation ${i + 1} — ${e.name || "Anonymous"}\nNotes: ${e.notes || "no notes"}`).join("\n\n");

    setStageSync("loading");
    setOutput("");

    const prompt = `You are Sorene, an execution coach assessing an entrepreneur's confidence level after their customer discovery.

Project: "${projectTitle}"

Raw customer conversations (${convs.length} total):
${convSummary}

Painkiller Analysis summary:
${analysisText}

Entrepreneur's defined painkiller problem:
"${verdictText}"

Assess confidence level as a separate, focused evaluation. Return:

**Confidence Level** — one of: High / Medium-High / Medium / Medium-Low / Low

**What drives the confidence up** — 2-3 specific signals from their data that are strong

**What keeps it from being higher** — 1-2 specific gaps or missing signals

**What to do next** — one concrete action that would move confidence up one level

Be direct. Bold the most important phrases. No fluff.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: "You are Sorene, a sharp execution coach. Be direct, specific, and honest about confidence." }),
      });
      if (!res.ok) { setStageSync("waiting"); return; }
      const data = await res.json();
      const full: string = (data?.reply ?? "").trim();
      setOutput(full);
      setStageSync("done");
      try { localStorage.setItem(cacheKey, full); } catch { /* ignore */ }
    } catch { setStageSync("waiting"); }
  };

  const handleReset = () => {
    try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
    setOutput("");
    setStageSync("waiting");
  };

  const confidence = stage === "done" ? parseConfidenceLevel(output) : null;
  const style = confidence ? CONFIDENCE_STYLE[confidence] : null;

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <BarChart3 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Confidence Level</p>
            <p className="text-[11px] text-[#9A9A9A]">Generated after your analysis and painkiller problem are ready</p>
          </div>
        </div>
        {stage === "done" && (
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#9A9A9A] hover:text-[#151515] border border-[#ECEDEE] hover:border-[#151515] transition-all">
            Regenerate
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {stage === "idle" && (
          <p className="text-[13px] text-[#9A9A9A] py-4 text-center">
            Complete the Painkiller Analysis and define your Painkiller Problem first.
          </p>
        )}
        {stage === "waiting" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-[13px] text-[#9A9A9A] leading-relaxed max-w-sm">
              Both your analysis and problem statement are ready. Sorene will now assess your confidence level.
            </p>
            <button onClick={handleGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151515] text-white text-[13px] font-semibold hover:bg-[#2a2a2a] transition-colors">
              <BarChart3 size={14} /> Assess my confidence
            </button>
          </div>
        )}
        {stage === "loading" && (
          <div className="flex items-center gap-2 py-6 justify-center text-[#9A9A9A] text-[13px]">
            <Loader2 size={14} className="animate-spin" /> Assessing confidence…
          </div>
        )}
        {stage === "done" && output && (
          <div className="space-y-4">
            {confidence && style && (
              <div className={cn("rounded-2xl border px-5 py-4", style.bg, style.border)}>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Confidence Level</p>
                <p className={cn("text-[26px] font-bold leading-tight mb-2", style.text)}>{confidence}</p>
                <p className={cn("text-[12px] leading-relaxed font-medium opacity-80", style.text)}>
                  {isConfidenceHighEnough(confidence)
                    ? "Signal is strong enough to define your painkiller and advance."
                    : "You need stronger signals before advancing to Build Demo."}
                </p>
              </div>
            )}
            <div className="text-[13px] text-[#151515] leading-relaxed">
              <MarkdownText text={output} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewReadinessBar({ projectTitle, onAdvance }: { projectTitle: string; onAdvance: () => void }) {
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [hasVerdict, setHasVerdict] = useState(false);
  const [convCount, setConvCount] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);

  const refresh = () => {
    try {
      const raw = localStorage.getItem(`convlog-${projectTitle}`);
      setConvCount(raw ? JSON.parse(raw).length : 0);
    } catch { /* ignore */ }
    try { setHasAnalysis(!!localStorage.getItem(`painkiller-analysis-${projectTitle}`)); } catch { /* ignore */ }
    try {
      const confText = localStorage.getItem(`confidence-level-${projectTitle}`) ?? "";
      setConfidence(confText ? parseConfidenceLevel(confText) : null);
    } catch { /* ignore */ }
    try { setHasVerdict(!!(localStorage.getItem(`painkiller-verdict-${projectTitle}`) ?? "").trim()); } catch { /* ignore */ }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const checkItems = [
    { done: convCount >= 20, text: `${convCount} conversations logged (target: 20–100)` },
    { done: hasAnalysis,     text: "Painkiller analysis run" },
    { done: hasVerdict,      text: "Painkiller problem defined" },
  ];

  // Confidence is informational only — shown as context, not a gate
  const confidenceNote = confidence ? `Confidence: ${confidence}` : null;

  const score = Math.round((checkItems.filter((c) => c.done).length / checkItems.length) * 100);
  const canAdvance = checkItems.every((c) => c.done);

  const { label, color, textColor } =
    score === 0   ? { label: "Not started",    color: "bg-[#ECEDEE]",  textColor: "text-[#9A9A9A]"  } :
    score <= 25   ? { label: "Just started",   color: "bg-[#FFA94D]",  textColor: "text-[#C85B00]"  } :
    score <= 50   ? { label: "In progress",    color: "bg-[#FFD43B]",  textColor: "text-[#7B5D00]"  } :
    score <= 75   ? { label: "Almost there",   color: "bg-[#74C0FC]",  textColor: "text-[#1864AB]"  } :
                    { label: "Ready to build", color: "bg-[#32C382]",  textColor: "text-[#0B5E35]"  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#151515]">Readiness to advance to Build Demo</p>
          <span className={cn("text-[13px] font-bold", textColor)}>{score}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#F0F1F2] overflow-hidden mb-3">
          <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className={cn("text-[12px] font-semibold", textColor)}>{label}</span>
        </div>
        <div className="space-y-2.5">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                item.done ? "bg-[#32C382]" : "bg-[#F0F1F2]")}>
                {item.done && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <p className={cn("text-[12px]", item.done ? "text-[#151515] font-medium" : "text-[#9A9A9A]")}>{item.text}</p>
            </div>
          ))}
          {confidenceNote && (
            <div className="flex items-center gap-2.5 pt-1">
              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                isConfidenceHighEnough(confidence) ? "bg-[#32C382]" : "bg-[#FFD43B]")}>
                <BarChart3 size={8} className="text-white" />
              </div>
              <p className="text-[12px] text-[#9A9A9A]">{confidenceNote} — informational, not a gate</p>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-4">
        {canAdvance ? (
          <button onClick={onAdvance}
            className="w-full py-3 rounded-xl bg-[#32C382] text-white text-[13px] font-semibold hover:bg-[#28a870] transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={15} /> Start Build Demo
          </button>
        ) : (
          <div className="rounded-xl bg-[#F5F5F5] border border-[#ECEDEE] px-4 py-3 flex items-center gap-2.5">
            <Lock size={13} className="text-[#9A9A9A] shrink-0" />
            <p className="text-[12px] text-[#9A9A9A] leading-relaxed">
              {(() => {
                const failing = checkItems.find((c) => !c.done);
                return failing ? `Complete: ${failing.text.split(" (")[0].toLowerCase()}` : "Complete all items above to unlock Build Demo.";
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewStage2({
  step,
  project,
  onAdvance,
}: {
  step: typeof VIBE_STEPS[number];
  project: DirectionCardData | null;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">

      {/* ── What is this? ── */}
      <section>
        <h4 className="text-base font-semibold text-[#151515] mb-3">What is this?</h4>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <p className="text-[15px] font-medium text-[#151515] leading-relaxed">{step.whatIs}</p>
      </section>

      {/* ── What to look for (collapsible) ── */}
      <CollapseSection title="What to look for">
        <p className="text-[13px] text-[#62646A] leading-relaxed mb-5">
          Not all problems are painkillers. You are looking for the one that is <strong className="text-[#151515] font-semibold">frequent, severe, and people already spend money to solve</strong>. These three signals together = painkiller.
        </p>
        <div className="space-y-3">
          {[
            { label: "Frequency", desc: "Did multiple people mention the same problem unprompted? Aim for 3+ mentions." },
            { label: "Severity",  desc: "Does it disrupt their day, cost them money, or cause real frustration? Not just annoying." },
            { label: "Spending",  desc: "Are they already paying for a workaround or partial solution? That's your strongest signal." },
            { label: "Language",  desc: "When they described it, what exact words did they use? That's your product copy." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#151515] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
              <div>
                <p className="text-[13px] font-semibold text-[#151515]">{item.label}</p>
                <p className="text-[13px] text-[#62646A] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapseSection>

      {/* ── Painkiller Analysis (collapsible) ── */}
      <CollapseSection title="Painkiller Analysis">
        <PainkillerAnalysisCard projectTitle={project?.title ?? ""} />
      </CollapseSection>

      {/* ── Your Painkiller Problem (collapsible) ── */}
      <CollapseSection title="Your Painkiller Problem">
        <PainkillerVerdictCard projectTitle={project?.title ?? ""} />
      </CollapseSection>

      {/* ── Confidence Level (collapsible, auto-generated) ── */}
      <CollapseSection title="Confidence Level">
        <ConfidenceLevelCard projectTitle={project?.title ?? ""} />
      </CollapseSection>

      {/* ── Readiness ── */}
      <InterviewReadinessBar projectTitle={project?.title ?? ""} onAdvance={onAdvance} />

    </div>
  );
}

// ─────────────────────────────────────────────
// Build Demo Stage 3
// ─────────────────────────────────────────────

// ── Single editable offering card ──
interface OfferingField {
  key: string;
  label: string;
  sublabel: string;
  placeholder: string;
  rows: number;
}

const OFFERING_FIELDS: OfferingField[] = [
  { key: "one_sentence_offer", label: "One-Sentence Offer",    sublabel: "Who you help, what they achieve, and how",                rows: 2, placeholder: "We help [who] [achieve X] without [friction]…" },
  { key: "price_range",        label: "Suggested Price Range", sublabel: "Specific range + 1-sentence rationale",                   rows: 2, placeholder: "$X–$Y because…" },
  { key: "best_format",        label: "Best MVO Format",       sublabel: "Workshop / PDF / session / service — and why this fits",  rows: 2, placeholder: "1-on-1 session because…" },
  { key: "offer_clarity",      label: "Offer Clarity",         sublabel: "Who, what they get, key outcome, price",                  rows: 4, placeholder: "Who: …\nWhat: …\nOutcome: …\nPrice: …" },
  { key: "first_pitch",        label: "First Pitch",           sublabel: "One paragraph to say or send to 3 customers right now",   rows: 4, placeholder: "Hi [name], I'm working on something for people like you…" },
];

function SingleOfferingCard({
  field, value, onSave, onRegenerate, project,
}: {
  field: OfferingField;
  value: string;
  onSave: (val: string) => void;
  onRegenerate: (instruction: string) => Promise<string>;
  project: DirectionCardData | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || refining) return;
    setRefining(true);
    const instruction = refineInput.trim();
    setRefineInput("");
    const updated = await onRegenerate(instruction);
    if (updated) { setDraft(updated); onSave(updated); }
    setRefining(false);
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div>
          <p className="text-[13px] font-semibold text-[#151515]">{field.label}</p>
          <p className="text-[11px] text-[#9A9A9A]">{field.sublabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[11px] text-[#32C382] font-medium flex items-center gap-1"><CheckCircle2 size={11} /> Saved</span>}
          {!editing && value && (
            <button onClick={() => setEditing(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#9A9A9A] hover:text-[#151515] border border-[#ECEDEE] hover:border-[#151515] transition-all">
              Edit
            </button>
          )}
          {editing && (
            <>
              <button onClick={() => { setDraft(value); setEditing(false); }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#9A9A9A] border border-[#ECEDEE] hover:border-[#151515] transition-all">
                Cancel
              </button>
              <button onClick={handleSave}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#151515] text-white hover:bg-[#2a2a2a] transition-all">
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={field.rows}
            className="w-full rounded-xl border border-[#151515] bg-white px-3 py-2.5 text-[13px] text-[#151515] resize-none focus:outline-none transition-colors"
          />
        ) : value ? (
          <p className="text-[13px] text-[#151515] leading-relaxed whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-[13px] text-[#9A9A9A] italic">{field.placeholder}</p>
        )}
      </div>

      {/* Refine with prompt */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[#ECEDEE] bg-[#FAFAFA]">
        <input
          value={refineInput}
          onChange={(e) => setRefineInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
          placeholder={`Refine this — e.g. "make it shorter" or "price higher"`}
          className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
        />
        <button onClick={handleRefine} disabled={!refineInput.trim() || refining}
          className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30">
          {refining ? <Loader2 size={11} className="animate-spin text-white" /> : <ArrowRight size={11} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

function InitialOfferingsSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const [generating, setGenerating] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const storageKey = (key: string) => `mvo-offering-${key}-${title}`;
  // legacy key kept for readiness bar compatibility
  const legacyKey = `mvo-offer-${title}`;

  useEffect(() => {
    if (!title || loaded) return;
    const loaded_vals: Record<string, string> = {};
    for (const f of OFFERING_FIELDS) {
      try { loaded_vals[f.key] = localStorage.getItem(storageKey(f.key)) ?? ""; } catch { /* ignore */ }
    }
    setValues(loaded_vals);
    setLoaded(true);
    // mark legacy key so readiness bar still works
    if (Object.values(loaded_vals).some((v) => v.trim())) {
      try { localStorage.setItem(legacyKey, "1"); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const hasAny = OFFERING_FIELDS.some((f) => values[f.key]?.trim());

  const buildContext = () => {
    const painkiller = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const convRaw = localStorage.getItem(`convlog-${title}`);
    const convs: { name?: string; notes?: string }[] = convRaw ? JSON.parse(convRaw) : [];
    const convSample = convs.slice(0, 6).map((e, i) => `${i + 1}. ${e.name || "Anonymous"}: ${e.notes || "no notes"}`).join("\n");
    return { painkiller, convSample, convCount: convs.length };
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    const { painkiller, convSample, convCount } = buildContext();

    const prompt = `You are Sorene, a sharp startup coach building a Minimum Viable Offer.

Project: "${title}"
${project?.oneliner ? `One-liner: ${project.oneliner}` : ""}
Painkiller problem: "${painkiller || "not yet defined"}"
${convCount > 0 ? `Sample customer conversations:\n${convSample}` : ""}

Return ONLY valid JSON (no markdown, no preamble) in this exact shape:
{
  "one_sentence_offer": "We help [specific who] [achieve X] [without Y / in Z time]",
  "price_range": "$X–$Y. [1-sentence rationale tied to pain severity and willingness to pay]",
  "best_format": "[Format name]. [2 sentences: why this format fits this specific problem]",
  "offer_clarity": "Who: [specific customer]\\nWhat: [deliverable]\\nOutcome: [clear result]\\nPrice: [$X]",
  "first_pitch": "[2-3 sentence paragraph they can say or send right now to 3 potential customers]"
}`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: "Return only valid JSON. No markdown fences. No preamble. Be specific to this project." }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply: string = (data?.reply ?? "").trim();
        const match = reply.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const newVals: Record<string, string> = {};
          for (const f of OFFERING_FIELDS) {
            newVals[f.key] = parsed[f.key] ?? "";
            try { localStorage.setItem(storageKey(f.key), newVals[f.key]); } catch { /* ignore */ }
          }
          setValues(newVals);
          try { localStorage.setItem(legacyKey, "1"); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const handleSave = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    try { localStorage.setItem(storageKey(key), val); } catch { /* ignore */ }
    try { localStorage.setItem(legacyKey, "1"); } catch { /* ignore */ }
  };

  const handleRegenerate = async (key: string, instruction: string): Promise<string> => {
    const { painkiller, convSample } = buildContext();
    const current = values[key] ?? "";
    const field = OFFERING_FIELDS.find((f) => f.key === key)!;

    const prompt = `You are Sorene, a sharp startup coach.

Project: "${title}"
Painkiller problem: "${painkiller}"
${convSample ? `Conversations:\n${convSample}` : ""}

Current "${field.label}":
"${current}"

User instruction: "${instruction}"

Rewrite only the "${field.label}" field based on the instruction. Return only the updated text — no labels, no JSON, no preamble.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: "You are Sorene. Return only the updated field text. No labels, no JSON, no preamble." }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data?.reply ?? "").trim();
      }
    } catch { /* ignore */ }
    return "";
  };

  const handleResetAll = () => {
    for (const f of OFFERING_FIELDS) {
      try { localStorage.removeItem(storageKey(f.key)); } catch { /* ignore */ }
    }
    try { localStorage.removeItem(legacyKey); } catch { /* ignore */ }
    setValues({});
  };

  return (
    <div className="space-y-4">
      {/* Generate / Regenerate all */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#9A9A9A]">
          {hasAny ? "Each section is editable. Use the chat input to refine." : "Sorene generates your initial offerings — then you edit each one."}
        </p>
        <button onClick={hasAny ? handleResetAll : handleGenerateAll} disabled={generating}
          className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all",
            hasAny
              ? "border border-[#ECEDEE] text-[#9A9A9A] hover:text-[#151515] hover:border-[#151515]"
              : "bg-[#151515] text-white hover:bg-[#2a2a2a]",
            generating && "opacity-50 cursor-not-allowed")}>
          {generating
            ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
            : hasAny
            ? "Regenerate all"
            : <><Lightbulb size={12} /> Generate initial offerings</>}
        </button>
      </div>

      {/* Individual cards */}
      {OFFERING_FIELDS.map((field) => (
        <SingleOfferingCard
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          onSave={(val) => handleSave(field.key, val)}
          onRegenerate={(instruction) => handleRegenerate(field.key, instruction)}
          project={project}
        />
      ))}
    </div>
  );
}

function BuildDemoGuidanceChat({ project }: { project: DirectionCardData | null }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cacheKey = `build-demo-chat-${project?.title ?? ""}`;

  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-offer-${project?.title ?? ""}`) ?? "";

    const system = `You are Sorene, a sharp startup coach helping an entrepreneur build their Minimum Viable Offer (MVO) for the Build Demo stage.
Project: "${project?.title}"${painkiller ? `\nPainkiller problem: "${painkiller}"` : ""}${offer ? `\nOffer built so far:\n${offer}` : ""}
Give direct, practical guidance. Be specific. No fluff.`;

    const newMessages: { role: "user" | "assistant"; content: string }[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, system, history: messages }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        const updated = [...newMessages, { role: "assistant" as const, content: reply }];
        setMessages(updated);
        try { localStorage.setItem(cacheKey, JSON.stringify(updated)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const guidelines = [
    { num: 1, text: "Start with the simplest version that delivers real value" },
    { num: 2, text: "Pick one format: workshop, PDF guide, 1-on-1 session, or manual service" },
    { num: 3, text: "Set up a simple landing page or pitch to 3 people directly" },
    { num: 4, text: "Ask for real money — not interest, not sign-ups" },
  ];

  return (
    <div className="space-y-4">
      {/* Guidance */}
      <div className="space-y-3">
        {guidelines.map((g) => (
          <div key={g.num} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#151515] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{g.num}</div>
            <p className="text-[13px] text-[#151515] leading-relaxed">{g.text}</p>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden mt-2">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
          <MessageCircle size={13} className="text-[#9A9A9A]" />
          <p className="text-[12px] font-semibold text-[#151515]">Ask Sorene anything about your demo</p>
        </div>
        {messages.length > 0 && (
          <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-2xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%]",
                  m.role === "user"
                    ? "bg-[#151515] text-white rounded-br-sm"
                    : "bg-[#F5F5F5] text-[#151515] rounded-bl-sm")}>
                  {m.role === "assistant" ? <MarkdownText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={12} className="animate-spin text-[#9A9A9A]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#ECEDEE]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="How do I price this? What format should I pick?…"
            className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30">
            <ArrowRight size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MVODefinitionCard({ project }: { project: DirectionCardData | null }) {
  const key = `mvo-defined-${project?.title ?? ""}`;
  const [mvo, setMvo] = useState("");
  const [savedIndicator, setSavedIndicator] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!project?.title) return;
    try { setMvo(localStorage.getItem(key) ?? ""); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  const handleChange = (val: string) => {
    setMvo(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(key, val); } catch { /* ignore */ }
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Rocket size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Your Minimum Viable Offer</p>
            <p className="text-[11px] text-[#9A9A9A]">Define what you will sell and for how much — in one paragraph</p>
          </div>
        </div>
        {savedIndicator && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#32C382]">
            <CheckCircle2 size={12} /> Saved
          </span>
        )}
      </div>
      <div className="px-5 py-4 space-y-2">
        <textarea
          value={mvo}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="I offer [format] for [who], priced at [$X], delivering [outcome] in [timeframe]…"
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors"
        />
        <p className="text-[11px] text-[#9A9A9A]">Auto-saves as you type</p>
      </div>
    </div>
  );
}

function BuildDemoReadinessBar({ project, onAdvance }: { project: DirectionCardData | null; onAdvance: () => void }) {
  const title = project?.title ?? "";
  const [hasOfferings, setHasOfferings] = useState(false);
  const [hasMvo, setHasMvo] = useState(false);
  const [hasPitch, setHasPitch] = useState(false);

  const refresh = () => {
    // Initial offerings generated (any offering field filled)
    try {
      const anyOffering = ["one_sentence_offer","price_range","best_format","offer_clarity","first_pitch"]
        .some((k) => !!(localStorage.getItem(`mvo-offering-${k}-${title}`) ?? "").trim());
      setHasOfferings(anyOffering);
    } catch { /* ignore */ }
    // MVO defined by user
    try { setHasMvo(!!(localStorage.getItem(`mvo-defined-${title}`) ?? "").trim()); } catch { /* ignore */ }
    // First pitch written (from Initial Offerings or MVO)
    try {
      const pitch = localStorage.getItem(`mvo-offering-first_pitch-${title}`) ?? "";
      setHasPitch(pitch.trim().length > 20);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const checkItems = [
    { done: hasOfferings, text: "Initial Offerings Package generated" },
    { done: hasMvo,       text: "Your Minimum Viable Offer defined" },
    { done: hasPitch,     text: "First pitch written and ready" },
  ];

  const score = Math.round((checkItems.filter((c) => c.done).length / checkItems.length) * 100);
  const canAdvance = checkItems.every((c) => c.done);

  const { label, color, textColor } =
    score === 0  ? { label: "Not started",       color: "bg-[#ECEDEE]", textColor: "text-[#9A9A9A]"  } :
    score <= 33  ? { label: "Just started",      color: "bg-[#FFA94D]", textColor: "text-[#C85B00]"  } :
    score <= 66  ? { label: "In progress",       color: "bg-[#FFD43B]", textColor: "text-[#7B5D00]"  } :
                   { label: "Offer is ready",    color: "bg-[#32C382]", textColor: "text-[#0B5E35]"  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#151515]">Readiness to advance to Experiment</p>
          <span className={cn("text-[13px] font-bold", textColor)}>{score}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#F0F1F2] overflow-hidden mb-3">
          <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
        </div>
        <div className="mb-4">
          <span className={cn("text-[12px] font-semibold", textColor)}>{label}</span>
        </div>
        <div className="space-y-2.5">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                item.done ? "bg-[#32C382]" : "bg-[#F0F1F2]")}>
                {item.done && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <p className={cn("text-[12px]", item.done ? "text-[#151515] font-medium" : "text-[#9A9A9A]")}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 pb-4">
        {canAdvance ? (
          <button onClick={onAdvance}
            className="w-full py-3 rounded-xl bg-[#32C382] text-white text-[13px] font-semibold hover:bg-[#28a870] transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={15} /> Start Experiment
          </button>
        ) : (
          <div className="rounded-xl bg-[#F5F5F5] border border-[#ECEDEE] px-4 py-3 flex items-center gap-2.5">
            <Lock size={13} className="text-[#9A9A9A] shrink-0" />
            <p className="text-[12px] text-[#9A9A9A]">
              {checkItems.find((c) => !c.done)?.text
                ? `Complete: ${checkItems.find((c) => !c.done)!.text.toLowerCase()}`
                : "Complete all items to unlock Experiment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Experiment Stage 4
// ─────────────────────────────────────────────

function ExperimentGuidanceChat({ project }: { project: DirectionCardData | null }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cacheKey = `experiment-chat-${project?.title ?? ""}`;

  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-defined-${project?.title ?? ""}`) ?? "";

    const system = `You are Sorene, a startup coach helping an entrepreneur close their first paying customers in the Experiment stage.
Project: "${project?.title}"${painkiller ? `\nPainkiller problem: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}
Be direct and practical. Help them overcome objections, price confidently, and close real sales. No fluff.`;

    const newMessages: { role: "user" | "assistant"; content: string }[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, system, history: messages }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        const updated = [...newMessages, { role: "assistant" as const, content: reply }];
        setMessages(updated);
        try { localStorage.setItem(cacheKey, JSON.stringify(updated)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const guidelines = [
    { num: 1, text: "Make the real offer to real people — not a survey, not a waitlist" },
    { num: 2, text: "Ask for real money (not just interest or email sign-up)" },
    { num: 3, text: "Record every response: yes / no / maybe — and why" },
    { num: 4, text: "3 paying customers is the only validation that matters" },
    { num: 5, text: "Log each result here to unlock the next stage" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {guidelines.map((g) => (
          <div key={g.num} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#151515] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{g.num}</div>
            <p className="text-[13px] text-[#151515] leading-relaxed">{g.text}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden mt-2">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
          <MessageCircle size={13} className="text-[#9A9A9A]" />
          <p className="text-[12px] font-semibold text-[#151515]">Ask Sorene about closing your first paying customers</p>
        </div>
        {messages.length > 0 && (
          <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-2xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%]",
                  m.role === "user"
                    ? "bg-[#151515] text-white rounded-br-sm"
                    : "bg-[#F5F5F5] text-[#151515] rounded-bl-sm")}>
                  {m.role === "assistant" ? <MarkdownText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={12} className="animate-spin text-[#9A9A9A]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#ECEDEE]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="How do I handle price objections? What if they say maybe?…"
            className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30">
            <ArrowRight size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

type CustomerResponse = { id: string; name: string; response: "yes" | "no" | "maybe"; note: string; date: string };

function PayingCustomerTracker({ project }: { project: DirectionCardData | null }) {
  const storageKey = `experiment-customers-${project?.title ?? ""}`;
  const [entries, setEntries] = useState<CustomerResponse[]>([]);
  const [name, setName] = useState("");
  const [response, setResponse] = useState<"yes" | "no" | "maybe">("yes");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  const save = (updated: CustomerResponse[]) => {
    setEntries(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const addEntry = () => {
    if (!name.trim()) return;
    const entry: CustomerResponse = {
      id: Date.now().toString(),
      name: name.trim(),
      response,
      note: note.trim(),
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    };
    save([...entries, entry]);
    setName(""); setNote(""); setResponse("yes");
  };

  const removeEntry = (id: string) => save(entries.filter((e) => e.id !== id));

  const yesCount = entries.filter((e) => e.response === "yes").length;

  const responseBadge = (r: CustomerResponse["response"]) =>
    r === "yes"   ? "bg-[#CEF2E2] text-[#196141]" :
    r === "no"    ? "bg-[#FDECEA] text-[#C0392B]" :
                    "bg-[#FFF3CD] text-[#7B5D00]";

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center gap-4 rounded-2xl bg-[#F5FFD9] border border-[#32C382]/30 px-5 py-4">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#151515] mb-0.5">Paying Customers</p>
          <p className="text-[12px] text-[#62646A]">3 paying customers = proceed to Launch Readiness</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold text-[#151515] leading-none">{yesCount}</span>
          <span className="text-[16px] text-[#9A9A9A] font-medium">/3</span>
        </div>
      </div>

      {/* Log form */}
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
          <Plus size={13} className="text-[#9A9A9A]" />
          <p className="text-[12px] font-semibold text-[#151515]">Log a customer conversation</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEntry(); }}
              placeholder="Person / company name…"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[12px] text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors"
            />
            <select
              value={response}
              onChange={(e) => setResponse(e.target.value as CustomerResponse["response"])}
              className="rounded-xl border border-gray-200 px-3 py-2 text-[12px] text-[#151515] bg-white focus:outline-none focus:border-[#151515] transition-colors"
            >
              <option value="yes">✅ Yes — paid</option>
              <option value="no">❌ No</option>
              <option value="maybe">🤔 Maybe</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEntry(); }}
              placeholder="Note: what did they say? (optional)"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[12px] text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors"
            />
            <button
              onClick={addEntry}
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-30"
            >Log</button>
          </div>
        </div>
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start gap-3 rounded-xl border border-[#ECEDEE] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-semibold text-[#151515]">{e.name}</p>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", responseBadge(e.response))}>
                    {e.response === "yes" ? "Paid" : e.response === "no" ? "No" : "Maybe"}
                  </span>
                  <span className="text-[10px] text-[#9A9A9A]">{e.date}</span>
                </div>
                {e.note && <p className="text-[12px] text-[#62646A] leading-relaxed">{e.note}</p>}
              </div>
              <button onClick={() => removeEntry(e.id)} className="text-gray-300 hover:text-[#DF2E16] transition-colors mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationScoreSection({ project }: { project: DirectionCardData | null }) {
  type AStage = "idle" | "loading" | "done";
  const storageKey = `experiment-validation-score-${project?.title ?? ""}`;
  const chatKey = `experiment-validation-score-chat-${project?.title ?? ""}`;
  const [stage, setStage] = useState<AStage>("idle");
  const [result, setResult] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setResult(raw); setStage("done"); }
      const chatRaw = localStorage.getItem(chatKey);
      if (chatRaw) setChatMessages(JSON.parse(chatRaw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const generate = async () => {
    setStage("loading");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-defined-${project?.title ?? ""}`) ?? "";
    const customersRaw = localStorage.getItem(`experiment-customers-${project?.title ?? ""}`) ?? "[]";
    let customerSummary = "No responses logged yet.";
    try {
      const customers: CustomerResponse[] = JSON.parse(customersRaw);
      if (customers.length > 0) {
        const yes = customers.filter((c) => c.response === "yes").length;
        const no = customers.filter((c) => c.response === "no").length;
        const maybe = customers.filter((c) => c.response === "maybe").length;
        customerSummary = `${customers.length} conversations logged: ${yes} paid, ${no} declined, ${maybe} maybe. Notes: ${customers.map((c) => `"${c.name}: ${c.response}${c.note ? ` — ${c.note}` : ""}"`).join("; ")}`;
      }
    } catch { /* ignore */ }

    const system = `You are Sorene, a direct startup coach. Respond in plain prose only — no JSON, no code blocks, no bullet lists formatted as JSON. Write in clear sentences.`;
    const prompt = `Assess the validation signal strength for this project at the Experiment stage.
Project: "${project?.title}"${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}
Customer responses: ${customerSummary}

Write 3-4 sentences in plain text: (1) the signal strength with a score out of 10, (2) what it means, (3) one specific next action. Be direct and honest. No JSON, no code blocks.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        setResult(reply);
        setStage("done");
        try { localStorage.setItem(storageKey, reply); } catch { /* ignore */ }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-defined-${project?.title ?? ""}`) ?? "";
    const system = `You are Sorene, a startup coach discussing validation results.
Project: "${project?.title}"${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}
${result ? `Validation assessment: "${result}"` : ""}
Respond in plain prose. No JSON, no code blocks. Be direct and actionable.`;
    const newMessages: { role: "user" | "assistant"; content: string }[] = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, system, history: chatMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        const updated = [...newMessages, { role: "assistant" as const, content: reply }];
        setChatMessages(updated);
        try { localStorage.setItem(chatKey, JSON.stringify(updated)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <BarChart3 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Validation Score</p>
            <p className="text-[11px] text-[#9A9A9A]">AI assessment based on your customer responses</p>
          </div>
        </div>
        {stage === "done" && (
          <button onClick={generate} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Refresh</button>
        )}
      </div>
      <div className="px-5 py-4 space-y-4">
        {stage === "idle" && (
          <button onClick={generate}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] text-[#9A9A9A] hover:border-[#151515] hover:text-[#151515] transition-colors">
            Generate validation score from your responses
          </button>
        )}
        {stage === "loading" && (
          <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
            <Loader2 size={13} className="animate-spin" /> Analysing your responses…
          </div>
        )}
        {stage === "done" && result && (
          <div className="text-[13px] text-[#151515] leading-relaxed">
            <MarkdownText text={result} />
          </div>
        )}
        {stage === "done" && (
          <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] border-b border-[#ECEDEE]">
              <MessageCircle size={12} className="text-[#9A9A9A]" />
              <p className="text-[11px] font-semibold text-[#151515]">Ask Sorene about your validation score</p>
            </div>
            {chatMessages.length > 0 && (
              <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("rounded-2xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%]",
                      m.role === "user"
                        ? "bg-[#151515] text-white rounded-br-sm"
                        : "bg-[#F5F5F5] text-[#151515] rounded-bl-sm")}>
                      {m.role === "assistant" ? <MarkdownText text={m.content} /> : m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 size={12} className="animate-spin text-[#9A9A9A]" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#ECEDEE]">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="What does this score mean for my next step?…"
                className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
              />
              <button onClick={handleChat} disabled={!chatInput.trim() || chatLoading}
                className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0 hover:bg-[#2a2a2a] transition-colors disabled:opacity-30">
                <ArrowRight size={12} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RevisitPromptSection({ project }: { project: DirectionCardData | null }) {
  type AStage = "idle" | "loading" | "done";
  const storageKey = `experiment-revisit-${project?.title ?? ""}`;
  const chatKey = `experiment-revisit-chat-${project?.title ?? ""}`;
  const [stage, setStage] = useState<AStage>("idle");
  const [result, setResult] = useState("");
  const [visible, setVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project?.title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setResult(raw); setStage("done"); }
      const chatRaw = localStorage.getItem(chatKey);
      if (chatRaw) setChatMessages(JSON.parse(chatRaw));
      // Show only when 0 paying customers logged
      const customersRaw = localStorage.getItem(`experiment-customers-${project?.title ?? ""}`) ?? "[]";
      const customers: CustomerResponse[] = JSON.parse(customersRaw);
      setVisible(customers.filter((c) => c.response === "yes").length === 0);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Poll to update visibility
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const customersRaw = localStorage.getItem(`experiment-customers-${project?.title ?? ""}`) ?? "[]";
        const customers: CustomerResponse[] = JSON.parse(customersRaw);
        setVisible(customers.filter((c) => c.response === "yes").length === 0);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.title]);

  if (!visible) return null;

  const generate = async () => {
    setStage("loading");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-defined-${project?.title ?? ""}`) ?? "";
    const customersRaw = localStorage.getItem(`experiment-customers-${project?.title ?? ""}`) ?? "[]";
    let customerSummary = "No responses yet.";
    try {
      const customers: CustomerResponse[] = JSON.parse(customersRaw);
      if (customers.length > 0) {
        customerSummary = customers.map((c) => `${c.name}: ${c.response}${c.note ? ` — ${c.note}` : ""}`).join("; ");
      }
    } catch { /* ignore */ }

    const prompt = `This founder has 0 paying customers so far.
Project: "${project?.title}"${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nCurrent offer: "${offer}"` : ""}
Customer responses so far: ${customerSummary}

Give 2-3 specific, actionable suggestions — should they revisit the idea, change the offer framing, or try a different audience? Be honest and direct. No fluff.`;

    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        setResult(reply);
        setStage("done");
        try { localStorage.setItem(storageKey, reply); } catch { /* ignore */ }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const painkiller = localStorage.getItem(`painkiller-verdict-${project?.title ?? ""}`) ?? "";
    const offer = localStorage.getItem(`mvo-defined-${project?.title ?? ""}`) ?? "";
    const system = `You are Sorene, a startup coach helping a founder who has 0 paying customers so far.
Project: "${project?.title}"${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}
${result ? `Your previous assessment: "${result}"` : ""}
Be direct, honest, and actionable. Help them figure out what to change.`;
    const newMessages: { role: "user" | "assistant"; content: string }[] = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, system, history: chatMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        const updated = [...newMessages, { role: "assistant" as const, content: reply }];
        setChatMessages(updated);
        try { localStorage.setItem(chatKey, JSON.stringify(updated)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  };

  return (
    <div className="rounded-2xl border border-[#FFA94D]/40 bg-[#FFF8F0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#FFA94D]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FFA94D] flex items-center justify-center shrink-0">
            <Lightbulb size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">No paying customers yet — what to do</p>
            <p className="text-[11px] text-[#C85B00]">Sorene will suggest what to revisit</p>
          </div>
        </div>
        {stage === "done" && (
          <button onClick={generate} className="text-[11px] text-[#C85B00] hover:text-[#151515] transition-colors font-medium">Refresh</button>
        )}
      </div>
      <div className="px-5 py-4 space-y-4">
        {stage === "idle" && (
          <button onClick={generate}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#FFA94D]/50 text-[12px] text-[#C85B00] hover:border-[#FFA94D] transition-colors">
            Get suggestions to revisit idea or offer framing
          </button>
        )}
        {stage === "loading" && (
          <div className="flex items-center gap-2 text-[12px] text-[#C85B00]">
            <Loader2 size={13} className="animate-spin" /> Analysing what to change…
          </div>
        )}
        {stage === "done" && result && (
          <div className="text-[13px] text-[#151515] leading-relaxed">
            <MarkdownText text={result} />
          </div>
        )}
        {/* Chat */}
        {stage === "done" && (
          <div className="rounded-2xl border border-[#FFA94D]/30 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF3E0] border-b border-[#FFA94D]/20">
              <MessageCircle size={12} className="text-[#C85B00]" />
              <p className="text-[11px] font-semibold text-[#C85B00]">Ask Sorene a follow-up</p>
            </div>
            {chatMessages.length > 0 && (
              <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto bg-[#FFFBF5]">
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("rounded-2xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%]",
                      m.role === "user"
                        ? "bg-[#FFA94D] text-white rounded-br-sm"
                        : "bg-white border border-[#FFA94D]/20 text-[#151515] rounded-bl-sm")}>
                      {m.role === "assistant" ? <MarkdownText text={m.content} /> : m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="bg-white border border-[#FFA94D]/20 rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 size={12} className="animate-spin text-[#C85B00]" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#FFA94D]/20 bg-[#FFFBF5]">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Should I change my price? Try a different audience?…"
                className="flex-1 text-[12px] text-[#151515] placeholder-[#C85B00]/40 bg-transparent focus:outline-none"
              />
              <button onClick={handleChat} disabled={!chatInput.trim() || chatLoading}
                className="w-7 h-7 rounded-lg bg-[#FFA94D] flex items-center justify-center shrink-0 hover:bg-[#E8951F] transition-colors disabled:opacity-30">
                <ArrowRight size={12} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExperimentReadinessBar({ project, onAdvance }: { project: DirectionCardData | null; onAdvance: () => void }) {
  const title = project?.title ?? "";
  const [yesCount, setYesCount] = useState(0);
  const [hasResponses, setHasResponses] = useState(false);
  const [hasScore, setHasScore] = useState(false);

  const refresh = () => {
    try {
      const raw = localStorage.getItem(`experiment-customers-${title}`) ?? "[]";
      const customers: CustomerResponse[] = JSON.parse(raw);
      setYesCount(customers.filter((c) => c.response === "yes").length);
      setHasResponses(customers.length > 0);
    } catch { /* ignore */ }
    try { setHasScore(!!(localStorage.getItem(`experiment-validation-score-${title}`) ?? "").trim()); } catch { /* ignore */ }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const checkItems = [
    { done: hasResponses,  text: "At least one customer conversation logged" },
    { done: yesCount >= 3, text: "3 paying customers secured" },
    { done: hasScore,      text: "Validation score generated" },
  ];

  const score = Math.round((checkItems.filter((c) => c.done).length / checkItems.length) * 100);
  const canAdvance = checkItems.every((c) => c.done);

  const { label, color, textColor } =
    score === 0  ? { label: "Not started",         color: "bg-[#ECEDEE]", textColor: "text-[#9A9A9A]" } :
    score <= 33  ? { label: "Just started",        color: "bg-[#FFA94D]", textColor: "text-[#C85B00]" } :
    score <= 66  ? { label: "In progress",         color: "bg-[#FFD43B]", textColor: "text-[#7B5D00]" } :
                   { label: "Ready to launch",     color: "bg-[#32C382]", textColor: "text-[#0B5E35]" };

  return (
    <div className="rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#151515]">Readiness to advance to Launch Readiness</p>
          <span className={cn("text-[13px] font-bold", textColor)}>{score}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#F0F1F2] overflow-hidden mb-3">
          <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
        </div>
        <div className="mb-4">
          <span className={cn("text-[12px] font-semibold", textColor)}>{label}</span>
        </div>
        <div className="space-y-2.5">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                item.done ? "bg-[#32C382]" : "bg-[#F0F1F2]")}>
                {item.done && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <p className={cn("text-[12px]", item.done ? "text-[#151515] font-medium" : "text-[#9A9A9A]")}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 pb-4">
        {canAdvance ? (
          <button onClick={onAdvance}
            className="w-full py-3 rounded-xl bg-[#32C382] text-white text-[13px] font-semibold hover:bg-[#28a870] transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={15} /> Start Launch Readiness
          </button>
        ) : (
          <div className="rounded-xl bg-[#F5F5F5] border border-[#ECEDEE] px-4 py-3 flex items-center gap-2.5">
            <Lock size={13} className="text-[#9A9A9A] shrink-0" />
            <p className="text-[12px] text-[#9A9A9A]">
              {checkItems.find((c) => !c.done)?.text
                ? `Complete: ${checkItems.find((c) => !c.done)!.text.toLowerCase()}`
                : "Complete all items to unlock Launch Readiness."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExperimentStage4({
  step,
  project,
  onAdvance,
}: {
  step: typeof VIBE_STEPS[number];
  project: DirectionCardData | null;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">

      {/* ── What is this? ── */}
      <section>
        <h4 className="text-base font-semibold text-[#151515] mb-3">What is this?</h4>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <p className="text-[15px] font-medium text-[#151515] leading-relaxed">{step.whatIs}</p>
      </section>

      {/* ── What You Should Do ── */}
      <CollapseSection title="What You Should Do">
        <ExperimentGuidanceChat project={project} />
      </CollapseSection>

      {/* ── Paying Customers Tracker ── */}
      <CollapseSection title="Paying Customers Tracker">
        <PayingCustomerTracker project={project} />
      </CollapseSection>

      {/* ── Validation Score ── */}
      <CollapseSection title="Validation Score">
        <ValidationScoreSection project={project} />
      </CollapseSection>

      {/* ── Revisit prompt (shown only when 0 paying) ── */}
      <RevisitPromptSection project={project} />

      {/* ── Readiness Gate ── */}
      <ExperimentReadinessBar project={project} onAdvance={onAdvance} />

    </div>
  );
}

function BuildDemoStage3({
  step,
  project,
  onAdvance,
}: {
  step: typeof VIBE_STEPS[number];
  project: DirectionCardData | null;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">

      {/* ── What is this? ── */}
      <section>
        <h4 className="text-base font-semibold text-[#151515] mb-3">What is this?</h4>
        <Separator className="bg-[#D8D9DB] mb-4" />
        <p className="text-[15px] font-medium text-[#151515] leading-relaxed">{step.whatIs}</p>
      </section>

      {/* ── What You Should Do (collapsible, with chat) ── */}
      <CollapseSection title="What You Should Do">
        <BuildDemoGuidanceChat project={project} />
      </CollapseSection>

      {/* ── Initial Offerings (collapsible) ── */}
      <CollapseSection title="Initial Offerings">
        <InitialOfferingsSection project={project} />
      </CollapseSection>

      {/* ── Your MVO (collapsible) ── */}
      <CollapseSection title="Your Minimum Viable Offer">
        <MVODefinitionCard project={project} />
      </CollapseSection>

      {/* ── Readiness ── */}
      <BuildDemoReadinessBar project={project} onAdvance={onAdvance} />

    </div>
  );
}

// ─────────────────────────────────────────────
// Launchpad
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Launch Pillars data
// ─────────────────────────────────────────────

const LAUNCH_PILLARS = [
  { id: "brand_digital", label: "Brand & Digital Presence", icon: Rocket, items: [
    { id: "biz_name", label: "Business name" },
    { id: "target_customers", label: "Target customers" },
    { id: "tagline", label: "Tagline" },
    { id: "benefit", label: "Benefit description" },
    { id: "offerings", label: "Offerings" },
    { id: "pricing", label: "Pricing packages" },
    { id: "logo", label: "Logo" },
    { id: "brand_color", label: "Brand color palette" },
    { id: "domain", label: "Choose domain" },
    { id: "website", label: "Build website" },
    { id: "social", label: "Set up social media profiles" },
  ]},
  { id: "tools", label: "Tools Stack", icon: BarChart3, items: [
    { id: "crm", label: "CRM (customer relationship management)" },
    { id: "accounting_tool", label: "Accounting software" },
    { id: "payments", label: "Payment service (Stripe, etc.)" },
    { id: "collab", label: "Collaboration & project management" },
    { id: "esign", label: "Electronic signature tool" },
    { id: "social_tool", label: "Social media scheduler" },
    { id: "expense", label: "Expense tracking" },
  ]},
  { id: "operations", label: "Operations", icon: Users, items: [
    { id: "processes", label: "Identify core business processes" },
    { id: "office", label: "Get office space / set up remote" },
    { id: "it", label: "IT capabilities (hardware, cloud, security)" },
    { id: "ops_docs", label: "Document operational processes" },
  ]},
  { id: "finance", label: "Financial Setup", icon: DollarSign, items: [
    { id: "bank_account", label: "Open business bank account" },
    { id: "credit_card", label: "Get business credit card" },
    { id: "accounting_setup", label: "Set up accounting system" },
    { id: "tax_pro", label: "Hire tax professional + tax planning" },
    { id: "insurance", label: "Get business insurance" },
    { id: "funding_plan", label: "Finalize funding plan" },
  ]},
  { id: "legal", label: "Legal & Structure", icon: FileText, items: [
    { id: "incorporation", label: "Business incorporation" },
    { id: "dba_name", label: "Register fictitious/DBA name" },
    { id: "ein", label: "Get federal Tax ID (EIN)" },
    { id: "lawyer", label: "Hire a business lawyer" },
    { id: "permits", label: "Get business permits & licenses" },
    { id: "contracts", label: "Draft contracts (partners & customers)" },
  ]},
];

// Growth lives in its own top-level tab (not inside Launchpad).
const GROWTH_PILLAR = { id: "growth", label: "Growth", icon: BarChart3, items: [
  { id: "business_plan", label: "Business plan" },
  { id: "marketing_plan", label: "Marketing plan" },
  { id: "gtm_strategy", label: "Go-to-market strategy" },
  { id: "sales_playbook", label: "Sales playbook" },
  { id: "financial_model", label: "Financial model & projections" },
  { id: "growth_metrics", label: "Growth metrics / North Star" },
  { id: "retention_playbook", label: "Customer retention / churn playbook" },
  { id: "referral_strategy", label: "Referral & partnerships strategy" },
  { id: "content_seo", label: "Content & SEO plan" },
  { id: "pitch_deck", label: "Pitch deck" },
  { id: "hiring_plan", label: "Hiring plan" },
] } as const;

const GROWTH_STORAGE_KEYS: Record<string, (title: string) => string> = {
  business_plan: (t) => `growth-business-plan-${t}`,
  marketing_plan: (t) => `growth-marketing-plan-${t}`,
  gtm_strategy: (t) => `growth-gtm-strategy-${t}`,
  sales_playbook: (t) => `growth-sales-playbook-${t}`,
  financial_model: (t) => `growth-financial-model-${t}`,
  growth_metrics: (t) => `growth-metrics-${t}`,
  retention_playbook: (t) => `growth-retention-${t}`,
  referral_strategy: (t) => `growth-referral-${t}`,
  content_seo: (t) => `growth-content-seo-${t}`,
  pitch_deck: (t) => `growth-pitch-deck-${t}`,
  hiring_plan: (t) => `growth-hiring-${t}`,
};

const GROWTH_CLUSTERS: { label: string; ids: string[] }[] = [
  { label: "PLAN", ids: ["business_plan", "marketing_plan", "gtm_strategy"] },
  { label: "REVENUE", ids: ["sales_playbook", "financial_model", "growth_metrics", "retention_playbook", "referral_strategy", "content_seo"] },
  { label: "FUNDRAISE & TEAM", ids: ["pitch_deck", "hiring_plan"] },
];

type PillarDef = typeof LAUNCH_PILLARS[number] | typeof GROWTH_PILLAR;
type ChecklistStatus = "todo" | "progress" | "done";

// ─────────────────────────────────────────────
// TargetCustomersSection — auto-prefill from validation / launching strategy
// ─────────────────────────────────────────────

function TargetCustomersSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const storageKey = `target-customers-${title}`;

  const [main, setMain] = useState("");
  const [secondary, setSecondary] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const obj = JSON.parse(raw);
        setMain(obj?.main?.label ?? "");
        setSecondary(obj?.secondary?.label ?? "");
        setSaved(true);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const save = () => {
    if (!title) return;
    const obj: Record<string, { label: string }> = {};
    if (main.trim()) obj.main = { label: main.trim() };
    if (secondary.trim()) obj.secondary = { label: secondary.trim() };
    try { localStorage.setItem(storageKey, JSON.stringify(obj)); } catch { /* ignore */ }
    setSaved(true);
  };

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      {!main && !secondary && (
        <p className="text-[11px] text-[#9A9A9A] italic">
          Complete Launching Strategy in Validation to auto-fill this.
        </p>
      )}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-[#9A9A9A] mb-1">Primary</p>
          <textarea
            value={main}
            onChange={(e) => { setMain(e.target.value); setSaved(false); }}
            rows={2}
            placeholder="e.g. Solo founders building their first product"
            className="w-full text-[13px] text-[#151515] leading-relaxed resize-none px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#151515] transition-colors bg-white"
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#9A9A9A] mb-1">Secondary</p>
          <textarea
            value={secondary}
            onChange={(e) => { setSecondary(e.target.value); setSaved(false); }}
            rows={2}
            placeholder="e.g. Early-stage startup teams"
            className="w-full text-[13px] text-[#151515] leading-relaxed resize-none px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#151515] transition-colors bg-white"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saved || (!main.trim() && !secondary.trim())}
        className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-[#32C382]/40 text-[#32C382] hover:bg-[#F5FFD9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// BusinessNameSection — special item for biz_name
// ─────────────────────────────────────────────

function BusinessNameSection({ project, onNameChosen }: { project: DirectionCardData | null; onNameChosen: (name: string) => void }) {
  const title = project?.title ?? "";
  const storageKey = `business-name-${title}`;

  // Stable defaults for SSR/first client render — reading localStorage during
  // render causes a hydration mismatch that disables page interactivity.
  const [chosen, setChosen] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setChosen(stored ?? "");
      setCollapsed(!!stored);
    } catch {}
  }, [storageKey]);
  const [suggestions, setSuggestions] = useState<{ name: string; reason: string }[]>([]);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!title) return;
    try {
      const cached = localStorage.getItem(`business-name-suggestions-${title}`);
      if (cached) { setSuggestions(JSON.parse(cached)); setStage("done"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const buildContext = () => {
    const painkiller     = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const offer          = localStorage.getItem(`mvo-defined-${title}`) ?? "";
    const patternSummary = localStorage.getItem(`pattern-summary-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    const competitors = (project?.key_competitors ?? []).map((c) => c.name).filter(Boolean);
    return { painkiller, offer, patternSummary, targetCustomer, competitors };
  };

  const generateSuggestions = async () => {
    if (!title) return;
    setStage("loading");
    const { painkiller, offer, patternSummary, targetCustomer, competitors } = buildContext();
    const competitorLine = competitors.length > 0
      ? `\nKnown competitors (do NOT use names similar to these): ${competitors.join(", ")}`
      : "";
    const system = `You are Sorene, a startup brand coach. Return ONLY valid JSON — no markdown, no preamble.`;
    const prompt = `Suggest 3 business name options for this founder. Names must be:
- Clear, simple, and immediately communicate what the offer is
- Distinct from any known competitors — do not suggest names that are similar to competitor brands
- Original enough that they are unlikely to already be in use by similar businesses${competitorLine}

Project: "${title}"${project?.oneliner ? `\nOne-liner: "${project.oneliner}"` : ""}${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}${patternSummary ? `\nPattern: "${patternSummary.slice(0, 200)}"` : ""}

Return JSON: [{"name": "...", "reason": "1 sentence why this works — and why it stands out from competitors"}, ...]`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setSuggestions(parsed); setStage("done");
          try { localStorage.setItem(`business-name-suggestions-${title}`, JSON.stringify(parsed)); } catch { /* ignore */ }
        } else { setStage("idle"); }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user" as const, text: msg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    const { painkiller, offer, patternSummary, targetCustomer } = buildContext();
    const system = `You are Sorene, a startup brand coach. Suggest business names that are clear, simple, and communicate the offer directly. IMPORTANT: If the user is proposing a specific name they want (e.g. they typed a brand name), put THAT exact name as the FIRST item with a short reason evaluating it, then add 2 alternatives. If the user is giving feedback or direction (e.g. "shorter", "more playful"), return 3 fresh suggestions. Return a JSON array: [{"name": "...", "reason": "..."}]. No markdown outside the JSON.`;
    const history = newHistory.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    const prompt = `Context — Project: "${title}"${targetCustomer ? `, target customer: "${targetCustomer}"` : ""}${painkiller ? `, painkiller: "${painkiller}"` : ""}${offer ? `, offer: "${offer}"` : ""}${patternSummary ? `, pattern: "${patternSummary.slice(0, 150)}"` : ""}. User typed: "${msg}". If this looks like a specific business name they want to use, return it as the first option (with a one-line evaluation) followed by 2 alternatives. Otherwise treat it as feedback and return 3 new suggestions. Return a JSON array of 3 items.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system, history }) });
      if (res.ok) {
        const data = await res.json();
        const reply = (data?.reply ?? "").trim();
        const match = reply.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setSuggestions([]);
          setTimeout(() => {
            setSuggestions(parsed);
            setSuggestionKey((k) => k + 1);
          }, 120);
          try { localStorage.setItem(`business-name-suggestions-${title}`, JSON.stringify(parsed)); } catch { /* ignore */ }
          const firstName = (parsed[0]?.name ?? "").toLowerCase();
          const usedTheirName = firstName === msg.toLowerCase().trim();
          setChatHistory([...newHistory, { role: "ai", text: usedTheirName ? `Got it — I put "${parsed[0].name}" at the top with alternatives:` : "Here are 3 new options:" }]);
        } else {
          setChatHistory([...newHistory, { role: "ai", text: reply }]);
        }
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  };

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = (prefill?: string) => { setEditValue(prefill ?? chosen); setEditing(true); };
  const saveEdit = () => {
    const v = editValue.trim();
    if (v) { setChosen(v); try { localStorage.setItem(storageKey, v); } catch { /* ignore */ } onNameChosen(v); }
    setEditing(false);
    setCollapsed(!!v);
  };

  const chooseName = (name: string) => { startEdit(name); };

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      {/* Chosen name badge — shown when name saved and not editing */}
      {chosen && !editing && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F5FFD9] border border-[#32C382]/30 rounded-xl">
          <CheckCircle2 size={13} className="text-[#32C382] shrink-0" />
          <span className="text-[13px] font-semibold text-[#151515]">{chosen}</span>
          <button onClick={() => startEdit()} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto shrink-0">Edit</button>
        </div>
      )}

      {/* Edit field — shown when editing OR no name chosen yet */}
      {(editing || !chosen) && (
        <>
          {/* Hint only when no name yet */}
          {!chosen && !editing && (
            <p className="text-[12px] text-[#62646A] leading-relaxed">
              A great business name is <strong className="text-[#151515] font-medium">clear</strong>, <strong className="text-[#151515] font-medium">simple</strong>, and instantly tells people what you do. Avoid clever wordplay — clarity wins.
            </p>
          )}

          {editing && (
            <div className="space-y-2">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                placeholder="Type or choose a name below…"
                className="w-full text-[13px] text-[#151515] px-3 py-2 rounded-xl border border-[#151515] focus:outline-none bg-white"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
                <button onClick={() => { setEditing(false); }} className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-gray-200 text-[#62646A] hover:border-[#151515] transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Generate / suggestions */}
          {stage === "idle" && (
            <button onClick={generateSuggestions} disabled={!title}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
              <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Suggest 3 name options
            </button>
          )}
          {stage === "loading" && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]">
              <Loader2 size={11} className="animate-spin" /> Generating name ideas…
            </div>
          )}
          {stage === "done" && suggestions.length > 0 && (
            <motion.div key={suggestionKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-xl border p-3 transition-all border-gray-100 bg-[#FAFAFA] hover:border-[#151515]/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#151515]">{s.name}</span>
                    <button onClick={() => chooseName(s.name)}
                      className="text-[10px] font-medium text-[#151515] border border-[#151515]/20 px-2.5 py-1 rounded-full hover:bg-[#151515] hover:text-white transition-colors shrink-0">
                      Choose
                    </button>
                  </div>
                  <p className="text-[11px] text-[#62646A] mt-0.5 leading-snug">{s.reason}</p>
                </div>
              ))}
              <button onClick={generateSuggestions}
                className="text-[10px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">
                Regenerate
              </button>
            </motion.div>
          )}

          {/* Chat for more ideas */}
          {stage === "done" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {chatHistory.length > 0 && (
                <div className="px-3 py-2 space-y-1.5 max-h-32 overflow-y-auto bg-[#FAFAFA]">
                  {chatHistory.map((m, i) => (
                    <p key={i} className={cn("text-[11px] leading-relaxed", m.role === "user" ? "text-[#151515] font-medium" : "text-[#62646A]")}>
                      {m.role === "ai" ? <span className="text-[#32C382] font-semibold">Sorene: </span> : "You: "}{m.text}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask for more ideas, e.g. something shorter…"
                  className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none"
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                  className="shrink-0 text-[#32C382] disabled:opacity-30 transition-colors">
                  {chatLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BrandTextSection — generic for tagline / benefit / offerings
// ─────────────────────────────────────────────

type BrandTextType = "tagline" | "benefit" | "offerings" | "logo" | "domain" | "website";

const BRAND_TEXT_META: Record<BrandTextType, { hint: string; promptInstruction: string; placeholder: string }> = {
  tagline: {
    hint: "A great tagline is short (under 8 words), benefit-focused, and instantly tells people what is in it for them.",
    promptInstruction: `Generate 3 tagline options for this business. Each tagline must be under 8 words, benefit-focused, plain language. IMPORTANT: return a JSON array. The "text" field must contain ONLY the short tagline itself (under 8 words). The "reason" field explains why it works. Example: [{"text": "Launch fast, grow with confidence", "reason": "Direct and benefit-focused"}, ...]`,
    placeholder: 'e.g. "Launch your business without the guesswork"',
  },
  benefit: {
    hint: "A benefit description explains the single biggest positive outcome customers get. Keep it to 1-2 sentences, positive, and jargon-free.",
    promptInstruction: `Generate 3 benefit description options for this business. IMPORTANT: return a JSON array. The "text" field must contain ONLY the 1-2 sentence benefit copy itself. The "reason" field explains why it works. Example: [{"text": "We help you go from idea to paying clients in 90 days.", "reason": "Specific and outcome-focused"}, ...]`,
    placeholder: 'e.g. "We help you go from employee to founder in 6 months — without the guesswork."',
  },
  offerings: {
    hint: "A service description tells customers exactly what they get. Keep it to 1 clear sentence per offering, starting with a verb.",
    promptInstruction: `Generate 3 service/offering description options for this business. IMPORTANT: return a JSON array. The "text" field must contain ONLY the 1-sentence offering copy (start with a verb). The "reason" field explains why it works. Example: [{"text": "Validate your idea with real customers in 30 days.", "reason": "Action-oriented and specific"}, ...]`,
    placeholder: 'e.g. "Validate your business idea with real customer feedback in 30 days."',
  },
  logo: {
    hint: "A logo concept describes visual direction — type style, symbol ideas, and feeling.",
    promptInstruction: "",
    placeholder: 'e.g. "Bold S, forward momentum — geometric lettermark"',
  },
  domain: {
    hint: "Your domain should match your business name closely. Check availability at namecheap.com or porkbun.com before registering.",
    promptInstruction: `Suggest 8 domain name options built around the chosen business name. Stay close to the brand name but vary the approach so some are likely still available: try the exact name, then common prefixes (get, try, use, join, hey, my) and suffixes (app, hq, io, hub) and a mix of TLDs (.com, .co, .io, .ai). IMPORTANT: return a JSON array. The "text" field must contain ONLY the full domain name (e.g. "getmybiz.com"). The "reason" field is a 1-sentence note. Example: [{"text": "getsorene.com", "reason": "Adds 'get' prefix, keeps brand clear"}, ...]`,
    placeholder: 'e.g. "Something with .ai or shorter"',
  },
  website: {
    hint: "At launch you need just 3 pages: Home, Services/Pricing, and Contact or Booking. Pick a platform you can launch in a weekend.",
    promptInstruction: `Recommend 3 website platform options for this business type. IMPORTANT: return a JSON array. The "text" field must contain ONLY "Platform — Page1, Page2, Page3". The "reason" field explains why it fits. Example: [{"text": "Squarespace — Home, Services, Contact", "reason": "Easy to use, great templates"}, ...]`,
    placeholder: 'e.g. "Something with booking built in"',
  },
};

// ─────────────────────────────────────────────
// LogoConceptSection — upload logo images (JPEG/PNG ≤ 5 MB)
// ─────────────────────────────────────────────

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB

function LogoConceptSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const storageKey = `brand-logo-concepts-${title}`;

  const [logos, setLogos] = useState<string[]>([]); // saved base64 data URLs
  const [pending, setPending] = useState<string | null>(null); // awaiting Save
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLogos(JSON.parse(raw));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const persist = (list: string[]) => {
    setLogos(list);
    try { localStorage.setItem(storageKey, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    const file = files[0];
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG or PNG files are supported.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError("File must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) setPending(dataUrl);
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const savePending = () => {
    if (!pending) return;
    persist([...logos, pending]);
    setPending(null);
  };

  const cancelPending = () => { setPending(null); setError(""); };

  const remove = (i: number) => persist(logos.filter((_, idx) => idx !== i));

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Upload your logo files. JPEG or PNG, max 5 MB each.</p>

      {logos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {logos.map((src, i) => (
            <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-[#F9F9F9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Logo ${i + 1}`} className="w-full h-full object-contain p-1" />
              <button
                onClick={() => remove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending preview — waiting for Save */}
      {pending && (
        <div className="space-y-2">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-[#151515] bg-[#F9F9F9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending} alt="Preview" className="w-full h-full object-contain p-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={savePending} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
            <button onClick={cancelPending} className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-gray-200 text-[#62646A] hover:border-[#151515] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {!pending && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-[12px] font-medium px-4 py-2 rounded-xl border border-dashed border-gray-300 text-[#62646A] hover:border-[#151515] hover:text-[#151515] transition-colors"
          >
            + Add logo
          </button>
          {error && <p className="mt-1.5 text-[11px] text-[#DF2E16]">{error}</p>}
        </div>
      )}
    </div>
  );
}

function BrandTextSection({ type, project }: { type: BrandTextType; project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const storageKey = `brand-${type}-${title}`;
  const meta = BRAND_TEXT_META[type];

  // Stable defaults for SSR/first client render — reading localStorage during
  // render causes a hydration mismatch that disables page interactivity.
  const [chosen, setChosen] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setChosen(stored ?? "");
      setCollapsed(!!stored);
    } catch {}
  }, [storageKey]);
  const [suggestions, setSuggestions] = useState<{ text?: string; name?: string; reason?: string; available?: boolean | null }[]>([]);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!title) return;
    try {
      const cached = localStorage.getItem(`brand-${type}-suggestions-${title}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const wordCount = (s: string) => (s || "").trim().split(/\s+/).length;
        // Migrate old data: normalize to {text, reason}. If text looks like the
        // explanation (long) and reason looks like the copy (short), they were swapped
        // by the AI — correct them. Thresholds per type:
        // tagline: copy ≤ 10 words; benefit/offerings: copy ≤ 35 words; others: lenient
        const maxCopyWords: Partial<Record<BrandTextType, number>> = { tagline: 10, benefit: 35, offerings: 35 };
        const threshold = maxCopyWords[type] ?? 999;
        const migrated = Array.isArray(parsed) ? parsed.map((s: { name?: string; text?: string; reason?: string; available?: boolean | null }) => {
          const candidateText = s.text || s.name || "";
          const candidateReason = s.reason || "";
          // If candidate text is longer than threshold and reason is shorter, they are swapped
          const swapped = wordCount(candidateText) > threshold && wordCount(candidateReason) < wordCount(candidateText);
          return {
            text: swapped ? candidateReason : candidateText,
            reason: swapped ? candidateText : candidateReason,
            ...(s.available !== undefined ? { available: s.available } : {}),
          };
        }) : parsed;
        setSuggestions(migrated);
        // Re-save corrected data so next load is already clean
        try { localStorage.setItem(`brand-${type}-suggestions-${title}`, JSON.stringify(migrated)); } catch { /* ignore */ }
        setStage("done");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type]);

  const buildContext = () => {
    const painkiller     = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const offer          = localStorage.getItem(`mvo-defined-${title}`) ?? "";
    const patternSummary = localStorage.getItem(`pattern-summary-${title}`) ?? "";
    const chosenName     = localStorage.getItem(`business-name-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    return { painkiller, offer, patternSummary, targetCustomer, chosenName };
  };

  const buildPrompt = (ctx: ReturnType<typeof buildContext>) => {
    const { painkiller, offer, patternSummary, targetCustomer, chosenName } = ctx;
    return `${meta.promptInstruction}

Project: "${title}"${chosenName ? `\nBusiness name: "${chosenName}"` : ""}${project?.oneliner ? `\nOne-liner: "${project.oneliner}"` : ""}${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}${patternSummary ? `\nPattern: "${patternSummary.slice(0, 200)}"` : ""}

Remember: "text" = the actual copy itself (short). "reason" = why it works (explanation). Return only the JSON array.`;
  };

  const checkAndAnnotateDomains = async (list: { text: string; reason: string }[]): Promise<{ text: string; reason: string; available?: boolean | null }[]> => {
    if (type !== "domain") return list;
    setCheckingAvailability(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/check-domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domains: list.map((s) => s.text) }) });
      if (res.ok) {
        const data = await res.json();
        const availMap: Record<string, boolean> = {};
        for (const r of (data.results ?? [])) availMap[r.domain] = r.available;
        const annotated = list.map((s) => ({ ...s, available: availMap[s.text.toLowerCase().trim()] ?? null }));
        // Surface available domains first, then unknown, then taken.
        const rank = (a: boolean | null | undefined) => (a === true ? 0 : a === false ? 2 : 1);
        annotated.sort((x, y) => rank(x.available) - rank(y.available));
        return annotated;
      }
    } catch { /* ignore */ }
    setCheckingAvailability(false);
    return list;
  };

  // For domains: keep generating + checking until we collect enough AVAILABLE
  // ones, telling the model which domains were already taken so it avoids them.
  const generateAvailableDomains = async () => {
    const TARGET = 4;       // how many available domains we want to show
    const MAX_ROUNDS = 5;   // safety cap on generation rounds
    const system = `You are Sorene, a startup brand coach. Return ONLY valid JSON — no markdown, no preamble.`;
    const { authFetch } = await import("@/lib/authFetch");
    const available: { text: string; reason: string; available?: boolean | null }[] = [];
    const tried = new Set<string>();

    setStage("done");
    setCheckingAvailability(true);
    for (let round = 0; round < MAX_ROUNDS && available.length < TARGET; round++) {
      const takenNote = tried.size > 0
        ? `\n\nThese are already taken — do NOT suggest them or close variants: ${[...tried].join(", ")}.`
        : "";
      let parsed: { text: string; reason: string }[] = [];
      try {
        const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: buildPrompt(buildContext()) + takenNote, system }) });
        if (!res.ok) break;
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (!match) break;
        const raw = JSON.parse(match[0]);
        parsed = Array.isArray(raw) ? raw.map((s: { name?: string; text?: string; reason?: string }) => ({ text: s.text || s.name || "", reason: s.reason || "" })) : [];
      } catch { break; }

      const fresh = parsed.filter((s) => s.text && !tried.has(s.text.toLowerCase().trim()));
      fresh.forEach((s) => tried.add(s.text.toLowerCase().trim()));
      if (fresh.length === 0) continue;

      const checked = await checkAndAnnotateDomains(fresh);
      for (const c of checked) {
        if (c.available === true && available.length < TARGET) available.push(c);
      }
      // Show progress as we accumulate available ones
      setSuggestions([...available]);
    }
    setCheckingAvailability(false);
    setStage("done");
    setSuggestions(available);
    try { localStorage.setItem(`brand-${type}-suggestions-${title}`, JSON.stringify(available)); } catch { /* ignore */ }
  };

  const generateSuggestions = async () => {
    if (!title) return;
    setStage("loading");
    if (type === "domain") { await generateAvailableDomains(); return; }
    const system = `You are Sorene, a startup brand coach. Return ONLY valid JSON — no markdown, no preamble.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: buildPrompt(buildContext()), system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) {
          const raw = JSON.parse(match[0]);
          const parsed = Array.isArray(raw) ? raw.map((s: { name?: string; text?: string; reason?: string }) => ({ text: s.text || s.name || "", reason: s.reason || "" })) : raw;
          setStage("done");
          setSuggestions(parsed);
          try { localStorage.setItem(`brand-${type}-suggestions-${title}`, JSON.stringify(parsed)); } catch { /* ignore */ }
        } else { setStage("idle"); }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = (prefill?: string) => { setEditValue(prefill ?? chosen); setEditing(true); };
  const saveEdit = () => {
    const v = editValue.trim();
    if (v) { setChosen(v); try { localStorage.setItem(storageKey, v); } catch { /* ignore */ } }
    setEditing(false);
    setCollapsed(!!v);
  };

  // "Choose" from suggestions → open edit field for review before saving
  const choose = (name: string) => { startEdit(name); };

  const [customInput, setCustomInput] = useState("");
  const [customChecking, setCustomChecking] = useState(false);
  const [customResult, setCustomResult] = useState<boolean | null>(null);

  const checkCustomDomain = async () => {
    const d = customInput.trim().toLowerCase();
    if (!d) return;
    setCustomChecking(true);
    setCustomResult(null);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/check-domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domains: [d] }) });
      if (res.ok) {
        const data = await res.json();
        setCustomResult(data.results?.[0]?.available ?? null);
      }
    } catch { /* ignore */ }
    setCustomChecking(false);
  };

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      {chosen && !editing && (
        <div className="flex items-start gap-2 px-3 py-2 bg-[#F5FFD9] border border-[#32C382]/30 rounded-xl">
          <CheckCircle2 size={13} className="text-[#32C382] shrink-0 mt-0.5" />
          <span className="text-[13px] font-medium text-[#151515] flex-1 leading-snug">{chosen}</span>
          <button onClick={() => startEdit()} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors shrink-0">Edit</button>
        </div>
      )}

      {/* Suggestions + edit field — shown when no value saved yet, or when editing */}
      {(!chosen || editing) && (
        <>
          {!chosen && !editing && (
            <p className="text-[12px] text-[#62646A] leading-relaxed">{meta.hint}</p>
          )}
          {editing && (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Type or choose an option below…"
                className="w-full text-[13px] text-[#151515] leading-relaxed resize-none px-3 py-2 rounded-xl border border-[#151515] focus:outline-none bg-white"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
                <button onClick={() => setEditing(false)} className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-gray-200 text-[#62646A] hover:border-[#151515] transition-colors">Cancel</button>
              </div>
            </div>
          )}
          {stage === "idle" && (
            <button onClick={generateSuggestions} disabled={!title}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
              <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Suggest 3 options
            </button>
          )}
          {stage === "loading" && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]">
              <Loader2 size={11} className="animate-spin" /> Generating options…
            </div>
          )}
          {stage === "done" && checkingAvailability && type === "domain" && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]">
              <Loader2 size={11} className="animate-spin" /> Finding available domains{suggestions.length > 0 ? ` (${suggestions.length} found)` : ""}…
            </div>
          )}
          {stage === "done" && type === "domain" && !checkingAvailability && suggestions.length === 0 && (
            <p className="text-[11px] text-[#62646A] leading-relaxed">
              Could not find an available domain close to your name. Try the custom check below, or tweak your business name.
            </p>
          )}
          {stage === "done" && suggestions.length > 0 && (
            <motion.div key={suggestionKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
              {suggestions.map((s, i) => {
                const displayText = s.text || s.name || "";
                const unavailable = type === "domain" && s.available === false;
                return (
                <div key={i} className={cn(
                  "rounded-xl border p-3 transition-all",
                  unavailable ? "opacity-40 border-gray-100 bg-[#FAFAFA]"
                  : chosen === displayText ? "border-[#32C382] bg-[#F5FFD9]"
                  : "border-gray-100 bg-[#FAFAFA] hover:border-[#151515]/20"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={cn("text-[13px] font-semibold leading-snug", unavailable ? "text-[#9A9A9A] line-through" : "text-[#151515]")}>{displayText}</span>
                      {type === "domain" && s.available === true && !checkingAvailability && (
                        <span className="text-[10px] font-medium text-[#32C382] bg-[#F5FFD9] border border-[#32C382]/30 px-1.5 py-0.5 rounded-full shrink-0">Available</span>
                      )}
                      {type === "domain" && s.available === false && (
                        <span className="text-[10px] font-medium text-[#9A9A9A] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">Taken</span>
                      )}
                    </div>
                    {!unavailable && chosen !== displayText ? (
                      <button onClick={() => choose(displayText)}
                        className="text-[10px] font-medium text-[#151515] border border-[#151515]/20 px-2.5 py-1 rounded-full hover:bg-[#151515] hover:text-white transition-colors shrink-0">
                        Choose
                      </button>
                    ) : !unavailable ? (
                      <CheckCircle2 size={13} className="text-[#32C382] shrink-0 mt-0.5" />
                    ) : null}
                  </div>
                  {s.reason && !unavailable && <p className="text-[11px] text-[#62646A] mt-0.5 leading-snug">{s.reason}</p>}
                </div>
                );
              })}
              <button onClick={generateSuggestions}
                className="text-[10px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">
                Regenerate
              </button>
            </motion.div>
          )}
          {type === "domain" && stage === "done" && (
            <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3 space-y-2">
              <p className="text-[11px] font-medium text-[#62646A]">Or check your own domain:</p>
              <div className="flex items-center gap-2">
                <input
                  value={customInput}
                  onChange={(e) => { setCustomInput(e.target.value); setCustomResult(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") checkCustomDomain(); }}
                  placeholder="e.g. mybrand.com"
                  className="flex-1 text-[13px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#32C382]"
                />
                <button onClick={checkCustomDomain} disabled={customChecking || !customInput.trim()}
                  className="text-[11px] font-medium text-[#151515] border border-[#151515]/20 px-3 py-1.5 rounded-lg hover:bg-[#151515] hover:text-white transition-colors disabled:opacity-30 shrink-0">
                  {customChecking ? <Loader2 size={12} className="animate-spin" /> : "Check"}
                </button>
              </div>
              {customResult === true && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-[#32C382]">{customInput.trim().toLowerCase()} is available!</span>
                  <button onClick={() => choose(customInput.trim().toLowerCase())}
                    className="text-[10px] font-medium text-white bg-[#32C382] px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity shrink-0">
                    Choose this
                  </button>
                </div>
              )}
              {customResult === false && (
                <span className="text-[11px] font-medium text-[#9A9A9A]">{customInput.trim().toLowerCase()} is already taken.</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PricingPackageSection
// ─────────────────────────────────────────────

type PricingPackage = { id: string; name: string; price: string; description: string; features: string; disclaimer: string };

function PricingPackageSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const storageKey = `brand-pricing-${title}`;

  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [collapsed, setCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [ownDesc, setOwnDesc] = useState("");
  const [ownEval, setOwnEval] = useState("");
  const [ownEvalLoading, setOwnEvalLoading] = useState(false);

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setPackages(JSON.parse(raw)); setStage("done"); setCollapsed(true); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const save = (pkgs: PricingPackage[]) => {
    setPackages(pkgs);
    try { localStorage.setItem(storageKey, JSON.stringify(pkgs)); } catch { /* ignore */ }
  };

  const buildPrompt = (extra = "") => {
    const offer      = localStorage.getItem(`mvo-defined-${title}`) ?? "";
    const painkiller = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    const chosenName = localStorage.getItem(`business-name-${title}`) ?? "";
    const chosenOffering = localStorage.getItem(`brand-offerings-${title}`) ?? "";
    return `Generate 2-3 pricing packages for this business. Each package should have a clear name, price, short description (1-2 sentences), a bullet-point list of features (as a single string, one per line starting with •), and a short disclaimer (e.g. refund policy, what is not included, cancellation terms).${extra}

Project: "${title}"${chosenName ? `\nBusiness name: "${chosenName}"` : ""}${project?.oneliner ? `\nOne-liner: "${project.oneliner}"` : ""}${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}${chosenOffering ? `\nOffering: "${chosenOffering}"` : ""}

Return JSON: [{"name":"Package name","price":"$X/mo or $X one-time","description":"short desc","features":"• feature1\n• feature2\n• feature3","disclaimer":"short disclaimer"}, ...]`;
  };

  const generate = async (extra = "") => {
    if (!title) return;
    setStage("loading");
    const system = `You are Sorene, a startup pricing coach. Return ONLY valid JSON — no markdown, no preamble.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: buildPrompt(extra), system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) {
          const parsed: PricingPackage[] = JSON.parse(match[0]).map((p: PricingPackage, i: number) => ({ ...p, id: `pkg-${i}` }));
          save(parsed); setStage("done"); setCollapsed(false);
        } else { setStage("idle"); }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user" as const, text: msg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    await generate(`\n\nUser feedback: "${msg}". Adjust accordingly.`);
    setChatHistory([...newHistory, { role: "ai", text: "Updated packages based on your feedback." }]);
    setChatLoading(false);
  };

  const updatePkg = (id: string, field: keyof PricingPackage, value: string) => {
    const updated = packages.map((p) => p.id === id ? { ...p, [field]: value } : p);
    save(updated);
  };

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      {!collapsed && <p className="text-[12px] text-[#62646A] leading-relaxed">Create 2-3 clear packages. Each needs a name, price, what is included, and a short disclaimer. Keep descriptions simple and benefit-focused.</p>}

      {stage === "idle" && (
        <button onClick={() => generate()} disabled={!title}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
          <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Suggest pricing packages
        </button>
      )}
      {stage === "loading" && <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Generating packages…</div>}

      {stage === "done" && packages.length > 0 && (
        <>
          {collapsed ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F5FFD9] border border-[#32C382]/30 rounded-xl">
              <CheckCircle2 size={13} className="text-[#32C382] shrink-0" />
              <span className="text-[13px] font-medium text-[#151515] flex-1">{packages.length} packages saved</span>
              <button onClick={() => setCollapsed(false)} className="text-[11px] text-[#32C382] hover:underline">Edit</button>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-1">Package name</p>
                      <input value={pkg.name} onChange={(e) => updatePkg(pkg.id, "name", e.target.value)}
                        className="w-full text-[13px] font-semibold text-[#151515] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#151515]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-1">Price</p>
                      <input value={pkg.price} onChange={(e) => updatePkg(pkg.id, "price", e.target.value)}
                        className="w-full text-[13px] font-semibold text-[#151515] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#151515]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-1">Description</p>
                    <textarea value={pkg.description} onChange={(e) => updatePkg(pkg.id, "description", e.target.value)} rows={2}
                      className="w-full text-[12px] text-[#151515] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#151515] resize-none" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-1">Features (one per line)</p>
                    <textarea value={pkg.features} onChange={(e) => updatePkg(pkg.id, "features", e.target.value)} rows={3}
                      className="w-full text-[12px] text-[#151515] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#151515] resize-none font-mono" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-1">Disclaimer</p>
                    <input value={pkg.disclaimer} onChange={(e) => updatePkg(pkg.id, "disclaimer", e.target.value)}
                      className="w-full text-[12px] text-[#62646A] italic bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#151515]" />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button onClick={() => generate()} className="text-[10px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Regenerate</button>
                <button onClick={() => setCollapsed(true)} className="text-[10px] text-[#32C382] font-medium hover:underline">Save & collapse</button>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {chatHistory.length > 0 && (
                  <div className="px-3 py-2 space-y-1 max-h-24 overflow-y-auto bg-[#FAFAFA]">
                    {chatHistory.map((m, i) => (
                      <p key={i} className={cn("text-[11px]", m.role === "user" ? "text-[#151515] font-medium" : "text-[#62646A]")}>
                        {m.role === "ai" ? <span className="text-[#32C382] font-semibold">Sorene: </span> : "You: "}{m.text}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder='e.g. "Add a premium tier" or "Make it cheaper"'
                    className="flex-1 text-[12px] text-[#151515] placeholder-gray-300 bg-transparent focus:outline-none" />
                  <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} className="shrink-0 text-[#32C382] disabled:opacity-30">
                    {chatLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {!collapsed && <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] text-[#9CA3AF] font-medium shrink-0">or describe your own</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3 space-y-2">
          <textarea
            value={ownDesc}
            onChange={(e) => setOwnDesc(e.target.value)}
            placeholder="Describe your pricing packages (e.g. a starter at $99/mo, a pro at $299/mo with 5 seats)…"
            rows={3}
            className="w-full text-[13px] text-[#151515] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#32C382] resize-none placeholder:text-[#9CA3AF]"
          />
          <button
            onClick={async () => {
              const text = ownDesc.trim();
              if (!text || ownEvalLoading) return;
              setOwnEvalLoading(true);
              setOwnEval("");
              await generate(`\n\nUser described their own packages: "${text}". Use this as the basis — structure them into the correct format and evaluate if the pricing makes sense for this business.`);
              setOwnEval("Packages structured from your description.");
              setOwnEvalLoading(false);
            }}
            disabled={!ownDesc.trim() || ownEvalLoading}
            className="flex items-center gap-1 text-[10px] font-medium text-[#32C382] border border-[#32C382]/40 px-2.5 py-1 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30"
          >
            {ownEvalLoading ? <Loader2 size={10} className="animate-spin" /> : <img src="/figmaAssets/starfour.svg" className="w-2 h-2" alt="" />}
            Structure &amp; evaluate
          </button>
          {ownEval && (
            <p className="text-[11px] text-[#62646A] leading-relaxed">
              <span className="text-[#32C382] font-semibold">Sorene: </span>{ownEval}
            </p>
          )}
        </div>
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// BrandColorSection
// ─────────────────────────────────────────────

function ColorUploadArea({ title }: { title: string }) {
  const storageKey = `brand-color-upload-${title}`;
  const [preview, setPreview] = useState<string>(() => {
    try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      try { localStorage.setItem(storageKey, dataUrl); } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {preview ? (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[#32C382]/30 bg-[#F5FFD9]">
          <img src={preview} alt="Brand colors" className="w-10 h-10 object-contain rounded-lg border border-white" />
          <span className="text-[12px] font-medium text-[#151515] flex-1">Brand image saved</span>
          <button onClick={() => { setPreview(""); try { localStorage.removeItem(storageKey); } catch {} }}
            className="text-[10px] text-[#9CA3AF] hover:text-[#374151] transition-colors">Remove</button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] hover:border-[#32C382]/50 hover:bg-[#F5FFD9]/30 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 13V7M7 10l3-3 3 3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="2" width="16" height="16" rx="4" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
          <span className="text-[11px] text-[#9CA3AF]">Upload brand image or mood board</span>
          <span className="text-[10px] text-[#C4C4C4]">PNG, JPG, SVG</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </>
  );
}

type ColorPalette = { id: string; name: string; vibe: string; primary: string; secondary: string; accent: string; neutral: string };

function BrandColorSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const storageKey = `brand-colors-${title}`;

  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [chosen, setChosen] = useState<ColorPalette | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { const d = JSON.parse(raw); setPalettes(d.palettes ?? []); setChosen(d.chosen ?? null); setStage("done"); setCollapsed(!!d.chosen); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const generate = async () => {
    if (!title) return;
    setStage("loading");
    const painkiller     = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const chosenName     = localStorage.getItem(`business-name-${title}`) ?? "";
    const chosenTagline  = localStorage.getItem(`brand-tagline-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    const system = `You are Sorene, a startup brand coach. Return ONLY valid JSON — no markdown, no preamble.`;
    const prompt = `Generate 3 brand color palette options for this business. Each palette has a primary, secondary, accent, and neutral color. Colors must feel cohesive and reflect the brand personality.

Project: "${title}"${chosenName ? `\nBusiness name: "${chosenName}"` : ""}${chosenTagline ? `\nTagline: "${chosenTagline}"` : ""}${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}

Return JSON: [{"id":"p1","name":"palette name","vibe":"2-word mood description","primary":"#hexcode","secondary":"#hexcode","accent":"#hexcode","neutral":"#hexcode"}, ...]`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) {
          const parsed: ColorPalette[] = JSON.parse(match[0]);
          setPalettes(parsed); setStage("done");
          try { localStorage.setItem(storageKey, JSON.stringify({ palettes: parsed, chosen })); } catch { /* ignore */ }
        } else { setStage("idle"); }
      } else { setStage("idle"); }
    } catch { setStage("idle"); }
  };

  const choosePalette = (p: ColorPalette) => {
    setChosen(p); setCollapsed(true);
    try { localStorage.setItem(storageKey, JSON.stringify({ palettes, chosen: p })); } catch { /* ignore */ }
  };

  const Swatch = ({ hex, label }: { hex: string; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-lg border border-white/30 shadow-sm" style={{ backgroundColor: hex }} />
      <span className="text-[9px] text-[#9A9A9A] font-mono">{hex}</span>
      <span className="text-[9px] text-[#62646A]">{label}</span>
    </div>
  );

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      {!collapsed && <p className="text-[12px] text-[#62646A] leading-relaxed">Your brand palette should feel consistent across your website, social media, and materials. Pick 1 palette and stick to it.</p>}

      {chosen && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F5FFD9] border border-[#32C382]/30 rounded-xl">
          <CheckCircle2 size={13} className="text-[#32C382] shrink-0" />
          <div className="flex gap-1.5">
            {[chosen.primary, chosen.secondary, chosen.accent, chosen.neutral].map((hex, i) => (
              <div key={i} className="w-5 h-5 rounded-md border border-white/50 shadow-sm" style={{ backgroundColor: hex }} />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#151515] flex-1 truncate">{chosen.name}</span>
          <button onClick={() => setCollapsed((v) => !v)} className="text-[11px] text-[#32C382] hover:underline shrink-0">{collapsed ? "Change" : "Collapse"}</button>
        </div>
      )}

      {!collapsed && (
        <>
          {stage === "idle" && (
            <button onClick={generate} disabled={!title}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
              <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Suggest color palettes
            </button>
          )}
          {stage === "loading" && <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Generating palettes…</div>}
          {stage === "done" && palettes.length > 0 && (
            <div className="space-y-2">
              {palettes.map((p) => (
                <div key={p.id} className={cn("rounded-xl border p-3 transition-all",
                  chosen?.name === p.name ? "border-[#32C382] bg-[#F5FFD9]" : "border-gray-100 bg-[#FAFAFA] hover:border-[#151515]/20"
                )}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[13px] font-semibold text-[#151515]">{p.name}</span>
                      <span className="text-[11px] text-[#9A9A9A] ml-2">{p.vibe}</span>
                    </div>
                    {chosen?.name !== p.name ? (
                      <button onClick={() => choosePalette(p)}
                        className="text-[10px] font-medium text-[#151515] border border-[#151515]/20 px-2.5 py-1 rounded-full hover:bg-[#151515] hover:text-white transition-colors shrink-0">
                        Choose
                      </button>
                    ) : <CheckCircle2 size={13} className="text-[#32C382] shrink-0" />}
                  </div>
                  <div className="flex gap-3">
                    <Swatch hex={p.primary} label="Primary" />
                    <Swatch hex={p.secondary} label="Secondary" />
                    <Swatch hex={p.accent} label="Accent" />
                    <Swatch hex={p.neutral} label="Neutral" />
                  </div>
                </div>
              ))}
              <button onClick={generate} className="text-[10px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Regenerate</button>
            </div>
          )}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-[#9CA3AF] font-medium shrink-0">or upload brand colors</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <ColorUploadArea title={title} />
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SocialMediaSection
// ─────────────────────────────────────────────

const ALL_SOCIAL_CHANNELS = [
  { id: "instagram", label: "Instagram", note: "Visual content, stories, reels" },
  { id: "linkedin", label: "LinkedIn", note: "B2B, professional network" },
  { id: "tiktok", label: "TikTok", note: "Short-form video, organic reach" },
  { id: "twitter", label: "X (Twitter)", note: "Real-time updates, thought leadership" },
  { id: "facebook", label: "Facebook", note: "Community, local business, ads" },
  { id: "youtube", label: "YouTube", note: "Long-form video, tutorials" },
  { id: "pinterest", label: "Pinterest", note: "Visual discovery, lifestyle, DIY" },
  { id: "threads", label: "Threads", note: "Text-based, Instagram community" },
  { id: "whatsapp", label: "WhatsApp Business", note: "Direct customer messaging" },
];

function SocialMediaSection({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const statusKey = (id: string) => `social-status-${id}-${title}`;
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [priority, setPriority] = useState<string[]>([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityDone, setPriorityDone] = useState(false);

  useEffect(() => {
    if (!title) return;
    const loaded: Record<string, boolean> = {};
    for (const ch of ALL_SOCIAL_CHANNELS) {
      try { loaded[ch.id] = localStorage.getItem(statusKey(ch.id)) === "done"; } catch { loaded[ch.id] = false; }
    }
    setStatuses(loaded);
    try {
      const raw = localStorage.getItem(`social-priority-${title}`);
      if (raw) { setPriority(JSON.parse(raw)); setPriorityDone(true); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const toggleChannel = (id: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(statusKey(id), next[id] ? "done" : "todo"); } catch { /* ignore */ }
      return next;
    });
  };

  const suggestPriority = async () => {
    if (!title) return;
    setPriorityLoading(true);
    const painkiller = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    const system = `You are Sorene. Return ONLY a JSON array of channel ids — no markdown, no preamble.`;
    const channels = ALL_SOCIAL_CHANNELS.map((c) => c.id).join(", ");
    const prompt = `Which 3 social media channels should this founder prioritise first? Return their ids only.\n\nChannels: ${channels}\nProject: "${title}"${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${project?.oneliner ? `\nOne-liner: "${project.oneliner}"` : ""}\n\nReturn JSON array of 3 ids: ["id1","id2","id3"]`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) {
          const ids = JSON.parse(match[0]);
          setPriority(ids); setPriorityDone(true);
          try { localStorage.setItem(`social-priority-${title}`, JSON.stringify(ids)); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setPriorityLoading(false);
  };

  const doneCount = ALL_SOCIAL_CHANNELS.filter((c) => statuses[c.id]).length;

  return (
    <div className="mt-2 ml-[26px] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#62646A]">Mark each channel as set up. Start with the ones Sorene recommends for your business.</p>
      </div>

      {!priorityDone && (
        <button onClick={suggestPriority} disabled={!title || priorityLoading}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
          {priorityLoading ? <Loader2 size={11} className="animate-spin" /> : <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" />}
          {priorityLoading ? "Analysing…" : "Show which to prioritise"}
        </button>
      )}

      <div className="space-y-2">
        {ALL_SOCIAL_CHANNELS.map((ch) => {
          const done = statuses[ch.id] ?? false;
          const isPriority = priority.includes(ch.id);
          return (
            <button key={ch.id} onClick={() => toggleChannel(ch.id)} className="w-full flex items-center gap-2.5 text-left group">
              <div className={cn("w-3.5 h-3.5 rounded-full shrink-0 transition-colors border",
                done ? "bg-[#32C382] border-[#32C382]" : "bg-white border-gray-300 group-hover:border-[#151515]"
              )} />
              <span className={cn("text-[13px] flex-1 transition-colors", done ? "text-[#9A9A9A] line-through" : "text-[#151515]")}>{ch.label}</span>
              {isPriority && !done && <span className="text-[10px] font-medium text-[#32C382] border border-[#32C382]/40 px-1.5 py-0.5 rounded-full shrink-0">Start here</span>}
              <span className="text-[11px] text-[#9A9A9A] shrink-0">{ch.note}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#9A9A9A]">{doneCount}/{ALL_SOCIAL_CHANNELS.length} channels set up</p>
    </div>
  );
}

const PILLAR_GRADIENTS: Record<string, string> = {
  legal:       "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #818CF8 34.62%, #6366F1 100%)",
  finance:     "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #4ADE80 34.62%, #16A34A 100%)",
  brand_digital: "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #F38744 34.62%, #EF4444 100%)",
  operations:  "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #38BDF8 34.62%, #0284C7 100%)",
  tools:       "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #F472B6 34.62%, #DB2777 100%)",
  growth:      "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #FCD34D 34.62%, #F59E0B 100%)",
};

const PILLAR_TAGLINES: Record<string, string> = {
  legal:       "Set the legal foundation",
  finance:     "Get your money in order",
  brand_digital: "Build your presence",
  operations:  "Run the machine",
  tools:       "Pick your stack",
  growth:      "Scale what works",
};

function PillarCard({ pillar, project, onNameChosen, autoOpen }: { pillar: PillarDef; project: DirectionCardData | null; onNameChosen?: (name: string) => void; autoOpen?: boolean }) {
  const title = project?.title ?? "";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(autoOpen ?? false);

  useEffect(() => {
    if (autoOpen) {
      setIsExpanded(true);
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);
  const [statuses, setStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [tips, setTips] = useState<Record<string, string>>({});
  const [tipsStage, setTipsStage] = useState<"idle" | "loading" | "done">("idle");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItem = (itemId: string) => setOpenItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  useEffect(() => {
    if (!title) return;
    const loaded: Record<string, ChecklistStatus> = {};
    for (const item of pillar.items) {
      try {
        const v = localStorage.getItem(`launchpad-status-${item.id}-${title}`) as ChecklistStatus | null;
        loaded[item.id] = v ?? "todo";
      } catch { loaded[item.id] = "todo"; }
    }
    setStatuses(loaded);
    try {
      const raw = localStorage.getItem(`launchpad-tips-${pillar.id}-${title}`);
      if (raw) { setTips(JSON.parse(raw)); setTipsStage("done"); }
      else { setTips({}); setTipsStage("idle"); }
    } catch { setTips({}); setTipsStage("idle"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, pillar.id]);

  const cycleStatus = (itemId: string) => {
    setStatuses((prev) => {
      const cur = prev[itemId] ?? "todo";
      const next: ChecklistStatus = cur === "todo" ? "progress" : cur === "progress" ? "done" : "todo";
      const updated = { ...prev, [itemId]: next };
      try { localStorage.setItem(`launchpad-status-${itemId}-${title}`, next); } catch { /* ignore */ }
      return updated;
    });
  };

  const generateTips = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!title) return;
    setTipsStage("loading");
    const painkiller      = localStorage.getItem(`painkiller-verdict-${title}`) ?? "";
    const offer           = localStorage.getItem(`mvo-defined-${title}`) ?? "";
    const patternSummary  = localStorage.getItem(`pattern-summary-${title}`) ?? "";
    const validationScore = localStorage.getItem(`experiment-validation-score-${title}`) ?? "";
    let targetCustomer = "";
    try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
    const runway        = localStorage.getItem(`finance-runway-${title}`) ?? "";
    const startupCost   = localStorage.getItem(`finance-startup_cost-${title}`) ?? "";
    const revenueTarget = localStorage.getItem(`finance-revenue_target-${title}`) ?? "";
    const fundingPath   = localStorage.getItem(`finance-funding_path-${title}`) ?? "";
    const itemList = pillar.items.map((i) => `"${i.id}": "${i.label}"`).join(", ");
    const system = `You are Sorene, a startup coach. Respond ONLY with valid JSON — a single object. No markdown, no preamble.`;
    const prompt = `Give a short, specific tip (1 sentence, max 20 words) for each checklist item for this founder.\n\nProject: "${title}"${targetCustomer ? `\nTarget customer: "${targetCustomer}"` : ""}${painkiller ? `\nPainkiller: "${painkiller}"` : ""}${offer ? `\nOffer: "${offer}"` : ""}${patternSummary ? `\nPattern: "${patternSummary.slice(0, 200)}"` : ""}${validationScore ? `\nValidation: "${validationScore}"` : ""}${runway ? `\nRunway: "${runway}"` : ""}${startupCost ? `\nStartup cost: "${startupCost}"` : ""}${revenueTarget ? `\nRevenue target: "${revenueTarget}"` : ""}${fundingPath ? `\nFunding: "${fundingPath}"` : ""}\n\nPillar: "${pillar.label}"\nItems: { ${itemList} }\n\nReturn JSON: { [itemId]: "tip string" }`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system }) });
      if (res.ok) {
        const data = await res.json();
        const match = (data?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setTips(parsed); setTipsStage("done");
          try { localStorage.setItem(`launchpad-tips-${pillar.id}-${title}`, JSON.stringify(parsed)); } catch { /* ignore */ }
        } else { setTipsStage("idle"); }
      } else { setTipsStage("idle"); }
    } catch { setTipsStage("idle"); }
  };

  const doneCount = pillar.items.filter((i) => (statuses[i.id] ?? "todo") === "done").length;
  const gradient = PILLAR_GRADIENTS[pillar.id] ?? PILLAR_GRADIENTS.legal;
  const tagline = PILLAR_TAGLINES[pillar.id] ?? "";
  const Icon = pillar.icon;

  return (
    <motion.div
      ref={cardRef}
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col group cursor-pointer"
      onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
    >
      {/* Gradient header */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col relative", isExpanded ? "p-5 pb-8" : "p-4")}
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.25)_0%,transparent_70%)] pointer-events-none" />

        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-body-small-medium mb-6 w-fit relative z-10"
            >
              <ChevronLeft size={18} />Back
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center relative z-10 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Icon size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-white">{pillar.label}</h3>
              {!isExpanded && <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide truncate">{tagline}</p>}
            </div>
          </div>
          {!isExpanded && (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 text-white text-[11px] font-medium border border-white/30 shrink-0 backdrop-blur-sm">
              Open <ArrowRight size={10} />
            </motion.div>
          )}
        </div>
      </motion.div>


      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="space-y-3">
                {pillar.items.map((item) => {
                  const status = statuses[item.id] ?? "todo";
                  const tip = tips[item.id];
                  const hasContent = pillar.id === "brand_digital" && [
                    "biz_name", "target_customers", "tagline", "benefit", "offerings", "pricing",
                    "logo", "domain", "website", "brand_color", "social",
                  ].includes(item.id);
                  const open = !!openItems[item.id];
                  return (
                    <div key={item.id}>
                      {hasContent ? (
                        <button onClick={() => toggleItem(item.id)} className="w-full flex items-center gap-3 text-left group">
                          <ChevronDown size={15} className={cn(
                            "shrink-0 transition-transform text-[#9A9A9A] group-hover:text-[#151515]",
                            !open && "-rotate-90",
                            status === "done" && "text-[#32C382]"
                          )} />
                          <span className={cn("text-[14px] transition-colors flex-1", status === "done" ? "text-[#9A9A9A]" : "text-[#151515]")}>
                            {item.label}
                          </span>
                          {status === "done" && <CheckCircle2 size={13} className="text-[#32C382] shrink-0" />}
                        </button>
                      ) : (
                        <button onClick={() => cycleStatus(item.id)} className="w-full flex items-center gap-3 text-left group">
                          <div className={cn(
                            "w-3.5 h-3.5 rounded-full shrink-0 transition-colors border",
                            status === "done"       ? "bg-[#32C382] border-[#32C382]"
                            : status === "progress" ? "bg-[#FFD43B] border-[#FFD43B]"
                            : "bg-white border-gray-300 group-hover:border-[#151515]"
                          )} />
                          <span className={cn("text-[14px] transition-colors flex-1", status === "done" ? "text-[#9A9A9A] line-through" : "text-[#151515]")}>
                            {item.label}
                          </span>
                        </button>
                      )}
                      <AnimatePresence initial={false}>
                        {hasContent && open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ height: { duration: 0.25 }, opacity: { duration: 0.2 } }}
                            className="overflow-hidden"
                          >
                            {item.id === "biz_name" && (
                              <BusinessNameSection project={project} onNameChosen={(name) => {
                                cycleStatus("biz_name");
                                onNameChosen?.(name);
                              }} />
                            )}
                            {item.id === "target_customers" && (
                              <TargetCustomersSection project={project} />
                            )}
                            {(item.id === "tagline" || item.id === "benefit" || item.id === "offerings") && (
                              <BrandTextSection type={item.id as BrandTextType} project={project} />
                            )}
                            {item.id === "pricing" && (
                              <PricingPackageSection project={project} />
                            )}
                            {item.id === "logo" && (
                              <LogoConceptSection project={project} />
                            )}
                            {(item.id === "domain" || item.id === "website") && (
                              <BrandTextSection type={item.id as BrandTextType} project={project} />
                            )}
                            {item.id === "brand_color" && (
                              <BrandColorSection project={project} />
                            )}
                            {item.id === "social" && (
                              <SocialMediaSection project={project} />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {tip && item.id !== "biz_name" && item.id !== "target_customers" && item.id !== "tagline" && item.id !== "benefit" && item.id !== "offerings" && item.id !== "pricing" && item.id !== "logo" && item.id !== "domain" && item.id !== "website" && item.id !== "brand_color" && item.id !== "social" && (
                        <p className="text-[11px] text-[#62646A] italic leading-relaxed pl-[26px] mt-1">
                          {tip}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// LaunchPadContent — main component
// ─────────────────────────────────────────────

function LaunchPadContent({ project, onNameChosen, autoOpenPillarId, onAutoOpenConsumed }: {
  project: DirectionCardData | null;
  onNameChosen?: (name: string) => void;
  autoOpenPillarId?: string;
  onAutoOpenConsumed?: () => void;
}) {
  useEffect(() => {
    if (autoOpenPillarId) {
      // Clear after one render so switching tabs doesn't re-trigger
      const t = setTimeout(() => onAutoOpenConsumed?.(), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenPillarId]);

  return (
    <div className="p-5 flex flex-col gap-4">
      {LAUNCH_PILLARS.map((pillar) => (
        <PillarCard key={pillar.id} pillar={pillar} project={project} onNameChosen={onNameChosen}
          autoOpen={autoOpenPillarId === pillar.id} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// GrowthItemCard — expandable card with AI generation + inline editing + save
// ─────────────────────────────────────────────

type GrowthStage = "idle" | "loading" | "editing" | "saved";

// Helpers to read localStorage context
function readGrowthContext(title: string) {
  const get = (k: string) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
  let targetCustomer = "";
  try { targetCustomer = JSON.parse(localStorage.getItem(`target-customers-${title}`) ?? "{}").main?.label ?? ""; } catch { /* ignore */ }
  return {
    painkiller: get(`painkiller-verdict-${title}`),
    offer: get(`mvo-defined-${title}`),
    patternSummary: get(`pattern-summary-${title}`),
    businessName: get(`business-name-${title}`),
    tagline: get(`brand-tagline-${title}`),
    benefit: get(`brand-benefit-${title}`),
    offerings: get(`brand-offerings-${title}`),
    pricing: get(`brand-pricing-${title}`),
    targetCustomer,
    revenueTarget: get(`finance-revenue_target-${title}`),
    runway: get(`finance-runway-${title}`),
    fundingPath: get(`finance-funding_path-${title}`),
  };
}

function ctxLines(ctx: ReturnType<typeof readGrowthContext>, title: string) {
  const lines: string[] = [`Project: "${title}"`];
  if (ctx.businessName) lines.push(`Business name: "${ctx.businessName}"`);
  if (ctx.targetCustomer) lines.push(`Target customer: "${ctx.targetCustomer}"`);
  if (ctx.painkiller) lines.push(`Painkiller verdict: "${ctx.painkiller}"`);
  if (ctx.offer) lines.push(`Offer: "${ctx.offer}"`);
  if (ctx.pricing) lines.push(`Pricing: "${ctx.pricing}"`);
  if (ctx.revenueTarget) lines.push(`Revenue target: "${ctx.revenueTarget}"`);
  if (ctx.runway) lines.push(`Runway: "${ctx.runway}"`);
  if (ctx.fundingPath) lines.push(`Funding path: "${ctx.fundingPath}"`);
  if (ctx.patternSummary) lines.push(`Pattern summary: "${ctx.patternSummary.slice(0, 300)}"`);
  return lines.join("\n");
}

const GROWTH_AI_SYSTEM = "You are Sorene, a startup coach. Return ONLY valid JSON — no markdown, no preamble.";

// ── Business Plan ──────────────────────────────
const BP_SECTIONS = [
  { id: "executive_summary", label: "Executive Summary" },
  { id: "problem_solution", label: "Problem & Solution" },
  { id: "target_market", label: "Target Market" },
  { id: "business_model", label: "Business Model" },
  { id: "revenue_streams", label: "Revenue Streams" },
  { id: "plan_90_day", label: "90-Day Plan" },
] as const;

function BusinessPlanCard({ title }: { title: string }) {
  const storageKey = `growth-business-plan-${title}`;
  type Sections = Record<string, string>;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<Sections>({});
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}

Generate a concise business plan. Return JSON with exactly these keys:
{
  "executive_summary": "2-3 sentences: what the business is, who it's for, what it does",
  "problem_solution": "The validated pain (2 sentences) followed by how the offer solves it (2 sentences)",
  "target_market": "Primary customer description and secondary if applicable. Include context on their situation.",
  "business_model": "How you make money — pricing model and delivery method in 1-2 sentences",
  "revenue_streams": "Specific packages or tiers with projected numbers if known. One per line.",
  "plan_90_day": "Three milestones — Month 1: [build/setup actions], Month 2: [first sales actions], Month 3: [scale actions]. Use bullet points."
}`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
    setOpenSection(null);
  };

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">AI will draft all 6 sections using your validation data — target customer, painkiller, offer, and pricing. Review and edit each section before saving.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate business plan
      </button>
    </div>
  );

  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Drafting your business plan…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {BP_SECTIONS.map((s) => (
        <div key={s.id} className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left"
          >
            <span className="text-[12px] font-semibold text-[#151515]">{s.label}</span>
            {openSection === s.id ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>
            {openSection === s.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                transition={{ duration: 0.2 }} className="overflow-hidden">
                <p className="px-3 py-3 text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap border-t border-gray-100">{data[s.id] ?? ""}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {BP_SECTIONS.map((s) => (
        <div key={s.id} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2.5 bg-[#FAFAFA] border-b border-gray-100">
            <p className="text-[12px] font-semibold text-[#151515]">{s.label}</p>
          </div>
          <textarea
            value={data[s.id] ?? ""}
            onChange={(e) => setData((prev) => ({ ...prev, [s.id]: e.target.value }))}
            rows={s.id === "plan_90_day" ? 5 : 3}
            placeholder={
              s.id === "executive_summary" ? "What the business is, who it's for, what it does…" :
              s.id === "problem_solution" ? "The pain you validated + how your offer solves it…" :
              s.id === "target_market" ? "Primary customer and secondary audience…" :
              s.id === "business_model" ? "How you make money — pricing model and delivery…" :
              s.id === "revenue_streams" ? "Packages, tiers, and projected numbers…" :
              "Month 1: build / Month 2: sell / Month 3: scale…"
            }
            className="w-full px-3 py-2.5 text-[12px] text-[#151515] leading-relaxed bg-white focus:outline-none resize-none placeholder:text-gray-300"
          />
        </div>
      ))}
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Marketing Plan ─────────────────────────────
type MktChannel = { channel: string; tactics: string[]; priority: "high" | "medium" | "low" };

function MarketingPlanCard({ title }: { title: string }) {
  const storageKey = `growth-marketing-plan-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<MktChannel[]>([]);
  const [openCh, setOpenCh] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nGenerate a marketing plan as a JSON array of channels: [{"channel":"...","tactics":["..."],"priority":"high"|"medium"|"low"}]. Return 4-6 channels most relevant to this business.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved"); setOpenCh(null);
  };

  const priorityColor = (p: string) => p === "high" ? "bg-red-100 text-red-700" : p === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-[#62646A]";

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Channel-by-channel plan with priority-ranked tactics tailored to your audience and offer.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate marketing plan
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your marketing plan…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {data.map((ch, ci) => (
        <div key={ci} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenCh(openCh === ci ? null : ci)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#151515]">{ch.channel}</span>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", priorityColor(ch.priority))}>{ch.priority}</span>
            </div>
            {openCh === ci ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>
            {openCh === ci && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-3 py-2.5 space-y-1 border-t border-gray-100">
                  {ch.tactics.map((t, ti) => <div key={ti} className="flex items-start gap-2"><span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span><p className="text-[12px] text-[#151515] leading-relaxed">{t}</p></div>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map((ch, ci) => (
        <div key={ci} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center justify-between">
            <input value={ch.channel} onChange={(e) => setData((prev) => prev.map((c, i) => i === ci ? { ...c, channel: e.target.value } : c))} className="text-[12px] font-semibold text-[#151515] bg-transparent focus:outline-none flex-1 mr-2" />
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", priorityColor(ch.priority))}>{ch.priority}</span>
            <button onClick={() => setData((prev) => prev.filter((_, i) => i !== ci))} className="ml-2 text-[#9A9A9A] hover:text-red-500 transition-colors text-[10px]">✕</button>
          </div>
          <div className="px-3 py-2.5 space-y-1.5">
            {ch.tactics.map((t, ti) => (
              <div key={ti} className="flex items-start gap-2">
                <span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span>
                <input value={t} onChange={(e) => setData((prev) => prev.map((c, i) => i === ci ? { ...c, tactics: c.tactics.map((tt, j) => j === ti ? e.target.value : tt) } : c))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
                <button onClick={() => setData((prev) => prev.map((c, i) => i === ci ? { ...c, tactics: c.tactics.filter((_, j) => j !== ti) } : c))} className="text-[#9A9A9A] hover:text-red-500 transition-colors text-[10px] shrink-0">✕</button>
              </div>
            ))}
            <button onClick={() => setData((prev) => prev.map((c, i) => i === ci ? { ...c, tactics: [...c.tactics, ""] } : c))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add tactic</button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button onClick={() => setData((prev) => [...prev, { channel: "New channel", tactics: [""], priority: "medium" }])} className="text-[11px] text-[#62646A] border border-dashed border-gray-300 rounded-full px-3 py-1.5 hover:border-[#151515] transition-colors">+ Add channel</button>
        <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
      </div>
    </div>
  );
}

// ── GTM Strategy ───────────────────────────────
type GtmMilestone = { week: string; milestone: string; actions: string[] };

function GtmStrategyCard({ title }: { title: string }) {
  const storageKey = `growth-gtm-strategy-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<GtmMilestone[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a go-to-market strategy as a JSON array: [{"week":"Week 1-2","milestone":"...","actions":["..."]}]. Return 5-6 milestone blocks covering the first 12 weeks.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const readOnly = stage === "saved";

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Week-by-week milestones covering your first 12 weeks — from setup through traction.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate GTM strategy
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Mapping your go-to-market timeline…</div>
  );

  if (readOnly) return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      <div className="relative pl-4 border-l-2 border-[#32C382]/30 space-y-3">
        {data.map((m, mi) => (
          <div key={mi} className="relative">
            <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-[#32C382] border-2 border-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#32C382] shrink-0">{m.week}</span>
                <p className="text-[12px] font-semibold text-[#151515]">{m.milestone}</p>
              </div>
              <div className="px-3 py-2 space-y-1">
                {m.actions.map((a, ai) => <div key={ai} className="flex items-start gap-2"><span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span><p className="text-[12px] text-[#151515] leading-relaxed">{a}</p></div>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative pl-4 border-l-2 border-[#32C382]/30 space-y-3">
        {data.map((m, mi) => (
          <div key={mi} className="relative">
            <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-[#32C382] border-2 border-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#32C382] shrink-0">{m.week}</span>
                <input value={m.milestone} onChange={(e) => setData((prev) => prev.map((x, i) => i === mi ? { ...x, milestone: e.target.value } : x))} className="flex-1 text-[12px] font-semibold text-[#151515] bg-transparent focus:outline-none" />
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                {m.actions.map((a, ai) => (
                  <div key={ai} className="flex items-start gap-2">
                    <span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span>
                    <input value={a} onChange={(e) => setData((prev) => prev.map((x, i) => i === mi ? { ...x, actions: x.actions.map((aa, j) => j === ai ? e.target.value : aa) } : x))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
                    <button onClick={() => setData((prev) => prev.map((x, i) => i === mi ? { ...x, actions: x.actions.filter((_, j) => j !== ai) } : x))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
                  </div>
                ))}
                <button onClick={() => setData((prev) => prev.map((x, i) => i === mi ? { ...x, actions: [...x.actions, ""] } : x))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add action</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Sales Playbook ─────────────────────────────
type SalesPlaybook = { opener: string; pitch: string; objections: { objection: string; response: string }[] };

function SalesPlaybookCard({ title }: { title: string }) {
  const storageKey = `growth-sales-playbook-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<SalesPlaybook>({ opener: "", pitch: "", objections: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a sales playbook. Return JSON: {"opener":"...","pitch":"...","objections":[{"objection":"...","response":"..."}]}. Include 3-5 common objections.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openSP, setOpenSP] = useState<string | null>(null);
  const readOnly = stage === "saved";

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Your sales opener, pitch, and objection-handling scripts based on your validated offer and target customer.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate sales playbook
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Writing your sales playbook…</div>
  );

  if (readOnly) return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {[{ key: "opener", label: "Opener" }, { key: "pitch", label: "Pitch" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenSP(openSP === key ? null : key)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] font-semibold text-[#151515]">{label}</span>
            {openSP === key ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openSP === key && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><p className="px-3 py-3 text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap border-t border-gray-100">{data[key as "opener" | "pitch"]}</p></motion.div>}</AnimatePresence>
        </div>
      ))}
      <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-widest mt-3">Objection Handler</p>
      {data.objections.map((obj, oi) => (
        <div key={oi} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenSP(openSP === `obj-${oi}` ? null : `obj-${oi}`)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] text-[#151515]">{obj.objection}</span>
            {openSP === `obj-${oi}` ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openSP === `obj-${oi}` && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><p className="px-3 py-3 text-[12px] text-[#32C382] leading-relaxed border-t border-gray-100">{obj.response}</p></motion.div>}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {[{ key: "opener", label: "Opener" }, { key: "pitch", label: "Pitch" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100"><p className="text-[12px] font-semibold text-[#151515]">{label}</p></div>
          <textarea value={data[key as "opener" | "pitch"]} onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))} rows={3} placeholder={key === "opener" ? "How you start the conversation…" : "Your 30-second pitch…"} className="w-full px-3 py-2.5 text-[12px] text-[#151515] bg-white focus:outline-none resize-none placeholder:text-gray-300" />
        </div>
      ))}
      <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-widest mt-1">Objection Handler</p>
      {data.objections.map((obj, oi) => (
        <div key={oi} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-red-400 shrink-0">Objection</span>
            <input value={obj.objection} onChange={(e) => setData((prev) => ({ ...prev, objections: prev.objections.map((o, i) => i === oi ? { ...o, objection: e.target.value } : o) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" placeholder="What they say…" />
            <button onClick={() => setData((prev) => ({ ...prev, objections: prev.objections.filter((_, i) => i !== oi) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
          </div>
          <div className="px-3 py-2 flex items-start gap-2">
            <span className="text-[10px] font-semibold text-[#32C382] shrink-0 mt-0.5">Response</span>
            <textarea value={obj.response} onChange={(e) => setData((prev) => ({ ...prev, objections: prev.objections.map((o, i) => i === oi ? { ...o, response: e.target.value } : o) }))} rows={2} className="flex-1 text-[12px] text-[#151515] bg-white focus:outline-none resize-none" placeholder="How you respond…" />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button onClick={() => setData((prev) => ({ ...prev, objections: [...prev.objections, { objection: "", response: "" }] }))} className="text-[11px] text-[#62646A] border border-dashed border-gray-300 rounded-full px-3 py-1.5 hover:border-[#151515] transition-colors">+ Add objection</button>
        <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
      </div>
    </div>
  );
}

// ── Financial Model ────────────────────────────
const FM_DEFAULT_ROWS = [
  { label: "Revenue", m1: "", m3: "", m6: "", m12: "" },
  { label: "Costs", m1: "", m3: "", m6: "", m12: "" },
  { label: "Gross Profit", m1: "", m3: "", m6: "", m12: "" },
  { label: "Runway (months)", m1: "", m3: "", m6: "", m12: "" },
];

type FmRow = { label: string; m1: string; m3: string; m6: string; m12: string };

function FinancialModelCard({ title }: { title: string }) {
  const storageKey = `growth-financial-model-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [rows, setRows] = useState<FmRow[]>(FM_DEFAULT_ROWS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { const parsed = JSON.parse(raw); setRows(parsed.rows ?? FM_DEFAULT_ROWS); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nGenerate realistic financial projections. Return JSON: {"rows":[{"label":"Revenue","m1":"$X","m3":"$X","m6":"$X","m12":"$X"},{"label":"Costs","m1":"$X","m3":"$X","m6":"$X","m12":"$X"},{"label":"Gross Profit","m1":"$X","m3":"$X","m6":"$X","m12":"$X"},{"label":"Runway (months)","m1":"X","m3":"X","m6":"X","m12":"X"}]}. Use realistic figures based on context.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { const parsed = JSON.parse(match[0]); setRows(parsed.rows ?? FM_DEFAULT_ROWS); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("editing"); // fall back to blank editing
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify({ rows })); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openFM, setOpenFM] = useState<string | null>(null);
  const colHdr = ["", "Month 1", "Month 3", "Month 6", "Month 12"];
  const colKeys: (keyof FmRow)[] = ["label", "m1", "m3", "m6", "m12"];

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Editable revenue, cost, and runway projections across 1, 3, 6, and 12-month horizons.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate financial model
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your financial projections…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenFM(openFM === row.label ? null : row.label)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] font-semibold text-[#151515]">{row.label}</span>
            {openFM === row.label ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openFM === row.label && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="grid grid-cols-4 gap-0 border-t border-gray-100">
                {(["m1", "m3", "m6", "m12"] as const).map((k, i) => (
                  <div key={k} className={cn("px-3 py-2.5 text-center", i < 3 && "border-r border-gray-100")}>
                    <p className="text-[10px] text-[#9A9A9A] mb-1">{["Mo 1","Mo 3","Mo 6","Mo 12"][i]}</p>
                    <p className="text-[12px] font-semibold text-[#151515]">{row[k] || "—"}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[#ECEDEE]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#ECEDEE]">
              {colHdr.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[#151515] whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-[#ECEDEE] last:border-0">
                {colKeys.map((col, ci) => (
                  <td key={ci} className={cn("px-3 py-2", col === "label" ? "font-semibold text-[#151515] bg-[#FAFAFA] border-r border-[#ECEDEE]" : "text-[#151515]")}>
                    {col === "label"
                      ? <span>{row[col]}</span>
                      : <input value={row[col]} onChange={(e) => setRows((prev) => prev.map((r, i) => i === ri ? { ...r, [col]: e.target.value } : r))} className="w-full bg-transparent focus:outline-none min-w-[60px]" placeholder="$0" />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Growth Metrics ─────────────────────────────
type GrowthMetrics = { northStar: string; supporting: string[] };

function GrowthMetricsCard({ title }: { title: string }) {
  const storageKey = `growth-metrics-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<GrowthMetrics>({ northStar: "", supporting: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nSuggest the most important growth metrics. Return JSON: {"northStar":"the single most important metric","supporting":["metric1","metric2","metric3","metric4","metric5"]}`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Your single most important metric and the supporting KPIs that tell you if you're on track.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate growth metrics
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Identifying your North Star metric…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      <div className="rounded-xl border-2 border-[#32C382] bg-[#F5FFD9] px-3 py-3">
        <p className="text-[10px] font-semibold text-[#32C382] uppercase tracking-wide mb-1">North Star Metric</p>
        <p className="text-[14px] font-semibold text-[#151515]">{data.northStar}</p>
      </div>
      <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-widest mt-2">Supporting Metrics</p>
      {data.supporting.map((m, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-[#62646A] flex items-center justify-center shrink-0">{i + 1}</span>
          <p className="text-[12px] text-[#151515] flex-1">{m}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-[#32C382] bg-[#F5FFD9] overflow-hidden">
        <div className="px-3 py-2 border-b border-[#32C382]/30">
          <p className="text-[10px] font-semibold text-[#32C382] uppercase tracking-wide">North Star Metric</p>
        </div>
        <div className="px-3 py-3">
          <input value={data.northStar} onChange={(e) => setData((prev) => ({ ...prev, northStar: e.target.value }))} className="w-full text-[14px] font-semibold text-[#151515] bg-transparent focus:outline-none" placeholder="e.g. Weekly active users" />
        </div>
      </div>
      <p className="text-[11px] font-semibold text-[#62646A] uppercase tracking-wide">Supporting Metrics</p>
      <div className="space-y-2">
        {data.supporting.map((m, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-[#ECEDEE] px-3 py-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-[#62646A] flex items-center justify-center shrink-0">{i + 1}</span>
            <input value={m} onChange={(e) => setData((prev) => ({ ...prev, supporting: prev.supporting.map((s, j) => j === i ? e.target.value : s) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
            <button onClick={() => setData((prev) => ({ ...prev, supporting: prev.supporting.filter((_, j) => j !== i) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
          </div>
        ))}
        {data.supporting.length < 5 && (
          <button onClick={() => setData((prev) => ({ ...prev, supporting: [...prev.supporting, ""] }))} className="text-[11px] text-[#62646A] hover:text-[#151515] border border-dashed border-gray-300 rounded-xl px-3 py-1.5 w-full text-left hover:border-[#151515] transition-colors">+ Add supporting metric</button>
        )}
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Pitch Deck ─────────────────────────────────
type PitchSlide = { slide: string; bullets: string[] };

function PitchDeckCard({ title }: { title: string }) {
  const storageKey = `growth-pitch-deck-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [slides, setSlides] = useState<PitchSlide[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setSlides(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a pitch deck outline with ~10 slides. Return JSON array: [{"slide":"Problem","bullets":["...","..."]},{"slide":"Solution","bullets":["...","..."]},{"slide":"Market","bullets":["..."]},{"slide":"Product","bullets":["..."]},{"slide":"Traction","bullets":["..."]},{"slide":"Business Model","bullets":["..."]},{"slide":"Team","bullets":["..."]},{"slide":"Ask","bullets":["..."]}]`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\[[\s\S]*\]/);
        if (match) { setSlides(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(slides)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openPD, setOpenPD] = useState<number | null>(null);

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">A 10-slide pitch deck outline with AI-written bullets for each slide, ready to take into Canva or Figma.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate pitch deck
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your pitch deck outline…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {slides.map((sl, si) => (
        <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenPD(openPD === si ? null : si)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="w-5 h-5 rounded-full bg-[#151515] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{si + 1}</span>
            <span className="text-[12px] font-semibold text-[#151515] flex-1">{sl.slide}</span>
            {openPD === si ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openPD === si && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3 py-2.5 space-y-1.5 border-t border-gray-100">
                {sl.bullets.map((b, bi) => (
                  <div key={bi} className="flex items-start gap-2">
                    <span className="text-[#32C382] text-[10px] mt-1 shrink-0">•</span>
                    <p className="text-[12px] text-[#151515] leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {slides.map((sl, si) => (
          <div key={si} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
            <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#151515] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{si + 1}</span>
              <input value={sl.slide} onChange={(e) => setSlides((prev) => prev.map((s, i) => i === si ? { ...s, slide: e.target.value } : s))} className="flex-1 text-[12px] font-semibold text-[#151515] bg-transparent focus:outline-none" />
            </div>
            <div className="px-3 py-2.5 space-y-1.5">
              {sl.bullets.map((b, bi) => (
                <div key={bi} className="flex items-start gap-2">
                  <span className="text-[#32C382] text-[10px] mt-1 shrink-0">•</span>
                  <input value={b} onChange={(e) => setSlides((prev) => prev.map((s, i) => i === si ? { ...s, bullets: s.bullets.map((bb, j) => j === bi ? e.target.value : bb) } : s))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
                  <button onClick={() => setSlides((prev) => prev.map((s, i) => i === si ? { ...s, bullets: s.bullets.filter((_, j) => j !== bi) } : s))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => setSlides((prev) => prev.map((s, i) => i === si ? { ...s, bullets: [...s.bullets, ""] } : s))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add bullet</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Retention Playbook ─────────────────────────
type RetentionPlaybook = { onboarding_steps: string[]; check_in_triggers: string[]; churn_signals: string[]; win_back: string };

function RetentionPlaybookCard({ title }: { title: string }) {
  const storageKey = `growth-retention-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<RetentionPlaybook>({ onboarding_steps: [], check_in_triggers: [], churn_signals: [], win_back: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a customer retention and churn prevention playbook. Return JSON: {"onboarding_steps":["..."],"check_in_triggers":["..."],"churn_signals":["..."],"win_back":"..."}. Include 4-5 items per list.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openRP, setOpenRP] = useState<string | null>(null);

  const listSections: { key: keyof RetentionPlaybook; label: string }[] = [
    { key: "onboarding_steps", label: "Onboarding Steps" },
    { key: "check_in_triggers", label: "Check-in Triggers" },
    { key: "churn_signals", label: "Churn Signals" },
  ];

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Onboarding steps, check-in triggers, churn signals, and win-back tactics to keep customers longer.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate retention playbook
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your retention playbook…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {[...listSections, { key: "win_back" as keyof RetentionPlaybook, label: "Win-Back Strategy" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenRP(openRP === key ? null : key)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] font-semibold text-[#151515]">{label}</span>
            {openRP === key ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openRP === key && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3 py-3 border-t border-gray-100 space-y-1.5">
                {Array.isArray(data[key])
                  ? (data[key] as string[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span><p className="text-[12px] text-[#151515] leading-relaxed">{item}</p></div>
                  ))
                  : <p className="text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap">{data[key] as string}</p>
                }
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {listSections.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">{label}</p></div>
          <div className="px-3 py-2.5 space-y-1.5">
            {(data[key] as string[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span>
                <input value={item} onChange={(e) => setData((prev) => ({ ...prev, [key]: (prev[key] as string[]).map((s, j) => j === i ? e.target.value : s) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
                <button onClick={() => setData((prev) => ({ ...prev, [key]: (prev[key] as string[]).filter((_, j) => j !== i) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
              </div>
            ))}
            <button onClick={() => setData((prev) => ({ ...prev, [key]: [...(prev[key] as string[]), ""] }))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add item</button>
          </div>
        </div>
      ))}
      <div className="rounded-xl border border-[#ECEDEE] overflow-hidden">
        <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">Win-Back Strategy</p></div>
        <textarea value={data.win_back} onChange={(e) => setData((prev) => ({ ...prev, win_back: e.target.value }))} rows={3} className="w-full px-3 py-2.5 text-[12px] text-[#151515] bg-white focus:outline-none resize-y" />
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Referral Strategy ──────────────────────────
type ReferralStrategy = { referral_program: string; partner_types: string[]; outreach_script: string; incentive: string };

function ReferralStrategyCard({ title }: { title: string }) {
  const storageKey = `growth-referral-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<ReferralStrategy>({ referral_program: "", partner_types: [], outreach_script: "", incentive: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a referral and partnerships strategy. Return JSON: {"referral_program":"...","partner_types":["..."],"outreach_script":"...","incentive":"..."}. Include 3-5 partner types.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openRS, setOpenRS] = useState<string | null>(null);

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Referral program design, partner types to target, and an outreach script to start conversations.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate referral strategy
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your referral strategy…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {[
        { key: "referral_program", label: "Referral Program" },
        { key: "partner_types", label: "Partner Types" },
        { key: "outreach_script", label: "Outreach Script" },
        { key: "incentive", label: "Incentive / Reward" },
      ].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenRS(openRS === key ? null : key)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] font-semibold text-[#151515]">{label}</span>
            {openRS === key ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openRS === key && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3 py-3 border-t border-gray-100 space-y-1.5">
                {Array.isArray(data[key as keyof ReferralStrategy])
                  ? (data[key as keyof ReferralStrategy] as string[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span><p className="text-[12px] text-[#151515] leading-relaxed">{item}</p></div>
                  ))
                  : <p className="text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap">{data[key as keyof ReferralStrategy] as string}</p>
                }
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {[{ key: "referral_program" as const, label: "Referral Program" }, { key: "outreach_script" as const, label: "Outreach Script" }, { key: "incentive" as const, label: "Incentive / Reward" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">{label}</p></div>
          <textarea value={data[key]} onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))} rows={3} className="w-full px-3 py-2.5 text-[12px] text-[#151515] bg-white focus:outline-none resize-y" />
        </div>
      ))}
      <div className="rounded-xl border border-[#ECEDEE] overflow-hidden">
        <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">Partner Types</p></div>
        <div className="px-3 py-2.5 space-y-1.5">
          {data.partner_types.map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span>
              <input value={pt} onChange={(e) => setData((prev) => ({ ...prev, partner_types: prev.partner_types.map((s, j) => j === i ? e.target.value : s) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
              <button onClick={() => setData((prev) => ({ ...prev, partner_types: prev.partner_types.filter((_, j) => j !== i) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
            </div>
          ))}
          <button onClick={() => setData((prev) => ({ ...prev, partner_types: [...prev.partner_types, ""] }))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add partner type</button>
        </div>
      </div>
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Content & SEO Plan ─────────────────────────
type ContentSeo = { keywords: string[]; content_types: string[]; posting_cadence: string; first_5_posts: string[] };

function ContentSeoCard({ title }: { title: string }) {
  const storageKey = `growth-content-seo-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<ContentSeo>({ keywords: [], content_types: [], posting_cadence: "", first_5_posts: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a content and SEO plan. Return JSON: {"keywords":["..."],"content_types":["..."],"posting_cadence":"...","first_5_posts":["..."]}. Include 5-8 keywords, 3-5 content types, and 5 post ideas.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openCS, setOpenCS] = useState<string | null>(null);

  const listSections2: { key: keyof ContentSeo; label: string }[] = [
    { key: "keywords", label: "Target Keywords" },
    { key: "content_types", label: "Content Types" },
    { key: "first_5_posts", label: "First 5 Post Ideas" },
  ];

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">Keywords, content types, posting cadence, and your first 5 content ideas to build organic reach.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate content & SEO plan
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Building your content & SEO plan…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {[{ key: "posting_cadence", label: "Posting Cadence" }, ...listSections2].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenCS(openCS === key ? null : key)} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="text-[12px] font-semibold text-[#151515]">{label}</span>
            {openCS === key ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openCS === key && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3 py-3 border-t border-gray-100 space-y-1.5">
                {Array.isArray(data[key as keyof ContentSeo])
                  ? (data[key as keyof ContentSeo] as string[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span><p className="text-[12px] text-[#151515] leading-relaxed">{item}</p></div>
                  ))
                  : <p className="text-[12px] text-[#151515] leading-relaxed">{data[key as keyof ContentSeo] as string}</p>
                }
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#ECEDEE] overflow-hidden">
        <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">Posting Cadence</p></div>
        <input value={data.posting_cadence} onChange={(e) => setData((prev) => ({ ...prev, posting_cadence: e.target.value }))} className="w-full px-3 py-2.5 text-[12px] text-[#151515] bg-white focus:outline-none" placeholder="e.g. 3x per week" />
      </div>
      {listSections2.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">{label}</p></div>
          <div className="px-3 py-2.5 space-y-1.5">
            {(data[key] as string[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#32C382] text-[10px] mt-1 shrink-0">▸</span>
                <input value={item} onChange={(e) => setData((prev) => ({ ...prev, [key]: (prev[key] as string[]).map((s, j) => j === i ? e.target.value : s) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
                <button onClick={() => setData((prev) => ({ ...prev, [key]: (prev[key] as string[]).filter((_, j) => j !== i) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
              </div>
            ))}
            <button onClick={() => setData((prev) => ({ ...prev, [key]: [...(prev[key] as string[]), ""] }))} className="text-[11px] text-[#32C382] hover:underline mt-1">+ Add item</button>
          </div>
        </div>
      ))}
      <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
    </div>
  );
}

// ── Hiring Plan ────────────────────────────────
type HiringRole = { role: string; when: string; why: string };
type HiringPlan = { first_hire: string; timeline: string; roles: HiringRole[] };

function HiringPlanCard({ title }: { title: string }) {
  const storageKey = `growth-hiring-${title}`;
  const [stage, setStage] = useState<GrowthStage>("idle");
  const [data, setData] = useState<HiringPlan>({ first_hire: "", timeline: "", roles: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setData(JSON.parse(raw)); setStage("saved"); }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const generate = async () => {
    setStage("loading");
    const ctx = readGrowthContext(title);
    const prompt = `${ctxLines(ctx, title)}\n\nCreate a hiring plan. Return JSON: {"first_hire":"...","timeline":"...","roles":[{"role":"...","when":"...","why":"..."}]}. Include 3-5 roles in order of priority.`;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: GROWTH_AI_SYSTEM }) });
      if (res.ok) {
        const d = await res.json();
        const match = (d?.reply ?? "").trim().match(/\{[\s\S]*\}/);
        if (match) { setData(JSON.parse(match[0])); setStage("editing"); return; }
      }
    } catch { /* ignore */ }
    setStage("idle");
  };

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    setStage("saved");
  };

  const [openHP, setOpenHP] = useState<number | null>(null);

  if (stage === "idle") return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#62646A] leading-relaxed">When to hire, which roles come first, and the rationale for each based on your stage and offer.</p>
      <button onClick={generate} disabled={!title} className="flex items-center gap-1.5 text-[11px] font-medium text-[#32C382] border border-[#32C382]/40 px-3 py-1.5 rounded-full hover:bg-[#F5FFD9] transition-colors disabled:opacity-30">
        <img src="/figmaAssets/starfour.svg" className="w-2.5 h-2.5" alt="" /> Generate hiring plan
      </button>
    </div>
  );
  if (stage === "loading") return (
    <div className="flex items-center gap-2 py-2 text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin" /> Planning your hiring roadmap…</div>
  );

  if (stage === "saved") return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={13} className="text-[#32C382]" />
        <span className="text-[12px] font-medium text-[#32C382]">Saved</span>
        <button onClick={() => setStage("editing")} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors ml-auto">Edit</button>
      </div>
      {[{ key: "first_hire" as const, label: "First Hire" }, { key: "timeline" as const, label: "Hiring Timeline" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-gray-100"><p className="text-[11px] font-semibold text-[#151515]">{label}</p></div>
          <p className="px-3 py-2.5 text-[12px] text-[#151515] leading-relaxed">{data[key]}</p>
        </div>
      ))}
      <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-widest mt-2">Roles Roadmap</p>
      {data.roles.map((role, ri) => (
        <div key={ri} className="rounded-xl border border-gray-100 overflow-hidden">
          <button onClick={() => setOpenHP(openHP === ri ? null : ri)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#FAFAFA] hover:bg-gray-100 transition-colors text-left">
            <span className="w-5 h-5 rounded-full bg-[#151515] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{ri + 1}</span>
            <span className="text-[12px] font-semibold text-[#151515] flex-1">{role.role}</span>
            {openHP === ri ? <ChevronUp size={13} className="text-[#9A9A9A]" /> : <ChevronDown size={13} className="text-[#9A9A9A]" />}
          </button>
          <AnimatePresence initial={false}>{openHP === ri && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3 py-3 border-t border-gray-100 space-y-2">
                {[{ k: "when" as const, l: "When" }, { k: "why" as const, l: "Why" }].map(({ k, l }) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-[10px] font-semibold text-[#9A9A9A] shrink-0 w-8 mt-0.5">{l}</span>
                    <p className="text-[12px] text-[#151515] leading-relaxed">{role[k]}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {[{ key: "first_hire" as const, label: "First Hire" }, { key: "timeline" as const, label: "Hiring Timeline" }].map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE]"><p className="text-[11px] font-semibold text-[#151515]">{label}</p></div>
          <input value={data[key]} onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full px-3 py-2.5 text-[12px] text-[#151515] bg-white focus:outline-none" />
        </div>
      ))}
      <p className="text-[11px] font-semibold text-[#62646A] uppercase tracking-wide mt-2">Roles Roadmap</p>
      {data.roles.map((role, ri) => (
        <div key={ri} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
          <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#ECEDEE] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#151515] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{ri + 1}</span>
            <input value={role.role} onChange={(e) => setData((prev) => ({ ...prev, roles: prev.roles.map((r, i) => i === ri ? { ...r, role: e.target.value } : r) }))} className="flex-1 text-[12px] font-semibold text-[#151515] bg-transparent focus:outline-none" placeholder="Role title" />
            <button onClick={() => setData((prev) => ({ ...prev, roles: prev.roles.filter((_, i) => i !== ri) }))} className="text-[#9A9A9A] hover:text-red-500 text-[10px] shrink-0">✕</button>
          </div>
          <div className="px-3 py-2.5 space-y-1.5">
            {[{ key: "when" as const, label: "When" }, { key: "why" as const, label: "Why" }].map(({ key: rk, label: rl }) => (
              <div key={rk} className="flex items-start gap-2">
                <span className="text-[10px] font-semibold text-[#9A9A9A] shrink-0 w-8 mt-0.5">{rl}</span>
                <input value={role[rk]} onChange={(e) => setData((prev) => ({ ...prev, roles: prev.roles.map((r, i) => i === ri ? { ...r, [rk]: e.target.value } : r) }))} className="flex-1 text-[12px] text-[#151515] bg-transparent focus:outline-none" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button onClick={() => setData((prev) => ({ ...prev, roles: [...prev.roles, { role: "", when: "", why: "" }] }))} className="text-[11px] text-[#62646A] hover:text-[#151515] border border-dashed border-gray-300 rounded-xl px-3 py-1.5 hover:border-[#151515] transition-colors">+ Add role</button>
        <button onClick={save} className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors">Save</button>
      </div>
    </div>
  );
}

// ── GrowthItemCard — expandable row ────────────
const GROWTH_ITEM_META: Record<string, { gradient: string; tagline: string; description: string }> = {
  business_plan:      { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #6366F1 35%, #8B5CF6 100%)", tagline: "Strategy · Vision", description: "A concise plan covering your market, business model, revenue streams, and 90-day execution roadmap." },
  marketing_plan:     { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #F38744 35%, #EF4444 100%)", tagline: "Channels · Tactics", description: "Channel-by-channel marketing plan with priority tactics tailored to your audience and offer." },
  gtm_strategy:       { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #06B6D4 35%, #3B82F6 100%)", tagline: "Launch · Timeline", description: "Week-by-week go-to-market milestones to take your product from built to gaining traction." },
  sales_playbook:     { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #10B981 35%, #059669 100%)", tagline: "Script · Objections", description: "Your sales opener, pitch, and objection-handling scripts based on your validated offer." },
  financial_model:    { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #F59E0B 35%, #D97706 100%)", tagline: "Revenue · Runway", description: "Editable revenue, cost, and runway projections across 1, 3, 6, and 12-month horizons." },
  growth_metrics:     { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #A3E635 35%, #16B364 100%)", tagline: "North Star · KPIs", description: "Your single most important metric and the supporting KPIs that tell you if you're on track." },
  retention_playbook: { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #EC4899 35%, #8B5CF6 100%)", tagline: "Onboarding · Churn", description: "Onboarding steps, check-in triggers, churn signals, and win-back tactics to keep customers longer." },
  referral_strategy:  { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #F59E0B 35%, #EF4444 100%)", tagline: "Referrals · Partners", description: "Referral program design, partner types to target, and an outreach script to start conversations." },
  content_seo:        { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #06B6D4 35%, #10B981 100%)", tagline: "Content · SEO", description: "Keywords, content types, posting cadence, and your first 5 content ideas to build organic reach." },
  pitch_deck:         { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #0A0A0A 35%, #374151 100%)", tagline: "Slides · Story", description: "A 10-slide pitch deck outline with AI-written bullets for each slide, ready to take into Canva or Figma." },
  hiring_plan:        { gradient: "radial-gradient(140% 260% at 0% 0%, #0A0A0A 26%, rgba(0,0,0,0) 81%), linear-gradient(114deg, #6366F1 35%, #EC4899 100%)", tagline: "First hires · Roles", description: "When to hire, which roles come first, and the rationale for each based on your stage and offer." },
};

function GrowthItemCard({ id, label, project }: { id: string; label: string; project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const meta = GROWTH_ITEM_META[id] ?? { gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)", tagline: "", description: "" };

  useEffect(() => {
    try {
      const keyFn = GROWTH_STORAGE_KEYS[id];
      if (keyFn && title) setHasSaved(!!localStorage.getItem(keyFn(title)));
    } catch { /* ignore */ }
  }, [id, title]);

  const renderContent = () => {
    if (id === "business_plan") return <BusinessPlanCard title={title} />;
    if (id === "marketing_plan") return <MarketingPlanCard title={title} />;
    if (id === "gtm_strategy") return <GtmStrategyCard title={title} />;
    if (id === "sales_playbook") return <SalesPlaybookCard title={title} />;
    if (id === "financial_model") return <FinancialModelCard title={title} />;
    if (id === "growth_metrics") return <GrowthMetricsCard title={title} />;
    if (id === "pitch_deck") return <PitchDeckCard title={title} />;
    if (id === "retention_playbook") return <RetentionPlaybookCard title={title} />;
    if (id === "referral_strategy") return <ReferralStrategyCard title={title} />;
    if (id === "content_seo") return <ContentSeoCard title={title} />;
    if (id === "hiring_plan") return <HiringPlanCard title={title} />;
    return null;
  };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[28px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col cursor-pointer"
      onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
    >
      {/* Gradient header */}
      <motion.div layout transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col relative", isExpanded ? "p-5 pb-8" : "p-5")}
        style={{ background: meta.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.2)_0%,transparent_70%)] pointer-events-none" />
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-[12px] font-medium mb-5 w-fit relative z-10"
            >
              <ChevronLeft size={16} /> Back
            </motion.button>
          )}
        </AnimatePresence>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-[14px] font-semibold text-white leading-snug">{label}</h3>
            {!isExpanded && <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide mt-0.5">{meta.tagline}</p>}
          </div>
          {!isExpanded && (
            <div className="flex items-center gap-1.5 shrink-0">
              {hasSaved && <CheckCircle2 size={13} className="text-white/80" />}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 text-white text-[12px] font-medium border border-white/30 backdrop-blur-sm">
                Open <ArrowRight size={12} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Collapsed description */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout="position"
            className="px-5 py-4">
            <p className="text-[12px] text-[#62646A] leading-relaxed">{meta.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">{renderContent()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// GrowthContent — top-level Growth tab (full width)
// ─────────────────────────────────────────────

function GrowthContent({ project }: { project: DirectionCardData | null }) {
  const pillar = GROWTH_PILLAR;
  const itemsMap = Object.fromEntries(pillar.items.map((i) => [i.id, i.label]));
  return (
    <div className="p-5 space-y-6">
      {GROWTH_CLUSTERS.map((cluster) => (
        <section key={cluster.label}>
          <div className="flex items-baseline gap-3 mb-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#151515]">{cluster.label}</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {cluster.ids.map((itemId) => {
              const label = itemsMap[itemId];
              if (!label) return null;
              return <GrowthItemCard key={itemId} id={itemId} label={label} project={project} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Agents — all tiers, DNA/Direction card design
// ─────────────────────────────────────────────

interface AgentDef {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  whatItDoes: string[];
  output: string;
}

const AGENT_TIERS: { tier: string; label: string; blurb: string; agents: AgentDef[] }[] = [
  {
    tier: "tier1",
    label: "Build first",
    blurb: "The core loop — find who to talk to, reach them, build an audience.",
    agents: [
      {
        id: "customer_research",
        icon: Search,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #A3E635 34.62%, #16B364 100%)`,
        name: "Customer Research Agent",
        tagline: "Validation · Interviews",
        description: "Finds and qualifies your target customers, drafts interview scripts, and synthesizes patterns from the conversations you log.",
        tags: ["Live now", "Find customers", "Interview scripts", "Pattern synthesis"],
        whatItDoes: [
          "Identifies and ranks your ideal customer segments",
          "Drafts tailored interview questions and outreach to recruit them",
          "Reads your logged conversations and surfaces recurring pains",
          "Delivers a painkiller verdict and who to talk to next",
        ],
        output: "Ranked pains, painkiller verdict, next interview targets",
      },
      {
        id: "outreach",
        icon: Mail,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #F38744 34.62%, #EF4444 100%)`,
        name: "Outreach Agent",
        tagline: "Distribution · Pipeline",
        description: "Writes and personalises cold DMs and emails to prospects, partners, and early users, then tracks replies and suggests follow-ups.",
        tags: ["Live now", "Cold DMs", "Personalisation", "Follow-ups"],
        whatItDoes: [
          "Drafts personalised messages from your offer and a prospect's context",
          "Suggests channels and the best time to reach out",
          "Tracks replies in a simple pipeline view",
          "Recommends follow-up timing and copy",
        ],
        output: "Ready-to-send messages + a lightweight pipeline",
      },
      {
        id: "content_social",
        icon: MessageCircle,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #818CF8 34.62%, #6366F1 100%)`,
        name: "Content & Social Agent",
        tagline: "Build-in-public · Inbound",
        description: "Turns your founder journey into Threads posts — generates options in your voice, you review and post with one click.",
        tags: ["Live now", "Threads", "Generate & post"],
        whatItDoes: [
          "Generates post ideas from your journey, wins, and customer insights",
          "Adapts each idea to the norms of X, Threads, and LinkedIn",
          "Builds a weekly content calendar in your brand voice",
          "Keeps a backlog so you never start from a blank page",
        ],
        output: "Channel-ready posts + a weekly calendar",
      },
    ],
  },
  {
    tier: "tier2",
    label: "Strong follow-ups",
    blurb: "Sharpen your offer and convert the attention you're building.",
    agents: [
      {
        id: "market_intel",
        icon: BarChart3,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #38BDF8 34.62%, #0284C7 100%)`,
        name: "Competitor & Market Intelligence Agent",
        tagline: "Signals · Alerts",
        description: "Monitors competitors, pricing changes, and market signals, then alerts you to threats and opportunities as they emerge.",
        tags: ["Competitor watch", "Pricing signals", "Alerts"],
        whatItDoes: [
          "Tracks named competitors and their public moves",
          "Flags pricing, positioning, and launch changes",
          "Surfaces emerging opportunities in your space",
          "Sends a digest so you stay aware without the busywork",
        ],
        output: "Competitor digest + opportunity/threat alerts",
      },
      {
        id: "offer_pricing",
        icon: DollarSign,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #FCD34D 34.62%, #F59E0B 100%)`,
        name: "Offer & Pricing Agent",
        tagline: "Packaging · Willingness to pay",
        description: "Stress-tests your pricing, suggests packages and tiers, and frames 'would you pay?' tests so you price with evidence, not guesswork.",
        tags: ["Packages", "Tiers", "Pricing tests"],
        whatItDoes: [
          "Proposes package and tier structures for your offer",
          "Stress-tests price points against your target customer",
          "Frames willingness-to-pay questions for interviews",
          "Recommends a launch price with rationale",
        ],
        output: "Pricing options + tiers + a recommended launch price",
      },
      {
        id: "lead_crm",
        icon: Users,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #F472B6 34.62%, #DB2777 100%)`,
        name: "Lead Qualification & CRM Agent",
        tagline: "Inbound · Prioritisation",
        description: "Watches inbound from your connected channels, scores leads, logs them, and tells you exactly who to prioritise next.",
        tags: ["Lead scoring", "Auto-logging", "Prioritisation"],
        whatItDoes: [
          "Captures inbound from WhatsApp, Telegram, and forms",
          "Scores each lead against your ideal customer profile",
          "Logs and organises contacts automatically",
          "Tells you who to follow up with first",
        ],
        output: "Scored, organised lead list with next actions",
      },
      {
        id: "coach",
        icon: CheckCircle2,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #4ADE80 34.62%, #16A34A 100%)`,
        name: "Accountability & Coach Agent",
        tagline: "Check-ins · Nudges",
        description: "Runs daily and weekly check-ins through your connected channels, nudges stalled tasks across Launchpad and Growth, and celebrates wins.",
        tags: ["Check-ins", "Nudges", "Momentum"],
        whatItDoes: [
          "Sends scheduled check-ins via WhatsApp or Telegram",
          "Spots stalled tasks across your Hub and nudges you",
          "Helps you set the week's focus and review it",
          "Celebrates milestones to keep momentum",
        ],
        output: "Regular check-ins + proactive nudges on stalled work",
      },
    ],
  },
  {
    tier: "tier3",
    label: "As you scale",
    blurb: "Operational leverage once you have traction.",
    agents: [
      {
        id: "finance_runway",
        icon: DollarSign,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #34D399 34.62%, #059669 100%)`,
        name: "Finance & Runway Agent",
        tagline: "Burn · Runway",
        description: "Tracks your burn, runway, and revenue targets, and flags the moment you need to act — before it becomes urgent.",
        tags: ["Burn tracking", "Runway", "Targets"],
        whatItDoes: [
          "Tracks spend, revenue, and runway month over month",
          "Compares progress to your revenue targets",
          "Flags when runway gets short enough to act",
          "Surfaces cost and pricing levers to extend runway",
        ],
        output: "Live runway view + act-now alerts",
      },
      {
        id: "hiring",
        icon: User,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #A78BFA 34.62%, #7C3AED 100%)`,
        name: "Hiring Agent",
        tagline: "First hire · Screening",
        description: "Drafts job descriptions, screens applicants, and helps you plan and sequence your first hire so you bring on the right person at the right time.",
        tags: ["Job specs", "Screening", "First hire"],
        whatItDoes: [
          "Drafts role descriptions from your needs and stage",
          "Suggests when and what to hire first",
          "Screens and summarises applicants against the role",
          "Prepares interview questions tailored to the hire",
        ],
        output: "Job spec + screened shortlist + interview kit",
      },
      {
        id: "legal",
        icon: FileText,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #94A3B8 34.62%, #475569 100%)`,
        name: "Legal & Compliance Agent",
        tagline: "Incorporation · Contracts",
        description: "Guides incorporation, contracts, and permits, and flags upcoming deadlines so nothing legal slips through the cracks.",
        tags: ["Incorporation", "Contracts", "Deadlines"],
        whatItDoes: [
          "Walks you through incorporation steps for your region",
          "Drafts starter contracts for partners and customers",
          "Tracks permits, licences, and filing deadlines",
          "Flags what needs a real lawyer vs. what you can self-serve",
        ],
        output: "Step-by-step legal checklist + deadline reminders",
      },
      {
        id: "fundraising",
        icon: Rocket,
        gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #FB7185 34.62%, #E11D48 100%)`,
        name: "Investor & Fundraising Agent",
        tagline: "Narrative · Investors",
        description: "Builds your pitch narrative, finds matched investors, and preps the updates that keep them warm between conversations.",
        tags: ["Pitch", "Investor match", "Updates"],
        whatItDoes: [
          "Shapes your traction and story into a pitch narrative",
          "Finds investors matched to your stage and space",
          "Drafts investor updates to keep momentum",
          "Preps answers to the questions investors will ask",
        ],
        output: "Pitch narrative + matched investor list + update drafts",
      },
    ],
  },
];

// ── Customer Research Agent UI ─────────────────────────────────────────────
function CustomerResearchAgentUI({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";

  type Stage = "idle" | "loading" | "done";
  const [targetStage, setTargetStage] = useState<Stage>("idle");
  const [targetResult, setTargetResult] = useState("");
  const [scriptStage, setScriptStage] = useState<Stage>("idle");
  const [scriptResult, setScriptResult] = useState("");
  const [patternStage, setPatternStage] = useState<Stage>("idle");
  const [patternResult, setPatternResult] = useState("");

  // Conversation log state (shared with Validation tab via same localStorage key)
  interface ConvEntry { id: string; name: string; notes: string; fileName?: string; createdAt: string; }
  const [convEntries, setConvEntries] = useState<ConvEntry[]>([]);
  const [addConvOpen, setAddConvOpen] = useState(false);
  const [convForm, setConvForm] = useState({ name: "", notes: "", fileName: "" });
  const [convSaving, setConvSaving] = useState(false);
  const [convExpandedId, setConvExpandedId] = useState<string | null>(null);
  const convFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!title) return;
    try {
      const t = localStorage.getItem(`cr-target-${title}`);
      if (t) { setTargetResult(t); setTargetStage("done"); }
      const s = localStorage.getItem(`cr-script-${title}`);
      if (s) { setScriptResult(s); setScriptStage("done"); }
      const p = localStorage.getItem(`cr-patterns-${title}`);
      if (p) { setPatternResult(p); setPatternStage("done"); }
      // Load conversations (same key as Validation tab)
      const c = localStorage.getItem(`convlog-${title}`);
      if (c) setConvEntries(JSON.parse(c));
    } catch { /* ignore */ }
  }, [title]);

  const saveConvEntries = (updated: ConvEntry[]) => {
    setConvEntries(updated);
    try { localStorage.setItem(`convlog-${title}`, JSON.stringify(updated)); } catch { /* ignore */ }
    // Persist to Firestore
    import("@/lib/firebase").then(({ auth }) =>
      auth?.currentUser?.getIdToken().then((token) => {
        if (!token) return;
        // Sync all entries via the existing conversations API
        updated.forEach((entry) => {
          fetch("/api/execution-projects/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ projectTitle: title, entry }),
          }).catch(() => {});
        });
      })
    ).catch(() => {});
  };

  const handleAddConv = async () => {
    if (!convForm.name.trim() && !convForm.notes.trim()) return;
    setConvSaving(true);
    const entry: ConvEntry = {
      id: Date.now().toString(),
      name: convForm.name.trim(),
      notes: convForm.notes.trim(),
      fileName: convForm.fileName || undefined,
      createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };
    const updated = [entry, ...convEntries];
    saveConvEntries(updated);
    setConvForm({ name: "", notes: "", fileName: "" });
    if (convFileRef.current) convFileRef.current.value = "";
    setAddConvOpen(false);
    setConvSaving(false);
  };

  const handleDeleteConv = (id: string) => {
    const updated = convEntries.filter((e) => e.id !== id);
    saveConvEntries(updated);
    if (convExpandedId === id) setConvExpandedId(null);
  };

  const callAI = async (prompt: string, system: string): Promise<string> => {
    const { authFetch } = await import("@/lib/authFetch");
    const res = await authFetch("/api/execution-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, system }),
    });
    if (!res.ok) throw new Error("AI error");
    const data = await res.json();
    return (data?.reply ?? "").trim();
  };

  const findTargets = async () => {
    if (!project) return;
    setTargetStage("loading");
    try {
      const system = `You are Sorene, a sharp execution coach. Reply in plain text only — no markdown headers, no JSON. Use short numbered lines.`;
      const prompt = `Find 8 specific types of people or communities this founder should talk to immediately for customer research.

Project: "${project.title}"
${project.oneliner ? `What it does: ${project.oneliner}` : ""}
${project.first_10_customers ? `Target customer: ${project.first_10_customers}` : ""}
${project.description ? `Details: ${project.description.slice(0, 300)}` : ""}

List 8 specific targets. For each: their role/community, where to find them (platform or place), and why they're relevant. Be specific — not "entrepreneurs" but "bootstrapped SaaS founders in Southeast Asia who run < 10-person teams". Keep each line short.`;
      const reply = await callAI(prompt, system);
      setTargetResult(reply);
      setTargetStage("done");
      try { localStorage.setItem(`cr-target-${title}`, reply); } catch { /* ignore */ }
    } catch { setTargetStage("idle"); }
  };

  const generateScript = async () => {
    if (!project) return;
    setScriptStage("loading");
    try {
      const system = `You are Sorene, a sharp execution coach. Reply in plain text only — no markdown headers, no JSON.`;
      const prompt = `Write a customer interview script for this project.

Project: "${project.title}"
${project.oneliner ? `What it does: ${project.oneliner}` : ""}
${project.first_10_customers ? `Target customer: ${project.first_10_customers}` : ""}
${project.description ? `Details: ${project.description.slice(0, 300)}` : ""}

Write 8 questions. Start with easy openers about their current situation, move to problem depth, end with willingness to pay/change. The goal is to validate whether the pain is real and severe enough. Don't mention the product until question 7+. Format as numbered questions only — no intro, no explanations between questions.`;
      const reply = await callAI(prompt, system);
      setScriptResult(reply);
      setScriptStage("done");
      try { localStorage.setItem(`cr-script-${title}`, reply); } catch { /* ignore */ }
    } catch { setScriptStage("idle"); }
  };

  const analysePatterns = async () => {
    if (!project) return;
    setPatternStage("loading");
    try {
      let convSummary = "No conversations logged yet.";
      try {
        const raw = localStorage.getItem(`convlog-${title}`);
        if (raw) {
          const entries = JSON.parse(raw) as { name?: string; notes?: string }[];
          if (entries.length > 0) {
            convSummary = `${entries.length} conversations logged:\n` +
              entries.map((e, i) => `${i + 1}. ${e.name ?? "Anonymous"}: ${(e.notes ?? "").slice(0, 200)}`).join("\n");
          }
        }
      } catch { /* ignore */ }

      const system = `You are Sorene, a sharp execution coach. Reply in plain text only — no markdown, no JSON.`;
      const prompt = `Analyse the patterns across these customer conversations and give a validation verdict.

Project: "${project.title}"
${project.oneliner ? `What it does: ${project.oneliner}` : ""}

Conversations:
${convSummary}

Write 4-5 sentences covering: (1) the strongest signal you see, (2) the most common pain point or objection, (3) any surprising insight, (4) a clear verdict — is the pain validated, partially validated, or not validated yet, and why. Be specific to what they actually said. End with one concrete next action.`;
      const reply = await callAI(prompt, system);
      setPatternResult(reply);
      setPatternStage("done");
      try { localStorage.setItem(`cr-patterns-${title}`, reply); } catch { /* ignore */ }
    } catch { setPatternStage("idle"); }
  };

  const AgentSection = ({
    icon: Icon, label, sublabel, stage, result, onRun, runLabel, refreshLabel = "Refresh",
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string; sublabel: string;
    stage: Stage; result: string;
    onRun: () => void; runLabel: string; refreshLabel?: string;
  }) => (
    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <Icon size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">{label}</p>
            <p className="text-[11px] text-[#9A9A9A]">{sublabel}</p>
          </div>
        </div>
        {stage === "done" && (
          <button onClick={onRun} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">{refreshLabel}</button>
        )}
      </div>
      <div className="px-5 py-4">
        {stage === "idle" && (
          <button onClick={onRun}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] text-[#9A9A9A] hover:border-[#151515] hover:text-[#151515] transition-colors">
            {runLabel}
          </button>
        )}
        {stage === "loading" && (
          <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
            <Loader2 size={13} className="animate-spin" /> Working on it…
          </div>
        )}
        {stage === "done" && result && (
          <div className="text-[13px] text-[#151515] leading-relaxed whitespace-pre-wrap">
            <MarkdownText text={result} />
          </div>
        )}
      </div>
    </div>
  );

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[#9A9A9A]">Select a project from your Hub first to use this agent.</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <AgentSection
        icon={Users}
        label="Who to talk to"
        sublabel="Specific people and communities to reach for interviews"
        stage={targetStage}
        result={targetResult}
        onRun={findTargets}
        runLabel="Find my target customers →"
      />
      <AgentSection
        icon={MessageCircle}
        label="Interview script"
        sublabel="Tailored questions to surface real pain — not polite feedback"
        stage={scriptStage}
        result={scriptResult}
        onRun={generateScript}
        runLabel="Generate interview script →"
      />
      {/* Pattern analysis with inline conversation logger */}
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
              <BarChart3 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#151515]">Pattern analysis</p>
              <p className="text-[11px] text-[#9A9A9A]">Log conversations, then Sorene finds the signal</p>
            </div>
          </div>
          {patternStage === "done" && (
            <button onClick={analysePatterns} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">Refresh</button>
          )}
        </div>

        {/* Conversation logger */}
        <div className="border-b border-[#ECEDEE]">
          <div className="flex items-center justify-between px-5 py-3 bg-white">
            <p className="text-[12px] font-medium text-[#151515]">
              Conversations logged
              {convEntries.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-[#62646A]">{convEntries.length}</span>}
            </p>
            <button onClick={() => setAddConvOpen((v) => !v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all",
                addConvOpen ? "bg-gray-100 text-[#62646A]" : "bg-[#151515] text-white hover:bg-[#2a2a2a]")}>
              <Plus size={11} />{addConvOpen ? "Cancel" : "Add"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {addConvOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                className="overflow-hidden">
                <div className="px-5 pb-4 space-y-3 bg-[#FAFAFA] border-t border-gray-100">
                  <div className="pt-3">
                    <input value={convForm.name} onChange={(e) => setConvForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Who did you speak to? (name or description)"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                  </div>
                  <textarea value={convForm.notes} onChange={(e) => setConvForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes — what problems did they mention? What exact words did they use? How much pain were they in?"
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors" />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-dashed border-gray-200 hover:border-[#151515] transition-colors text-[11px] text-[#62646A] hover:text-[#151515]">
                      <Paperclip size={12} />
                      {convForm.fileName
                        ? <span className="text-[#151515] font-medium truncate max-w-[160px]">{convForm.fileName}</span>
                        : "Attach notes (Word / PDF)"}
                      <input ref={convFileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setConvForm((p) => ({ ...p, fileName: f.name })); }} />
                    </label>
                    <button onClick={handleAddConv} disabled={!convForm.name.trim() && !convForm.notes.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      {convSaving && <Loader2 size={12} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {convEntries.length === 0 && !addConvOpen && (
            <div className="px-5 py-4 text-center">
              <p className="text-[12px] text-[#9A9A9A]">No conversations yet — add one after each customer chat.</p>
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {convEntries.map((entry) => {
              const isOpen = convExpandedId === entry.id;
              return (
                <div key={entry.id}>
                  <button onClick={() => setConvExpandedId(isOpen ? null : entry.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#62646A]">
                      {(entry.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#151515] truncate">{entry.name || "Anonymous"}</p>
                    </div>
                    {entry.fileName && <FileText size={12} className="text-[#9A9A9A] shrink-0" />}
                    <span className="text-[11px] text-[#9A9A9A] shrink-0">{entry.createdAt}</span>
                    {isOpen ? <ChevronUp size={13} className="text-[#9A9A9A] shrink-0" /> : <ChevronDown size={13} className="text-[#9A9A9A] shrink-0" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                        className="overflow-hidden">
                        <div className="px-5 pb-3 space-y-2 bg-[#FAFAFA]">
                          {entry.notes && (
                            <div className="rounded-xl bg-white border border-gray-100 px-3 py-2.5">
                              <p className="text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                            </div>
                          )}
                          {entry.fileName && (
                            <p className="flex items-center gap-1.5 text-[11px] text-[#62646A]"><Paperclip size={11} />{entry.fileName}</p>
                          )}
                          <button onClick={() => handleDeleteConv(entry.id)}
                            className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analyse button / result */}
        <div className="px-5 py-4">
          {patternStage === "idle" && (
            <button onClick={analysePatterns}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] text-[#9A9A9A] hover:border-[#151515] hover:text-[#151515] transition-colors">
              Analyse my conversations →
            </button>
          )}
          {patternStage === "loading" && (
            <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
              <Loader2 size={13} className="animate-spin" /> Analysing patterns…
            </div>
          )}
          {patternStage === "done" && patternResult && (
            <div className="text-[13px] text-[#151515] leading-relaxed">
              <MarkdownText text={patternResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Outreach Agent UI ──────────────────────────────────────────────────────
interface OutreachProspect {
  id: string;
  name: string;
  role: string;
  context: string;
  message: string;
  format: "dm" | "email";
  status: "drafted" | "sent" | "replied" | "interested" | "declined";
  createdAt: string;
}

function OutreachAgentUI({ project }: { project: DirectionCardData | null }) {
  const title = project?.title ?? "";
  const pipelineKey = `outreach-pipeline-${title}`;

  const [prospects, setProspects] = useState<OutreachProspect[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", context: "", format: "dm" as "dm" | "email" });
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!title) return;
    try {
      const raw = localStorage.getItem(pipelineKey);
      if (raw) setProspects(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [title, pipelineKey]);

  const save = (updated: OutreachProspect[]) => {
    setProspects(updated);
    try { localStorage.setItem(pipelineKey, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const generateMessage = async () => {
    if (!project || !form.name.trim()) return;
    setGenerating(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const system = `You are Sorene, a sharp execution coach helping a founder write outreach. Write only the message itself — no subject line label, no intro explaining what you're writing, no sign-off instructions. Just the message text, ready to copy and send.`;
      const prompt = `Write a personalised ${form.format === "email" ? "cold email" : "cold DM"} for this founder to send to a prospect.

Founder's project: "${project.title}"
${project.oneliner ? `What it does: ${project.oneliner}` : ""}
${project.first_10_customers ? `Who they're targeting: ${project.first_10_customers}` : ""}

Prospect: ${form.name}${form.role ? `, ${form.role}` : ""}
${form.context ? `Context about them: ${form.context}` : ""}

The message should: reference something specific about the prospect, connect their situation to what the founder is building, and end with one clear low-friction ask (a 20-min call, a quick reply, feedback on an idea — not a sale). Keep it under 120 words. Sound like a real person, not a template.`;

      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system }),
      });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      const msg = (data?.reply ?? "").trim();

      const prospect: OutreachProspect = {
        id: Date.now().toString(),
        name: form.name.trim(),
        role: form.role.trim(),
        context: form.context.trim(),
        message: msg,
        format: form.format,
        status: "drafted",
        createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      };
      save([prospect, ...prospects]);
      setExpandedId(prospect.id);
      setForm({ name: "", role: "", context: "", format: "dm" });
      setFormOpen(false);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const updateStatus = (id: string, status: OutreachProspect["status"]) => {
    save(prospects.map((p) => p.id === id ? { ...p, status } : p));
  };

  const deleteProspect = (id: string) => {
    save(prospects.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const STATUS_COLORS: Record<OutreachProspect["status"], string> = {
    drafted: "bg-gray-100 text-[#62646A]",
    sent: "bg-blue-50 text-blue-600",
    replied: "bg-yellow-50 text-yellow-700",
    interested: "bg-[#DCFCE7] text-[#16A34A]",
    declined: "bg-red-50 text-red-500",
  };
  const STATUS_LABELS: Record<OutreachProspect["status"], string> = {
    drafted: "Drafted", sent: "Sent", replied: "Replied", interested: "Interested", declined: "Declined",
  };
  const STATUS_NEXT: Record<OutreachProspect["status"], OutreachProspect["status"][]> = {
    drafted: ["sent"],
    sent: ["replied", "declined"],
    replied: ["interested", "declined"],
    interested: ["declined"],
    declined: [],
  };

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[#9A9A9A]">Select a project from your Hub first to use this agent.</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setFormOpen((v) => !v)}
          className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all",
            formOpen ? "bg-gray-100 text-[#62646A]" : "bg-[#151515] text-white hover:bg-[#2a2a2a]")}>
          <Plus size={13} />{formOpen ? "Cancel" : "New prospect"}
        </button>
      </div>

      {/* Add prospect form */}
      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
            className="overflow-hidden">
            <div className="rounded-2xl border border-[#ECEDEE] bg-[#FAFAFA] p-4 space-y-3">
              <p className="text-[12px] font-semibold text-[#151515]">Tell Sorene about the prospect</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name *"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                <input
                  value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="Role / company"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
              </div>
              <textarea
                value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))}
                placeholder="What do you know about them? (LinkedIn summary, recent post, mutual connection, their problem…)"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-[#62646A]">Format:</p>
                  {(["dm", "email"] as const).map((f) => (
                    <button key={f} onClick={() => setForm((p) => ({ ...p, format: f }))}
                      className={cn("px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                        form.format === f ? "bg-[#151515] text-white" : "bg-gray-100 text-[#62646A] hover:bg-gray-200")}>
                      {f === "dm" ? "Cold DM" : "Cold Email"}
                    </button>
                  ))}
                </div>
                <button onClick={generateMessage} disabled={!form.name.trim() || generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  {generating && <Loader2 size={13} className="animate-spin" />}
                  Write message →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline */}
      {prospects.length === 0 && !formOpen ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center">
          <Mail size={20} className="text-[#9A9A9A] mx-auto mb-2" />
          <p className="text-[13px] text-[#9A9A9A]">No prospects yet. Add one and Sorene will write the message.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-[#FAFAFA] border-b border-[#ECEDEE]">
            <p className="text-[12px] font-semibold text-[#151515]">Pipeline</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-[#62646A] font-semibold">{prospects.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {prospects.map((p) => {
              const isOpen = expandedId === p.id;
              return (
                <div key={p.id}>
                  <button onClick={() => setExpandedId(isOpen ? null : p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#62646A]">
                      {(p.name[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-small-medium text-[#151515] truncate">{p.name}</p>
                      <p className="text-[11px] text-[#9A9A9A] truncate">{p.role || p.createdAt}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[p.status])}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-[#9A9A9A] shrink-0" /> : <ChevronDown size={14} className="text-[#9A9A9A] shrink-0" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 bg-[#FAFAFA]">
                          <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                            <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wide mb-1.5">
                              {p.format === "email" ? "Cold Email" : "Cold DM"}
                            </p>
                            <p className="text-[13px] text-[#151515] leading-relaxed whitespace-pre-wrap">{p.message}</p>
                            <button
                              onClick={() => navigator.clipboard.writeText(p.message)}
                              className="mt-2 text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">
                              Copy →
                            </button>
                          </div>
                          {STATUS_NEXT[p.status].length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[11px] text-[#9A9A9A]">Mark as:</p>
                              {STATUS_NEXT[p.status].map((s) => (
                                <button key={s} onClick={() => updateStatus(p.id, s)}
                                  className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors", STATUS_COLORS[s], "hover:opacity-80")}>
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          )}
                          <button onClick={() => deleteProspect(p.id)}
                            className="flex items-center gap-1.5 text-[12px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Content & Social Agent UI ──────────────────────────────────────────────
const POST_TOPICS = [
  { value: "win", label: "Recent win", hint: "Something that worked, a milestone, a small victory" },
  { value: "lesson", label: "Lesson learned", hint: "Something that didn't work and what you took from it" },
  { value: "customer", label: "Customer insight", hint: "Something surprising you heard from a customer conversation" },
  { value: "build", label: "What I'm building", hint: "Update on progress, what changed, what's next" },
  { value: "blocker", label: "Current blocker", hint: "Real struggle — vulnerability builds trust and often gets advice" },
  { value: "custom", label: "Custom topic", hint: "Describe what you want to write about" },
];

const THREADS_ICON = (
  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068v-.064c0-3.518.85-6.372 2.495-8.423C5.845 1.277 8.599.095 12.18.071h.014c2.746.018 5.143.808 7.137 2.35 1.89 1.46 3.19 3.51 3.867 6.105l-2.012.54c-.55-2.07-1.586-3.696-3.078-4.832-1.584-1.213-3.564-1.826-5.889-1.82-2.94.02-5.086.92-6.37 2.67C4.568 6.89 3.937 9.19 3.937 12.004v.064c0 2.814.63 5.114 1.912 6.92 1.284 1.75 3.43 2.65 6.37 2.67 2.497.017 4.253-.557 5.5-1.752 1.392-1.332 2.094-3.31 2.086-5.876a7.2 7.2 0 0 0-.085-1.136h-7.558v-2.33h9.756c.112.573.168 1.176.168 1.793v.003c.013 3.363-.962 5.937-2.9 7.647-1.72 1.515-4.08 2.284-6.999 2.268Z" />
  </svg>
);

interface ThreadsDraft { id: string; text: string; editing: boolean; schedulerOpen: boolean; frozen?: boolean; frozenAt?: number; posted?: boolean; postFailed?: boolean; failReason?: string; ctaComment?: string; scheduledId?: string; }
interface ContentDNA { summary: string; bestHours: number[]; postCount: number; analyzedAt: number; }
interface ScheduledPost { id: string; text: string; scheduledAt: number; status: string; failReason?: string; }
interface Competitor { username: string; addedAt: number; lastAnalyzedAt?: number; postCount?: number; insights?: string; }
interface XDraft { id: string; text: string; editing: boolean; frozen?: boolean; frozenAt?: number; posted?: boolean; postFailed?: boolean; failReason?: string; scheduledId?: string; }
interface XScheduledPost { id: string; text: string; scheduledAt: number; status: string; failReason?: string; }
interface WatchedSubreddit { name: string; addedBy: "user" | "sorene"; addedAt: number; approved?: boolean; reason?: string; }
interface RedditOpportunity { id: string; subreddit: string; threadId: string; title: string; url: string; score: number; commentCount: number; createdAt: number; relevanceScore: number; draftReply: string; dismissed?: boolean; posted?: boolean; }

function ContentSocialAgentUI({ project }: { project: DirectionCardData | null }) {
  const authUser = useAtomValue(userAtom);

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[#9A9A9A]">Select a project from your Hub first to use this agent.</p>
      </div>
    );
  }

  return <ContentSocialAgentUIInner key={project.title} project={project} authUser={authUser} />;
}

function ContentSocialAgentUIInner({ project, authUser }: { project: DirectionCardData; authUser: ReturnType<typeof useAtomValue<typeof userAtom>> }) {
  // Initialize from cached status so returning users see their status instantly and
  // first-time users see the Connect button immediately — no loading spinner flash.
  const [accountStatus, setAccountStatus] = useState<"loading" | "disconnected" | "connected">(() => {
    try {
      const cached = localStorage.getItem(`social-threads-status-${project.title}`);
      return cached === "connected" ? "connected" : "disconnected";
    } catch { return "disconnected"; }
  });
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem(`social-threads-username-${project.title}`) ?? ""; } catch { return ""; }
  });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Content DNA
  const [dna, setDna] = useState<ContentDNA | null>(null);
  const [scanningHistory, setScanningHistory] = useState(false);

  // Competitor analysis
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [analyzingCompetitors, setAnalyzingCompetitors] = useState(false);
  const [competitorError, setCompetitorError] = useState("");

  // Weekly batch
  const [cadence, setCadence] = useState<1 | 2 | 3>(1);
  const [generateMode, setGenerateMode] = useState<"single" | 1 | 2 | 3 | null>(null);
  const [ctaLink, setCtaLink] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [weekDrafts, setWeekDrafts] = useState<ThreadsDraft[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);

  // Publishing / scheduling
  const [publishing, setPublishing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [approvingAll, setApprovingAll] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [publishedScheduled, setPublishedScheduled] = useState<ScheduledPost[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // Custom slot overrides: draftId → timestamp (ms). When set, overrides scheduleSlots[i].
  const [slotOverrides, setSlotOverrides] = useState<Record<string, number>>({});
  // Which draft has the slot editor open
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [postedOpen, setPostedOpen] = useState(false);
  // Pending date/time string while slot editor is open: draftId → { date, time }
  const [pendingSlot, setPendingSlot] = useState<Record<string, { date: string; time: string }>>({});

  // ── X (Twitter) channel state ──
  const [xStatus, setXStatus] = useState<"loading" | "connected" | "disconnected">(() => {
    try {
      const cached = localStorage.getItem(`social-x-status-${project.title}`);
      return cached === "connected" ? "connected" : "disconnected";
    } catch { return "disconnected"; }
  });
  const [xUsername, setXUsername] = useState("");
  const [xKeyForm, setXKeyForm] = useState(false);
  const [xKeys, setXKeys] = useState({ apiKey: "", apiSecret: "", accessToken: "", accessTokenSecret: "" });
  const [xConnecting, setXConnecting] = useState(false);
  const [xConnectError, setXConnectError] = useState("");
  const [xDrafts, setXDrafts] = useState<XDraft[]>([]);
  const [xScheduled, setXScheduled] = useState<XScheduledPost[]>([]);
  const [xGenerating, setXGenerating] = useState(false);
  const [xApprovingAll, setXApprovingAll] = useState(false);
  const [xSuccessMsg, setXSuccessMsg] = useState("");
  const [xErrorMsg, setXErrorMsg] = useState("");
  const [xPostedOpen, setXPostedOpen] = useState(false);
  const [xHelpInput, setXHelpInput] = useState("");
  const [xHelpMessages, setXHelpMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [xHelpLoading, setXHelpLoading] = useState(false);
  const [xSetupStep, setXSetupStep] = useState<"instructions" | "keys">("instructions");

  // ── Reddit channel state ──
  const [redditStatus, setRedditStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [redditUsername, setRedditUsername] = useState("");
  const [redditKarma, setRedditKarma] = useState(0);
  const [watchedSubreddits, setWatchedSubreddits] = useState<WatchedSubreddit[]>([]);
  const [redditKeywords, setRedditKeywords] = useState<string[]>([]);
  const [redditOpportunities, setRedditOpportunities] = useState<RedditOpportunity[]>([]);
  const [subInput, setSubInput] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [suggestedSubs, setSuggestedSubs] = useState<{ name: string; reason: string }[]>([]);
  const [suggestingReddit, setSuggestingReddit] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [scanningOpportunities, setScanningOpportunities] = useState(false);
  const [redditSuccessMsg, setRedditSuccessMsg] = useState("");
  const [redditTipsOpen, setRedditTipsOpen] = useState(false);

  // Best posting times (local HH:MM strings) — up to 3 slots
  const bestTimes: string[] = dna?.bestHours?.slice(0, 3).map((utcH) => {
    const d = new Date();
    d.setUTCHours(utcH, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }) ?? ["08:00", "13:00", "19:00"];

  // Pre-compute schedule slots for the next 7 days
  // - Picks 1/2/3 best time slots per day matching cadence
  // - Adds a small per-day minute variation so posts don't land the same minute every day
  // - Deduplicates same-day same-minute collisions
  // - Loops up to 10 days so today's already-past slots don't leave Day 7 without a time
  const scheduleSlots = (() => {
    const slots: number[] = [];
    const today = new Date();
    today.setSeconds(0, 0);
    const neededSlots = cadence * 7;
    for (let day = 0; day < 10 && slots.length < neededSlots; day++) {
      // Pick how many time slots per day
      const dayTimes = cadence === 2 ? bestTimes.slice(0, 2)
        : cadence === 3 ? bestTimes.slice(0, 3)
        : [bestTimes[0]]; // cadence === 1 or single
      // Slight per-day variation: 0, 11, 22, 33, 44, 10, 21 min across the week
      const minuteVariation = (day * 11) % 45;
      const usedMs = new Set<number>();
      for (const t of dayTimes) {
        const [h, m] = t.split(":").map(Number);
        const rawMins = h * 60 + m + minuteVariation;
        const d = new Date(today);
        d.setDate(d.getDate() + day);
        d.setHours(Math.floor(rawMins / 60) % 24, rawMins % 60, 0, 0);
        // Nudge forward 15 min if this exact ms is already taken this day
        while (usedMs.has(d.getTime())) d.setMinutes(d.getMinutes() + 15);
        usedMs.add(d.getTime());
        if (d.getTime() > Date.now() + 60_000) slots.push(d.getTime());
      }
    }
    return slots.sort((a, b) => a - b);
  })();

  const loadAccount = async () => {
    const { authFetch } = await import("@/lib/authFetch");
    const p = encodeURIComponent(project.title);
    const [accountRes, draftsRes, competitorsRes, xRes, xScheduleRes, redditRes, redditWatchlistRes, redditOppRes] = await Promise.all([
      authFetch(`/api/threads/account?project=${p}`),
      authFetch(`/api/threads/drafts?project=${p}`),
      authFetch(`/api/threads/competitors?project=${p}`),
      authFetch(`/api/x/keys?project=${p}`),
      authFetch(`/api/x/schedule?project=${p}`),
      authFetch(`/api/reddit/account?project=${p}`),
      authFetch(`/api/reddit/watchlist?project=${p}`),
      authFetch(`/api/reddit/opportunities?project=${p}`),
    ]);
    if (accountRes.ok) {
      const data = await accountRes.json() as { connected: boolean; username?: string; dna?: ContentDNA | null };
      if (data.connected) {
        setAccountStatus("connected");
        setUsername(data.username ?? "");
        try {
          localStorage.setItem(`social-threads-status-${project.title}`, "connected");
          localStorage.setItem(`social-threads-username-${project.title}`, data.username ?? "");
        } catch { /* ignore */ }
      } else {
        setAccountStatus("disconnected");
        try { localStorage.setItem(`social-threads-status-${project.title}`, "disconnected"); } catch { /* ignore */ }
      }
      if (data.dna) setDna(data.dna);
    } else { setAccountStatus("disconnected"); }
    if (draftsRes.ok) {
      const data = await draftsRes.json() as { batch: { drafts: ThreadsDraft[]; ctaLink: string; cadence: 1 | 2 | 3; slotOverrides: Record<string, number>; userNotes?: string } | null };
      if (data.batch) {
        // Always restore notes/ctaLink/cadence regardless of whether drafts exist
        setCtaLink(data.batch.ctaLink ?? "");
        setCadence(data.batch.cadence ?? 1);
        setUserNotes(data.batch.userNotes ?? "");
        if (data.batch.drafts.length > 0) {
          setWeekDrafts(data.batch.drafts);
          setSlotOverrides(data.batch.slotOverrides ?? {});
        }
      }
    }
    if (competitorsRes.ok) {
      const data = await competitorsRes.json() as { competitors: Competitor[] };
      setCompetitors(data.competitors ?? []);
    }
    if (xRes.ok) {
      const data = await xRes.json() as { connected: boolean; username?: string };
      if (data.connected) {
        setXStatus("connected");
        setXUsername(data.username ?? "");
        try { localStorage.setItem(`social-x-status-${project.title}`, "connected"); } catch { /* ignore */ }
      } else {
        setXStatus("disconnected");
        try { localStorage.setItem(`social-x-status-${project.title}`, "disconnected"); } catch { /* ignore */ }
      }
    } else { setXStatus("disconnected"); }
    if (xScheduleRes.ok) {
      const data = await xScheduleRes.json() as { posts: XScheduledPost[] };
      setXScheduled(data.posts ?? []);
    }
    if (redditRes.ok) {
      const data = await redditRes.json() as { connected: boolean; username?: string; karma?: number };
      if (data.connected) { setRedditStatus("connected"); setRedditUsername(data.username ?? ""); setRedditKarma(data.karma ?? 0); }
      else setRedditStatus("disconnected");
    } else { setRedditStatus("disconnected"); }
    if (redditWatchlistRes.ok) {
      const data = await redditWatchlistRes.json() as { watchlist: { subreddits: WatchedSubreddit[]; keywords: string[] } };
      setWatchedSubreddits(data.watchlist?.subreddits ?? []);
      setRedditKeywords(data.watchlist?.keywords ?? []);
    }
    if (redditOppRes.ok) {
      const data = await redditOppRes.json() as { opportunities: RedditOpportunity[] };
      setRedditOpportunities(data.opportunities ?? []);
    }
    setDraftsLoaded(true);
  };

  useEffect(() => {
    if (!authUser) return;
    loadAccount().catch(() => { setAccountStatus("disconnected"); setDraftsLoaded(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, project.title]);

  // Load scheduled posts independently so a failure doesn't block the rest of loadAccount
  useEffect(() => {
    if (!authUser) return;
    const p = encodeURIComponent(project.title);
    import("@/lib/authFetch").then(({ authFetch }) =>
      authFetch(`/api/threads/schedule?project=${p}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data: { posts?: ScheduledPost[]; published?: ScheduledPost[] } | null) => {
          if (!data) return;
          setScheduledPosts(data.posts ?? []);
          setPublishedScheduled((data.published ?? []).sort((a, b) => b.scheduledAt - a.scheduledAt).slice(0, 20));
        })
        .catch(() => {})
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, project.title]);

  // Auto-save drafts to Firestore whenever they change (debounced 1.5s)
  // NOTE: draftsLoaded is intentionally excluded from deps — it's only a guard.
  // Including it would fire a save with stale weekDrafts=[] right after load, deleting the batch.
  useEffect(() => {
    if (!draftsLoaded || !authUser) return;
    const timer = setTimeout(async () => {
      try {
        const { authFetch } = await import("@/lib/authFetch");
        await authFetch(`/api/threads/drafts?project=${encodeURIComponent(project.title)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drafts: weekDrafts, ctaLink, cadence, slotOverrides, userNotes }),
        });
      } catch { /* ignore */ }
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDrafts, ctaLink, cadence, slotOverrides, userNotes]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("threads_connected") === "1") {
      setAccountStatus("connected");
      window.history.replaceState({}, "", window.location.pathname + "?tab=agents");
      setTimeout(() => scanHistory(), 500);
    }
    if (params.get("threads_error") === "1") {
      setAccountStatus("disconnected");
      window.history.replaceState({}, "", window.location.pathname + "?tab=agents");
    }
    if (params.get("reddit_connected") === "1") {
      setRedditStatus("connected");
      const url = new URL(window.location.href);
      url.searchParams.delete("reddit_connected");
      const connectedProject = params.get("project") ?? "";
      if (connectedProject) url.searchParams.delete("project");
      window.history.replaceState({}, "", url.toString());
      import("@/lib/authFetch").then(({ authFetch }) => {
        const projectParam = connectedProject ? `?project=${encodeURIComponent(connectedProject)}` : "";
        return authFetch(`/api/reddit/account${projectParam}`).then((r) => r.json()).then((data: { connected: boolean; username?: string; karma?: number }) => {
          if (data.connected) { setRedditUsername(data.username ?? ""); setRedditKarma(data.karma ?? 0); }
        });
      }).catch(() => {});
    }
    if (params.get("reddit_error") === "1") {
      setRedditStatus("disconnected");
      const url = new URL(window.location.href);
      url.searchParams.delete("reddit_error");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 60s to mark frozen drafts as posted once their scheduled time has passed
  useEffect(() => {
    const check = async () => {
      const frozen = weekDrafts.filter((d) => d.frozen && !d.posted);
      if (!frozen.length || !authUser) return;
      try {
        const { authFetch } = await import("@/lib/authFetch");
        const res = await authFetch(`/api/threads/schedule?project=${encodeURIComponent(project.title)}`);
        if (!res.ok) return;
        const data = await res.json() as { posts: ScheduledPost[]; failed?: ScheduledPost[]; published?: ScheduledPost[] };
        const pendingIds = new Set(data.posts.map((p) => p.id));
        const failedIds = new Set((data.failed ?? []).map((p) => p.id));
        const publishedIds = new Set((data.published ?? []).map((p) => p.id));
        const pendingTexts = new Set(data.posts.map((p) => p.text.trim()));
        const failedTexts = new Set((data.failed ?? []).map((p) => p.text.trim()));
        const publishedTexts = new Set((data.published ?? []).map((p) => p.text.trim()));
        const now = Date.now();
        setWeekDrafts((prev) => prev.map((d) => {
          if (!d.frozen || d.posted) return d;
          if ((d.frozenAt ?? 0) > now) return d;
          const cleanText = d.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim();
          const sid = d.scheduledId;
          // Prefer ID-based matching; fall back to text matching for older drafts
          const isPublished = sid ? publishedIds.has(sid) : publishedTexts.has(cleanText);
          const isFailed = sid ? failedIds.has(sid) : failedTexts.has(cleanText);
          const isPending = sid ? pendingIds.has(sid) : pendingTexts.has(cleanText);
          if (isPublished) return { ...d, posted: true, postFailed: false, failReason: undefined };
          if (isFailed) {
            const failedPost = (data.failed ?? []).find((p) => (sid ? p.id === sid : p.text.trim() === cleanText));
            return { ...d, postFailed: true, failReason: failedPost?.failReason };
          }
          // No longer in any list — treat as posted
          if (!isPending) return { ...d, posted: true, postFailed: false };
          return d;
        }));
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 15_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDrafts, authUser]);

  const scanHistory = async () => {
    setScanningHistory(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/threads/history?project=${encodeURIComponent(project.title)}`);
      if (res.ok) {
        const data = await res.json() as { dna?: ContentDNA };
        if (data.dna) setDna(data.dna);
      }
    } catch { /* ignore */ }
    setScanningHistory(false);
  };

  const addCompetitor = async () => {
    const username = competitorInput.replace(/^@/, "").trim().toLowerCase();
    if (!username) return;
    setCompetitorError("");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/threads/competitors?project=${encodeURIComponent(project.title)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", username }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; competitors?: Competitor[] };
      if (data.ok) { setCompetitors(data.competitors ?? []); setCompetitorInput(""); }
      else setCompetitorError(data.error ?? "Failed to add");
    } catch { setCompetitorError("Failed to add"); }
  };

  const removeCompetitor = async (username: string) => {
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/threads/competitors?project=${encodeURIComponent(project.title)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", username }),
      });
      const data = await res.json() as { competitors?: Competitor[] };
      setCompetitors(data.competitors ?? []);
    } catch { /* ignore */ }
  };

  const analyzeCompetitors = async () => {
    setAnalyzingCompetitors(true);
    setCompetitorError("");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/threads/competitors?project=${encodeURIComponent(project.title)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; competitors?: Competitor[] };
      if (data.ok) setCompetitors(data.competitors ?? []);
      else setCompetitorError(data.error ?? "Analysis failed");
    } catch { setCompetitorError("Analysis failed"); }
    setAnalyzingCompetitors(false);
  };

  const connectX = async () => {
    setXConnecting(true);
    setXConnectError("");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/x/keys?project=${encodeURIComponent(project.title)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(xKeys),
      });
      const data = await res.json() as { ok?: boolean; error?: string; username?: string };
      if (data.ok) {
        setXStatus("connected");
        setXUsername(data.username ?? "");
        try { localStorage.setItem(`social-x-status-${project.title}`, "connected"); } catch { /* ignore */ }
        setXKeyForm(false);
        setXKeys({ apiKey: "", apiSecret: "", accessToken: "", accessTokenSecret: "" });
      } else {
        setXConnectError(data.error ?? "Connection failed");
      }
    } catch { setXConnectError("Connection failed"); }
    setXConnecting(false);
  };

  const disconnectX = async () => {
    try {
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch(`/api/x/keys?project=${encodeURIComponent(project.title)}`, { method: "DELETE" });
      setXStatus("disconnected");
      try { localStorage.setItem(`social-x-status-${project.title}`, "disconnected"); } catch { /* ignore */ }
      setXUsername("");
      setXDrafts([]);
    } catch { /* ignore */ }
  };

  const generateXWeek = async () => {
    setXGenerating(true);
    setXDrafts([]);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const count = 7;
      const title = project?.title ?? "";
      const brandName = title ? (localStorage.getItem(`business-name-${title}`) ?? "") : "";
      const brandContext = brandName ? `Brand: ${brandName}` : (project?.oneliner ?? "");
      const dnaContext = dna?.summary ? `\nContent DNA: ${dna.summary}` : "";

      const system = `You are ghostwriting X (Twitter) posts for a founder. Write short, punchy, high-signal tweets.

RULES:
- Max 280 characters each — count carefully, never go over
- Start with a hook: bold claim, surprising stat, or pattern interrupt
- No hashtags. No emojis unless genuinely needed.
- Vary formats: hot take / observation / question / data point / short story
- Sound like a real person, not a marketer
- No numbered lists in a single tweet — prose only`;

      const prompt = `Write exactly ${count} X/Twitter posts for a 7-day schedule (1 per day).

${brandContext}${dnaContext}

Separate posts with exactly "---". No labels, no numbering, no intro. Just the ${count} posts.`;

      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system, maxTokens: 1500, stream: true }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let idx = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("---");
          for (let i = 0; i < parts.length - 1; i++) {
            const text = parts[i].trim();
            if (text) {
              setXDrafts((prev) => [...prev, { id: `x-${Date.now()}-${idx++}`, text, editing: false }]);
            }
          }
          buffer = parts[parts.length - 1];
        }
        if (buffer.trim()) {
          setXDrafts((prev) => [...prev, { id: `x-${Date.now()}-${idx}`, text: buffer.trim(), editing: false }]);
        }
      }
    } catch { /* ignore */ }
    setXGenerating(false);
  };

  const approveAllX = async () => {
    if (xDrafts.length === 0) return;
    setXApprovingAll(true);
    setXErrorMsg("");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const pending = xDrafts.filter((d) => !d.frozen);
      const now = Date.now();
      const newScheduled: XScheduledPost[] = [];
      const idMap: Record<string, string> = {};

      for (let i = 0; i < pending.length; i++) {
        const draft = pending[i];
        const scheduledAt = now + (i + 1) * 24 * 60 * 60 * 1000;
        const res = await authFetch(`/api/x/schedule?project=${encodeURIComponent(project.title)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.text, scheduledAt }),
        });
        if (res.ok) {
          const data = await res.json() as { post: XScheduledPost };
          newScheduled.push(data.post);
          idMap[draft.id] = data.post.id;
        }
      }

      setXScheduled((prev) => [...prev, ...newScheduled].sort((a, b) => a.scheduledAt - b.scheduledAt));
      const frozen = xDrafts.map((d, i) => d.frozen ? d : {
        ...d, frozen: true, frozenAt: now + (i + 1) * 24 * 60 * 60 * 1000,
        ...(idMap[d.id] ? { scheduledId: idMap[d.id] } : {}),
      });
      setXDrafts(frozen);
      setXSuccessMsg(`${newScheduled.length} posts scheduled ✓`);
      setTimeout(() => setXSuccessMsg(""), 4000);
    } catch { /* ignore */ }
    setXApprovingAll(false);
  };

  const sendXHelp = async () => {
    if (!xHelpInput.trim() || xHelpLoading) return;
    const msg = xHelpInput.trim();
    setXHelpInput("");
    setXHelpLoading(true);
    const newMessages: { role: "user" | "assistant"; content: string }[] = [...xHelpMessages, { role: "user", content: msg }];
    setXHelpMessages(newMessages);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: msg,
          system: `You are Sorene, helping a founder set up their X (Twitter) API keys to connect their account to Sorene for social media scheduling. Be concise and practical. Guide them step by step through the X developer portal. Key facts: they need to go to developer.twitter.com, create a project and app, enable OAuth 1.0a with read+write permissions, and get 4 keys: API Key, API Secret, Access Token, Access Token Secret. The Access Token must be generated with read+write permissions (not read-only). Common issues: wrong permission level, using OAuth 2.0 instead of 1.0a, regenerating tokens after changing permissions.`,
          history: xHelpMessages,
          maxTokens: 500,
        }),
      });
      const data = await res.json() as { reply: string };
      setXHelpMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch { /* ignore */ }
    setXHelpLoading(false);
  };

  // ── Reddit functions ──
  const saveWatchlist = async (subs?: WatchedSubreddit[], kws?: string[]) => {
    setSavingWatchlist(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch(`/api/reddit/watchlist?project=${encodeURIComponent(project.title)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddits: subs ?? watchedSubreddits, keywords: kws ?? redditKeywords }),
      });
    } catch { /* ignore */ }
    setSavingWatchlist(false);
  };

  const addSubreddit = () => {
    const name = subInput.trim().replace(/^r\//, "");
    if (!name || watchedSubreddits.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    const next = [...watchedSubreddits, { name, addedBy: "user" as const, addedAt: Date.now() }];
    setWatchedSubreddits(next);
    setSubInput("");
    saveWatchlist(next, undefined);
  };

  const removeSubreddit = (name: string) => {
    const next = watchedSubreddits.filter((s) => s.name !== name);
    setWatchedSubreddits(next);
    saveWatchlist(next, undefined);
  };

  const approveSubreddit = (name: string) => {
    const next = watchedSubreddits.map((s) => s.name === name ? { ...s, approved: true } : s);
    setWatchedSubreddits(next);
    saveWatchlist(next, undefined);
  };

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (!kw || redditKeywords.includes(kw)) return;
    const next = [...redditKeywords, kw];
    setRedditKeywords(next);
    setKwInput("");
    saveWatchlist(undefined, next);
  };

  const removeKeyword = (kw: string) => {
    const next = redditKeywords.filter((k) => k !== kw);
    setRedditKeywords(next);
    saveWatchlist(undefined, next);
  };

  const suggestSubreddits = async () => {
    setSuggestingReddit(true);
    try {
      const productContext = project?.oneliner ?? project?.simple_positioning ?? project?.description ?? "";
      if (!productContext) { setSuggestingReddit(false); return; }
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/reddit/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productContext }),
      });
      const data = await res.json() as { suggestions: { name: string; reason: string }[] };
      const filtered = (data.suggestions ?? []).filter((s) => !watchedSubreddits.some((w) => w.name.toLowerCase() === s.name.toLowerCase()));
      setSuggestedSubs(filtered);
    } catch { /* ignore */ }
    setSuggestingReddit(false);
  };

  const acceptSuggestedSub = (name: string, reason: string) => {
    const next = [...watchedSubreddits, { name, addedBy: "sorene" as const, addedAt: Date.now(), approved: true, reason }];
    setWatchedSubreddits(next);
    setSuggestedSubs((prev) => prev.filter((s) => s.name !== name));
    saveWatchlist(next, undefined);
  };

  const dismissSuggestedSub = (name: string) => setSuggestedSubs((prev) => prev.filter((s) => s.name !== name));

  const scanOpportunities = async () => {
    setScanningOpportunities(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/reddit/opportunities?project=${encodeURIComponent(project.title)}`, { method: "POST" });
      const data = await res.json() as { ok: boolean; found: number; opportunities: RedditOpportunity[]; error?: string };
      if (data.ok) {
        setRedditOpportunities((prev) => {
          const existing = new Set(prev.map((o) => o.id));
          return [...prev, ...data.opportunities.filter((o) => !existing.has(o.id))];
        });
        if (data.found > 0) setRedditSuccessMsg(`Found ${data.found} new opportunit${data.found === 1 ? "y" : "ies"}!`);
        else setRedditSuccessMsg("No new threads found — try again later.");
        setTimeout(() => setRedditSuccessMsg(""), 3000);
      }
    } catch { /* ignore */ }
    setScanningOpportunities(false);
  };

  const dismissOpportunity = async (id: string) => {
    setRedditOpportunities((prev) => prev.filter((o) => o.id !== id));
    const { authFetch } = await import("@/lib/authFetch");
    await authFetch(`/api/reddit/opportunities?project=${encodeURIComponent(project.title)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "dismiss" }),
    }).catch(() => {});
  };

  const postOpportunity = async (opp: RedditOpportunity) => {
    setRedditOpportunities((prev) => prev.map((o) => o.id === opp.id ? { ...o, posted: true } : o));
    const { authFetch } = await import("@/lib/authFetch");
    await authFetch(`/api/reddit/opportunities?project=${encodeURIComponent(project.title)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: opp.id, action: "post" }),
    }).catch(() => {});
  };

  const updateOpportunityDraft = async (id: string, draftReply: string) => {
    setRedditOpportunities((prev) => prev.map((o) => o.id === id ? { ...o, draftReply } : o));
    const { authFetch } = await import("@/lib/authFetch");
    await authFetch(`/api/reddit/opportunities?project=${encodeURIComponent(project.title)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_draft", draftReply }),
    }).catch(() => {});
  };

  const connectReddit = async () => {
    const { authFetch } = await import("@/lib/authFetch");
    const res = await authFetch(`/api/reddit/auth?project=${encodeURIComponent(project.title)}`);
    if (res.ok) {
      const data = await res.json() as { url: string };
      if (data.url) window.location.href = data.url;
    }
  };

  const connectThreads = async () => {
    setConnecting(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch(`/api/threads/auth?project=${encodeURIComponent(project.title)}`);
      if (res.ok) {
        const data = await res.json() as { url?: string };
        if (data.url) {
          window.open(data.url, "_blank");
          // Poll for connection after the OAuth popup completes
          const poll = setInterval(async () => {
            try {
              const { authFetch: af } = await import("@/lib/authFetch");
              const r = await af(`/api/threads/account?project=${encodeURIComponent(project.title)}`);
              if (r.ok) {
                const d = await r.json() as { connected: boolean; username?: string };
                if (d.connected) {
                  clearInterval(poll);
                  setAccountStatus("connected");
                  setUsername(d.username ?? "");
                  try {
                    localStorage.setItem(`social-threads-status-${project.title}`, "connected");
                    localStorage.setItem(`social-threads-username-${project.title}`, d.username ?? "");
                  } catch { /* ignore */ }
                  setConnecting(false);
                }
              }
            } catch { /* ignore */ }
          }, 3000);
          // Stop polling after 5 minutes
          setTimeout(() => { clearInterval(poll); setConnecting(false); }, 300000);
          return;
        }
      }
    } catch { /* ignore */ }
    setConnecting(false);
  };

  const disconnectThreads = async () => {
    setDisconnecting(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch(`/api/threads/account?project=${encodeURIComponent(project.title)}`, { method: "DELETE" });
      setAccountStatus("disconnected");
      try {
        localStorage.setItem(`social-threads-status-${project.title}`, "disconnected");
        localStorage.removeItem(`social-threads-username-${project.title}`);
      } catch { /* ignore */ }
      setUsername("");
      setWeekDrafts([]);
      setDna(null);
    } catch { /* ignore */ }
    setDisconnecting(false);
  };

  const generateWeek = async (mode?: "single" | 1 | 2 | 3) => {
    const activeMode = mode ?? generateMode ?? 1;
    const isSingle = activeMode === "single";
    const newCadence: 1 | 2 | 3 = isSingle ? 1 : (activeMode as 1 | 2 | 3);
    if (!isSingle) setCadence(newCadence);
    setGenerating(true);
    setWeekDrafts([]);
    // Auto-save link/notes before generating
    try {
      const { authFetch: af } = await import("@/lib/authFetch");
      await af(`/api/threads/drafts?project=${encodeURIComponent(project.title)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts: [], ctaLink, cadence: newCadence, slotOverrides, userNotes }),
      });
    } catch { /* ignore */ }
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const count = isSingle ? 1 : newCadence * 7;

      // Pull brand context from Launchpad localStorage
      const title = project?.title ?? "";
      const brandName    = title ? (localStorage.getItem(`business-name-${title}`) ?? "") : "";
      const tagline      = title ? (localStorage.getItem(`brand-tagline-${title}`) ?? "") : "";
      const benefit      = title ? (localStorage.getItem(`brand-benefit-${title}`) ?? "") : "";
      const offerings    = title ? (localStorage.getItem(`brand-offerings-${title}`) ?? "") : "";

      const brandContext = [
        brandName  && `Brand name: ${brandName}`,
        tagline    && `Tagline: ${tagline}`,
        benefit    && `Core benefit: ${benefit}`,
        offerings  && `Offerings: ${offerings}`,
      ].filter(Boolean).join("\n");

      // Brand is the source of truth for social content — LaunchPad is final
      // Only fall back to project direction if no brand info exists yet
      const projectContext = !brandContext && project
        ? [`About: ${project.title}`, project.oneliner && `What it does: ${project.oneliner}`, project.first_10_customers && `Target customer: ${project.first_10_customers}`].filter(Boolean).join("\n")
        : "";

      const dnaContext = dna?.summary
        ? `\nContent DNA — analysis of this account's top-performing posts (apply these patterns): ${dna.summary}`
        : "";

      const analyzedCompetitors = competitors.filter((c) => c.insights && !c.insights.startsWith("Could not") && !c.insights.startsWith("No public") && !c.insights.startsWith("Analysis failed"));
      const competitorContext = analyzedCompetitors.length > 0
        ? `\nCompetitor intelligence — patterns from high-performing accounts in this space (steal the tactics, not the content):\n${analyzedCompetitors.map((c) => `@${c.username}: ${c.insights}`).join("\n\n")}`
        : "";

      const ctaNote = ctaLink.trim()
        ? `\nCTA link: ${ctaLink.trim()} — do NOT put this in the post body. For posts that naturally call for a CTA, add TWO lines at the very end:
[ADD_LINK_IN_COMMENT]
[CTA_COMMENT: write a short, natural first-comment here that flows from the post's specific angle — no generic phrases like "check this out" or "learn more". It should feel like a genuine continuation of the post that happens to mention the link. End with the URL: ${ctaLink.trim()}]`
        : "";
      const notesContext = userNotes.trim() ? `\nFounder's notes / guidance: ${userNotes.trim()}` : "";

      const system = `You are ghostwriting Threads posts for a founder. Your job is to sound like a real person — not a content creator, not a marketer, not an AI.

OPENING LINE — every post MUST start with a short, punchy sentence in ALL CAPS. This is the hook that stops the scroll. Examples:
"MOST PEOPLE GET THIS WRONG."
"I ALMOST QUIT LAST TUESDAY."
"NOBODY TALKS ABOUT THIS PART."
Keep it under 8 words. Make it a bold claim, surprising truth, or pattern interrupt. Then continue in normal case.

VOICE — this is the most important thing:
- Write like someone typing a thought between meetings. Informal. Imperfect. Occasionally incomplete.
- Use contractions always (don't, isn't, we've, I'm). Never "do not", "is not".
- Vary sentence length wildly. One-word sentences are fine. So are run-ons.
- It's okay to start with "I" sometimes. Real people do.
- Avoid "perfect" rhythm where every line is the same length — that's the AI tell.
- No motivational tone. No "here's what I learned" energy. Just observations, thoughts, opinions.

WHAT MAKES IT FEEL HUMAN:
- Specific details beat generic statements. "3 users churned in week 2" > "some users left early"
- Mild self-doubt or admission of uncertainty reads as authentic
- An unfinished thought or a question you genuinely don't know the answer to
- Slightly awkward transitions are fine — don't over-polish
- A hot take with a soft hedge ("maybe I'm wrong but...")
- Real frustration, real excitement — not performed emotion

WHAT TO AVOID:
- Never start with "In a world where..." or "Let's talk about..." or "Here's the truth:"
- No em dashes (—) used for dramatic effect. Use comma or period instead.
- No "Unpopular opinion:" label. Just say the unpopular opinion.
- No inspirational ending lines like "Keep building." or "Stay consistent."
- No hashtags, ever
- No numbered lists or bullet points — prose only
- No URLs in body. If CTA needed: [ADD_LINK_IN_COMMENT] at end
- HARD LIMIT: every post MUST be under 500 characters (including spaces). Count carefully. If a draft is over 500 chars, cut it — never go over.

FORMATS — use different ones across the week:
hot take / genuine question / short story with a twist / thing I got wrong / observation nobody says out loud / something I'm trying / result or data point with context`;

      const scheduleNote = isSingle ? "1 standalone post" : `a 7-day schedule (${newCadence} post${newCadence > 1 ? "s" : ""} per day)`;
      const prompt = `Write exactly ${count} Threads post${count > 1 ? "s" : ""} for ${scheduleNote}.

${projectContext}${brandContext ? `\n${brandContext}` : ""}${dnaContext}${competitorContext}${ctaNote}${notesContext}

Each post must use a different format and angle. They should feel like the same person's feed — consistent voice, different moods. Add [ADD_LINK_IN_COMMENT] + [CTA_COMMENT: ...] to more than half the posts — at minimum ${Math.ceil(count * 0.55)} out of ${count}. Only skip the CTA on posts where it would feel truly forced (e.g. a raw vulnerable moment or a question post with no clear answer).

Separate posts with exactly "---". No labels, no numbering, no intro text. Just the ${count} posts.`;

      const res = await authFetch("/api/execution-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system, maxTokens: Math.max(1500, count * 200), stream: true }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let postIndex = 0;

        const parseDraft = (raw: string, idx: number): ThreadsDraft => {
          const hasCta = raw.includes("[ADD_LINK_IN_COMMENT]");
          const ctaCommentMatch = raw.match(/\[CTA_COMMENT:\s*([\s\S]*?)\]/);
          const aiCtaComment = ctaCommentMatch?.[1]?.trim();
          const cleanText = raw
            .replace(/\[CTA_COMMENT:[\s\S]*?\]\s*/g, "")
            .replace(/\[ADD_LINK_IN_COMMENT\]\s*/g, "")
            .trim();
          const storedText = hasCta ? `${cleanText}\n[ADD_LINK_IN_COMMENT]` : cleanText;
          const ctaComment = hasCta && ctaLink.trim() ? (aiCtaComment ?? ctaLink.trim()) : undefined;
          return { id: `${Date.now()}-${idx}`, text: storedText, editing: false, schedulerOpen: false, ...(ctaComment ? { ctaComment } : {}) };
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // Extract completed posts separated by ---
          const parts = buffer.split(/\n---\n|^---\n/m);
          while (parts.length > 1 && postIndex < count) {
            const raw = parts.shift()!.trim();
            if (raw) {
              const draft = parseDraft(raw, postIndex++);
              setWeekDrafts((prev) => [...prev, draft]);
            }
          }
          buffer = parts[0];
        }
        // Handle last post (no trailing ---)
        const lastRaw = buffer.trim();
        if (lastRaw && postIndex < count) {
          setWeekDrafts((prev) => [...prev, parseDraft(lastRaw, postIndex)]);
        }
      }
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const updateDraft = (id: string, text: string) =>
    setWeekDrafts((prev) => prev.map((d) => d.id === id ? { ...d, text } : d));
  const toggleEdit = (id: string) =>
    setWeekDrafts((prev) => prev.map((d) => d.id === id ? { ...d, editing: !d.editing } : d));
  const discardDraft = (id: string) =>
    setWeekDrafts((prev) => prev.filter((d) => d.id !== id));

  const publishNow = async (draft: ThreadsDraft): Promise<boolean> => {
    setPublishing(draft.id);
    let success = false;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/threads/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim() }),
      });
      if (res.ok) {
        success = true;
        setSuccessMsg("Posted ✓");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch { /* ignore */ }
    setPublishing(null);
    return success;
  };

  // Approve all — validate token first, then schedule each draft at its slot
  const approveAll = async () => {
    if (weekDrafts.length === 0) return;
    setApprovingAll(true);
    setErrorMsg("");
    try {
      const { authFetch } = await import("@/lib/authFetch");

      // Validate token before committing
      const validateRes = await authFetch("/api/threads/validate");
      if (validateRes.ok) {
        const vd = await validateRes.json() as { valid: boolean; reason?: string };
        if (!vd.valid) {
          setErrorMsg(`Threads token issue: ${vd.reason ?? "please reconnect your account"}`);
          setApprovingAll(false);
          return;
        }
      }

      // Check all posts are within 500 chars
      const overLimit = weekDrafts.filter((d) => {
        const clean = d.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim();
        return clean.length > 500;
      });
      if (overLimit.length > 0) {
        setErrorMsg(`${overLimit.length} post${overLimit.length > 1 ? "s are" : " is"} over 500 characters — please edit before scheduling.`);
        setApprovingAll(false);
        return;
      }

      const pendingDrafts = weekDrafts.filter((d) => !d.frozen);
      const newScheduled: ScheduledPost[] = [];
      const scheduledIdMap: Record<string, string> = {};
      for (let i = 0; i < pendingDrafts.length; i++) {
        const draft = pendingDrafts[i];
        const globalIdx = weekDrafts.indexOf(draft);
        const scheduledAt = slotOverrides[draft.id] ?? scheduleSlots[globalIdx] ?? (Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
        const hasCta = draft.text.includes("[ADD_LINK_IN_COMMENT]");
        const cleanText = draft.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim();
        const res = await authFetch(`/api/threads/schedule?project=${encodeURIComponent(project.title)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            scheduledAt,
            ...(hasCta && (draft.ctaComment ?? ctaLink).trim() ? { ctaLink: (draft.ctaComment ?? ctaLink).trim() } : {}),
          }),
        });
        if (res.ok) {
          const data = await res.json() as { post: ScheduledPost };
          newScheduled.push(data.post);
          scheduledIdMap[draft.id] = data.post.id;
        }
      }
      setScheduledPosts((prev) => [...prev, ...newScheduled].sort((a, b) => a.scheduledAt - b.scheduledAt));
      // Freeze pending drafts in place — show them as locked/waiting
      const now = Date.now();
      const frozenDrafts = weekDrafts.map((d, i) => d.frozen ? d : {
        ...d,
        frozen: true,
        frozenAt: slotOverrides[d.id] ?? scheduleSlots[i] ?? now,
        editing: false,
        ...(scheduledIdMap[d.id] ? { scheduledId: scheduledIdMap[d.id] } : {}),
      });
      setWeekDrafts(frozenDrafts);
      // Immediately persist frozen drafts — don't rely on debounced auto-save
      authFetch(`/api/threads/drafts?project=${encodeURIComponent(project.title)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts: frozenDrafts, ctaLink, cadence, slotOverrides, userNotes }),
      }).catch(() => {});
      setSuccessMsg(`${newScheduled.length} posts scheduled ✓`);
    } catch { /* ignore */ }
    setApprovingAll(false);
  };

  const cancelScheduled = async (id: string) => {
    setCancellingId(id);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch("/api/threads/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setScheduledPosts((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
    setCancellingId(null);
  };

  const [openChannels, setOpenChannels] = useState<Set<string>>(new Set());
  const toggleChannel = (id: string) => setOpenChannels((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const X_ICON = (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const REDDIT_ICON = (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );

  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ── Threads channel ── */}
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
        {/* Channel header — always visible */}
        {/* Threads channel header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA]">
          <button onClick={() => toggleChannel("threads")} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-black">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068v-.064c0-3.518.85-6.372 2.495-8.423C5.845 1.277 8.599.095 12.18.071h.014c2.746.018 5.143.808 7.137 2.35 1.89 1.46 3.19 3.51 3.867 6.105l-2.012.54c-.55-2.07-1.586-3.696-3.078-4.832-1.584-1.213-3.564-1.826-5.889-1.82-2.94.02-5.086.92-6.37 2.67C4.568 6.89 3.937 9.19 3.937 12.004v.064c0 2.814.63 5.114 1.912 6.92 1.284 1.75 3.43 2.65 6.37 2.67 2.497.017 4.253-.557 5.5-1.752 1.392-1.332 2.094-3.31 2.086-5.876a7.2 7.2 0 0 0-.085-1.136h-7.558v-2.33h9.756c.112.573.168 1.176.168 1.793v.003c.013 3.363-.962 5.937-2.9 7.647-1.72 1.515-4.08 2.284-6.999 2.268Z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#151515]">Threads</p>
              {accountStatus === "connected"
                ? <p className="text-[11px] text-[#32C382]">Connected{username ? ` · @${username}` : ""}</p>
                : <p className="text-[11px] text-[#9A9A9A]">Connect to generate and post directly</p>}
            </div>
          </button>
          <div className="flex items-center gap-3 shrink-0">
            {accountStatus === "connected" && (
              <>
                <button onClick={(e) => { e.stopPropagation(); scanHistory(); }} disabled={scanningHistory}
                  className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium flex items-center gap-1">
                  {scanningHistory ? <Loader2 size={11} className="animate-spin" /> : null}
                  {dna ? "Re-scan" : "Scan history"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); disconnectThreads(); }} disabled={disconnecting}
                  className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors font-medium">
                  Disconnect
                </button>
              </>
            )}
            {accountStatus === "disconnected" && (
              <button onClick={(e) => { e.stopPropagation(); connectThreads(); }} disabled={connecting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
                {connecting ? <Loader2 size={12} className="animate-spin" /> : null}
                Connect
              </button>
            )}
            <button onClick={() => toggleChannel("threads")} className="text-[#9A9A9A] hover:text-[#151515] transition-colors ml-1">
              <ChevronDown size={14} className={cn("transition-transform", openChannels.has("threads") && "rotate-180")} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {openChannels.has("threads") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
              className="overflow-hidden border-t border-[#ECEDEE]">
        {accountStatus === "disconnected" && (
          <div className="px-5 py-4 text-center space-y-3">
            <p className="text-[12px] text-[#9A9A9A]">Connect your Threads account to generate, schedule, and post directly from here.</p>
            <button onClick={connectThreads} disabled={connecting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50">
              {connecting ? <Loader2 size={12} className="animate-spin" /> : null}
              Connect Threads
            </button>
          </div>
        )}
        {/* Content DNA */}
        {accountStatus === "connected" && (
          <div className="px-5 py-4 border-b border-[#ECEDEE]">
            {scanningHistory && (
              <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
                <Loader2 size={12} className="animate-spin" /> Scanning your post history…
              </div>
            )}
            {!scanningHistory && dna && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Content DNA · {dna.postCount} posts analysed</p>
                <div className="space-y-3">
                  {dna.summary
                    .split(/\n\n+|(?=\*\*What's Not Working\*\*|\*\*Next:\*\*|\*\*Next\*\*)/)
                    .map((s) => s.trim()).filter(Boolean)
                    .map((para, i) => {
                      // Detect numbered bullets like (1) ... (2) ... (3) and render as separate lines
                      const bulletParts = para.split(/(?=\s*\(\d+\)\s)/).map((s) => s.trim()).filter(Boolean);
                      const isNextPara = para.startsWith("**Next");
                      const renderInline = (text: string) =>
                        text.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                          part.startsWith("**") && part.endsWith("**")
                            ? <strong key={j} className="font-semibold text-[#151515]">{part.slice(2, -2)}</strong>
                            : part
                        );
                      if (isNextPara && bulletParts.length > 1) {
                        return (
                          <div key={i} className="space-y-1.5">
                            {bulletParts.map((bp, j) => (
                              <p key={j} className="text-[12px] text-[#62646A] leading-relaxed">{renderInline(bp)}</p>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <p key={i} className="text-[12px] text-[#62646A] leading-relaxed">{renderInline(para)}</p>
                      );
                    })}
                </div>
              </div>
            )}
            {!scanningHistory && !dna && (
              <button onClick={scanHistory} className="text-[12px] text-[#9A9A9A] hover:text-[#151515] transition-colors">
                Scan your post history → Sorene learns what works for your audience
              </button>
            )}
          </div>
        )}

        {/* Competitor Intelligence */}
        {accountStatus === "connected" && (
          <div className="px-5 py-4 border-b border-[#ECEDEE] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Competitor Intelligence</p>
              {competitors.some((c) => c.insights) && (
                <button onClick={analyzeCompetitors} disabled={analyzingCompetitors}
                  className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium flex items-center gap-1">
                  {analyzingCompetitors ? <Loader2 size={11} className="animate-spin" /> : null}
                  Re-analyze
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#9A9A9A]">Add accounts posting similar content — Sorene learns their patterns to improve your posts.</p>

            {/* Add input */}
            <div className="flex gap-2">
              <input
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                placeholder="@username"
                className="flex-1 text-[12px] px-3 py-2 rounded-xl border border-[#ECEDEE] bg-white focus:outline-none focus:border-[#151515] transition-colors placeholder:text-[#C4C4C4]"
              />
              <button onClick={addCompetitor} disabled={!competitorInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40">
                Add
              </button>
            </div>
            {competitorError && <p className="text-[11px] text-[#DF2E16]">{competitorError}</p>}

            {/* Competitor list */}
            {competitors.length > 0 && (
              <div className="space-y-2">
                {competitors.map((c) => (
                  <div key={c.username} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#151515]">@{c.username}</span>
                        {c.lastAnalyzedAt && (
                          <span className="text-[10px] text-[#32C382] font-medium">{c.postCount} posts analysed</span>
                        )}
                        {!c.lastAnalyzedAt && (
                          <span className="text-[10px] text-[#9A9A9A]">Not yet analysed</span>
                        )}
                      </div>
                      <button onClick={() => removeCompetitor(c.username)}
                        className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">
                        Remove
                      </button>
                    </div>
                    {c.insights && (
                      <div className="px-3 py-2.5 space-y-1.5">
                        {c.insights.split(/\n\n+/).map((para, i) => (
                          <p key={i} className="text-[11px] text-[#62646A] leading-relaxed">
                            {para.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                              part.startsWith("**") && part.endsWith("**")
                                ? <strong key={j} className="font-semibold text-[#151515]">{part.slice(2, -2)}</strong>
                                : part
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!competitors.every((c) => c.lastAnalyzedAt) || competitors.some((c) => !c.insights) ? (
                  <button onClick={analyzeCompetitors} disabled={analyzingCompetitors}
                    className="w-full py-2.5 rounded-xl border border-[#ECEDEE] text-[12px] font-semibold text-[#151515] hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {analyzingCompetitors ? <><Loader2 size={12} className="animate-spin" /> Analysing…</> : "Analyse all accounts →"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Plan a week */}
        <div className="border-t border-[#ECEDEE] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-[#FAFAFA] border-b border-[#ECEDEE]">
          <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0">
            <CalendarDays size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#151515]">Plan your week</p>
            <p className="text-[11px] text-[#9A9A9A]">
              Generate a full week of posts · review · approve all at once
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Best posting times */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Best posting times</p>
              <p className="text-[12px] text-[#151515] font-medium mt-0.5">{bestTimes.join(" & ")}</p>
            </div>
            <div className="text-right">
              {dna ? (
                <p className="text-[11px] text-[#32C382]">Optimised from your history · updates with each scan</p>
              ) : (
                <button onClick={scanHistory} disabled={scanningHistory} className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors underline underline-offset-2 decoration-dotted">
                  {scanningHistory ? "Scanning…" : "Scan history to personalise →"}
                </button>
              )}
            </div>
          </div>

          {/* CTA link */}
          <div>
            <p className="text-[12px] font-medium text-[#151515] mb-1.5">CTA link <span className="text-[#9A9A9A] font-normal">(optional)</span></p>
            <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)}
              placeholder="e.g. https://sorene.ai/waitlist"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[12px] text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
            <p className="text-[11px] text-[#9A9A9A] mt-1">Links go in the first comment, not the post — Threads suppresses link reach.</p>
          </div>

          {/* Guidance notes */}
          <div>
            <p className="text-[12px] font-medium text-[#151515] mb-1.5">Your notes <span className="text-[#9A9A9A] font-normal">(optional)</span></p>
            <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)}
              placeholder={"e.g. Focus on our beta launch this week. Avoid talking about pricing. Target corporate professionals thinking about starting a business."}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[12px] text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors resize-none" />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-[#9A9A9A]">Guide the AI — topics, things to avoid, tone.</p>
              <button onClick={async () => {
                try {
                  const { authFetch } = await import("@/lib/authFetch");
                  await authFetch(`/api/threads/drafts?project=${encodeURIComponent(project.title)}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ drafts: weekDrafts, ctaLink, cadence, slotOverrides, userNotes }),
                  });
                  setNotesSaved(true);
                  setTimeout(() => setNotesSaved(false), 2500);
                } catch { /* ignore */ }
              }} className={cn("text-[11px] px-3 py-1 rounded-lg font-medium transition-all", notesSaved ? "bg-[#32C382] text-white" : "bg-[#151515] text-white hover:bg-[#2a2a2a]")}>
                {notesSaved ? "Saved ✓" : "Save notes"}
              </button>
            </div>
          </div>

          {/* Generate options */}
          <div>
            <p className="text-[12px] font-medium text-[#151515] mb-2">Generate posts</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { mode: "single" as const, label: "1 post", sub: `Best slot: ${bestTimes[0]}` },
                { mode: 1 as const, label: "1 / day", sub: `${bestTimes[0]} · 7 posts` },
                { mode: 2 as const, label: "2 / day", sub: `${bestTimes.slice(0, 2).join(" & ")} · 14 posts` },
                { mode: 3 as const, label: "3 / day", sub: `${bestTimes.join(" & ")} · 21 posts` },
              ]).map(({ mode, label, sub }) => (
                <button key={String(mode)} onClick={() => { setGenerateMode(mode); generateWeek(mode); }} disabled={generating}
                  className={cn(
                    "flex flex-col items-start px-3.5 py-3 rounded-xl border text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                    generateMode === mode && generating
                      ? "bg-[#151515] border-[#151515] text-white"
                      : "bg-white border-gray-200 hover:border-[#151515] hover:bg-[#FAFAFA]"
                  )}>
                  <span className={cn("text-[13px] font-semibold", generateMode === mode && generating ? "text-white" : "text-[#151515]")}>
                    {generateMode === mode && generating ? <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Writing…</span> : label}
                  </span>
                  <span className={cn("text-[11px] mt-0.5", generateMode === mode && generating ? "text-white/70" : "text-[#9A9A9A]")}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly drafts — review + approve */}
      {weekDrafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-[#151515]">This week's posts</p>
              <p className="text-[11px] text-[#9A9A9A] mt-0.5">
                {weekDrafts.some((d) => !d.frozen)
                  ? "Edit any post, remove ones you don't like, then approve and schedule."
                  : "All scheduled — posts will go live at the times shown."}
              </p>
            </div>
            {successMsg && <span className="text-[11px] text-[#32C382] font-medium shrink-0">{successMsg}</span>}
          </div>

          {weekDrafts.filter((d) => !d.posted).map((draft, i) => {
            const effectiveSlot = slotOverrides[draft.id] ?? scheduleSlots[i];
            const effectiveDate = effectiveSlot ? new Date(effectiveSlot) : null;
            const slotDateVal = effectiveDate ? effectiveDate.toLocaleDateString("en-CA") : ""; // YYYY-MM-DD
            const slotTimeVal = effectiveDate ? effectiveDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
            const slotLabel = effectiveDate ? effectiveDate.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
            const hasCta = draft.text.includes("[ADD_LINK_IN_COMMENT]");
            const displayText = draft.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim();
            const isEditingSlot = editingSlot === draft.id;

            const pendingDate = pendingSlot[draft.id]?.date ?? slotDateVal;
            const pendingTime = pendingSlot[draft.id]?.time ?? slotTimeVal;
            const commitSlotEdit = () => {
              if (!pendingDate || !pendingTime) return;
              const ts = new Date(`${pendingDate}T${pendingTime}`).getTime();
              if (!isNaN(ts)) setSlotOverrides((prev) => ({ ...prev, [draft.id]: ts }));
            };

            return (
              <div key={draft.id} className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#FAFAFA] border-b border-[#ECEDEE]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wide">Day {Math.floor(i / cadence) + 1}{cadence === 2 ? ` · ${i % 2 === 0 ? "AM" : "PM"}` : ""}</p>
                    {slotLabel && (
                      <button onClick={() => setEditingSlot(isEditingSlot ? null : draft.id)}
                        className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors underline underline-offset-2 decoration-dotted">
                        {slotLabel}
                      </button>
                    )}
                    {hasCta && ctaLink && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">link in comment</span>}
                  </div>
                  {draft.frozen ? (
                    <div className="flex items-center gap-2">
                      {draft.posted ? (
                        <><CheckCircle2 size={11} className="text-[#32C382]" /><span className="text-[11px] text-[#32C382] font-medium">Posted</span></>
                      ) : draft.postFailed ? (
                        <><span className="text-[11px] text-red-500 font-medium">Failed to post{draft.failReason ? `: ${draft.failReason}` : ""}</span>
                        <button onClick={() => setWeekDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, frozen: false, postFailed: false, failReason: undefined, editing: false } : d))}
                          className="text-[11px] text-red-400 hover:text-red-600 transition-colors font-medium underline underline-offset-2">
                          Retry
                        </button></>
                      ) : (
                        <><Lock size={11} className="text-[#9A9A9A]" /><span className="text-[11px] text-[#9A9A9A] font-medium">Scheduled</span>
                        <button onClick={() => setWeekDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, frozen: false, editing: true } : d))}
                          className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium underline underline-offset-2">
                          Edit
                        </button></>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-[11px]", displayText.length > 500 ? "text-red-500" : "text-[#9A9A9A]")}>{displayText.length}/500</span>
                      <button onClick={() => toggleEdit(draft.id)}
                        className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors font-medium">
                        {draft.editing ? "Done" : "Edit"}
                      </button>
                      <button onClick={() => discardDraft(draft.id)} className="text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isEditingSlot && !draft.posted && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                      className="overflow-hidden border-b border-[#ECEDEE]">
                      <div className="px-4 py-3 bg-white flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-[#9A9A9A] font-medium">Change schedule:</p>
                        <input type="date" value={pendingDate}
                          min={new Date().toLocaleDateString("en-CA")}
                          onChange={(e) => setPendingSlot((prev) => ({ ...prev, [draft.id]: { date: e.target.value, time: pendingTime } }))}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-[#151515] focus:outline-none focus:border-[#151515] transition-colors" />
                        <input type="time" value={pendingTime}
                          onChange={(e) => setPendingSlot((prev) => ({ ...prev, [draft.id]: { date: pendingDate, time: e.target.value } }))}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-[#151515] focus:outline-none focus:border-[#151515] transition-colors" />
                        <button onClick={() => { commitSlotEdit(); setEditingSlot(null); }}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-[#151515] text-white font-medium hover:bg-[#2a2a2a] transition-colors">
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={cn("p-4 space-y-3", draft.posted && "opacity-40")}>
                  {draft.editing && !draft.posted ? (
                    <textarea value={displayText} onChange={(e) => updateDraft(draft.id, e.target.value + (hasCta ? "\n[ADD_LINK_IN_COMMENT]" : ""))}
                      rows={4} maxLength={500}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-[#151515] resize-none focus:outline-none focus:border-[#151515] transition-colors" />
                  ) : (
                    <p className="text-[13px] text-[#151515] leading-relaxed whitespace-pre-wrap">{displayText}</p>
                  )}
                  {hasCta && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 space-y-1.5">
                      <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">First comment (auto-posted)</p>
                      {ctaLink ? (
                        <textarea
                          value={draft.ctaComment ?? ctaLink}
                          onChange={(e) => setWeekDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, ctaComment: e.target.value } : d))}
                          rows={2}
                          className="w-full bg-transparent text-[12px] text-blue-700 resize-none focus:outline-none placeholder-blue-300"
                          placeholder={ctaLink}
                        />
                      ) : (
                        <p className="text-[11px] text-blue-400 italic">Add your CTA link above to enable</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Approve and schedule */}
          {accountStatus === "connected" && weekDrafts.some((d) => !d.frozen && !d.posted) && (
            <div className="space-y-2">
              {errorMsg && (
                <p className="text-[12px] text-red-500 text-center px-2">{errorMsg}</p>
              )}
              <button onClick={approveAll} disabled={approvingAll}
                className="w-full py-3 rounded-2xl bg-[#151515] text-white text-[13px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {approvingAll
                  ? <><Loader2 size={13} className="animate-spin" /> Scheduling…</>
                  : <>Approve and schedule {weekDrafts.filter((d) => !d.frozen && !d.posted).length} posts</>}
              </button>
            </div>
          )}

          {/* Posted section */}
          {weekDrafts.some((d) => d.posted) && (
            <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
              <button onClick={() => setPostedOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#32C382]" />
                  <p className="text-[12px] font-semibold text-[#151515]">Posted</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8FBF0] text-[#32C382] font-semibold">{weekDrafts.filter((d) => d.posted).length}</span>
                </div>
                <ChevronDown size={14} className={cn("text-[#9A9A9A] transition-transform", postedOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {postedOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                    className="overflow-hidden divide-y divide-[#ECEDEE]">
                    {weekDrafts.filter((d) => d.posted).map((draft) => {
                      const displayText = draft.text.replace(/\[ADD_LINK_IN_COMMENT\]\s*$/, "").trim();
                      return (
                        <div key={draft.id} className="px-4 py-3 flex items-start gap-3">
                          <p className="text-[12px] text-[#9A9A9A] leading-relaxed flex-1 line-clamp-2">{displayText}</p>
                          <button onClick={() => setWeekDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                            className="text-[#BCBCBC] hover:text-[#DF2E16] transition-colors shrink-0 mt-0.5">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Scheduled queue — fallback for legacy users with no draft batch (weekDrafts already shows these otherwise) */}
      {scheduledPosts.length > 0 && weekDrafts.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[#9A9A9A]" />
            <p className="text-[12px] font-semibold text-[#151515]">Scheduled Queue</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#9A9A9A] font-semibold">{scheduledPosts.length}</span>
          </div>
          <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden divide-y divide-[#ECEDEE]">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#151515] leading-relaxed line-clamp-2">{post.text}</p>
                  <p className="text-[10px] text-[#9A9A9A] mt-1">{new Date(post.scheduledAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <button onClick={() => cancelScheduled(post.id)} className="text-[#BCBCBC] hover:text-[#DF2E16] transition-colors shrink-0 mt-0.5">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published scheduled posts — fallback for legacy users with no draft batch */}
      {publishedScheduled.length > 0 && weekDrafts.length === 0 && (
        <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
          <button onClick={() => setPostedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#32C382]" />
              <p className="text-[12px] font-semibold text-[#151515]">Posted</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8FBF0] text-[#32C382] font-semibold">{publishedScheduled.length}</span>
            </div>
            <ChevronDown size={14} className={cn("text-[#9A9A9A] transition-transform", postedOpen && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {postedOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                className="overflow-hidden divide-y divide-[#ECEDEE]">
                {publishedScheduled.map((post) => (
                  <div key={post.id} className="px-4 py-3 flex items-start gap-3">
                    <p className="text-[12px] text-[#9A9A9A] leading-relaxed flex-1 line-clamp-2">{post.text}</p>
                    <p className="text-[10px] text-[#9A9A9A] shrink-0 mt-0.5">{new Date(post.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── X (Twitter) channel ── */}
      <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden self-start">
        <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA]">
          <button onClick={() => toggleChannel("x")} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-black">{X_ICON}</div>
            <div>
              <p className="text-[13px] font-semibold text-[#151515]">X (Twitter)</p>
              {xStatus === "connected"
                ? <p className="text-[11px] text-[#32C382]">Connected{xUsername ? ` · @${xUsername}` : ""}</p>
                : <p className="text-[11px] text-[#9A9A9A]">Bring your own API keys · free to connect</p>}
            </div>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {xStatus === "connected" && (
              <button onClick={(e) => { e.stopPropagation(); disconnectX(); }}
                className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors font-medium">Disconnect</button>
            )}
            {xStatus === "disconnected" && (
              <button onClick={(e) => { e.stopPropagation(); setXKeyForm(true); toggleChannel("x"); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors">
                Connect
              </button>
            )}
            <button onClick={() => toggleChannel("x")} className="text-[#9A9A9A] hover:text-[#151515] transition-colors ml-1">
              <ChevronDown size={14} className={cn("transition-transform", openChannels.has("x") && "rotate-180")} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {openChannels.has("x") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
              className="overflow-hidden border-t border-[#ECEDEE]">

              {/* Setup flow — disconnected */}
              {xStatus === "disconnected" && (
                <div className="p-5 space-y-4">
                  {/* Tab switcher */}
                  <div className="flex gap-1 p-1 bg-[#F5F5F5] rounded-xl">
                    {(["instructions", "keys"] as const).map((tab) => (
                      <button key={tab} onClick={() => setXSetupStep(tab)}
                        className={cn("flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                          xSetupStep === tab ? "bg-white text-[#151515] shadow-sm" : "text-[#9A9A9A] hover:text-[#151515]")}>
                        {tab === "instructions" ? "How to connect" : "Enter API keys"}
                      </button>
                    ))}
                  </div>

                  {xSetupStep === "instructions" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {[
                          { n: "1", text: "Go to developer.twitter.com and sign in with your X account" },
                          { n: "2", text: 'Click "+ Create Project" — give it any name, select "Making a bot" as the use case' },
                          { n: "3", text: 'Inside the project, create an App. Under "User authentication settings", enable OAuth 1.0a with Read and Write permissions' },
                          { n: "4", text: 'Go to "Keys and Tokens" — copy your API Key and API Key Secret' },
                          { n: "5", text: 'Under "Access Token and Secret", click Generate — copy both values. Make sure it shows "Read and Write" not "Read Only"' },
                          { n: "6", text: 'Paste all 4 keys into the "Enter API keys" tab and hit Connect' },
                        ].map(({ n, text }) => (
                          <div key={n} className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                            <p className="text-[12px] text-[#62646A] leading-relaxed">{text}</p>
                          </div>
                        ))}
                      </div>
                      <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-black text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors">
                        Open X Developer Portal →
                      </a>
                      <button onClick={() => setXSetupStep("keys")}
                        className="w-full py-2.5 rounded-xl border border-[#ECEDEE] text-[12px] font-semibold text-[#151515] hover:bg-[#FAFAFA] transition-colors">
                        I have my keys →
                      </button>
                    </div>
                  )}

                  {xSetupStep === "keys" && (
                    <div className="space-y-3">
                      {[
                        { key: "apiKey" as const, label: "API Key" },
                        { key: "apiSecret" as const, label: "API Key Secret" },
                        { key: "accessToken" as const, label: "Access Token" },
                        { key: "accessTokenSecret" as const, label: "Access Token Secret" },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#151515]">{label}</label>
                          <input type="password" value={xKeys[key]}
                            onChange={(e) => setXKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`Paste your ${label}`}
                            className="w-full text-[12px] px-3 py-2.5 rounded-xl border border-[#ECEDEE] bg-white focus:outline-none focus:border-[#151515] transition-colors placeholder:text-[#C4C4C4]" />
                        </div>
                      ))}
                      {xConnectError && <p className="text-[11px] text-[#DF2E16]">{xConnectError}</p>}
                      <button onClick={connectX} disabled={xConnecting || !xKeys.apiKey || !xKeys.apiSecret || !xKeys.accessToken || !xKeys.accessTokenSecret}
                        className="w-full py-2.5 rounded-xl bg-black text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                        {xConnecting ? <><Loader2 size={12} className="animate-spin" /> Verifying…</> : "Connect X account"}
                      </button>
                    </div>
                  )}

                  {/* Inline help chat */}
                  <div className="border-t border-[#ECEDEE] pt-4 space-y-3">
                    <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wide">Ask Sorene for help</p>
                    {xHelpMessages.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {xHelpMessages.map((m, i) => (
                          <div key={i} className={cn("px-3 py-2 rounded-xl text-[12px] leading-relaxed",
                            m.role === "user" ? "bg-[#F5F5F5] text-[#151515]" : "bg-[#E8FBF0] text-[#151515]")}>
                            {m.content}
                          </div>
                        ))}
                        {xHelpLoading && <div className="px-3 py-2 rounded-xl bg-[#E8FBF0] text-[12px] text-[#9A9A9A]"><Loader2 size={11} className="animate-spin inline mr-1" />Thinking…</div>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={xHelpInput} onChange={(e) => setXHelpInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendXHelp()}
                        placeholder="e.g. Where do I find my Access Token?"
                        className="flex-1 text-[12px] px-3 py-2 rounded-xl border border-[#ECEDEE] bg-white focus:outline-none focus:border-[#151515] transition-colors placeholder:text-[#C4C4C4]" />
                      <button onClick={sendXHelp} disabled={!xHelpInput.trim() || xHelpLoading}
                        className="px-3 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40">
                        Ask
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Connected — generate & schedule */}
              {xStatus === "connected" && (
                <div className="divide-y divide-[#ECEDEE]">
                  {/* Generate section */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Plan your week</p>
                        <p className="text-[11px] text-[#9A9A9A] mt-0.5">1 post/day · 7 days · 280 chars max</p>
                      </div>
                      <button onClick={generateXWeek} disabled={xGenerating}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40">
                        {xGenerating ? <><Loader2 size={12} className="animate-spin" />Generating…</> : "Generate week"}
                      </button>
                    </div>

                    {/* Draft list */}
                    {xDrafts.filter((d) => !d.posted).map((draft, i) => (
                      <div key={draft.id} className={cn("rounded-2xl border overflow-hidden", draft.frozen ? "border-[#E8FBF0] bg-[#FAFFFE]" : "border-[#ECEDEE]")}>
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
                          <p className="text-[11px] font-semibold text-[#9A9A9A]">Post {i + 1}</p>
                          {draft.frozen ? (
                            draft.postFailed
                              ? <span className="text-[10px] text-[#DF2E16] font-semibold">Failed</span>
                              : <span className="text-[10px] text-[#32C382] font-semibold flex items-center gap-1"><CheckCircle2 size={10} /> Scheduled</span>
                          ) : (
                            <button onClick={() => setXDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                              className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">Remove</button>
                          )}
                        </div>
                        <div className="p-4">
                          {draft.editing ? (
                            <textarea value={draft.text} rows={3}
                              onChange={(e) => setXDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, text: e.target.value } : d))}
                              className="w-full text-[12px] text-[#151515] leading-relaxed resize-none focus:outline-none bg-transparent" />
                          ) : (
                            <p className={cn("text-[12px] text-[#151515] leading-relaxed whitespace-pre-wrap", draft.frozen && "opacity-60")}>{draft.text}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn("text-[10px] font-medium", draft.text.length > 280 ? "text-[#DF2E16]" : "text-[#9A9A9A]")}>{draft.text.length}/280</span>
                            {!draft.frozen && (
                              <button onClick={() => setXDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, editing: !d.editing } : d))}
                                className="text-[11px] text-[#9A9A9A] hover:text-[#151515] transition-colors">
                                {draft.editing ? "Done" : "Edit"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {xSuccessMsg && <p className="text-[12px] text-[#32C382] font-semibold text-center">{xSuccessMsg}</p>}
                    {xErrorMsg && <p className="text-[12px] text-[#DF2E16] text-center">{xErrorMsg}</p>}

                    {xDrafts.some((d) => !d.frozen && !d.posted) && (
                      <button onClick={approveAllX} disabled={xApprovingAll}
                        className="w-full py-3 rounded-2xl bg-black text-white text-[13px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                        {xApprovingAll ? <><Loader2 size={13} className="animate-spin" />Scheduling…</> : <>Approve and schedule {xDrafts.filter((d) => !d.frozen && !d.posted).length} posts</>}
                      </button>
                    )}
                  </div>

                  {/* Posted section */}
                  {xDrafts.some((d) => d.posted) && (
                    <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
                      <button onClick={() => setXPostedOpen((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-[#32C382]" />
                          <p className="text-[12px] font-semibold text-[#151515]">Posted</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8FBF0] text-[#32C382] font-semibold">{xDrafts.filter((d) => d.posted).length}</span>
                        </div>
                        <ChevronDown size={14} className={cn("text-[#9A9A9A] transition-transform", xPostedOpen && "rotate-180")} />
                      </button>
                      {xPostedOpen && (
                        <div className="divide-y divide-[#ECEDEE]">
                          {xDrafts.filter((d) => d.posted).map((draft) => (
                            <div key={draft.id} className="px-4 py-3 flex items-start gap-3">
                              <CheckCircle2 size={13} className="text-[#32C382] shrink-0 mt-0.5" />
                              <p className="text-[12px] text-[#9A9A9A] leading-relaxed flex-1 line-clamp-2">{draft.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* end 2-col grid */}

      {/* ── Reddit channel ── */}
      <div className="col-span-1 md:col-span-2 rounded-2xl border border-[#ECEDEE] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA]">
          <button onClick={() => toggleChannel("reddit")} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#FF4500]">
              {REDDIT_ICON}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#151515]">Reddit</p>
              <p className="text-[11px] text-[#9A9A9A]">
                {redditStatus === "connected" ? `u/${redditUsername} · community engagement agent` : "Subreddit monitoring · reply drafting · community growth"}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {redditStatus === "connected" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8FBF0] text-[#32C382] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32C382]" />Connected
              </span>
            )}
            <button onClick={() => toggleChannel("reddit")} className="text-[#9A9A9A] hover:text-[#151515] transition-colors ml-1">
              <ChevronDown size={14} className={cn("transition-transform", openChannels.has("reddit") && "rotate-180")} />
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {openChannels.has("reddit") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
              className="overflow-hidden border-t border-[#ECEDEE]">
              <div className="p-5 space-y-5">

                {/* Reddit Tips (collapsible) */}
                <div className="rounded-xl border border-[#ECEDEE] overflow-hidden">
                  <button onClick={() => setRedditTipsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors text-left">
                    <p className="text-[12px] font-semibold text-[#151515]">Reddit Tips — Do&apos;s &amp; Don&apos;ts</p>
                    <ChevronDown size={13} className={cn("text-[#9A9A9A] transition-transform", redditTipsOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {redditTipsOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-[#32C382] uppercase tracking-wide mb-2">Do</p>
                            {["Answer the question genuinely before mentioning your product", "Be a helpful community member first — build karma over time", "Mention your product only when it&apos;s directly relevant", "Disclose your affiliation when it makes sense (\"I built this\")", "Reply to comments on your replies — engagement matters", "Post in smaller, niche subreddits where you can add real value", "Read each subreddit&apos;s rules before posting anything"].map((tip) => (
                              <p key={tip} className="text-[11px] text-[#62646A] leading-relaxed flex gap-1.5"><span className="text-[#32C382] shrink-0">✓</span>{tip.replace(/&apos;/g, "'")}</p>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-[#DF2E16] uppercase tracking-wide mb-2">Don&apos;t</p>
                            {["Drop links without context — auto-moderators will remove it", "Use the same reply template in multiple subreddits", "Post only self-promotional content — 9:1 rule (give:take)", "DM users to pitch your product after replying", "Create fake accounts or upvote rings", "Spam subreddits with frequent posts about your product", "Ignore subreddit rules — bans are hard to reverse"].map((tip) => (
                              <p key={tip} className="text-[11px] text-[#62646A] leading-relaxed flex gap-1.5"><span className="text-[#DF2E16] shrink-0">✗</span>{tip.replace(/&apos;/g, "'")}</p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Connect Reddit */}
                {redditStatus === "disconnected" && (
                  <div className="rounded-xl border border-[#ECEDEE] bg-[#FAFAFA] p-4 space-y-3">
                    <p className="text-[13px] font-semibold text-[#151515]">Connect your Reddit account</p>
                    <p className="text-[12px] text-[#9A9A9A] leading-relaxed">Sorene monitors subreddits for conversations where your product is relevant, drafts helpful replies, and lets you post with one click.</p>
                    <button onClick={connectReddit}
                      className="px-4 py-2.5 rounded-xl bg-[#FF4500] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity">
                      Connect Reddit
                    </button>
                  </div>
                )}

                {redditStatus === "loading" && (
                  <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#9A9A9A]" /></div>
                )}

                {redditStatus === "connected" && (
                  <div className="space-y-5">
                    {/* Account info + disconnect */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-semibold text-[#151515]">u/{redditUsername}</p>
                        {redditKarma > 0 && <p className="text-[11px] text-[#9A9A9A]">{redditKarma.toLocaleString()} karma</p>}
                      </div>
                      <button onClick={async () => { const { authFetch } = await import("@/lib/authFetch"); await authFetch(`/api/reddit/account?project=${encodeURIComponent(project.title)}`, { method: "DELETE" }); setRedditStatus("disconnected"); setRedditUsername(""); setRedditKarma(0); }}
                        className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors">Disconnect</button>
                    </div>

                    {/* Subreddit Watchlist */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Subreddit Watchlist</p>
                      <p className="text-[11px] text-[#9A9A9A]">Sorene monitors these subreddits for keyword matches and surfaces relevant threads to reply to.</p>

                      {/* Sorene suggestions */}
                      {suggestedSubs.length > 0 && (
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
                          <p className="text-[11px] font-semibold text-orange-700">Sorene suggests</p>
                          {suggestedSubs.map((s) => (
                            <div key={s.name} className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-[#151515]">r/{s.name}</p>
                                <p className="text-[11px] text-[#62646A] leading-snug">{s.reason}</p>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button onClick={() => acceptSuggestedSub(s.name, s.reason)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#151515] text-white font-semibold hover:bg-[#2a2a2a] transition-colors">Add</button>
                                <button onClick={() => dismissSuggestedSub(s.name)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#ECEDEE] text-[#9A9A9A] hover:text-[#DF2E16] hover:border-[#DF2E16] transition-colors">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User watchlist */}
                      {watchedSubreddits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedSubreddits.map((s) => (
                            <div key={s.name} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border", s.addedBy === "sorene" && !s.approved ? "border-orange-300 bg-orange-50 text-orange-700" : "border-[#ECEDEE] bg-[#FAFAFA] text-[#151515]")}>
                              <span>r/{s.name}</span>
                              {s.addedBy === "sorene" && !s.approved && (
                                <button onClick={() => approveSubreddit(s.name)} className="text-orange-600 hover:text-orange-800 transition-colors font-semibold">Approve</button>
                              )}
                              <button onClick={() => removeSubreddit(s.name)} className="text-[#C4C4C4] hover:text-[#DF2E16] transition-colors ml-0.5">✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add subreddit input */}
                      <div className="flex gap-2">
                        <input value={subInput} onChange={(e) => setSubInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSubreddit()}
                          placeholder="r/entrepreneur"
                          className="flex-1 text-[12px] px-3 py-2 rounded-xl border border-[#ECEDEE] bg-white focus:outline-none focus:border-[#151515] transition-colors placeholder:text-[#C4C4C4]" />
                        <button onClick={addSubreddit} disabled={!subInput.trim()}
                          className="px-3.5 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40">Add</button>
                        <button onClick={suggestSubreddits} disabled={suggestingReddit}
                          className="px-3.5 py-2 rounded-xl border border-[#ECEDEE] text-[#151515] text-[12px] font-semibold hover:bg-[#FAFAFA] transition-colors disabled:opacity-40 flex items-center gap-1.5">
                          {suggestingReddit ? <Loader2 size={11} className="animate-spin" /> : null}
                          Ask Sorene
                        </button>
                      </div>
                    </div>

                    {/* Keyword Alerts */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Keyword Alerts</p>
                      <p className="text-[11px] text-[#9A9A9A]">Sorene alerts you when these keywords appear in monitored subreddits.</p>
                      {redditKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {redditKeywords.map((kw) => (
                            <div key={kw} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#ECEDEE] bg-[#FAFAFA] text-[#151515]">
                              <span>{kw}</span>
                              <button onClick={() => removeKeyword(kw)} className="text-[#C4C4C4] hover:text-[#DF2E16] transition-colors">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                          placeholder="e.g. landing page, conversion rate"
                          className="flex-1 text-[12px] px-3 py-2 rounded-xl border border-[#ECEDEE] bg-white focus:outline-none focus:border-[#151515] transition-colors placeholder:text-[#C4C4C4]" />
                        <button onClick={addKeyword} disabled={!kwInput.trim()}
                          className="px-3.5 py-2 rounded-xl bg-[#151515] text-white text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40">Add</button>
                      </div>
                    </div>

                    {/* Opportunities feed */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-[#151515] uppercase tracking-wide">Opportunities</p>
                        <button onClick={scanOpportunities} disabled={scanningOpportunities || watchedSubreddits.filter((s) => s.addedBy === "user" || s.approved).length === 0 || redditKeywords.length === 0}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-[#151515] text-white font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 flex items-center gap-1.5">
                          {scanningOpportunities ? <><Loader2 size={11} className="animate-spin" />Scanning…</> : "Scan now"}
                        </button>
                      </div>
                      {redditSuccessMsg && <p className="text-[12px] text-[#32C382] font-semibold">{redditSuccessMsg}</p>}
                      {(watchedSubreddits.filter((s) => s.addedBy === "user" || s.approved).length === 0 || redditKeywords.length === 0) && (
                        <p className="text-[11px] text-[#9A9A9A]">Add subreddits and keywords above, then scan for threads to reply to.</p>
                      )}
                      {redditOpportunities.filter((o) => !o.dismissed && !o.posted).length > 0 && (
                        <div className="space-y-3">
                          {redditOpportunities.filter((o) => !o.dismissed && !o.posted).map((opp) => (
                            <div key={opp.id} className="rounded-xl border border-[#ECEDEE] overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#ECEDEE]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-semibold text-[#FF4500]">r/{opp.subreddit}</span>
                                  <span className="text-[10px] text-[#9A9A9A] truncate">{opp.title}</span>
                                </div>
                                <button onClick={() => dismissOpportunity(opp.id)} className="text-[11px] text-[#9A9A9A] hover:text-[#DF2E16] transition-colors shrink-0 ml-2">Dismiss</button>
                              </div>
                              <div className="p-3 space-y-2">
                                <textarea
                                  defaultValue={opp.draftReply}
                                  onBlur={(e) => updateOpportunityDraft(opp.id, e.target.value)}
                                  rows={4}
                                  className="w-full text-[12px] text-[#151515] leading-relaxed resize-none focus:outline-none bg-transparent border border-[#ECEDEE] rounded-lg px-3 py-2 focus:border-[#151515] transition-colors"
                                />
                                <div className="flex items-center gap-2">
                                  <button onClick={() => postOpportunity(opp)}
                                    className="px-3.5 py-2 rounded-xl bg-[#FF4500] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity">Post reply</button>
                                  <a href={opp.url} target="_blank" rel="noopener noreferrer"
                                    className="px-3.5 py-2 rounded-xl border border-[#ECEDEE] text-[11px] text-[#151515] font-semibold hover:bg-[#FAFAFA] transition-colors flex items-center gap-1">
                                    View thread <ArrowRight size={10} />
                                  </a>
                                  <span className="text-[10px] text-[#9A9A9A] ml-auto">{opp.relevanceScore} keyword{opp.relevanceScore !== 1 ? "s" : ""} matched</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Posted */}
                      {redditOpportunities.some((o) => o.posted) && (
                        <p className="text-[11px] text-[#9A9A9A]">{redditOpportunities.filter((o) => o.posted).length} replies posted</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ── Agent detail panel ─────────────────────────────────────────────────────
function AgentDetail({ agent, project }: { agent: AgentDef; project: DirectionCardData | null }) {
  if (agent.id === "customer_research") return <CustomerResearchAgentUI project={project} />;
  if (agent.id === "outreach") return <OutreachAgentUI project={project} />;
  if (agent.id === "content_social") return <ContentSocialAgentUI project={project} />;

  return (
    <div className="p-6 space-y-6">
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">What it does</h4>
        <Separator className="bg-gray-100 mb-5" />
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {agent.whatItDoes.map((f, i) => (
            <div key={i} className="flex items-start gap-3 py-3.5">
              <CheckCircle2 size={14} className="text-[#32C382] shrink-0 mt-0.5" />
              <p className="text-label-medium text-[#151515]">{f}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">What you get</h4>
        <Separator className="bg-gray-100 mb-5" />
        <div className="rounded-2xl border border-[#ECEDEE] bg-[#FAFAFA] px-4 py-3">
          <p className="text-[13px] text-[#151515] leading-relaxed">{agent.output}</p>
        </div>
      </section>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-[#9A9A9A] font-medium">Coming soon</span>
        <p className="text-[12px] text-[#9A9A9A]">This agent is on the roadmap.</p>
      </div>
    </div>
  );
}

function AgentsContent({ project }: { project: DirectionCardData | null }) {
  return (
    <div className="p-5 space-y-6">
      {AGENT_TIERS.map((tier) => (
        <section key={tier.tier}>
          <div className="flex items-baseline gap-3 mb-1">
            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-[#151515]">{tier.label}</h4>
            <span className="text-[11px] text-[#9A9A9A]">{tier.agents.length} agents</span>
          </div>
          <p className="text-[12px] text-[#62646A] mb-4">{tier.blurb}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tier.agents.map((agent) => (
              <FolderCard
                key={agent.id}
                folder={{
                  id: agent.id,
                  gradient: agent.gradient,
                  iconNode: <agent.icon size={18} />,
                  title: agent.name,
                  tagline: agent.tagline,
                  description: agent.description,
                  content: <AgentDetail agent={agent} project={project} />,
                  fullWidth: agent.id === "content_social",
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Connect tab content (formerly Direct Sync)
// ─────────────────────────────────────────────

const WA_ICON = (
  <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path d="M22.5 9.5A9 9 0 0 0 7.1 20.4L6 26l5.7-1.5A9 9 0 1 0 22.5 9.5zm-6.5 13.8a7.5 7.5 0 0 1-3.8-1l-.3-.2-3.4.9.9-3.3-.2-.3a7.5 7.5 0 1 1 6.8 3.9zm4.1-5.6c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1l-.6.8c-.1.2-.2.2-.4.1a6 6 0 0 1-1.7-1 6.3 6.3 0 0 1-1.2-1.4c-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.3-.5-.3h-.4c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 .9 2.4 10.3 10.3 0 0 0 3.9 3.4c.5.2.9.4 1.3.5a3.2 3.2 0 0 0 1.4.1 2.4 2.4 0 0 0 1.6-1.1c.2-.4.2-.7.1-.9z" fill="white" />
  </svg>
);

const TG_ICON = (
  <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
    <circle cx="16" cy="16" r="16" fill="#229ED9" />
    <path d="M22.8 9.6l-2.9 13.7c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.3-.9.3l.3-4.8 8.1-7.3c.4-.3-.1-.5-.5-.2L8.7 17.8l-4.5-1.4c-1-.3-1-.9.2-1.4l17.6-6.8c.8-.3 1.5.2 1.3 1.4z" fill="white" />
  </svg>
);

const DISCORD_ICON = (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
    <circle cx="16" cy="16" r="16" fill="#5865F2" />
    <path d="M22.2 10.5a15 15 0 0 0-3.7-1.1l-.2.3c1.4.3 2.7.9 3.9 1.6a12.9 12.9 0 0 0-8.4-.3c-.4.1-.7.2-1 .3 1.2-.8 2.6-1.3 4-1.6l-.1-.3a15 15 0 0 0-3.8 1.2C10.4 13.8 9.4 17 9.4 20.2c1.2 1.4 3 2.3 4.9 2.3l.6-1a9 9 0 0 1-2.5-1.2l.6-.4a9.3 9.3 0 0 0 7.9 0l.6.4a9 9 0 0 1-2.6 1.2l.6 1c1.9 0 3.7-.9 4.9-2.3.1-3.2-.9-6.4-3.2-9.7zm-8.8 7.8c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6zm5.3 0c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6z" fill="white" />
  </svg>
);

const FB_ICON = (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
    <circle cx="16" cy="16" r="16" fill="#1877F2" />
    <path d="M21 16h-3v10h-4V16h-2v-3.5h2v-2c0-2.5 1.5-4 4-4 1.1 0 2.2.1 3 .2V10h-2c-1.1 0-1.3.5-1.3 1.3v1.2H21L20.5 16z" fill="white" />
  </svg>
);

const COMMUNITY_CHANNELS = [
  { id: "discord",   label: "Discord",   icon: DISCORD_ICON,  description: "Join our Discord — daily standups, founder channels, co-working sessions, and the fastest path to real peer accountability.",   color: "#5865F2", link: "https://discord.gg/2YtvCm2SWp" },
  { id: "whatsapp",  label: "WhatsApp",  icon: WA_ICON,       description: "A private WhatsApp community for Sorene founders. Share wins, ask questions, get feedback — in a group that understands early-stage.",   color: "#25D366", link: "https://chat.whatsapp.com/DdV5otkoSdV0tLmg1RUxrG" },
  { id: "facebook",  label: "Facebook",  icon: FB_ICON,       description: "The Sorene Facebook Group — weekly challenges, founder spotlights, and a broader network of entrepreneurs at every stage.",            color: "#1877F2", link: "https://www.facebook.com/groups/sorene" },
];

type ConnectSetting = {
  id: string;
  label: string;
  description: string;
  type: "toggle" | "select";
  options?: string[];
  defaultValue: string | boolean;
};

const CHANNEL_SETTINGS: Record<"whatsapp", ConnectSetting[]> = {
  whatsapp: [
    { id: "reminder_freq",  label: "Business update reminders",   description: "Push a daily or weekly prompt to share your business status.",   type: "select", options: ["Off", "Daily", "Weekly"], defaultValue: "Weekly" },
    { id: "knowledge",      label: "Business knowledge snippets", description: "Receive a curated business tip via WhatsApp each day.",          type: "select", options: ["Off", "Daily"],           defaultValue: "Off" },
    { id: "checkin_prompt", label: "Accountability check-in",     description: "Sorene checks in on your tasks at the hour you choose.",         type: "toggle", defaultValue: false },
  ],
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const suffix = i < 12 ? "AM" : "PM";
  const h = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${h}:00 ${suffix}` };
});
const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MESSENGER_FEATURES: string[] = [];

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none shrink-0">
      {HOUR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function DaySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none shrink-0">
      {DAY_OPTIONS.map((d) => <option key={d}>{d}</option>)}
    </select>
  );
}

type WaSettings = {
  activeProjectTitle?: string;
  reminder_freq?: string;
  reminder_hour?: number;
  reminder_day?: string;
  knowledge?: string;
  knowledge_hour?: number;
  checkin_prompt?: boolean;
  checkin_hour?: number;
};

function MessengerConnectCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState<"whatsapp" | null>(null);
  const [waSettings, setWaSettings] = useState<WaSettings>({
    reminder_freq: "Weekly",
    reminder_hour: 8,
    reminder_day: "Mon",
    knowledge: "Off",
    knowledge_hour: 8,
    checkin_prompt: false,
    checkin_hour: 8,
  });
  const [projects, setProjects] = useState<{ title: string }[]>([]);
  const [linkState, setLinkState] = useState<Record<string, "idle" | "loading" | "linked">>({ whatsapp: "idle" });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings + projects on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { authFetch } = await import("@/lib/authFetch");
        const [settingsRes, projectsRes] = await Promise.all([
          authFetch("/api/messaging/whatsapp/settings"),
          authFetch("/api/execution-projects/list"),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings && typeof data.settings === "object") {
            setWaSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          if (data.projects?.length) setProjects(data.projects);
        }
      } catch { /* ignore */ }
    };
    load();
  }, []);

  // Debounce-save settings to Firestore
  const saveSettings = (updated: WaSettings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { authFetch } = await import("@/lib/authFetch");
        await authFetch("/api/messaging/whatsapp/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
      } catch { /* ignore */ }
    }, 600);
  };

  const updateSetting = <K extends keyof WaSettings>(key: K, val: WaSettings[K]) => {
    setWaSettings((prev) => {
      const next = { ...prev, [key]: val };
      saveSettings(next);
      return next;
    });
  };

  const handleLink = async (platform: "whatsapp") => {
    if (linkState[platform] !== "idle") return;
    setLinkState((prev) => ({ ...prev, [platform]: "loading" }));
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/messaging/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error("Failed");
      const { deepLink } = await res.json();
      window.open(deepLink, "_blank");
      setLinkState((prev) => ({ ...prev, [platform]: "linked" }));
    } catch {
      setLinkState((prev) => ({ ...prev, [platform]: "idle" }));
    }
  };

  const gradient = "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #34D399 34.62%, #059669 100%)";

  return (
    <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col"
    >
      {/* Gradient header */}
      <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className="flex flex-col relative p-5 pb-8"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex justify-between items-start relative z-10 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-semibold text-white truncate">Connect via WhatsApp</p>
              <p className="text-[12px] sm:text-[13px] text-white/80 mt-0.5 leading-relaxed">Your coach is now in your pocket. Get sharp, personalised coaching on the go, log customer conversations instantly, and stay on track with daily check-ins and reminders — all through WhatsApp.</p>
            </div>
          </div>
          <button onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0 mt-0.5">
            <ChevronDown size={15} className={cn("text-white transition-transform", isExpanded ? "" : "-rotate-90")} />
          </button>
        </div>
      </motion.div>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-3">
              {/* WhatsApp row */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: "#25D36620" }}>
                    {WA_ICON}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#151515]">WhatsApp</p>
                    <p className="text-[11px] text-[#9A9A9A] hidden sm:block">Real-time coaching · Weekly check-ins · Progress tracking</p>
                  </div>
                  <button onClick={() => setSettingsOpen(settingsOpen === "whatsapp" ? null : "whatsapp")}
                    className={cn("p-2 rounded-lg transition-colors shrink-0", settingsOpen === "whatsapp" ? "bg-gray-100 text-[#151515]" : "text-[#9A9A9A] hover:text-[#151515] hover:bg-gray-50")}
                    title="Settings">
                    <Settings size={14} />
                  </button>
                  <button onClick={() => handleLink("whatsapp")} disabled={linkState.whatsapp === "loading"}
                    className={cn(
                      "flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all shrink-0",
                      linkState.whatsapp === "linked" ? "bg-[#F5FFD9] text-[#196141] border border-[#32C382]/30" : "bg-[#151515] text-white hover:bg-[#2a2a2a]",
                      linkState.whatsapp === "loading" && "opacity-60 cursor-not-allowed"
                    )}>
                    {linkState.whatsapp === "loading" && <Loader2 size={12} className="animate-spin" />}
                    {linkState.whatsapp === "linked" ? <><CheckCircle2 size={12} /> Connected</> : <>Connect <ArrowRight size={12} /></>}
                  </button>
                </div>

                {/* Settings panel */}
                <AnimatePresence initial={false}>
                  {settingsOpen === "whatsapp" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden border-t border-gray-100">
                      <div className="px-4 py-3 space-y-4 bg-[#FAFAFA]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A]">Notification settings</p>

                        {/* Active project selector */}
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-[#151515]">Active project</p>
                          <p className="text-[11px] text-[#9A9A9A] leading-snug">Context used for coaching and scheduled messages.</p>
                          <select
                            value={waSettings.activeProjectTitle ?? ""}
                            onChange={(e) => updateSetting("activeProjectTitle", e.target.value || undefined)}
                            className="mt-1 w-full text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                          >
                            <option value="">No project selected</option>
                            {projects.map((p) => <option key={p.title} value={p.title}>{p.title}</option>)}
                          </select>
                        </div>

                        {/* Business update reminders */}
                        <div className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-[#151515]">Business update reminders</p>
                              <p className="text-[11px] text-[#9A9A9A] leading-snug">Push a daily or weekly prompt to share your business status.</p>
                            </div>
                            <select value={waSettings.reminder_freq ?? "Off"} onChange={(e) => updateSetting("reminder_freq", e.target.value)}
                              className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-full sm:w-auto shrink-0">
                              {["Off", "Daily", "Weekly"].map((o) => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                          {(waSettings.reminder_freq === "Daily" || waSettings.reminder_freq === "Weekly") && (
                            <div className="flex items-center gap-2 pl-1 flex-wrap">
                              {waSettings.reminder_freq === "Weekly" && (
                                <>
                                  <span className="text-[11px] text-[#62646A]">on</span>
                                  <DaySelect value={waSettings.reminder_day ?? "Mon"} onChange={(v) => updateSetting("reminder_day", v)} />
                                </>
                              )}
                              <span className="text-[11px] text-[#62646A]">at</span>
                              <HourSelect value={waSettings.reminder_hour ?? 8} onChange={(v) => updateSetting("reminder_hour", v)} />
                            </div>
                          )}
                        </div>

                        {/* Business knowledge snippets */}
                        <div className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-[#151515]">Business knowledge snippets</p>
                              <p className="text-[11px] text-[#9A9A9A] leading-snug">Receive a curated business tip via WhatsApp each day.</p>
                            </div>
                            <select value={waSettings.knowledge ?? "Off"} onChange={(e) => updateSetting("knowledge", e.target.value)}
                              className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-full sm:w-auto shrink-0">
                              {["Off", "Daily"].map((o) => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                          {waSettings.knowledge === "Daily" && (
                            <div className="flex items-center gap-2 pl-1">
                              <span className="text-[11px] text-[#62646A]">at</span>
                              <HourSelect value={waSettings.knowledge_hour ?? 8} onChange={(v) => updateSetting("knowledge_hour", v)} />
                            </div>
                          )}
                        </div>

                        {/* Accountability check-in */}
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-[#151515]">Accountability check-in</p>
                              <p className="text-[11px] text-[#9A9A9A] leading-snug">Sorene checks in on your tasks at the hour you choose.</p>
                            </div>
                            <button onClick={() => updateSetting("checkin_prompt", !waSettings.checkin_prompt)}
                              className={cn("w-9 h-5 rounded-full shrink-0 mt-0.5 transition-colors relative", waSettings.checkin_prompt ? "bg-[#32C382]" : "bg-gray-200")}>
                              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", waSettings.checkin_prompt ? "left-[18px]" : "left-0.5")} />
                            </button>
                          </div>
                          {waSettings.checkin_prompt && (
                            <div className="flex items-center gap-2 pl-1">
                              <span className="text-[11px] text-[#62646A]">at</span>
                              <HourSelect value={waSettings.checkin_hour ?? 8} onChange={(v) => updateSetting("checkin_hour", v)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CommunityCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const gradient = "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #818CF8 34.62%, #6366F1 100%)";

  return (
    <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col"
    >
      {/* Gradient header */}
      <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className="flex flex-col relative p-5 pb-8"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex justify-between items-start relative z-10 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-semibold text-white truncate">Sorene Entrepreneur Community</p>
              <p className="text-[13px] text-white/80 mt-0.5">Join fellow founders — accountability, insights, real talk</p>
            </div>
          </div>
          <button onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0 mt-0.5">
            <ChevronDown size={15} className={cn("text-white transition-transform", isExpanded ? "" : "-rotate-90")} />
          </button>
        </div>
      </motion.div>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 space-y-3">
              {COMMUNITY_CHANNELS.map((c) => (
                <div key={c.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border border-gray-100 hover:bg-[#FAFAFA] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: c.color + "15" }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#151515]">{c.label}</p>
                    <p className="text-[11px] text-[#9A9A9A] leading-snug hidden sm:block">{c.description}</p>
                  </div>
                  <a href={c.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-[12px] font-semibold bg-[#151515] text-white hover:bg-[#2a2a2a] transition-colors shrink-0">
                    Join <ArrowRight size={12} />
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type ThreadsStatus = "idle" | "loading" | "connected" | "disconnecting";
interface ThreadsProfile { username: string; profilePictureUrl: string; }

function ThreadsConnectCard() {
  const [status, setStatus] = useState<ThreadsStatus>("idle");
  const [profile, setProfile] = useState<ThreadsProfile | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { authFetch } = await import("@/lib/authFetch");
        const res = await authFetch("/api/threads/account");
        if (res.ok) {
          const data = await res.json() as { connected: boolean; username?: string; profilePictureUrl?: string };
          if (data.connected) { setStatus("connected"); setProfile({ username: data.username ?? "", profilePictureUrl: data.profilePictureUrl ?? "" }); }
        }
      } catch { /* ignore */ }
    };
    check();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("threads_connected") === "1") {
      setStatus("connected");
      const url = new URL(window.location.href);
      url.searchParams.delete("threads_connected");
      window.history.replaceState({}, "", url.toString());
      import("@/lib/authFetch").then(({ authFetch }) =>
        authFetch("/api/threads/account").then((r) => r.json()).then((data: { connected: boolean; username?: string; profilePictureUrl?: string }) => {
          if (data.connected) setProfile({ username: data.username ?? "", profilePictureUrl: data.profilePictureUrl ?? "" });
        })
      ).catch(() => { /* ignore */ });
    }
    if (params.get("threads_error") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("threads_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleConnect = async () => {
    setStatus("loading");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/threads/auth");
      if (!res.ok) throw new Error("Failed to get auth URL");
      const { url } = await res.json() as { url: string };
      window.open(url, "_blank");
    } catch { setStatus("idle"); }
  };

  const handleDisconnect = async () => {
    setStatus("disconnecting");
    try {
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch("/api/threads/account", { method: "DELETE" });
      setStatus("idle"); setProfile(null);
    } catch { setStatus("connected"); }
  };

  return (
    <div className="rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white">
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0">{THREADS_ICON}</div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#151515]">Threads</h3>
            <p className="text-[12px] text-[#9A9A9A]">Connect to generate and post directly</p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        {status === "connected" && profile ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-[#FAFAFA]">
            {profile.profilePictureUrl
              ? <img src={profile.profilePictureUrl} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
              : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-[12px] font-bold text-[#62646A]">{profile.username?.[0]?.toUpperCase() ?? "T"}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#151515]">@{profile.username}</p>
              <div className="flex items-center gap-1 mt-0.5"><CheckCircle2 size={11} className="text-[#32C382]" /><p className="text-[11px] text-[#32C382] font-medium">Connected</p></div>
            </div>
            <button onClick={handleDisconnect} disabled={status !== "connected"} className="text-[11px] text-[#9A9A9A] hover:text-red-500 transition-colors disabled:opacity-50">
              {status !== "connected" ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-[12px] text-[#62646A] leading-relaxed">Connect your Threads account to generate, schedule, and post directly from here.</p>
            <button onClick={handleConnect} disabled={status === "loading"}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all bg-[#151515] text-white hover:bg-[#2a2a2a]", status === "loading" && "opacity-60 cursor-not-allowed")}>
              {status === "loading" && <Loader2 size={12} className="animate-spin" />}
              Connect <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectContent() {
  return (
    <div className="p-5 space-y-4">
      <MessengerConnectCard />
      <CommunityCard />
    </div>
  );
}

// ─────────────────────────────────────────────
// Folder card — DNA/Direction style
// ─────────────────────────────────────────────

interface FolderDef {
  id: string;
  gradient: string;
  iconNode: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
  content: React.ReactNode;
  strengthTags?: string[];
  fullWidth?: boolean;
}

function FolderCard({ folder }: { folder: FolderDef }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggle = (e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded((v) => !v); };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className={cn("relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col group cursor-pointer", folder.fullWidth && isExpanded && "md:col-span-2")}
      onClick={!isExpanded ? handleToggle : undefined}
    >
      {/* Gradient header — fills collapsed card on hover, always shown when expanded */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col relative", isExpanded ? "p-6 pb-10" : "p-6")}
        style={{ background: folder.gradient }}
      >
        {/* Subtle dark overlay for depth (matches DNA card style) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.25)_0%,transparent_70%)] pointer-events-none" />

        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              onClick={(e) => { e.stopPropagation(); handleToggle(e); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-body-small-medium mb-8 w-fit relative z-10"
            >
              <ChevronLeft size={18} />Back to summary
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white [&>svg]:text-white">{folder.iconNode}</span>
            </div>
            <div>
              <h3 className="text-heading-xsmall font-medium leading-tight tracking-tight text-white">{folder.title}</h3>
              {!isExpanded && <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide mt-0.5">{folder.tagline}</p>}
            </div>
          </div>
          {!isExpanded && (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 text-white text-[13px] font-medium border border-white/30 shrink-0 backdrop-blur-sm">
              Open <ArrowRight size={13} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Collapsed body */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout="position"
            className="px-6 pb-6 pt-4 flex flex-col flex-1">
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-4">{folder.description}</p>
            {folder.strengthTags && (
              <div className="mt-auto flex flex-wrap gap-2">
                {folder.strengthTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full border border-[#32C382] bg-[#F5FFD9] text-[#151515] text-body-xsmall-medium shadow-sm">{tag}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
            {folder.content}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────

type Tab = "validation" | "launchpad" | "growth" | "agents" | "direct-sync";

const TABS: { id: Tab; label: string; icon: React.ReactNode; gradient: string }[] = [
  {
    id: "validation",
    label: "Validation",
    icon: <Search size={14} />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #16B364 0%, #A3E635 100%)`,
  },
  {
    id: "launchpad",
    label: "Launchpad",
    icon: <Rocket size={14} />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #EF6820 0%, #FAC515 100%)`,
  },
  {
    id: "growth",
    label: "Growth",
    icon: <BarChart3 size={14} />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)`,
  },
  {
    id: "agents",
    label: "Agents",
    icon: <img src="/figmaAssets/starfour.svg" className="w-3.5 h-3.5 invert brightness-0" alt="" />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)`,
  },
  {
    id: "direct-sync",
    label: "Connect",
    icon: <MessageCircle size={14} />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #0891B2 0%, #2DD4BF 100%)`,
  },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Project picker dropdown
// ─────────────────────────────────────────────

function ProjectPicker({
  projects,
  selected,
  onSelect,
  onCreateProject,
  customNames = {},
}: {
  projects: DirectionCardData[];
  selected: DirectionCardData | null;
  onSelect: (p: DirectionCardData | null) => void;
  onCreateProject: () => void;
  customNames?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const displayName = (p: DirectionCardData) => customNames[p.title] || p.title;
  const label = selected ? displayName(selected) : "All Projects";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[#151515] text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
      >
        <FolderOpen size={15} className="text-[#62646A] shrink-0" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown size={14} className={cn("text-[#9A9A9A] transition-transform shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 overflow-hidden"
          >
            <div className="p-1.5">
              {/* All projects option */}
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                  !selected ? "bg-[#F3F4F6]" : "hover:bg-[#F8F9FA]"
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FolderOpen size={13} className="text-[#62646A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-body-small-medium text-[#151515]">All Projects</p>
                  <p className="text-[11px] text-[#9A9A9A]">Overview</p>
                </div>
                {!selected && <CheckCircle2 size={14} className="text-[#151515] ml-auto shrink-0" />}
              </button>

              {projects.length > 0 && <div className="h-px bg-gray-100 my-1" />}

              {projects.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                    selected?.title === p.title ? "bg-[#F3F4F6]" : "hover:bg-[#F8F9FA]"
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
                    {(i + 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-small-medium text-[#151515] truncate flex items-center gap-1.5">
                      {displayName(p)}
                      {(p as DirectionCardData & { archived?: boolean }).archived && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9A9A9A] bg-gray-100 px-1.5 py-0.5 rounded-full">Archived</span>
                      )}
                    </p>
                    {p.oneliner && <p className="text-[11px] text-[#9A9A9A] truncate">{p.oneliner}</p>}
                  </div>
                  {selected?.title === p.title && <CheckCircle2 size={14} className="text-[#151515] ml-auto shrink-0" />}
                </button>
              ))}

              {projects.length === 0 && <div className="h-px bg-gray-100 my-1" />}

              {projects.length === 0 && (
                <>
                  <a href="/direction" onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[#F8F9FA] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <ArrowRight size={13} className="text-[#62646A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-small-medium text-[#151515]">Choose a Direction</p>
                      <p className="text-[11px] text-[#9A9A9A]">Directions tailored to your DNA</p>
                    </div>
                  </a>
                  <button onClick={() => { onCreateProject(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[#F8F9FA] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Lightbulb size={13} className="text-[#62646A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-small-medium text-[#151515]">Create My Project</p>
                      <p className="text-[11px] text-[#9A9A9A]">Describe your own idea</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProjectSettings — archive / delete the current project
// ─────────────────────────────────────────────

function SettingsRow({ icon, title, subtitle, onClick, disabled, danger }: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-40", danger ? "hover:bg-[#FEF2F2]" : "hover:bg-[#F8F9FA]")}>
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", danger ? "bg-[#FEF2F2]" : "bg-gray-100")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-body-small-medium", danger ? "text-[#EF4444]" : "text-[#151515]")}>{title}</p>
        <p className="text-[11px] text-[#9A9A9A]">{subtitle}</p>
      </div>
    </button>
  );
}

type SettingsMode = "menu" | "confirmDelete" | "rename" | "editOneliner" | "confirmReset";

function ProjectSettings({
  project,
  displayName,
  onArchived,
  onDeleted,
  onRenamed,
  onUpdated,
}: {
  project: DirectionCardData;
  displayName: string;
  onArchived: (archived: boolean) => void;
  onDeleted: () => void;
  onRenamed: (name: string) => void;
  onUpdated: (oneliner: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SettingsMode>("menu");
  const [busy, setBusy] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [onelinerInput, setOnelinerInput] = useState(project.oneliner ?? "");
  const ref = useRef<HTMLDivElement>(null);
  const archived = !!(project as DirectionCardData & { archived?: boolean }).archived;

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setMode("menu"); }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Keep inputs in sync when switching projects.
  useEffect(() => { setNameInput(displayName); setOnelinerInput(project.oneliner ?? ""); }, [displayName, project.oneliner]);

  const manage = async (action: "archive" | "unarchive" | "delete") => {
    setBusy(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-projects/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, projectTitle: project.title }),
      });
      if (res.ok) {
        if (action === "delete") onDeleted();
        else onArchived(action === "archive");
        setOpen(false);
        setMode("menu");
      }
    } catch { /* ignore */ }
    setBusy(false);
  };

  const saveRename = () => {
    const name = nameInput.trim();
    if (!name) return;
    onRenamed(name);
    setOpen(false);
    setMode("menu");
  };

  const saveOneliner = async () => {
    setBusy(true);
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/execution-projects/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", projectTitle: project.title, oneliner: onelinerInput.trim() }),
      });
      if (res.ok) { onUpdated(onelinerInput.trim()); setOpen(false); setMode("menu"); }
    } catch { /* ignore */ }
    setBusy(false);
  };

  // Export every localStorage key tied to this project as a JSON file.
  const exportProject = () => {
    const data: Record<string, string> = {};
    try {
      const suffix = `-${project.title}`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith(suffix)) {
          const v = localStorage.getItem(key);
          if (v !== null) data[key] = v;
        }
      }
    } catch { /* ignore */ }
    const payload = { title: project.title, oneliner: project.oneliner ?? "", exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-zA-Z0-9_-]/g, "_")}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
    setMode("menu");
  };

  // Clear all of this project's progress keys (kept project + identity).
  const resetProgress = () => {
    try {
      const suffix = `-${project.title}`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Preserve the chosen business name / custom display name; wipe progress.
        if (key && key.endsWith(suffix) && key !== `business-name-${project.title}`) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    setOpen(false);
    setMode("menu");
    // Notify the hub to re-read storage (remount content).
    if (typeof window !== "undefined") window.dispatchEvent(new Event("execution-state-hydrated"));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-[#62646A] text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
        title="Project settings"
      >
        <Settings size={15} className="shrink-0" />
        <span className="hidden sm:inline">Project Settings</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A9A9A]">Project Settings</p>
              <p className="text-[13px] font-semibold text-[#151515] truncate mt-0.5">{displayName}</p>
            </div>

            {mode === "menu" && (
              <div className="p-1.5">
                <SettingsRow icon={<User size={13} className="text-[#62646A]" />} title="Rename project" subtitle="Change the display name"
                  onClick={() => { setNameInput(displayName); setMode("rename"); }} disabled={busy} />
                <SettingsRow icon={<FileText size={13} className="text-[#62646A]" />} title="Edit one-liner" subtitle="Update the short description"
                  onClick={() => { setOnelinerInput(project.oneliner ?? ""); setMode("editOneliner"); }} disabled={busy} />
                <SettingsRow icon={<ArrowRight size={13} className="text-[#62646A]" />} title="Export project" subtitle="Download all progress as JSON"
                  onClick={exportProject} disabled={busy} />
                <div className="h-px bg-gray-100 my-1" />
                <SettingsRow icon={<Archive size={13} className="text-[#62646A]" />} title={archived ? "Unarchive project" : "Archive project"} subtitle={archived ? "Restore to active projects" : "Hide without deleting data"}
                  onClick={() => manage(archived ? "unarchive" : "archive")} disabled={busy} />
                <SettingsRow icon={<Loader2 size={13} className="text-[#62646A]" />} title="Reset progress" subtitle="Clear checklists & answers"
                  onClick={() => setMode("confirmReset")} disabled={busy} />
                <SettingsRow icon={<Trash2 size={13} className="text-[#EF4444]" />} title="Delete project" subtitle="Permanently remove all data" danger
                  onClick={() => setMode("confirmDelete")} disabled={busy} />
              </div>
            )}

            {mode === "rename" && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[12px] font-medium text-[#151515] mb-1.5">Display name</p>
                  <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRename(); }}
                    className="w-full text-[13px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#32C382]" />
                  <p className="text-[11px] text-[#9A9A9A] mt-1.5">Shown in the picker and across the hub. Your saved progress is kept.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode("menu")} className="flex-1 text-[13px] font-medium text-[#151515] border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveRename} disabled={!nameInput.trim()} className="flex-1 text-[13px] font-medium text-white bg-[#151515] px-3 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">Save</button>
                </div>
              </div>
            )}

            {mode === "editOneliner" && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[12px] font-medium text-[#151515] mb-1.5">One-liner</p>
                  <textarea autoFocus value={onelinerInput} onChange={(e) => setOnelinerInput(e.target.value)} rows={3}
                    className="w-full text-[13px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#32C382] resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode("menu")} disabled={busy} className="flex-1 text-[13px] font-medium text-[#151515] border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40">Cancel</button>
                  <button onClick={saveOneliner} disabled={busy} className="flex-1 text-[13px] font-medium text-white bg-[#151515] px-3 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : null} Save
                  </button>
                </div>
              </div>
            )}

            {mode === "confirmReset" && (
              <div className="p-4">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#151515]">Reset progress?</p>
                    <p className="text-[12px] text-[#62646A] leading-relaxed mt-1">
                      This clears all checklists, brand copy, and saved answers for this project. The project itself stays. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode("menu")} className="flex-1 text-[13px] font-medium text-[#151515] border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={resetProgress} className="flex-1 text-[13px] font-medium text-white bg-[#F59E0B] px-3 py-2 rounded-xl hover:bg-[#D97706] transition-colors">Reset</button>
                </div>
              </div>
            )}

            {mode === "confirmDelete" && (
              <div className="p-4">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#151515]">Delete &ldquo;{displayName}&rdquo;?</p>
                    <p className="text-[12px] text-[#62646A] leading-relaxed mt-1">
                      This permanently removes the project and all its progress, conversations, and settings from your account. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMode("menu")}
                    disabled={busy}
                    className="flex-1 text-[13px] font-medium text-[#151515] border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => manage("delete")}
                    disabled={busy}
                    className="flex-1 text-[13px] font-medium text-white bg-[#EF4444] px-3 py-2 rounded-xl hover:bg-[#DC2626] transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  const authUser = useAtomValue(userAtom);
  const [activeTab, setActiveTab] = useState<Tab | null>("validation");
  const [launchpadOpenPillar, setLaunchpadOpenPillar] = useState<string | undefined>(undefined);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const bumpOnboard = useSetAtom(executionOnboardTriggerAtom);
  const [navigateTab, setNavigateTab] = useAtom(executionNavigateTabAtom);

  // After onboarding evaluation, the chat sets a target tab; switch to it here.
  useEffect(() => {
    if (navigateTab === "validation" || navigateTab === "launchpad" || navigateTab === "growth") {
      setActiveTab(navigateTab);
      setNavigateTab(null);
    }
  }, [navigateTab, setNavigateTab]);

  // "Create My Project" from the empty state → open the chat and start the
  // onboarding conversation (assess name + status, route to the right tab).
  const startProjectOnboarding = () => {
    setChatCollapsed(false);
    setChatOpen(true);
    bumpOnboard((n) => n + 1);
  };
  const [projects, setProjects] = useState<DirectionCardData[]>([]);
  const [atomProject, setAtomProject] = useAtom(selectedExecutionProjectAtom);
  const [selectedProject, setSelectedProject] = useState<DirectionCardData | null>(atomProject);
  const [createOpen, setCreateOpen] = useState(false);
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("custom-project-names");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [hydratedTick, setHydratedTick] = useState(0);

  // Consume atom set by DirectionCard "Start Validate", persist to Firestore, then clear
  useEffect(() => {
    if (!atomProject || !authUser?.uid) return;
    const add = async () => {
      // Persist via API
      const { authFetch } = await import("@/lib/authFetch");
      await authFetch("/api/execution-projects/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: atomProject }),
      }).catch(() => {});
      setProjects((prev) => prev.some((p) => p.title === atomProject.title) ? prev : [...prev, atomProject]);
      setSelectedProject(atomProject);
      setAtomProject(null);
    };
    add();
  }, [atomProject, authUser?.uid, setAtomProject]);

  // Load saved execution projects — localStorage first (instant), then Firestore (source of truth)
  useEffect(() => {
    if (!authUser?.uid) return;
    // Seed from localStorage cache immediately so UI isn't empty on load
    try {
      const cached = localStorage.getItem(`execution-projects-${authUser.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) setProjects(parsed);
      }
    } catch { /* ignore */ }
    // Then fetch from Firestore and update both state and cache
    import("@/lib/authFetch").then(({ authFetch }) =>
      authFetch("/api/execution-projects/list")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.projects?.length) {
            setProjects(data.projects);
            try { localStorage.setItem(`execution-projects-${authUser.uid}`, JSON.stringify(data.projects)); } catch { /* ignore */ }
          }
        })
        .catch(() => {})
    );
  }, [authUser?.uid]);

  // Sync Execution Hub progress (localStorage) with Firestore so it survives
  // logout, device changes, and cleared browser storage. Hydrate on login,
  // then auto-push any future changes (debounced).
  useEffect(() => {
    if (!authUser?.uid) return;
    installExecutionStateAutosave();
    hydrateExecutionState().then(() => {
      // Refresh custom project names from the (possibly) hydrated storage.
      try {
        const raw = localStorage.getItem("custom-project-names");
        if (raw) setCustomNames(JSON.parse(raw));
      } catch { /* ignore */ }
    });
    const onHydrated = () => {
      try {
        const raw = localStorage.getItem("custom-project-names");
        if (raw) setCustomNames(JSON.parse(raw));
      } catch { /* ignore */ }
      // Force content remount so card components re-read hydrated localStorage.
      setHydratedTick((t) => t + 1);
    };
    window.addEventListener("execution-state-hydrated", onHydrated);
    return () => window.removeEventListener("execution-state-hydrated", onHydrated);
  }, [authUser?.uid]);

  // Create a project, persist it, and select it. Reused by the create dialog and
  // by the onboarding chat's "Start Validate" action. Skips creating a duplicate
  // if a project with the same title already exists (just selects it instead).
  const createAndSelectProject = async (title: string, oneliner: string): Promise<DirectionCardData | null> => {
    const t = title.trim();
    if (!t) return null;
    const existing = projects.find((p) => p.title === t);
    if (existing) { setSelectedProject(existing); return existing; }
    const project: DirectionCardData = { title: t, oneliner: oneliner.trim() } as DirectionCardData;
    const { authFetch } = await import("@/lib/authFetch");
    await authFetch("/api/execution-projects/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    }).catch(() => {});
    setProjects((prev) => {
      const next = [...prev, project];
      try { localStorage.setItem(`execution-projects-${authUser?.uid}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setSelectedProject(project);
    return project;
  };

  const handleCreateProject = async () => {
    if (!createTitle.trim()) return;
    setCreateSaving(true);
    await createAndSelectProject(createTitle, createDesc);
    setCreateTitle("");
    setCreateDesc("");
    setCreateSaving(false);
    setCreateOpen(false);
  };

  // "Start Validate" from the onboarding chat: create + select the project, then
  // open the Validation tab.
  const [startValidate, setStartValidate] = useAtom(executionStartValidateAtom);
  useEffect(() => {
    if (!startValidate) return;
    const { title, oneliner } = startValidate;
    setStartValidate(null);
    (async () => {
      await createAndSelectProject(title, oneliner);
      setActiveTab("validation");
      setChatOpen(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startValidate]);


  const projectLabel = selectedProject ? `"${selectedProject.title}"` : "your idea";

  const validationFolders: FolderDef[] = [
    {
      id: "idea-validator",
      gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #A3E635 34.62%, #16B364 100%)`,
      iconNode: <Search size={18} />,
      title: "Idea Validator",
      tagline: "VIBE Framework · 2–4 weeks",
      description: `Validate ${projectLabel} with real people before building anything. Sorene structures the process — you have the conversations.`,
      content: <IdeaValidatorContent />,
      strengthTags: ["Validate", "Interview", "Build", "Experiment"],
    },
    {
      id: "go-no-go",
      gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #F38744 34.62%, #EF4444 100%)`,
      iconNode: <BarChart3 size={18} />,
      title: "The Go / No-Go Check",
      tagline: "Launch readiness · Health check",
      description: `A crystal-clear assessment that tells you if you're ready to launch ${projectLabel} — measured across market validation, problem clarity, learning, and finance.`,
      content: <GoNoGoContent project={selectedProject ?? null} onConfirmLaunch={() => {
        setLaunchpadOpenPillar("brand_digital");
        setActiveTab("launchpad");
      }} />,
      strengthTags: ["Market", "Problem", "Learning", "Finance"],
    },
  ];

  const launchpadFolders: FolderDef[] = [];

  const currentFolders = activeTab === "validation" ? validationFolders : launchpadFolders;
  const isDirectSync = activeTab === "direct-sync";
  const isActive = (id: Tab) => activeTab === id;

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-[#F9FAFB]">
      {/* ── Main content ── */}
      <div className={cn("flex-1 flex flex-col h-full overflow-hidden", chatOpen ? "hidden xl:flex" : "flex")}>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-2 px-4 pt-6 pb-2 lg:px-6">
              <ProjectPicker
                projects={projects}
                selected={selectedProject}
                onSelect={(p) => { setSelectedProject(p); setActiveTab("validation"); }}
                onCreateProject={() => setCreateOpen(true)}
                customNames={customNames}
              />
              {selectedProject && (
                <ProjectSettings
                  project={selectedProject}
                  displayName={customNames[selectedProject.title] || selectedProject.title}
                  onArchived={(archived) => {
                    setProjects((prev) => prev.map((p) => p.title === selectedProject.title ? { ...p, archived } : p));
                    setSelectedProject((prev) => prev ? { ...prev, archived } as DirectionCardData : prev);
                  }}
                  onDeleted={() => {
                    setProjects((prev) => prev.filter((p) => p.title !== selectedProject.title));
                    setSelectedProject(null);
                    setActiveTab("validation");
                  }}
                  onRenamed={(name) => {
                    const updated = { ...customNames, [selectedProject.title]: name };
                    setCustomNames(updated);
                    try { localStorage.setItem("custom-project-names", JSON.stringify(updated)); } catch { /* ignore */ }
                  }}
                  onUpdated={(oneliner) => {
                    setProjects((prev) => prev.map((p) => p.title === selectedProject.title ? { ...p, oneliner } : p));
                    setSelectedProject((prev) => prev ? { ...prev, oneliner } as DirectionCardData : prev);
                  }}
                />
              )}
            </div>

            {/* Tabs + inline accordion content */}
            <div className="px-4 lg:px-6 pt-2 pb-24 space-y-1">
              {/* Tab strip */}
              <div className="flex overflow-x-auto no-scrollbar rounded-[22px] shadow-sm border border-gray-100 w-full">
                {TABS.map((tab, i) => {
                  const isActive = activeTab === tab.id as Tab | null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                      className={cn(
                        "relative flex flex-1 items-center justify-center gap-2 px-2 py-3 text-[13px] font-semibold transition-all duration-300",
                        i > 0 && "border-l border-white/20",
                        isActive ? "text-white" : "text-[#9A9A9A] hover:text-[#62646A]"
                      )}
                      style={isActive ? { background: tab.gradient } : { background: "#F3F4F6" }}
                    >
                      <span className={isActive ? "text-white" : "text-[#BCBCBC]"}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Accordion panel — pure fade (no vertical translate) so the card stays flush under the tabs */}
              <AnimatePresence initial={false} mode="wait">
                {activeTab && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div
                      key={`${selectedProject?.title ?? "all"}-${activeTab}`}
                      className={cn(
                        activeTab === "validation" || activeTab === "launchpad" || activeTab === "growth" || activeTab === "direct-sync" || activeTab === "agents" ? "" : "p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                      )}
                    >
                      {activeTab === "validation"
                        ? <ValidationProgress key={`val-${hydratedTick}`} project={selectedProject} onCreateProject={startProjectOnboarding} onConfirmLaunch={() => { setLaunchpadOpenPillar("brand_digital"); setActiveTab("launchpad"); }} />
                        : activeTab === "launchpad"
                        ? <LaunchPadContent key={`lp-${hydratedTick}-${launchpadOpenPillar ?? "none"}`} project={selectedProject ?? null}
                            autoOpenPillarId={launchpadOpenPillar}
                            onAutoOpenConsumed={() => setLaunchpadOpenPillar(undefined)}
                            onNameChosen={(name) => {
                            const key = selectedProject?.title ?? "";
                            if (!key) return;
                            const updated = { ...customNames, [key]: name };
                            setCustomNames(updated);
                            try { localStorage.setItem("custom-project-names", JSON.stringify(updated)); } catch { /* ignore */ }
                          }} />
                        : activeTab === "growth"
                        ? <GrowthContent key={`gr-${hydratedTick}`} project={selectedProject ?? null} />
                        : activeTab === "agents"
                        ? <AgentsContent project={selectedProject ?? null} />
                        : isDirectSync
                        ? <ConnectContent />
                        : currentFolders.map((folder) => <FolderCard key={folder.id} folder={folder} />)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop chat sidebar ── */}
      <AnimatePresence initial={false}>
        {!chatCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full shrink-0 hidden xl:block overflow-hidden"
          >
            <ExecutionHubChat project={selectedProject ?? null} allProjects={projects} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop collapse/expand bubble ── */}
      <div className="absolute bottom-6 right-6 z-40 hidden xl:block">
        <button onClick={() => setChatCollapsed((v) => !v)}
          className="w-14 h-14 rounded-full bg-[#151515] flex items-center justify-center shadow-lg hover:bg-[#2a2a2a] transition-colors">
          <MessageCircle size={22} className="text-white" />
        </button>
      </div>

      {/* ── Mobile chat panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-2 rounded-4xl z-50 xl:hidden overflow-hidden">
            <ExecutionHubChat project={selectedProject ?? null} allProjects={projects} onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile chat bubble ── */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          className="absolute bottom-6 right-6 z-40 xl:hidden w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors">
          <MessageCircle size={22} className="text-white" />
        </button>
      )}

      {/* ── Create My Project modal ── */}
      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-[28px] p-8 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-heading-xsmall text-[#151515] mb-1">Create My Project</h2>
              <p className="text-label-medium text-[#62646A] mb-6">Describe your idea and we'll set it up as your validation project.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] block mb-1.5">Project name</label>
                  <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. AI Workflow Tool for Agencies"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] block mb-1.5">Description <span className="normal-case font-normal text-[#9A9A9A]">(optional)</span></label>
                  <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="What problem does it solve? Who is it for?"
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-[#151515] placeholder-gray-300 focus:outline-none focus:border-[#151515] transition-colors resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCreateOpen(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-[#62646A] hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateProject} disabled={!createTitle.trim() || createSaving}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {createSaving && <Loader2 size={14} className="animate-spin" />}
                  Start Validation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
