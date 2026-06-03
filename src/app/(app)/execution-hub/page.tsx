"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  Lightbulb,
  DollarSign,
  Rocket,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Lock,
} from "lucide-react";

// ─────────────────────────────────────────────
// Idea Validator
// ─────────────────────────────────────────────

const VIBE_STEPS = [
  {
    id: 1,
    vibe: "V + I",
    title: "Talk to 10 potential customers",
    subtitle: "Validate · Interview",
    icon: Users,
    duration: "~1–2 weeks",
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
    insight:
      "The 3 questions Sorene generates: (1) What is your biggest challenge with [problem area]? (2) What have you already tried to fix it? (3) What would you pay to solve this completely?",
  },
  {
    id: 2,
    vibe: "I",
    title: "Identify the painkiller problem",
    subtitle: "Interview",
    icon: Search,
    duration: "~2–3 days",
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
    id: 3,
    vibe: "B",
    title: "Create a minimum viable offer",
    subtitle: "Build",
    icon: Lightbulb,
    duration: "~3–5 days",
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
    id: 4,
    vibe: "E",
    title: "Get 3 paying customers",
    subtitle: "Experiment",
    icon: DollarSign,
    duration: "~1 week",
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
    insight:
      "3 paying customers before investing significant time or money is the validation gate. This is non-negotiable — it unlocks the Business Plan Builder.",
  },
];

function VibeStep({ step, index }: { step: (typeof VIBE_STEPS)[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = step.icon;

  return (
    <div className="rounded-2xl border border-[#EDEDED] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-[#F7F7F7] transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-[#151515] flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[#9A9A9A] uppercase tracking-wider">
              Step {step.id} · VIBE: {step.vibe}
            </span>
            <span className="text-[11px] text-[#9A9A9A]">·</span>
            <span className="text-[11px] text-[#9A9A9A]">{step.duration}</span>
          </div>
          <p className="text-[15px] font-semibold text-[#151515] mt-0.5 leading-snug">
            {step.title}
          </p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-[#9A9A9A] shrink-0 mt-1" />
        ) : (
          <ChevronDown size={16} className="text-[#9A9A9A] shrink-0 mt-1" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#F0F0F0]">
          <div className="pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] mb-2">
              Sorene provides
            </p>
            <ul className="space-y-2">
              {step.soreneDoes.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#151515]">
                  <CheckCircle2 size={13} className="text-[#151515] shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] mb-2">
              You must do
            </p>
            <ul className="space-y-2">
              {step.userDoes.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#62646A]">
                  <Circle size={13} className="text-[#CCCCCC] shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          {step.insight && (
            <div className="sm:col-span-2 rounded-xl bg-[#F7F7F7] p-4 mt-1">
              <p className="text-[12px] text-[#62646A] leading-5">{step.insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaValidator() {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#151515] flex items-center justify-center shrink-0">
          <Search size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#151515] leading-tight">
            Idea Validator
          </h2>
          <p className="text-[13px] text-[#62646A] mt-0.5 leading-5 max-w-xl">
            Validate your chosen idea with real people before building anything. AI cannot
            validate your idea — only real people can. Sorene makes that process structured,
            fast, and interpretable.
          </p>
        </div>
      </div>

      {/* VIBE pill row */}
      <div className="flex flex-wrap gap-2">
        {[
          { letter: "V", label: "Validate" },
          { letter: "I", label: "Interview" },
          { letter: "B", label: "Build demo" },
          { letter: "E", label: "Experiment" },
        ].map(({ letter, label }, i, arr) => (
          <div key={letter} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F7F7] border border-[#EDEDED]">
              <span className="text-[13px] font-bold text-[#151515]">{letter}</span>
              <span className="text-[12px] text-[#62646A]">{label}</span>
            </div>
            {i < arr.length - 1 && (
              <span className="text-[#CCCCCC] text-sm">·</span>
            )}
          </div>
        ))}
      </div>

      {/* Framework label */}
      <div className="flex items-center gap-2 text-[12px] text-[#9A9A9A]">
        <span>The 4-step validation framework</span>
        <span>·</span>
        <span>2–4 weeks</span>
        <span>·</span>
        <span>Zero code required</span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {VIBE_STEPS.map((step, i) => (
          <VibeStep key={step.id} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// The Launchpad
// ─────────────────────────────────────────────

function Launchpad() {
  const [pitch, setPitch] = useState("");

  const tools = [
    { label: "Business Plan", icon: "📋" },
    { label: "Pitch Deck", icon: "📊" },
    { label: "Brand Kit", icon: "🎨" },
    { label: "Content Plan", icon: "✍️" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#151515] flex items-center justify-center shrink-0">
          <Rocket size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#151515] leading-tight">
            The Launchpad
          </h2>
          <p className="text-[13px] text-[#62646A] mt-0.5 leading-5 max-w-xl">
            Distil your idea into 3 sentences, then instantly spin up everything you need to launch.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EDEDED] bg-white p-5 space-y-4">
        {/* Elevator pitch */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] block mb-2">
            Elevator Pitch
          </label>
          <p className="text-[12px] text-[#9A9A9A] mb-2">
            Describe your business idea in 3 sentences — what it is, who it's for, and the key benefit.
          </p>
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="We help [who] to [do what] so that [key outcome]…"
            rows={4}
            className="w-full rounded-xl border border-[#EDEDED] bg-[#F7F7F7] px-4 py-3 text-[13px] text-[#151515] placeholder-[#CCCCCC] resize-none focus:outline-none focus:border-[#151515] transition-colors"
          />
          <div className="flex justify-end mt-1">
            <span className={cn("text-[11px]", pitch.length > 400 ? "text-red-400" : "text-[#9A9A9A]")}>
              {pitch.length} / 400
            </span>
          </div>
        </div>

        {/* Spin-up tools */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] mb-3">
            Instantly generate
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tools.map((t) => (
              <button
                key={t.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-[#EDEDED] bg-[#F7F7F7] p-4 hover:border-[#151515] hover:bg-white transition-all group cursor-not-allowed opacity-60"
                disabled
                title="Coming soon"
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-[12px] font-medium text-[#151515]">{t.label}</span>
                <span className="text-[10px] text-[#9A9A9A]">Coming soon</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Direct Sync
// ─────────────────────────────────────────────

function DirectSync() {
  const channels = [
    {
      name: "WhatsApp",
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <circle cx="16" cy="16" r="16" fill="#25D366" />
          <path
            d="M22.5 9.5A9 9 0 0 0 7.1 20.4L6 26l5.7-1.5A9 9 0 1 0 22.5 9.5zm-6.5 13.8a7.5 7.5 0 0 1-3.8-1l-.3-.2-3.4.9.9-3.3-.2-.3a7.5 7.5 0 1 1 6.8 3.9zm4.1-5.6c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1l-.6.8c-.1.2-.2.2-.4.1a6 6 0 0 1-1.7-1 6.3 6.3 0 0 1-1.2-1.4c-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.3-.5-.3h-.4c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 .9 2.4 10.3 10.3 0 0 0 3.9 3.4c.5.2.9.4 1.3.5a3.2 3.2 0 0 0 1.4.1 2.4 2.4 0 0 0 1.6-1.1c.2-.4.2-.7.1-.9z"
            fill="white"
          />
        </svg>
      ),
      href: "https://wa.me/",
      color: "#25D366",
    },
    {
      name: "Telegram",
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <circle cx="16" cy="16" r="16" fill="#229ED9" />
          <path
            d="M22.8 9.6l-2.9 13.7c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.3-.9.3l.3-4.8 8.1-7.3c.4-.3-.1-.5-.5-.2L8.7 17.8l-4.5-1.4c-1-.3-1-.9.2-1.4l17.6-6.8c.8-.3 1.5.2 1.3 1.4z"
            fill="white"
          />
        </svg>
      ),
      href: "https://t.me/",
      color: "#229ED9",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#151515] flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#151515] leading-tight">
            Direct Sync
          </h2>
          <p className="text-[13px] text-[#62646A] mt-0.5 leading-5 max-w-xl">
            Seamless weekly accountability checks. Chat with Sorene directly on your preferred messaging app.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EDEDED] bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map((ch) => (
            <a
              key={ch.name}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-[#EDEDED] p-4 hover:border-[#151515] hover:shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F7F7F7] group-hover:scale-105 transition-transform">
                {ch.icon}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#151515]">
                  Chat on {ch.name}
                </p>
                <p className="text-[12px] text-[#9A9A9A] mt-0.5">
                  Weekly check-ins with Sorene
                </p>
              </div>
              <ArrowRight size={15} className="text-[#CCCCCC] group-hover:text-[#151515] transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Go/No-Go Check
// ─────────────────────────────────────────────

const GO_CHECKS = [
  {
    id: "market",
    label: "Market Validation",
    description:
      "Users signed up, leads generated, sales made, number of conversations logged, and quality of feedback received.",
    icon: BarChart3,
    items: ["User sign-ups", "Qualified leads", "Sales / paid customers", "Conversations logged", "Quality of feedback"],
  },
  {
    id: "problem",
    label: "Problem & Solution Clarity",
    description:
      "Can you clearly define the problem and your solution based on real market signals — not AI-generated assumptions?",
    icon: Search,
    items: [
      "Problem defined from real conversations",
      "Solution tested with at least one real person",
      "Clear who the customer is",
      "Painkiller problem identified",
    ],
  },
  {
    id: "learning",
    label: "Foundation Learning",
    description:
      "Completion of the core learning module that prepares you to run a business, not just an idea.",
    icon: CheckCircle2,
    items: [
      "Completed foundation module",
      "Understand the VIBE framework",
      "Understand MVO (minimum viable offer)",
      "Know your DNA + Direction",
    ],
  },
  {
    id: "finance",
    label: "Finance Readiness",
    description:
      "A basic assessment of whether you are financially positioned to commit to building this business.",
    icon: DollarSign,
    items: [
      "Personal runway assessed",
      "Startup cost estimate done",
      "First revenue target set",
      "Funding / bootstrap path chosen",
    ],
  },
];

function GoNoGoCheck() {
  const [scores, setScores] = useState<Record<string, Record<string, boolean>>>({});

  const toggle = (checkId: string, item: string) => {
    setScores((prev) => ({
      ...prev,
      [checkId]: {
        ...(prev[checkId] || {}),
        [item]: !(prev[checkId]?.[item] ?? false),
      },
    }));
  };

  const total = GO_CHECKS.reduce((acc, c) => acc + c.items.length, 0);
  const checked = Object.values(scores).reduce(
    (acc, items) => acc + Object.values(items).filter(Boolean).length,
    0,
  );
  const pct = Math.round((checked / total) * 100);
  const ready = pct >= 80;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#151515] flex items-center justify-center shrink-0">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-semibold text-[#151515] leading-tight">
            The Go / No-Go Check
          </h2>
          <p className="text-[13px] text-[#62646A] mt-0.5 leading-5 max-w-xl">
            A crystal-clear health check that tells you if you're ready to launch a business.
          </p>
        </div>
        {/* Score pill */}
        <div
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
            ready
              ? "bg-[#DCFCE7] text-[#166534]"
              : pct >= 50
              ? "bg-[#FEF9C3] text-[#854D0E]"
              : "bg-[#F7F7F7] text-[#62646A]",
          )}
        >
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            ready ? "bg-[#16A34A]" : pct >= 50 ? "bg-[#CA8A04]" : "bg-[#151515]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Verdict */}
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-[13px] font-medium flex items-center gap-2",
          ready
            ? "bg-[#DCFCE7] text-[#166534]"
            : "bg-[#F7F7F7] text-[#62646A]",
        )}
      >
        {ready ? (
          <>
            <CheckCircle2 size={15} />
            You're ready to launch. All core criteria are met.
          </>
        ) : (
          <>
            <Lock size={14} />
            Complete the criteria below to unlock your Go / No-Go verdict.
          </>
        )}
      </div>

      {/* Check groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GO_CHECKS.map((check) => {
          const Icon = check.icon;
          const groupChecked = check.items.filter((i) => scores[check.id]?.[i]).length;
          return (
            <div
              key={check.id}
              className="rounded-2xl border border-[#EDEDED] bg-white p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[#151515]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#151515]">
                      {check.label}
                    </p>
                    <span className="text-[11px] text-[#9A9A9A] shrink-0">
                      {groupChecked}/{check.items.length}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#62646A] mt-0.5 leading-4">
                    {check.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-1 border-t border-[#F0F0F0]">
                {check.items.map((item) => {
                  const on = scores[check.id]?.[item] ?? false;
                  return (
                    <button
                      key={item}
                      onClick={() => toggle(check.id, item)}
                      className="w-full flex items-center gap-2.5 text-left group"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          on
                            ? "bg-[#151515] border-[#151515]"
                            : "border-[#CCCCCC] group-hover:border-[#151515]",
                        )}
                      >
                        {on && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span
                        className={cn(
                          "text-[12px] transition-colors",
                          on ? "text-[#151515] line-through" : "text-[#62646A]",
                        )}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function Page() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-12">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-[24px] font-semibold text-[#151515]">Execution Hub</h1>
          <p className="text-[14px] text-[#62646A]">
            Turn your Direction into momentum. Validate, launch, and track what matters.
          </p>
        </div>

        <IdeaValidator />
        <Launchpad />
        <DirectSync />
        <GoNoGoCheck />
      </div>
    </div>
  );
}
