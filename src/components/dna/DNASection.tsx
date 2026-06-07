"use client";

import { DNACard } from "./DNACard";
import { AnimatePresence, motion } from "framer-motion";
import { useDnaData } from "@/hooks/useDnaData";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { cn } from "@/lib/utils";
import { DNACoreItem, mapProfileToDNA } from "@/lib/dnaMapping";

function truncateSummary(text: string, max = 160): string {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).replace(/\s\S*$/, "") + "…";
}

function buildDnaItems(scores: NonNullable<ReturnType<typeof useDnaData>["data"]>["dnaScores"], narrative?: Record<string, string> | null): DNACoreItem[] | null {
  if (!scores) return null;
  const riskLabel = scores.risk_score >= 8 ? "High" : scores.risk_score >= 5 ? "Medium" : "Low";
  const structureLabel = scores.structure_preference || (scores.structure_score >= 8 ? "Independent" : scores.structure_score >= 6 ? "Small Team" : "Collaborative");
  const collaborationLabel = scores.collaboration_mode || structureLabel;
  const uncertaintyLabel = scores.ambiguity_tolerance || (scores.uncertainty_score >= 8 ? "High" : scores.uncertainty_score >= 5 ? "Medium" : "Low");
  const readinessLabel = scores.readiness_label || (scores.readiness_score >= 7 ? "Ready" : scores.readiness_score >= 5 ? "Deciding" : "Exploring");
  const timeLabel = scores.time_availability || (scores.constraint_score >= 8 ? "High" : scores.constraint_score >= 5 ? "Medium" : "Limited");
  const energyStabilityLabel = scores.energy_stability_score >= 7 ? "Stable" : scores.energy_stability_score >= 4 ? "Variable" : "Depleted";
  const emotionalRisk = scores.emotional_risk || riskLabel;
  const financialRisk = scores.financial_risk || riskLabel;
  const primaryMotivation = narrative?.primary_motivation_label || scores.primary_motivation || scores.energy_source?.split(/[.,!?]/)[0]?.trim().slice(0, 50) || "—";
  const cleanedScoreStrengths = (scores.strength_patterns || []).filter(
    (s) => s && !/[:\-]/.test(s) && s !== s.toLowerCase() && s.split(" ").length <= 4
  );
  const strengthPatterns = narrative?.strength_patterns_labels
    ? narrative.strength_patterns_labels.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 5)
    : cleanedScoreStrengths.length
      ? cleanedScoreStrengths
      : [energyStabilityLabel + " energy", structureLabel, collaborationLabel, uncertaintyLabel + " adaptability", readinessLabel].slice(0, 5);

  return [
    {
      core_id: "your_core",
      title: "Your Core",
      variant: "hero" as const,
      isLarge: true,
      fullWidth: true,
      gradient: `radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)`,
      icon: "/figmaAssets/dna.svg",
      hero_statement: narrative?.core_dna_label || scores.motivation_driver.slice(0, 80),
      description: narrative?.your_core || scores.strengths_summary || "Your unique strengths and energy patterns shape how you work best.",
      summary: narrative?.your_core ? narrative.your_core.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".") : scores.success_feeling?.slice(0, 120) || "Your personal definition of success guides your direction.",
      key_signals: [
        { label: "Primary Motivation", value: primaryMotivation, explanation: scores.motivation_driver },
        { label: "Structure Preference", value: structureLabel, explanation: "How you prefer to organize your work environment." },
        { label: "Collaboration Mode", value: collaborationLabel, explanation: "How you work best with others." },
        { label: "Ambiguity Tolerance", value: uncertaintyLabel, explanation: "How you handle unclear or uncertain situations." },
        { label: "Emotional Risk", value: emotionalRisk, explanation: "Your tolerance for emotional risk and uncertainty." },
        { label: "Financial Risk", value: financialRisk, explanation: "Your financial risk appetite and runway tolerance." },
        { label: "Time Availability", value: timeLabel, explanation: "How much capacity you can commit to this work." },
        { label: "Readiness Level", value: readinessLabel, explanation: "Where you are on the path to taking action." },
      ],
      strength_patterns: narrative?.core_dna_label ? [narrative.core_dna_label, ...strengthPatterns.slice(0, 4)] : strengthPatterns,
    },
    {
      core_id: "what_drives_you",
      title: "What Drives You",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF6820 0%, #FAC515 100%)`,
      icon: "/figmaAssets/rocket-launch-collapsed.svg",
      hero_statement: scores.motivation_driver.slice(0, 80),
      description: narrative?.what_drives_you || scores.motivation_driver,
      summary: truncateSummary(narrative?.what_drives_you || scores.success_feeling || scores.motivation_driver || ""),
      key_signals: [
        {
          label: "Primary Drive",
          value: narrative?.primary_motivation_label || (riskLabel === "High" ? "Ambition" : riskLabel === "Medium" ? "Growth" : "Mastery"),
          explanation: riskLabel === "High"
            ? "You're wired to move — staying still feels like falling behind."
            : riskLabel === "Medium"
            ? "You want to grow without gambling everything — progress with intention."
            : "You care about doing it right more than doing it fast.",
        },
        {
          label: "Centrality",
          value: scores.motivation_driver.includes("core focus") ? "Central to your life" : scores.motivation_driver.includes("important component") ? "Key part of your life" : "One element of your life",
          explanation: scores.motivation_driver.includes("core focus")
            ? "This isn't a side project — you want it to be the main thing."
            : scores.motivation_driver.includes("important component")
            ? "Important, but not the only thing — you're building a bigger picture."
            : "This fits into a fuller life rather than defining it.",
        },
        {
          label: "Success Vision",
          value: narrative?.success_vision_label || "—",
          explanation: "What winning actually looks like for you — in your own terms.",
        },
        {
          label: "Non-Negotiable",
          value: narrative?.non_negotiable_label || "—",
          explanation: "The line you named as the hardest to cross — what you won't trade away.",
        },
        {
          label: "Readiness",
          value: readinessLabel,
          explanation: readinessLabel === "Ready"
            ? "You're not waiting for a sign — you're looking for the right direction to commit to."
            : readinessLabel === "Deciding"
            ? "You're moving from clarity to commitment — the pieces are coming together."
            : "You're still figuring out what you want — and that's a real and valid place to be.",
        },
      ],
      strength_patterns: narrative?.what_drives_you_strengths
        ? narrative.what_drives_you_strengths.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    },
    {
      core_id: "how_you_work",
      title: "How You Work",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #2DD4BF 0%, #0891B2 100%)`,
      icon: "/figmaAssets/intersect-three-collapsed.svg",
      hero_statement: `${structureLabel} — ${timeLabel.toLowerCase()} capacity`,
      description: narrative?.how_you_work || `You work best ${structureLabel === "Independent" ? "alone, sharing once it's ready" : structureLabel === "Small Team" ? "alongside a few trusted collaborators" : "with the energy of a team or community"}. You have ${timeLabel.toLowerCase()} capacity right now.`,
      summary: truncateSummary(narrative?.how_you_work || `${structureLabel} • ${timeLabel} capacity`),
      key_signals: [
        {
          label: "Work Mode",
          value: structureLabel,
          explanation: structureLabel === "Independent"
            ? "You think deepest alone — you share when it's ready, not during the messy middle."
            : structureLabel === "Small Team"
            ? "You thrive alongside 1-2 trusted people who can keep up, not in large or political structures."
            : "You're energized by shared thinking and collective ownership of the work.",
        },
        {
          label: "Collaboration Style",
          value: collaborationLabel,
          explanation: collaborationLabel === "Independent"
            ? "You protect your focus and bring others in at the right moment."
            : collaborationLabel === "Small Group"
            ? "You do your best work with a tight, trusted circle — quality over quantity."
            : "You draw energy from working alongside others and build best in community.",
        },
        {
          label: "Capacity",
          value: timeLabel,
          explanation: timeLabel === "High"
            ? "You have serious hours to commit — this can be central, not a side project."
            : timeLabel === "Medium"
            ? "You have real room to build without burning out — enough for real momentum."
            : "Your time is tight right now — the model needs to fit around your life, not compete with it.",
        },
        {
          label: "Energy Rhythm",
          value: energyStabilityLabel,
          explanation: energyStabilityLabel === "Stable"
            ? "Your energy is consistent — you can build in sustained sprints without crashing."
            : energyStabilityLabel === "Variable"
            ? "Your energy comes in waves — you work best with flexibility built into the structure."
            : "You're running lean right now — the right work needs to restore you, not drain you further.",
        },
      ],
      strength_patterns: narrative?.how_you_work_strengths
        ? narrative.how_you_work_strengths.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [structureLabel, `${timeLabel} capacity`],
    },
    {
      core_id: "risk_and_change",
      title: "Risk & Change",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #8B5CF6 0%, #500724 100%)`,
      icon: "/figmaAssets/scales-collapsed.svg",
      hero_statement: `${riskLabel} risk · ${uncertaintyLabel.toLowerCase()} uncertainty tolerance`,
      description: narrative?.risk_and_change || `Your relationship with risk leans ${riskLabel.toLowerCase()}, and you handle ambiguity at a ${uncertaintyLabel.toLowerCase()} threshold. ${uncertaintyLabel === "Low" ? "You move forward best when signals are clear." : uncertaintyLabel === "High" ? "You can act before signals fully resolve." : "You hold a middle ground — you need some clarity, but don't need certainty."}`,
      summary: truncateSummary(narrative?.risk_and_change || `${riskLabel} risk · ${uncertaintyLabel} uncertainty`),
      key_signals: [
        {
          label: "Risk Profile",
          value: riskLabel,
          explanation: riskLabel === "High"
            ? "You're willing to bet on yourself — uncertainty doesn't stop you, it activates you."
            : riskLabel === "Medium"
            ? "You take considered risks — you'll move when the signal is strong enough."
            : "You prefer calculated moves — you build confidence before you commit.",
        },
        {
          label: "Uncertainty Tolerance",
          value: uncertaintyLabel,
          explanation: uncertaintyLabel === "High"
            ? "You can act before all the answers are in — ambiguity is fuel, not friction."
            : uncertaintyLabel === "Medium"
            ? "You need some clarity to move, but you don't need certainty — a direction is enough."
            : "You move best when the path is clear — fog drains you and slows your decisions.",
        },
        {
          label: "Emotional Risk",
          value: emotionalRisk,
          explanation: emotionalRisk === "High"
            ? "You're willing to risk being wrong, being judged, or being vulnerable in public."
            : emotionalRisk === "Medium"
            ? "You'll put yourself out there when the stakes feel worth it."
            : "You protect your inner world carefully — you need psychological safety to take risks.",
        },
        {
          label: "Financial Risk",
          value: financialRisk,
          explanation: financialRisk === "High"
            ? "You can stomach real financial uncertainty — you'd rather swing than play it safe."
            : financialRisk === "Medium"
            ? "You'll invest when the logic holds — but you need income in sight."
            : "You need financial ground under your feet before you move — income is not optional.",
        },
        {
          label: "Change Response",
          value: uncertaintyLabel === "High" ? "Lean In" : uncertaintyLabel === "Medium" ? "Pause & Pivot" : "Seek Clarity First",
          explanation: uncertaintyLabel === "High"
            ? "When things shift, you move with them — you update fast and iterate."
            : uncertaintyLabel === "Medium"
            ? "You step back, reassess, then re-commit — thoughtful rather than reactive."
            : "You want to understand before you act — change feels better with a plan.",
        },
      ],
      strength_patterns: narrative?.risk_and_change_strengths
        ? narrative.risk_and_change_strengths.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [`${riskLabel} risk appetite`, `${uncertaintyLabel} ambiguity tolerance`],
    },
    {
      core_id: "your_energy",
      title: "Your Energy",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #84CC16 100%)`,
      icon: "/figmaAssets/flame-collapsed.svg",
      hero_statement: scores.energy_source ? scores.energy_source.slice(0, 80) : "What energizes and drains you",
      description: narrative?.your_energy || (scores.energy_drains
        ? `Energized by: ${scores.energy_source}\n\nDrained by: ${scores.energy_drains}`
        : scores.energy_source || "Energy patterns shape what kind of work sustains you."),
      summary: truncateSummary(narrative?.your_energy || `${energyStabilityLabel} energy pattern`),
      key_signals: [
        {
          label: "Energy Source",
          value: narrative?.energy_source_label || "—",
          explanation: "The kind of work and environment that genuinely lights you up.",
        },
        {
          label: "Energy Drain",
          value: narrative?.energy_drain_label || "—",
          explanation: "What pulls you down and costs you more than it gives back.",
        },
        {
          label: "Energy Stability",
          value: energyStabilityLabel,
          explanation: energyStabilityLabel === "Stable"
            ? "Your energy is consistent — you can build in sustained sprints without crashing."
            : energyStabilityLabel === "Variable"
            ? "Your energy comes in waves — structure that respects your rhythm will serve you better."
            : "You're running on low right now — the right work needs to restore you, not deplete you further.",
        },
        {
          label: "Flow Conditions",
          value: energyStabilityLabel === "Stable" ? "Deep Focus" : energyStabilityLabel === "Variable" ? "Flexible Rhythm" : "Recovery First",
          explanation: energyStabilityLabel === "Stable"
            ? "You enter deep focus naturally — protect that space and you'll do your best work."
            : energyStabilityLabel === "Variable"
            ? "You need permission to ebb and flow — not a rigid schedule but an honest one."
            : "Before building, you need to recover — the foundation needs to be solid first.",
        },
      ],
      strength_patterns: narrative?.your_energy_strengths
        ? narrative.your_energy_strengths.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [energyStabilityLabel + " energy"],
    },
    {
      core_id: "non_negotiable",
      title: "Strengths & Edges",
      variant: "standard" as const,
      isLarge: true,
      fullWidth: true,
      gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF4444 0%, #F38744 100%)`,
      icon: "/figmaAssets/boxing-glove-collapsed.svg",
      hero_statement: "What you won't compromise on",
      description: narrative?.strengths_and_edges || scores.non_negotiable || "The trade-offs that matter most to you — and the edges of what's tolerable.",
      summary: narrative?.strengths_and_edges?.split(". ")[0] || scores.non_negotiable?.slice(0, 100) || "",
      key_signals: [
        {
          label: "Core Strength",
          value: narrative?.primary_motivation_label || primaryMotivation || "—",
          explanation: "The most consistent strength pattern visible across everything you shared.",
        },
        {
          label: "Non-Negotiable",
          value: narrative?.non_negotiable_label || "—",
          explanation: "The line you named as the hardest to cross — what you simply won't trade away.",
        },
        {
          label: "Growth Edge",
          value: uncertaintyLabel === "Low" ? "Sitting With Ambiguity" : riskLabel === "Low" ? "Taking Bigger Swings" : energyStabilityLabel === "Depleted" ? "Rebuilding Energy First" : "Scaling Without Losing Craft",
          explanation: uncertaintyLabel === "Low"
            ? "You work best with clarity — the edge is learning to move before all the answers are in."
            : riskLabel === "Low"
            ? "You're careful and considered — the edge is trusting yourself enough to bet bigger."
            : energyStabilityLabel === "Depleted"
            ? "Your biggest lever right now isn't strategy — it's restoring what drains you."
            : "Your craft is strong — the challenge will be maintaining quality as the work grows.",
        },
        {
          label: "Readiness",
          value: readinessLabel,
          explanation: readinessLabel === "Ready"
            ? "You're not waiting for permission — you're looking for the right direction to move."
            : readinessLabel === "Deciding"
            ? "You're in the gap between knowing and committing — closer than you think."
            : "You're still forming the picture — and that honesty is itself a strength.",
        },
        {
          label: "Activation Mode",
          value: energyStabilityLabel === "Stable" && readinessLabel === "Ready" ? "Launch Ready" : readinessLabel === "Deciding" ? "Clarifying" : energyStabilityLabel === "Depleted" ? "Restore First" : "Building Momentum",
          explanation: energyStabilityLabel === "Stable" && readinessLabel === "Ready"
            ? "Your energy and readiness are aligned — the conditions to move are as good as they'll get."
            : readinessLabel === "Deciding"
            ? "The next step is a commitment decision, not a research one."
            : energyStabilityLabel === "Depleted"
            ? "The smartest move right now is recovering capacity before building anything new."
            : "You're gaining ground — each step is strengthening the foundation.",
        },
      ],
      strength_patterns: narrative?.strengths_edges_strengths
        ? narrative.strengths_edges_strengths.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [readinessLabel, energyStabilityLabel + " energy"].filter(Boolean),
    },
  ];
}

const DEFAULT_DNA_ITEMS: DNACoreItem[] = [
  {
    core_id: "your_core",
    title: "Your Core",
    description:
      "Someone who cares deeply about doing things well and doing it right. You're not chasing speed or noise. You care about quality, clarity, and doing things properly.",
    gradient: `
    radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)
`,
    icon: "/figmaAssets/dna.svg",
    variant: "hero" as const,
    isLarge: true,
    fullWidth: true,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Primary Motivation",
        value: "Mastery",
        explanation:
          "You care about doing things well, not just finishing them.",
      },
      {
        label: "Structure Preference",
        value: "Guided",
        explanation:
          "You like frameworks. Not rigid rules, but clear direction.",
      },
      {
        label: "Collaboration Mode",
        value: "Small Team",
        explanation:
          "You think best in focused environments, not large noisy groups.",
      },
      {
        label: "Ambiguity Tolerance",
        value: "Low",
        explanation:
          "Too much uncertainty drains you. You prefer clarity before action.",
      },
      {
        label: "Risk Profile",
        value: "Low / Medium",
        explanation:
          "You're willing to take practical risks, but not chaotic ones.",
      },
      {
        label: "Time Availability",
        value: "High",
        explanation: "You currently have the capacity to commit deeply.",
      },
      {
        label: "Readiness Level",
        value: "Committed",
        explanation:
          "You're not casually exploring. You're ready to act when the direction feels right.",
      },
    ],
    strength_patterns: [
      "Diagnostic depth",
      "Quality focus",
      "Systematic thinking",
    ],
  },
  {
    core_id: "what_drives_you",
    title: "What Drives You",
    description:
      "You're motivated by improving your skills and building structured, scalable systems.",
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF6820 0%, #FAC515 100%)`,
    icon: "/figmaAssets/rocket-launch-collapsed.svg",
    variant: "standard" as const,
    isLarge: false,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Primary Drive",
        value: "Mastery",
        explanation: "Driven by expertise and doing things right.",
      },
      {
        label: "Work Preference",
        value: "Independent",
        explanation: "Focused deep work without constant interruption.",
      },
    ],
    strength_patterns: ["Skill improvement", "Scalability", "Expertise"],
  },
  {
    core_id: "how_you_work",
    title: "How You Work",
    description:
      "You prefer small teams with guided structure, balanced autonomy, and hands-on execution.",
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #2DD4BF 0%, #0891B2 100%)`,
    icon: "/figmaAssets/intersect-three-collapsed.svg",
    variant: "standard" as const,
    isLarge: false,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Team Size",
        value: "Small Team",
        explanation: "Optimal performance in tight-knit groups.",
      },
      {
        label: "Autonomy",
        value: "Balanced",
        explanation: "Freedom to execute within a clear framework.",
      },
    ],
    strength_patterns: [
      "Hands-on execution",
      "Balanced autonomy",
      "Guided structure",
    ],
  },
  {
    core_id: "risk_and_change",
    title: "Risk & Change",
    description:
      "You value clarity over chaos. You're cautious emotionally, but willing to take calculated financial risks.",
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #8B5CF6 0%, #500724 100%)`,
    icon: "/figmaAssets/scales-collapsed.svg",
    variant: "standard" as const,
    isLarge: false,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Financial Risk",
        value: "Calculated",
        explanation: "Willing to invest when logic holds.",
      },
      {
        label: "Emotional Risk",
        value: "Cautious",
        explanation: "Prefer stability and clear communication.",
      },
    ],
    strength_patterns: ["Calculated risk", "Calculated risks", "Clarity"],
  },
  {
    core_id: "your_energy",
    title: "Your Energy",
    description:
      "You feel energized when creating clear logical systems, and drained by unpredictable or chaotic environments.",
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #84CC16 100%)`,
    icon: "/figmaAssets/flame-collapsed.svg",
    variant: "standard" as const,
    isLarge: false,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Energy Source",
        value: "Logic",
        explanation: "Fuelled by order and systematic beauty.",
      },
      {
        label: "Energy Drain",
        value: "Chaos",
        explanation: "Drained by noisy, unstructured environments.",
      },
    ],
    strength_patterns: ["Order", "Systematic beauty", "Logical systems"],
  },
  {
    core_id: "strengths_and_edges",
    title: "Strengths & Edges",
    description:
      "Your strengths lie in structured thinking and simplifying complexity. You may struggle in highly ambiguous or unstructured situations.",
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF4444 0%, #F38744 100%)`,
    icon: "/figmaAssets/boxing-glove-collapsed.svg",
    variant: "standard" as const,
    isLarge: true,
    fullWidth: true,
    summary: "",
    hero_statement: "",
    key_signals: [
      {
        label: "Core Strength",
        value: "Structured Thinking",
        explanation: "Ability to see paths through chaos.",
      },
      {
        label: "Edge Cases",
        value: "Ambiguity",
        explanation: "May struggle when rules are not defined.",
      },
    ],
    strength_patterns: [
      "Simplifying complexity",
      "Structured thinking",
      "Clarity",
    ],
  },
];

export const DNASection = () => {
  const { data: profile, isLoading, refetch } = useDnaData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const handleSeeDirection = useCallback(() => {
    localStorage.removeItem("rcGenerationRequested");
    router.push("/direction");
  }, [router]);
  const authUser = useAtomValue(userAtom);

  // Backfill strengths_edges_strengths if missing
  useEffect(() => {
    const narrative = (profile as any)?.dna_narrative as Record<string, string> | null | undefined;
    const answers = profile?.assessmentAnswers;
    if (narrative?.strengths_edges_strengths || !answers || !authUser?.uid) return;
    authFetch("/api/dna-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, mode: "strengths" }),
    })
      .then((r) => r.json())
      .then(async ({ strengths_edges_strengths }) => {
        if (strengths_edges_strengths) {
          const { saveUserProfile } = await import("@/lib/firestore");
          await saveUserProfile(authUser.uid, {
            dna_narrative: { ...(narrative || {}), strengths_edges_strengths },
          });
          refetch();
        }
      })
      .catch(() => {});
  }, [profile, authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Backfill energy labels if missing
  useEffect(() => {
    const narrative = (profile as any)?.dna_narrative as Record<string, string> | null | undefined;
    const answers = profile?.assessmentAnswers;
    if ((narrative?.energy_source_label && narrative?.energy_drain_label && narrative?.your_energy_strengths) || !answers || !authUser?.uid) return;
    authFetch("/api/dna-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, mode: "energy" }),
    })
      .then((r) => r.json())
      .then(async (labels) => {
        const { energy_source_label, energy_drain_label, your_energy_strengths } = labels;
        if (energy_source_label || energy_drain_label || your_energy_strengths) {
          const { saveUserProfile } = await import("@/lib/firestore");
          await saveUserProfile(authUser.uid, {
            dna_narrative: { ...(narrative || {}), energy_source_label, energy_drain_label, your_energy_strengths },
          });
          refetch();
        }
      })
      .catch(() => {});
  }, [profile, authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Backfill success_vision_label and non_negotiable_label if missing via lightweight endpoint
  useEffect(() => {
    const narrative = (profile as any)?.dna_narrative as Record<string, string> | null | undefined;
    const answers = profile?.assessmentAnswers;
    if ((narrative?.success_vision_label && narrative?.non_negotiable_label) || !answers || !authUser?.uid) return;
    authFetch("/api/dna-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => r.json())
      .then(async ({ success_vision_label, non_negotiable_label }) => {
        if (success_vision_label || non_negotiable_label) {
          const { saveUserProfile } = await import("@/lib/firestore");
          await saveUserProfile(authUser.uid, {
            dna_narrative: { ...(narrative || {}), success_vision_label, non_negotiable_label },
          });
          refetch();
        }
      })
      .catch(() => {});
  }, [profile, authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate full narrative if missing entirely or missing key fields
  useEffect(() => {
    const narrative = (profile as any)?.dna_narrative as Record<string, string> | null | undefined;
    const answers = profile?.assessmentAnswers;
    if ((narrative?.core_dna_label && narrative?.strength_patterns_labels && narrative?.what_drives_you_strengths && narrative?.how_you_work_strengths && narrative?.risk_and_change_strengths) || !answers || !authUser?.uid) return;
    authFetch("/api/dna-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, cvSummary: (profile as any)?.cvSummary }),
    })
      .then((r) => r.json())
      .then(async ({ narrative: newNarrative }) => {
        if (newNarrative?.core_dna_label || newNarrative?.primary_motivation_label) {
          const { saveUserProfile } = await import("@/lib/firestore");
          await saveUserProfile(authUser.uid, { dna_narrative: newNarrative });
          refetch();
        }
      })
      .catch(() => {});
  }, [profile, authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your DNA profile...</p>
        </div>
      </div>
    );
  }

  const dnaItems = (profile?.externalProfile ? mapProfileToDNA(profile.externalProfile) : null)
    ?? buildDnaItems(profile?.dnaScores, (profile as any)?.dna_narrative)
    ?? DEFAULT_DNA_ITEMS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 lg:p-3 lg:pt-6 max-w-5xl mx-auto">
          {dnaItems
            .filter((item) => !expandedId || expandedId === item.title)
            .map((item) => {
              const isExpanded = expandedId === item.title;
              const showFullWidth = item.fullWidth || isExpanded;

              return (
                <div
                  key={item.title}
                  className={cn(
                    "transition-all duration-500 ease-in-out",
                    showFullWidth ? "col-span-1 sm:col-span-2" : "col-span-1",
                  )}
                >
                  <DNACard
                    title={item.title}
                    description={isExpanded ? item.description : item.summary}
                    gradient={item.gradient}
                    icon={item.icon}
                    variant={item.variant}
                    keySignals={item.key_signals}
                    strengthPatterns={item.strength_patterns}
                    blindSpots={item.blind_spots}
                    riskExamples={item.risk_examples}
                    heroStatement={item.hero_statement}
                    isLarge={item.isLarge}
                    isExpanded={isExpanded}
                    onToggle={() => handleToggle(item.title)}
                  />
                </div>
              );
            })}
        </div>

        {/* See My Direction CTA */}
        <div className="flex justify-center px-4 pt-4 pb-10">
          <button
            onClick={handleSeeDirection}
            className="bg-black text-white text-sm font-semibold px-16 py-3.5 rounded-full hover:bg-gray-900 transition-colors w-full max-w-sm"
          >
            See My Direction
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
