"use client";

import { DNACard } from "./DNACard";
import { AnimatePresence, motion } from "framer-motion";
import { useDnaData } from "@/hooks/useDnaData";
import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { cn } from "@/lib/utils";
import { DNACoreItem, mapProfileToDNA } from "@/lib/dnaMapping";

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
  const primaryMotivation = scores.primary_motivation || scores.energy_source?.split(/[.,!?]/)[0]?.trim().slice(0, 50) || "—";
  const strengthPatterns = scores.strength_patterns?.length ? scores.strength_patterns : [energyStabilityLabel + " energy", structureLabel, collaborationLabel, uncertaintyLabel + " adaptability", readinessLabel].slice(0, 5);

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
      summary: narrative?.what_drives_you?.split(". ")[0] || scores.success_feeling?.slice(0, 100) || scores.motivation_driver.slice(0, 100),
      key_signals: [
        { label: "Primary Drive", value: riskLabel === "High" ? "Ambition" : riskLabel === "Medium" ? "Growth" : "Mastery", explanation: "Inferred from your risk and energy patterns." },
        { label: "Centrality", value: scores.motivation_driver.includes("core focus") ? "Center" : scores.motivation_driver.includes("important component") ? "Key part" : "Supporting", explanation: "Where this work would sit in your life." },
      ],
      strength_patterns: scores.success_feeling ? [scores.success_feeling.slice(0, 60)] : [],
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
      summary: narrative?.how_you_work?.split(". ")[0] || `${structureLabel} • ${timeLabel} capacity`,
      key_signals: [
        { label: "Work Mode", value: structureLabel, explanation: `Structure score: ${scores.structure_score}/10.` },
        { label: "Capacity", value: timeLabel, explanation: `Constraint score: ${scores.constraint_score}/10.` },
      ],
      strength_patterns: [structureLabel, `${timeLabel} capacity`],
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
      summary: narrative?.risk_and_change?.split(". ")[0] || `${riskLabel} risk · ${uncertaintyLabel} uncertainty`,
      key_signals: [
        { label: "Risk Profile", value: riskLabel, explanation: `Risk score: ${scores.risk_score}/10.` },
        { label: "Uncertainty Tolerance", value: uncertaintyLabel, explanation: `Uncertainty score: ${scores.uncertainty_score}/10.` },
      ],
      strength_patterns: [`${riskLabel} risk`, `${uncertaintyLabel} ambiguity tolerance`],
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
      summary: narrative?.your_energy?.split(". ")[0] || `${energyStabilityLabel} energy pattern`,
      key_signals: [
        { label: "Energy Source", value: scores.energy_source ? scores.energy_source.slice(0, 30) : "—", explanation: "What you said gives you energy." },
        { label: "Energy Stability", value: energyStabilityLabel, explanation: `Stability score: ${scores.energy_stability_score}/10.` },
      ],
      strength_patterns: scores.energy_source ? [scores.energy_source.slice(0, 50)] : [],
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
        { label: "Core Trade-off", value: scores.non_negotiable?.slice(0, 30) || "Authenticity", explanation: "The compromise you said would be hardest to live with." },
        { label: "Readiness", value: readinessLabel, explanation: `Readiness score: ${scores.readiness_score}/10.` },
      ],
      strength_patterns: scores.non_negotiable ? [scores.non_negotiable.slice(0, 50)] : [],
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
  const authUser = useAtomValue(userAtom);

  // Regenerate narrative if missing entirely or missing the new core_dna_label
  useEffect(() => {
    const narrative = (profile as any)?.dna_narrative as Record<string, string> | null | undefined;
    const answers = profile?.assessmentAnswers;
    if (narrative?.core_dna_label || !answers || !authUser?.uid) return;
    authFetch("/api/dna-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, cvSummary: (profile as any)?.cvSummary }),
    })
      .then((r) => r.json())
      .then(async ({ narrative: newNarrative }) => {
        if (newNarrative?.core_dna_label) {
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
