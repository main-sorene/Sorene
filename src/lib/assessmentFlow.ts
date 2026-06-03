"use client";
export type AssessmentContext = {
  profile: { firstName: string; cvFileName?: string | null };
  answers: Record<string, string>;
  hasCv: boolean;
};

export type FollowUp = {
  condition: (answer: string) => boolean;
  message: string | ((answer: string) => string);
  inputType: "freetext" | "choice";
  choices?: string[];
};

export type QuestionNode = {
  id: string;
  signal: string;
  soreneMessage: string | ((ctx: AssessmentContext) => string);
  inputType: "freetext" | "choice";
  choices?: string[];
  allowCustom?: boolean;
  next: string | ((answer: string, ctx: AssessmentContext) => string);
  followUp?: FollowUp;
  // always-show follow-up (no condition)
  alwaysFollowUp?: {
    message: string;
    inputType: "freetext" | "choice";
    choices?: string[];
  };
};

export const QUESTION_NODES: QuestionNode[] = [
  // Background questions — only used when user skips CV upload
  {
    id: "bg1_history",
    signal: "Background",
    soreneMessage: (ctx) =>
      `That's completely fine${ctx.profile.firstName !== "there" ? `, ${ctx.profile.firstName}` : ""}. Let me get to know you through a few short questions instead.\n\nTo start — could you walk me through what you've been doing professionally over the last few years? Not the job titles, but what your days have actually looked like, what kind of work has filled your time.`,
    inputType: "freetext",
    next: "bg2_skills",
  },
  {
    id: "bg2_skills",
    signal: "Background",
    soreneMessage:
      "Thank you for sharing that. When people come to you for help at work — colleagues, clients, friends — what do they tend to ask you about? What are the things you've quietly become good at over time, even if they don't feel like big achievements?",
    inputType: "freetext",
    next: "bg3_pattern",
  },
  {
    id: "bg3_pattern",
    signal: "Background",
    soreneMessage:
      "When you look back at the path you've taken — the roles, the shifts, the choices you made — does a thread run through it? Some quiet pattern in what kept pulling you forward, or in what you kept moving away from? Or has it felt more like one thing after another, without much shape?",
    inputType: "freetext",
    next: "bg4_direction",
  },
  {
    id: "bg4_direction",
    signal: "Background",
    soreneMessage:
      "Where do you feel yourself drifting these days — whether it's something you're quietly being drawn toward, or something you're slowly starting to step away from? Even if it's not fully formed yet, name what comes to mind.",
    inputType: "freetext",
    next: "bg5_turning",
  },
  {
    id: "bg5_turning",
    signal: "Background",
    soreneMessage:
      "One last bit of context before we go deeper. Looking back, was there a moment — a project, a conversation, a season of your life — that quietly shifted how you saw your work, or what you wanted from it? Take your time with this one.",
    inputType: "freetext",
    next: "q1_energy",
  },
  {
    id: "q1_energy",
    signal: "Energy Pattern",
    soreneMessage: (ctx) => {
      if (ctx.hasCv) {
        return `Think about a time when work didn't feel like work. When you were so absorbed that you lost track of time. What were you actually doing in that moment?`;
      }
      return `Think of a specific moment in your work or life when you felt genuinely energized — like what you were doing actually mattered and didn't feel like a burden. What were you doing, and why did it feel that way?`;
    },
    inputType: "freetext",
    next: "q1_followup",
  },
  {
    id: "q1_followup",
    signal: "Energy Pattern",
    soreneMessage: (ctx) => {
      const q1Answer = ctx.answers["q1_energy"] || "";
      const preview = q1Answer.length > 60 ? q1Answer.slice(0, 60) + "..." : q1Answer;
      return `${preview ? `I hear you — that sense of things clicking into place. ` : ""}What drains you? What kind of work makes the day feel long and leaves you feeling empty — not physically tired, but emotionally flat?`;
    },
    inputType: "freetext",
    next: "q1b_quit_reason",
  },
  {
    id: "q1b_quit_reason",
    signal: "Negative Filter",
    soreneMessage:
      "Now think about your most recent role — or the situation you're moving away from. What specifically pushed you out, or is pushing you out now? Not 'I needed a change' — but what was the thing you knew you couldn't keep doing?",
    inputType: "freetext",
    next: "q2_pattern",
  },
  {
    id: "q2_pattern",
    signal: "Energy Pattern",
    soreneMessage: "How often did that kind of energizing work actually show up in your past roles?",
    inputType: "choice",
    choices: [
      "All the time — it was a recurring thread",
      "Pretty often — it happened but wasn't my main role",
      "Occasionally — it came up but wasn't common",
      "Rarely — that was actually unusual for me",
    ],
    allowCustom: true,
    next: "q3_centrality",
    followUp: {
      condition: (answer) =>
        answer.includes("All the time") || answer.includes("Pretty often"),
      message:
        "So this was a real thread — not just a one-off. Did it consistently energize you, or did it start to feel like extra work on top of your real job?",
      inputType: "freetext",
    },
  },
  {
    id: "q3_centrality",
    signal: "Values + Motivation",
    soreneMessage:
      "If you were building something now, where would you want that kind of work to sit?",
    inputType: "choice",
    choices: [
      "At the center — I'd build the whole thing around it",
      "As a key part — important but not the only thing",
      "As one element — included but not the main focus",
      "Not sure yet — I need to think about this more",
    ],
    allowCustom: false,
    next: "q4_time",
  },
  {
    id: "q4_time",
    signal: "Constraints",
    soreneMessage:
      "How many focused hours per week can you realistically commit to building something new — without sacrificing things you're not willing to lose?",
    inputType: "choice",
    choices: [
      "0–5 hours — very limited right now",
      "5–10 hours — weekend side project pace",
      "10–20 hours — serious side hustle",
      "20–30 hours — part-time commitment",
      "30+ hours — full-time or close to it",
    ],
    allowCustom: true,
    next: "q5_finance",
    followUp: {
      condition: (answer) => answer.startsWith("0–5"),
      message:
        "That's a tight window. Is that a temporary situation, or is it how things are likely to stay for a while?",
      inputType: "freetext",
    },
  },
  {
    id: "q5_finance",
    signal: "Constraints + Risk Comfort",
    soreneMessage: "How soon do you need this to generate meaningful income?",
    inputType: "choice",
    choices: [
      "Within 3 months — I need money soon",
      "Within 6 months — I have a short runway",
      "Within 12 months — I can build gradually",
      "12+ months or no timeline — I can experiment",
      "Income isn't the main driver — I'm optimising for something else",
    ],
    allowCustom: false,
    next: "q6_tradeoff",
    followUp: {
      condition: (answer) => answer.startsWith("Within 3 months"),
      message:
        "Three months is urgent. That changes what's realistic — we'd need to focus on things that can generate cash quickly, like services or consulting, rather than products that take time to build. Does that feel right, or is there something about your situation I should know?",
      inputType: "freetext",
    },
  },
  {
    id: "q6_tradeoff",
    signal: "Non-Negotiables",
    soreneMessage:
      "Imagine you're two years into building something. Which of these would feel hardest to live with?",
    inputType: "choice",
    choices: [
      "Profitable but meaningless — good money, but the work feels empty",
      "Meaningful but barely pays — you love it, but it's financially stressful",
      "Stable but creatively limiting — reliable income, but you feel stuck",
      "Exciting but completely unpredictable — never boring, but chaotic income",
    ],
    allowCustom: false,
    next: "q7_uncertainty",
    alwaysFollowUp: {
      message:
        "Tell me why that one feels unbearable. What is it about that situation?",
      inputType: "freetext",
    },
  },
  {
    id: "q7_uncertainty",
    signal: "Decision-Making Style + Risk Comfort",
    soreneMessage:
      "Here's a scenario: You've been working on something for three months. Early feedback is mixed — not terrible, not great. Some people seem interested but nothing's clicking yet. What would you most likely do?",
    inputType: "choice",
    choices: [
      "Keep going and iterate — use the feedback and improve",
      "Step back and rethink — pause and reconsider the whole approach",
      "Feel anxious, need more proof — want clearer signals before continuing",
      "Pivot to test something else — try a different direction quickly",
      "Seek outside perspective — ask mentors or peers what they think",
    ],
    allowCustom: true,
    next: "q8_workmode",
    followUp: {
      condition: (answer) =>
        answer.includes("anxious") || answer.includes("need more proof"),
      message:
        "What would 'clearer proof' look like to you? What would make you feel confident enough to keep going?",
      inputType: "freetext",
    },
  },
  {
    id: "q8_workmode",
    signal: "Work Structure Preference",
    soreneMessage:
      "When you imagine building something, which feels most natural to you?",
    inputType: "choice",
    choices: [
      "Alone, then share — work solo, show people what I've made",
      "With a few trusted people — think alongside 1–2 collaborators",
      "With a team or community — I need group energy to stay motivated",
      "Alone at first, team later — start solo, involve others as it grows",
    ],
    allowCustom: true,
    next: "q9_success",
    followUp: {
      condition: (answer) => answer.startsWith("Alone"),
      message:
        "When you've worked alone in the past, what did you find hardest about it? Or does solo work feel genuinely natural?",
      inputType: "freetext",
    },
  },
  {
    id: "q9_success",
    signal: "Definition of Success",
    soreneMessage:
      "Imagine it's one year from now and things are going well. What does 'going well' actually feel like — not what it looks like from the outside, but what it feels like when you're living it?",
    inputType: "freetext",
    next: "q10_regret",
  },
  {
    id: "q10_regret",
    signal: "Risk Tolerance + Decision-Making Style",
    soreneMessage: "What would feel worse to you?",
    inputType: "choice",
    choices: [
      "Trying and failing — wasting time and effort on something that doesn't work",
      "Not trying at all — always wondering 'what if I had given it a shot'",
      "Both feel equally hard — I struggle with this tension",
      "Neither really — I don't think in terms of regret like this",
    ],
    allowCustom: false,
    next: "q11_readiness",
    followUp: {
      condition: (answer) => answer.includes("Not trying"),
      message:
        "So you're more afraid of regret than failure. That means the question isn't 'will this definitely work?' — it's 'is this worth trying?' Does that reframe feel right?",
      inputType: "choice",
      choices: [
        "Yes, that helps",
        "Somewhat, but I still feel uncertain",
        "Not really — let me explain",
      ],
    },
  },
  {
    id: "q11_readiness",
    signal: "Readiness Mode",
    soreneMessage: (ctx) =>
      `Last question, ${ctx.profile.firstName}. Where are you right now, honestly?`,
    inputType: "choice",
    choices: [
      "Exploring — understanding what's possible before committing",
      "Deciding — I have directions in mind but don't know which fits me",
      "Ready to start — I know roughly what I want, I need a plan",
      "Stuck — I've tried things before but nothing felt right",
      "Transitioning — I'm leaving something and need a sustainable next step",
    ],
    allowCustom: true,
    next: "closing",
    followUp: {
      condition: (answer) =>
        answer.includes("Deciding") || answer.includes("Stuck"),
      message: (answer: string) => {
        if (answer.includes("Deciding")) {
          return "What are you deciding between? Just the shorthand — no need to explain everything yet.";
        }
        return "What didn't fit about those past attempts? Was it the work itself, the model, the timing, or something else?";
      },
      inputType: "freetext",
    },
  },
];

export const OPENING_MESSAGE = (firstName: string) =>
  `Hi${firstName && firstName !== "there" ? ` ${firstName}` : ""}. I'm Sorene.\n\nBefore we explore business ideas together, I want to understand who you are — not who you think you should be, but how you actually work, what matters to you, and what your life allows right now.`;

export const CV_CONTEXT_MESSAGE = (cvSummary: string) =>
  `To do that well, I'd like to start with some context about your background and experience.\n\n${cvSummary}`;

export const CV_REQUEST_MESSAGE = `To do that well, I'd like to start with some context about your background and experience.\n\n**Would you like to share your CV or portfolio?**\n\nThis is completely optional, but it helps me understand:\n• What you've done professionally\n• What skills and experience you bring\n• What patterns might exist in your career journey\n• What you might be moving away from or toward\n\nYou can attach a PDF using the + button below, or skip and I'll get to know you through a few short questions instead.`;

export const CLOSING_MESSAGE =
  "Thank you for being honest with me. Give me a moment to bring this together.";

export function getNode(id: string): QuestionNode | undefined {
  return QUESTION_NODES.find((n) => n.id === id);
}

export function getNodeMessage(
  node: QuestionNode,
  ctx: AssessmentContext
): string {
  if (typeof node.soreneMessage === "function") {
    return node.soreneMessage(ctx);
  }
  return node.soreneMessage;
}

export function getFollowUpMessage(
  followUp: FollowUp & { message: string | ((answer: string) => string) },
  answer: string
): string {
  if (typeof followUp.message === "function") {
    return followUp.message(answer);
  }
  return followUp.message;
}

// Main question IDs (not follow-ups) for progress counting
export const MAIN_QUESTION_IDS = QUESTION_NODES.map((n) => n.id);
