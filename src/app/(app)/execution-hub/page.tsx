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
    whatIs: "The first step is about getting out of the building and having real conversations with the people you want to serve. No building, no coding — just listening.",
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
    whatIs: "Once you have logged enough conversations, you look for patterns. This step turns raw feedback into a single, clear problem worth solving.",
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
    whatIs: "Before building a product, you create the simplest possible offer that delivers real value. This could be a workshop, a PDF, a session, or a manual service.",
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
    whatIs: "Real validation only happens when someone pays. This step is about making the actual offer to real people and getting real money — not interest, not sign-ups.",
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
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-body-medium-medium text-[#151515] tracking-widest uppercase">Readiness Score</h4>
          <span className="text-[28px] font-medium leading-none" style={{ color: scoreColor }}>{pct}%</span>
        </div>
        <Separator className="bg-gray-100 mb-5" />
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
  const [activeStage, setActiveStage] = useState(1);

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

      <Separator className="bg-gray-100" />

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
            <VibeStageContent step={VIBE_STEPS[activeStage - 1]} />
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

function VibeStageContent({ step }: { step: typeof VIBE_STEPS[number] }) {
  const Icon = step.icon;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-1.5">What is this step</p>
        <p className="text-label-medium text-[#62646A] leading-relaxed">{step.whatIs}</p>
      </div>
      <div className="flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5">
        <div className="w-8 h-8 rounded-xl bg-[#151515] flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={15} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-1">Objective</p>
          <p className="text-body-small-medium text-[#151515] leading-snug">{step.title}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-3">Sorene provides</p>
          <ul className="space-y-2.5">
            {step.soreneDoes.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-label-medium text-[#151515]">
                <CheckCircle2 size={13} className="text-[#32C382] shrink-0 mt-0.5" />{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-3">You must do</p>
          <ul className="space-y-2.5">
            {step.userDoes.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-label-medium text-[#62646A]">
                <Circle size={13} className="text-gray-300 shrink-0 mt-0.5" />{s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {step.insight && (
        <div className="rounded-2xl bg-[#F5FFD9] border border-[#32C382]/30 px-4 py-3">
          <p className="text-label-medium text-[#151515] leading-relaxed">{step.insight}</p>
        </div>
      )}
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
