"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
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
// Idea Validator content
// ─────────────────────────────────────────────

const VIBE_STEPS = [
  {
    id: 1,
    vibe: "V + I",
    title: "Talk to 10 potential customers",
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

function IdeaValidatorContent() {
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {/* VIBE pills */}
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
            {i < arr.length - 1 && <span className="text-[#CCCCCC]">·</span>}
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#9A9A9A]">
        4-step framework · 2–4 weeks · zero code required
      </p>

      {/* Steps */}
      <div className="space-y-2">
        {VIBE_STEPS.map((step) => {
          const Icon = step.icon;
          const isOpen = openStep === step.id;
          return (
            <div key={step.id} className="rounded-xl border border-[#EDEDED] overflow-hidden">
              <button
                onClick={() => setOpenStep(isOpen ? null : step.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F7F7F7] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#151515] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[#9A9A9A] mr-2">Step {step.id} · {step.vibe}</span>
                  <span className="text-[13px] font-medium text-[#151515]">{step.title}</span>
                </div>
                <span className="text-[11px] text-[#9A9A9A] shrink-0 mr-2">{step.duration}</span>
                <ChevronDown
                  size={14}
                  className={cn("text-[#9A9A9A] shrink-0 transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#F0F0F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-2">Sorene provides</p>
                    <ul className="space-y-1.5">
                      {step.soreneDoes.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#151515]">
                          <CheckCircle2 size={12} className="text-[#151515] shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9A9A9A] mb-2">You must do</p>
                    <ul className="space-y-1.5">
                      {step.userDoes.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#62646A]">
                          <Circle size={12} className="text-[#CCCCCC] shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {step.insight && (
                    <div className="sm:col-span-2 rounded-lg bg-[#F7F7F7] px-4 py-3">
                      <p className="text-[12px] text-[#62646A] leading-5">{step.insight}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Launchpad content
// ─────────────────────────────────────────────

function LaunchpadContent() {
  const [pitch, setPitch] = useState("");
  const tools = [
    { label: "Business Plan", icon: "📋" },
    { label: "Pitch Deck", icon: "📊" },
    { label: "Brand Kit", icon: "🎨" },
    { label: "Content Plan", icon: "✍️" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] mb-1.5">
          Elevator Pitch
        </p>
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

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#62646A] mb-3">
          Instantly generate
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tools.map((t) => (
            <div
              key={t.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#EDEDED] bg-[#F7F7F7] p-4 opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-[12px] font-medium text-[#151515]">{t.label}</span>
              <span className="text-[10px] text-[#9A9A9A]">Coming soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Direct Sync content
// ─────────────────────────────────────────────

function DirectSyncContent() {
  const channels = [
    {
      name: "WhatsApp",
      href: "https://wa.me/",
      icon: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <circle cx="16" cy="16" r="16" fill="#25D366" />
          <path d="M22.5 9.5A9 9 0 0 0 7.1 20.4L6 26l5.7-1.5A9 9 0 1 0 22.5 9.5zm-6.5 13.8a7.5 7.5 0 0 1-3.8-1l-.3-.2-3.4.9.9-3.3-.2-.3a7.5 7.5 0 1 1 6.8 3.9zm4.1-5.6c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1l-.6.8c-.1.2-.2.2-.4.1a6 6 0 0 1-1.7-1 6.3 6.3 0 0 1-1.2-1.4c-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.3-.5-.3h-.4c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 .9 2.4 10.3 10.3 0 0 0 3.9 3.4c.5.2.9.4 1.3.5a3.2 3.2 0 0 0 1.4.1 2.4 2.4 0 0 0 1.6-1.1c.2-.4.2-.7.1-.9z" fill="white" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: "https://t.me/",
      icon: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <circle cx="16" cy="16" r="16" fill="#229ED9" />
          <path d="M22.8 9.6l-2.9 13.7c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.3-.9.3l.3-4.8 8.1-7.3c.4-.3-.1-.5-.5-.2L8.7 17.8l-4.5-1.4c-1-.3-1-.9.2-1.4l17.6-6.8c.8-.3 1.5.2 1.3 1.4z" fill="white" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[#62646A] leading-5">
        Click below to open a conversation with Sorene on your preferred app.
        Weekly accountability check-ins keep you on track.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((ch) => (
          <a
            key={ch.name}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-[#EDEDED] p-4 hover:border-[#151515] hover:shadow-sm transition-all group"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#F7F7F7] group-hover:scale-105 transition-transform">
              {ch.icon}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#151515]">Chat on {ch.name}</p>
              <p className="text-[12px] text-[#9A9A9A]">Weekly check-ins with Sorene</p>
            </div>
            <ArrowRight size={14} className="text-[#CCCCCC] group-hover:text-[#151515] transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Go/No-Go content
// ─────────────────────────────────────────────

const GO_CHECKS = [
  {
    id: "market",
    label: "Market Validation",
    description: "User sign-ups, leads, sales, conversations logged, and quality of feedback received.",
    icon: BarChart3,
    items: ["User sign-ups", "Qualified leads", "Sales / paid customers", "Conversations logged", "Quality of feedback"],
  },
  {
    id: "problem",
    label: "Problem & Solution Clarity",
    description: "Can you clearly define the problem and solution from real conversations — not AI-generated assumptions?",
    icon: Search,
    items: ["Problem defined from real conversations", "Solution tested with at least one real person", "Clear who the customer is", "Painkiller problem identified"],
  },
  {
    id: "learning",
    label: "Foundation Learning",
    description: "Completion of the core learning module that prepares you to run a business, not just an idea.",
    icon: CheckCircle2,
    items: ["Completed foundation module", "Understand the VIBE framework", "Understand MVO (minimum viable offer)", "Know your DNA + Direction"],
  },
  {
    id: "finance",
    label: "Finance Readiness",
    description: "A basic assessment of whether you are financially positioned to commit to building this.",
    icon: DollarSign,
    items: ["Personal runway assessed", "Startup cost estimate done", "First revenue target set", "Funding / bootstrap path chosen"],
  },
];

function GoNoGoContent() {
  const [scores, setScores] = useState<Record<string, Record<string, boolean>>>({});

  const toggle = (checkId: string, item: string) => {
    setScores((prev) => ({
      ...prev,
      [checkId]: { ...(prev[checkId] || {}), [item]: !(prev[checkId]?.[item] ?? false) },
    }));
  };

  const total = GO_CHECKS.reduce((acc, c) => acc + c.items.length, 0);
  const checked = Object.values(scores).reduce((acc, g) => acc + Object.values(g).filter(Boolean).length, 0);
  const pct = Math.round((checked / total) * 100);
  const ready = pct >= 80;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#62646A]">{checked} of {total} criteria met</span>
          <span className={cn("font-semibold", ready ? "text-[#16A34A]" : "text-[#151515]")}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", ready ? "bg-[#16A34A]" : pct >= 50 ? "bg-[#CA8A04]" : "bg-[#151515]")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={cn("rounded-lg px-3 py-2 text-[12px] font-medium flex items-center gap-2", ready ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F7F7F7] text-[#62646A]")}>
          {ready ? <CheckCircle2 size={13} /> : <Lock size={13} />}
          {ready ? "You're ready to launch. All core criteria are met." : "Complete the criteria below to unlock your Go / No-Go verdict."}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GO_CHECKS.map((check) => {
          const Icon = check.icon;
          const groupChecked = check.items.filter((i) => scores[check.id]?.[i]).length;
          return (
            <div key={check.id} className="rounded-xl border border-[#EDEDED] p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[#151515]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#151515]">{check.label}</p>
                    <span className="text-[11px] text-[#9A9A9A]">{groupChecked}/{check.items.length}</span>
                  </div>
                  <p className="text-[11px] text-[#9A9A9A] leading-4 mt-0.5">{check.description}</p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-[#F0F0F0] pt-2.5">
                {check.items.map((item) => {
                  const on = scores[check.id]?.[item] ?? false;
                  return (
                    <button key={item} onClick={() => toggle(check.id, item)} className="w-full flex items-center gap-2 text-left group">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", on ? "bg-[#151515] border-[#151515]" : "border-[#CCCCCC] group-hover:border-[#151515]")}>
                        {on && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={cn("text-[12px] transition-colors", on ? "text-[#9A9A9A] line-through" : "text-[#62646A]")}>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Folder card
// ─────────────────────────────────────────────

interface Folder {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  content: React.ReactNode;
}

function FolderCard({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-[#EDEDED] bg-white overflow-hidden transition-shadow", open && "shadow-sm")}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-5 text-left hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="w-11 h-11 rounded-2xl bg-[#F7F7F7] flex items-center justify-center shrink-0">
          {folder.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#151515]">{folder.title}</p>
          <p className="text-[13px] text-[#62646A] mt-0.5 leading-5">{folder.description}</p>
        </div>
        <ChevronDown
          size={16}
          className={cn("text-[#9A9A9A] shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-5 pb-6 border-t border-[#F0F0F0]">
          <div className="pt-5">{folder.content}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function Page() {
  const folders: Folder[] = [
    {
      id: "idea-validator",
      icon: <Search size={20} className="text-[#151515]" />,
      title: "Idea Validator",
      description: "Validate your idea with real people using the VIBE framework — before writing a single line of code.",
      content: <IdeaValidatorContent />,
    },
    {
      id: "launchpad",
      icon: <Rocket size={20} className="text-[#151515]" />,
      title: "The Launchpad",
      description: "Write your elevator pitch and instantly spin up your business plan, pitch deck, brand, and content.",
      content: <LaunchpadContent />,
    },
    {
      id: "direct-sync",
      icon: <MessageCircle size={20} className="text-[#151515]" />,
      title: "Direct Sync",
      description: "Weekly accountability check-ins with Sorene via WhatsApp or Telegram — tap to chat directly.",
      content: <DirectSyncContent />,
    },
    {
      id: "go-no-go",
      icon: <BarChart3 size={20} className="text-[#151515]" />,
      title: "The Go / No-Go Check",
      description: "A crystal-clear health check that tells you if you're ready to launch a business.",
      content: <GoNoGoContent />,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-3">
        <div className="mb-6 space-y-1">
          <h1 className="text-[22px] font-semibold text-[#151515]">Execution Hub</h1>
          <p className="text-[14px] text-[#62646A]">
            Turn your Direction into momentum. Open a section to get started.
          </p>
        </div>

        {folders.map((folder) => (
          <FolderCard key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}
