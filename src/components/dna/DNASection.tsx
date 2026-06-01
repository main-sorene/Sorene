import { DNACard } from "./DNACard";
import { AnimatePresence, motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { mapProfileToDNA, DNACoreItem } from "@/lib/dnaMapping";

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
  const { data: profileRes, isLoading } = useProfile();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const dnaItems =
    !isLoading && profileRes?.profile
      ? mapProfileToDNA(profileRes.profile)
      : DEFAULT_DNA_ITEMS;

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
