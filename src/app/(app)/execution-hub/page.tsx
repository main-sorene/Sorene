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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAtomValue, useAtom } from "jotai";
import { userAtom, selectedExecutionProjectAtom } from "@/store/atoms";
import { auth } from "@/lib/firebase";
import { ExecutionHubChat } from "@/components/executionHub/ExecutionHubChat";
import { getUserProfile } from "@/lib/firestore";
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
  { id: "market", label: "Market Validation", description: "User sign-ups, leads, sales, conversations logged, and quality of feedback received.", icon: BarChart3, items: ["User sign-ups", "Qualified leads", "Sales / paid customers", "Conversations logged", "Quality of feedback"] },
  { id: "problem", label: "Problem & Solution Clarity", description: "Problem and solution defined from real market conversations — not AI-generated assumptions.", icon: Search, items: ["Problem defined from real conversations", "Solution tested with at least one real person", "Clear who the customer is", "Painkiller problem identified"] },
  { id: "learning", label: "Foundation Learning", description: "Completion of the core learning module that prepares you to run a business.", icon: CheckCircle2, items: ["Completed foundation module", "Understand the VIBE framework", "Understand MVO (minimum viable offer)", "Know your DNA + Direction"] },
  { id: "finance", label: "Finance Readiness", description: "A basic assessment of whether you are financially positioned to commit.", icon: DollarSign, items: ["Personal runway assessed", "Startup cost estimate done", "First revenue target set", "Funding / bootstrap path chosen"] },
];

function GoNoGoContent() {
  const [scores, setScores] = useState<Record<string, Record<string, boolean>>>({});
  const toggle = (checkId: string, item: string) => setScores((prev) => ({ ...prev, [checkId]: { ...(prev[checkId] || {}), [item]: !(prev[checkId]?.[item] ?? false) } }));
  const total = GO_CHECKS.reduce((acc, c) => acc + c.items.length, 0);
  const checked = Object.values(scores).reduce((acc, g) => acc + Object.values(g).filter(Boolean).length, 0);
  const pct = Math.round((checked / total) * 100);
  const ready = pct >= 80;
  const scoreColor = ready ? "#32C382" : pct >= 50 ? "#F5B100" : "#151515";

  return (
    <div className="p-6 space-y-8">
      {/* Stage description */}
      <p className="text-[15px] font-medium text-[#151515] leading-relaxed">
        Launching too early wastes money and credibility — this step gives you a clear, honest score across market, problem, learning, and finance so you know exactly where you stand before you commit.
      </p>
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
      {GO_CHECKS.map((check, idx) => {
        const Icon = check.icon;
        const groupChecked = check.items.filter((i) => scores[check.id]?.[i]).length;
        return (
          <motion.section key={check.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Icon size={14} className="text-[#62646A]" /><h5 className="text-body-small-medium text-[#151515]">{check.label}</h5></div>
              <span className="text-[12px] text-[#9A9A9A]">{groupChecked}/{check.items.length}</span>
            </div>
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-3">{check.description}</p>
            <Separator className="bg-gray-100 mb-3" />
            <div className="space-y-2.5">
              {check.items.map((item) => {
                const on = scores[check.id]?.[item] ?? false;
                return (
                  <button key={item} onClick={() => toggle(check.id, item)} className="w-full flex items-center gap-3 text-left group">
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", on ? "bg-[#151515] border-[#151515]" : "border-gray-200 group-hover:border-[#151515]")}>
                      {on && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={cn("text-label-medium transition-colors", on ? "text-[#9A9A9A] line-through" : "text-[#151515]")}>{item}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        );
      })}
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

function ValidationProgress({ project, onCreateProject }: { project: DirectionCardData | null; onCreateProject: () => void }) {
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
      <div className="p-8 flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Rocket size={24} className="text-[#9A9A9A]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-body-medium-medium text-[#151515]">Start your validation journey</h3>
          <p className="text-label-medium text-[#62646A] max-w-sm leading-relaxed">
            Choose a direction Sorene has generated for you, or describe your own project to begin.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/direction"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors">
            <ArrowRight size={15} /> Choose a Direction
          </a>
          <button onClick={onCreateProject}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-[#151515] text-sm font-medium hover:bg-gray-50 transition-colors">
            Create My Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
            <GoNoGoContent />
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

function LaunchpadContent() {
  const [pitch, setPitch] = useState("");
  const tools = [{ label: "Business Plan", icon: "📋" }, { label: "Pitch Deck", icon: "📊" }, { label: "Brand Kit", icon: "🎨" }, { label: "Content Plan", icon: "✍️" }];
  return (
    <div className="p-6 space-y-8">
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">Elevator Pitch</h4>
        <Separator className="bg-gray-100 mb-5" />
        <p className="text-label-medium text-[#62646A] mb-3 leading-relaxed">Describe your business in 3 sentences — what it is, who it's for, and the key benefit.</p>
        <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="We help [who] to [do what] so that [key outcome]…" rows={4}
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-body-small text-[#151515] placeholder-gray-300 resize-none focus:outline-none focus:border-[#151515] transition-colors" />
        <div className="flex justify-end mt-1">
          <span className={cn("text-[11px]", pitch.length > 400 ? "text-[#DF2E16]" : "text-[#9A9A9A]")}>{pitch.length} / 400</span>
        </div>
      </section>
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">Instantly Generate</h4>
        <Separator className="bg-gray-100 mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tools.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-5 opacity-50 cursor-not-allowed">
              <span className="text-2xl">{t.icon}</span>
              <span className="text-body-small-medium text-[#151515]">{t.label}</span>
              <span className="text-[10px] text-[#9A9A9A]">Coming soon</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Agents System (placeholder)
// ─────────────────────────────────────────────

function AgentsSystemContent() {
  const agents = [
    { name: "Validation Agent", description: "Runs your customer interview process end-to-end — generates questions, logs responses, surfaces patterns.", status: "coming-soon" },
    { name: "Offer Agent", description: "Builds your minimum viable offer based on interview data and your DNA profile.", status: "coming-soon" },
    { name: "Outreach Agent", description: "Drafts personalised outreach messages to potential customers.", status: "coming-soon" },
    { name: "Progress Agent", description: "Tracks your execution milestones and sends proactive nudges.", status: "coming-soon" },
  ];
  return (
    <div className="p-6 space-y-8">
      <section>
        <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">Your AI Agents</h4>
        <Separator className="bg-gray-100 mb-5" />
        <p className="text-label-medium text-[#62646A] leading-relaxed mb-6">Specialised agents that run parts of your execution so you can focus on the work only you can do.</p>
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-start gap-4 py-5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <img src="/figmaAssets/starfour.svg" className="w-4 h-4" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-body-small-medium text-[#151515]">{agent.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#9A9A9A] font-medium">Coming soon</span>
                </div>
                <p className="text-label-medium text-[#62646A] leading-relaxed">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Direct Sync — card-based tab content
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

interface SyncChannel {
  platform: "whatsapp" | "telegram";
  name: string;
  tagline: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  features: string[];
  strengthTags: string[];
}

const SYNC_CHANNELS: SyncChannel[] = [
  {
    platform: "whatsapp",
    name: "WhatsApp",
    tagline: "Weekly check-ins · Progress tracking",
    description: "Link your WhatsApp to Sorene for structured weekly accountability check-ins. Every conversation is logged and synced back to your Execution Hub progress.",
    gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #4ADE80 34.62%, #16A34A 100%)`,
    icon: WA_ICON,
    features: [
      "Weekly accountability prompts from Sorene",
      "Log customer conversations via chat",
      "Progress synced to your Execution Hub",
      "Tap to link — one-time setup",
    ],
    strengthTags: ["Weekly Check-ins", "Progress Sync", "Accountability"],
  },
  {
    platform: "telegram",
    name: "Telegram",
    tagline: "Instant messaging · Real-time coaching",
    description: "Link your Telegram for instant access to Sorene. Ask questions, log progress, and get coaching between sessions — all synced to your account.",
    gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #38BDF8 34.62%, #0284C7 100%)`,
    icon: TG_ICON,
    features: [
      "Real-time coaching between sessions",
      "Log progress and milestones instantly",
      "Ask Sorene anything on the go",
      "Tap to link — one-time setup",
    ],
    strengthTags: ["Real-time", "On the go", "Instant coaching"],
  },
];

function DirectSyncCard({ channel }: { channel: SyncChannel }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkState, setLinkState] = useState<"idle" | "loading" | "linked">("idle");

  const handleToggle = (e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded((v) => !v); };

  const handleLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkState !== "idle") return;
    setLinkState("loading");
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/messaging/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform: channel.platform }),
      });
      if (!res.ok) throw new Error("Failed");
      const { deepLink } = await res.json();
      window.open(deepLink, "_blank");
      setLinkState("linked");
    } catch {
      setLinkState("idle");
    }
  };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col cursor-pointer"
      onClick={!isExpanded ? handleToggle : undefined}
    >
      {/* Gradient header — always visible */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col relative", isExpanded ? "p-6 pb-10" : "p-6")}
        style={{ background: channel.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.25)_0%,transparent_70%)] pointer-events-none" />
        <AnimatePresence>
          {isExpanded && (
            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              onClick={(e) => { e.stopPropagation(); handleToggle(e); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-body-small-medium mb-8 w-fit relative z-10">
              <ChevronLeft size={18} />Back to summary
            </motion.button>
          )}
        </AnimatePresence>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {channel.icon}
            </div>
            <div>
              <h3 className="text-heading-xsmall font-medium leading-tight tracking-tight text-white">{channel.name}</h3>
              {!isExpanded && <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide mt-0.5">{channel.tagline}</p>}
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
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-4">{channel.description}</p>
            <div className="mt-auto flex flex-wrap gap-2">
              {channel.strengthTags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full border border-[#32C382] bg-[#F5FFD9] text-[#151515] text-body-xsmall-medium shadow-sm">{tag}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <section>
                <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">What you get</h4>
                <Separator className="bg-gray-100 mb-5" />
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {channel.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 py-3.5">
                      <CheckCircle2 size={14} className="text-[#32C382] shrink-0" />
                      <p className="text-label-medium text-[#151515]">{f}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-body-medium-medium text-[#151515] mb-4 tracking-widest uppercase">Connect</h4>
                <Separator className="bg-gray-100 mb-5" />
                <p className="text-label-medium text-[#62646A] leading-relaxed mb-5">
                  Click below to open {channel.name}. Sorene will send you a link — tap it to complete the one-time setup. All conversations will sync back to your Execution Hub.
                </p>
                <button onClick={handleLink} disabled={linkState === "loading"}
                  className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl text-body-small-medium transition-all",
                    linkState === "linked"
                      ? "bg-[#CEF2E2] text-[#196141]"
                      : "bg-[#151515] text-white hover:bg-[#2a2a2a]",
                    linkState === "loading" && "opacity-60 cursor-not-allowed")}>
                  {linkState === "loading" && <Loader2 size={16} className="animate-spin" />}
                  {linkState === "linked" && <CheckCircle2 size={16} />}
                  {linkState === "idle" && <span className="text-lg leading-none">{channel.platform === "whatsapp" ? "💬" : "✈️"}</span>}
                  {linkState === "linked" ? `Linked to ${channel.name} ✓` : `Open ${channel.name}`}
                </button>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
}

function FolderCard({ folder }: { folder: FolderDef }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggle = (e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded((v) => !v); };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white flex flex-col group cursor-pointer"
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

type Tab = "validation" | "launchpad" | "agents" | "direct-sync";

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
    id: "agents",
    label: "Agents",
    icon: <img src="/figmaAssets/starfour.svg" className="w-3.5 h-3.5 invert brightness-0" alt="" />,
    gradient: `radial-gradient(140% 200% at 0% 0%, #0A0A0A 20%, rgba(0,0,0,0) 70%), linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)`,
  },
  {
    id: "direct-sync",
    label: "Direct Sync",
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
}: {
  projects: DirectionCardData[];
  selected: DirectionCardData | null;
  onSelect: (p: DirectionCardData | null) => void;
  onCreateProject: () => void;
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

  const label = selected ? selected.title : "All Projects";

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
                    <p className="text-body-small-medium text-[#151515] truncate">{p.title}</p>
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

export default function Page() {
  const authUser = useAtomValue(userAtom);
  const [activeTab, setActiveTab] = useState<Tab | null>("validation");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [projects, setProjects] = useState<DirectionCardData[]>([]);
  const [atomProject, setAtomProject] = useAtom(selectedExecutionProjectAtom);
  const [selectedProject, setSelectedProject] = useState<DirectionCardData | null>(atomProject);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  // Consume atom set by DirectionCard "Start Validate", persist to Firestore, then clear
  useEffect(() => {
    if (!atomProject || !authUser?.uid) return;
    const add = async () => {
      // Persist via API
      const token = await import("@/lib/firebase").then((m) => m.auth?.currentUser?.getIdToken());
      if (token) {
        await fetch("/api/execution-projects/add", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ project: atomProject }),
        }).catch(() => {});
      }
      setProjects((prev) => prev.some((p) => p.title === atomProject.title) ? prev : [...prev, atomProject]);
      setSelectedProject(atomProject);
      setAtomProject(null);
    };
    add();
  }, [atomProject, authUser?.uid, setAtomProject]);

  // Load saved execution projects from Firestore
  useEffect(() => {
    if (!authUser?.uid) return;
    import("@/lib/firebase").then(({ auth }) =>
      auth?.currentUser?.getIdToken().then((token) => {
        if (!token) return;
        fetch("/api/execution-projects/list", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data?.projects?.length) setProjects(data.projects); })
          .catch(() => {});
      })
    );
  }, [authUser?.uid]);

  const handleCreateProject = async () => {
    if (!createTitle.trim()) return;
    setCreateSaving(true);
    const project: DirectionCardData = { title: createTitle.trim(), oneliner: createDesc.trim() } as DirectionCardData;
    const token = await import("@/lib/firebase").then((m) => m.auth?.currentUser?.getIdToken()).catch(() => null);
    if (token) {
      await fetch("/api/execution-projects/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project }),
      }).catch(() => {});
    }
    setProjects((prev) => [...prev, project]);
    setSelectedProject(project);
    setCreateTitle("");
    setCreateDesc("");
    setCreateSaving(false);
    setCreateOpen(false);
  };


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
      content: <GoNoGoContent />,
      strengthTags: ["Market", "Problem", "Learning", "Finance"],
    },
  ];

  const launchpadFolders: FolderDef[] = [
    {
      id: "launchpad",
      gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #FAC515 34.62%, #EF6820 100%)`,
      iconNode: <Rocket size={18} />,
      title: "The Launchpad",
      tagline: "Elevator pitch · Business tools",
      description: `Write your 3-sentence elevator pitch for ${projectLabel} and instantly spin up your business plan, pitch deck, brand, and content.`,
      content: <LaunchpadContent />,
      strengthTags: ["Business Plan", "Pitch Deck", "Brand Kit"],
    },
  ];

  const agentsFolders: FolderDef[] = [
    {
      id: "agents",
      gradient: `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #818CF8 34.62%, #6366F1 100%)`,
      iconNode: <img src="/figmaAssets/starfour.svg" className="w-4 h-4 invert" alt="" />,
      title: "Agents System",
      tagline: "AI agents · Automated execution",
      description: "Specialised AI agents that run parts of your execution so you can focus on the work only you can do.",
      content: <AgentsSystemContent />,
      strengthTags: ["Validation", "Offer", "Outreach", "Progress"],
    },
  ];

  const currentFolders = activeTab === "validation" ? validationFolders : activeTab === "launchpad" ? launchpadFolders : agentsFolders;
  const isDirectSync = activeTab === "direct-sync";
  const isActive = (id: Tab) => activeTab === id;

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-[#F9FAFB]">
      {/* ── Main content ── */}
      <div className={cn("flex-1 flex flex-col h-full overflow-hidden", chatOpen ? "hidden xl:flex" : "flex")}>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center px-4 pt-6 pb-2 lg:px-6">
              <ProjectPicker
                projects={projects}
                selected={selectedProject}
                onSelect={(p) => { setSelectedProject(p); setActiveTab("validation"); }}
                onCreateProject={() => setCreateOpen(true)}
              />
            </div>

            {/* Tabs + inline accordion content */}
            <div className="px-4 lg:px-6 pt-4 pb-24 space-y-3">
              {/* Tab strip */}
              <div className="inline-flex rounded-[22px] overflow-hidden shadow-sm border border-gray-100">
                {TABS.map((tab, i) => {
                  const isActive = activeTab === tab.id as Tab | null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                      className={cn(
                        "relative flex items-center gap-2.5 px-[22px] py-[13px] text-[14px] font-semibold transition-all duration-300",
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

              {/* Accordion panel */}
              <AnimatePresence initial={false}>
                {activeTab && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div
                      key={`${selectedProject?.title ?? "all"}-${activeTab}`}
                      className={cn(
                        activeTab === "validation" ? "" : "p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                      )}
                    >
                      {activeTab === "validation"
                        ? <ValidationProgress project={selectedProject} onCreateProject={() => setCreateOpen(true)} />
                        : isDirectSync
                        ? SYNC_CHANNELS.map((ch) => <DirectSyncCard key={ch.platform} channel={ch} />)
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
            <ExecutionHubChat />
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
            <ExecutionHubChat onClose={() => setChatOpen(false)} />
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
