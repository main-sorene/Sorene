"use client";

import { DNACard } from "./DNACard";
import { AnimatePresence, motion } from "framer-motion";
import { useDnaData } from "@/hooks/useDnaData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DNACoreItem } from "@/lib/dnaMapping";

function buildDnaItems(scores: NonNullable<ReturnType<typeof useDnaData>["data"]>["dnaScores"]): DNACoreItem[] | null {
  if (!scores) return null;
  const riskLabel = scores.risk_score >= 8 ? "High" : scores.risk_score >= 5 ? "Medium" : "Low";
  const structureLabel = scores.structure_score >= 8 ? "Independent" : scores.structure_score >= 6 ? "Small Team" : "Collaborative";
  const uncertaintyLabel = scores.uncertainty_score >= 8 ? "High" : scores.uncertainty_score >= 5 ? "Medium" : "Low";
  const readinessLabel = scores.readiness_score >= 7 ? "Ready" : scores.readiness_score >= 5 ? "Deciding" : "Exploring";
  const timeLabel = scores.constraint_score >= 8 ? "High" : scores.constraint_score >= 5 ? "Medium" : "Limited";

  return [
    {
      core_id: "your_core",
      title: "Your Core",
      variant: "hero" as const,
      isLarge: true,
      fullWidth: true,
      gradient: `radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)`,
      icon: "/figmaAssets/dna.svg",
      hero_statement: scores.motivation_driver.slice(0, 80),
      description: scores.strengths_summary || "Your unique strengths and energy patterns shape how you work best.",
      summary: scores.success_feeling?.slice(0, 120) || "Your personal definition of success guides your direction.",
      key_signals: [
        { label: "Risk Profile", value: riskLabel, explanation: `Risk score: ${scores.risk_score}/10` },
        { label: "Structure Preference", value: structureLabel, explanation: `Structure score: ${scores.structure_score}/10` },
        { label: "Uncertainty Tolerance", value: uncertaintyLabel, explanation: `Uncertainty score: ${scores.uncertainty_score}/10` },
        { label: "Readiness Level", value: readinessLabel, explanation: `Readiness score: ${scores.readiness_score}/10` },
        { label: "Time Availability", value: timeLabel, explanation: `Capacity score: ${scores.constraint_score}/10` },
      ],
      strength_patterns: scores.energy_source ? [scores.energy_source.slice(0, 60)] : [],
    },
    {
      core_id: "energy",
      title: "Energy & Motivation",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #6366F1 0%, #E0E7FF 100%)`,
      icon: "/figmaAssets/lightning.svg",
      hero_statement: "What drives and drains you",
      description: scores.energy_drains ? `Energized by: ${scores.energy_source}\n\nDrained by: ${scores.energy_drains}` : scores.energy_source,
      summary: `Motivated by ${scores.motivation_driver.slice(0, 60)}`,
      key_signals: [
        { label: "Energy Stability", value: scores.energy_stability_score >= 7 ? "Stable" : scores.energy_stability_score >= 4 ? "Variable" : "Depleted" },
        { label: "Primary Driver", value: scores.motivation_driver.slice(0, 30) },
      ],
    },
    {
      core_id: "non_negotiable",
      title: "Non-Negotiables",
      variant: "standard" as const,
      isLarge: false,
      gradient: `radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #F59E0B 0%, #FEF3C7 100%)`,
      icon: "/figmaAssets/scales.svg",
      hero_statement: "What you won't compromise on",
      description: scores.non_negotiable || "The trade-offs that matter most to you.",
      summary: scores.non_negotiable?.slice(0, 80) || "",
      key_signals: [
        { label: "Core Value", value: scores.non_negotiable?.slice(0, 30) || "Authenticity" },
      ],
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
  const { data: profile, isLoading } = useDnaData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const dnaItems = buildDnaItems(profile?.dnaScores) || DEFAULT_DNA_ITEMS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 lg:p-3 lg:pt-6 pb-20 max-w-5xl mx-auto"
      >
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
      </motion.div>
    </AnimatePresence>
  );
};
