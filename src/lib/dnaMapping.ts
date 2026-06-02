import type { ProfileData } from "./authApi";

export interface KeySignal {
  label: string;
  value: string;
  explanation?: string;
}

export interface DNACoreItem {
  core_id: string;
  title: string;
  summary: string; // 18-28 words
  hero_statement: string;
  description: string;
  gradient: string;
  icon: string;
  variant: "hero" | "standard";
  isLarge: boolean;
  fullWidth?: boolean;
  key_signals: KeySignal[];
  strength_patterns?: string[];
  blind_spots?: string[];
  risk_examples?: string[];
}

const capitalize = (s: string) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function mapProfileToDNA(profile: ProfileData): DNACoreItem[] {
  const { core, identity, work_style, risk_profile, energy, strength_profile } =
    profile;

  const cores: DNACoreItem[] = [];

  // 1. Your Core
  cores.push({
    core_id: "your_core",
    title: "Your Core",
    variant: "hero",
    isLarge: true,
    fullWidth: true,
    gradient: `radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)`,
    icon: "/figmaAssets/dna.svg",
    hero_statement: `${identity?.archetype?.[0] || "Strategic Thinker"} driven by ${core?.primary_motivation || "purpose"}.`,
    description: core
      ? `${capitalize(core.primary_motivation || "")}-driven, ${(core.structure_preference || "").toLowerCase().replace(/_/g, " ")}-structured, and ${(core.collaboration_mode || "").toLowerCase().replace(/_/g, " ")} by nature — you bring ${(core.execution_bias || "focused execution").toLowerCase().replace(/_/g, " ")} to everything you build.`
      : `You are an ${identity?.archetype?.join(" and ") || "individual"} who operates best with guided structure and collaborative collaboration.`,
    summary: `As ${identity?.archetype?.[0] || "a professional"}, you combine a ${core?.primary_motivation || "value"}-led approach with a preference for ${core?.structure_preference || "balanced"} environments and ${(core?.collaboration_mode || "dynamic").replace("_", " ")} settings to ensure meaningful outcomes.`,
    key_signals: [
      {
        label: "Primary Motivation",
        value: capitalize(core?.primary_motivation || "growth"),
        explanation: core?.description?.primary_motivation,
      },
      {
        label: "Structure Preference",
        value: capitalize((core?.structure_preference || "flexible").replace(/_/g, " ")),
        explanation: core?.description?.structure_preference,
      },
      {
        label: "Collaboration Mode",
        value: capitalize(
          (core?.collaboration_mode || "collaborative").replace(/_/g, " "),
        ),
        explanation: core?.description?.collaboration_mode,
      },
      {
        label: "Ambiguity Tolerance",
        value: capitalize(core?.ambiguity_tolerance || "moderate"),
        explanation: core?.description?.ambiguity_tolerance,
      },
      {
        label: "Emotional Risk",
        value: capitalize(core?.risk_emotional || "balanced"),
        explanation: core?.description?.risk_emotional,
      },
      {
        label: "Financial Risk",
        value: capitalize(core?.risk_financial || "balanced"),
        explanation: core?.description?.risk_financial,
      },
      {
        label: "Time Availability",
        value: capitalize((core?.time_availability || "").replace(/_/g, " ") || "—"),
        explanation: core?.description?.time_availability,
      },
      {
        label: "Readiness Level",
        value: capitalize((core?.readiness_level || "").replace(/_/g, " ") || "—"),
        explanation: core?.description?.readiness_level,
      },
    ],
  });

  // 2. What Drives You
  cores.push({
    core_id: "what_drives_you",
    title: "What Drives You",
    variant: "standard",
    isLarge: false,
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF6820 0%, #FAC515 100%)`,
    icon: "/figmaAssets/rocket-launch-collapsed.svg",
    hero_statement: `Driven by ${core?.primary_motivation || "impact"} and ${core?.ownership_drive || "strong"} ownership.`,
    description:
      core?.description?.primary_motivation ||
      `Your primary drive is ${core?.primary_motivation || "meaningful work"}, refined by a ${core?.autonomy_need || "balanced"} need for autonomy and ${core?.ownership_drive || "clear"} drive for ownership.`,
    summary: `Your professional journey is fueled by a deep-seated need for ${core?.primary_motivation || "achievement"}, complemented by a strong ${core?.ownership_drive || "inherent"} drive for ownership and ${core?.autonomy_need || "selective"} autonomy in execution.`,
    key_signals: [
      {
        label: "Primary Motivation",
        value: capitalize(core?.primary_motivation || "growth"),
        explanation: core?.description?.primary_motivation,
      },
      {
        label: "Autonomy Need",
        value: capitalize(core?.autonomy_need || "balanced"),
        explanation: core?.description?.autonomy_need,
      },
      {
        label: "Ownership Drive",
        value: capitalize(core?.ownership_drive || "standard"),
        explanation: core?.description?.ownership_drive,
      },
    ],
  });

  // 3. How You Work
  cores.push({
    core_id: "how_you_work",
    title: "How You Work",
    variant: "standard",
    isLarge: false,
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #2DD4BF 0%, #0891B2 100%)`,
    icon: "/figmaAssets/intersect-three-collapsed.svg",
    hero_statement: `${capitalize(core?.structure_preference || "guided")} structure in ${(core?.collaboration_mode || "collaborative").replace("_", " ")} settings.`,
    description: `You prefer to operate with ${core?.structure_preference || "logical"} structure and ${(core?.collaboration_mode || "group").replace("_", " ")} collaboration, showing a ${core?.execution_bias || "steady"} bias toward execution.`,
    summary: `You excel in ${(core?.collaboration_mode || "team").replace("_", " ")} environments where ${core?.structure_preference || "clear"} frameworks provide the foundation for your ${core?.execution_bias || "focused"} execution bias and rapid decision-making style.`,
    key_signals: [
      {
        label: "Structure Preference",
        value: capitalize(core?.structure_preference || "guided"),
        explanation: core?.description?.structure_preference,
      },
      {
        label: "Collaboration Mode",
        value: capitalize(
          (core?.collaboration_mode || "flexible").replace("_", " "),
        ),
        explanation: core?.description?.collaboration_mode,
      },
      {
        label: "Execution Bias",
        value: capitalize(core?.execution_bias || "moderate"),
        explanation: core?.description?.execution_bias,
      },
      {
        label: "Exploration Bias",
        value: capitalize(core?.exploration_bias || "moderate"),
        explanation: core?.description?.exploration_bias,
      },
      {
        label: "Decision Style",
        value: work_style?.decision_style?.[0] || "Consultative",
      },
      {
        label: "Readiness Mode",
        value: work_style?.readiness_mode?.[0] || "Proactive",
      },
    ],
    strength_patterns: [
      ...(core?.execution_bias === "high" ? ["High execution bias"] : []),
      ...(work_style?.decision_style || []),
      ...(work_style?.readiness_mode || []),
    ],
    blind_spots: [
      ...(core?.exploration_bias === "low" ? ["Limited exploration bias"] : []),
      ...(core?.structure_preference === "rigid"
        ? ["Rigidity in structure"]
        : []),
    ],
  });

  // 4. Risk & Change
  cores.push({
    core_id: "risk_and_change",
    title: "Risk & Change",
    variant: "standard",
    isLarge: false,
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #8B5CF6 0%, #500724 100%)`,
    icon: "/figmaAssets/scales-collapsed.svg",
    hero_statement: `${capitalize(core?.ambiguity_tolerance || "moderate")} tolerance for ambiguity with a ${risk_profile?.uncertainty_style?.[0] || "adaptive"} style.`,
    description: `You handle uncertainty with a ${core?.ambiguity_tolerance || "balanced"} tolerance level, balancing ${core?.risk_emotional || "moderate"} emotional risk and ${core?.risk_financial || "measured"} financial risk thresholds.`,
    summary: `Navigating change with ${core?.ambiguity_tolerance || "steady"} ambiguity tolerance, you employ a ${risk_profile?.uncertainty_style?.[0] || "strategic"} style to manage emotional and financial risks in unpredictable situations.`,
    key_signals: [
      {
        label: "Ambiguity Tolerance",
        value: capitalize(core?.ambiguity_tolerance || "moderate"),
        explanation: core?.description?.ambiguity_tolerance,
      },
      {
        label: "Emotional Risk",
        value: capitalize(core?.risk_emotional || "balanced"),
        explanation: core?.description?.risk_emotional,
      },
      {
        label: "Financial Risk",
        value: capitalize(core?.risk_financial || "measured"),
        explanation: core?.description?.risk_financial,
      },
      {
        label: "Uncertainty Style",
        value: risk_profile?.uncertainty_style?.[0] || "Adaptive",
      },
    ],
    strength_patterns: [
      ...(risk_profile?.uncertainty_style || []),
      `Tolerance: ${core?.ambiguity_tolerance || "Moderate"}`,
    ],
    blind_spots: [
      ...(core?.ambiguity_tolerance === "low"
        ? ["Discomfort with high ambiguity"]
        : []),
      ...(core?.risk_emotional === "low"
        ? ["Sensitive to emotional risk"]
        : []),
    ],
    risk_examples: risk_profile?.risk_examples || [],
  });

  // 5. Your Energy
  cores.push({
    core_id: "your_energy",
    title: "Your Energy",
    variant: "standard",
    isLarge: false,
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #84CC16 100%)`,
    icon: "/figmaAssets/flame-collapsed.svg",
    hero_statement: `Energized by ${energy?.givers?.[0] || "creative problem solving"}.`,
    description: `Your energy is sustained by ${energy?.givers && energy.givers.length > 0 ? energy.givers.join(", ") : "meaningful challenges"}, while being significantly drained by ${energy?.drainers && energy.drainers.length > 0 ? energy.drainers.join(", ") : "repetitive tasks"}.`,
    summary: `Your peak performance is unlocked through ${energy?.givers?.[0] || "clarity"}, as you actively navigate away from ${energy?.drainers?.[0] || "stagnation"} to maintain deep engagement and momentum.`,
    key_signals: [
      { label: "Energy Source", value: energy?.givers?.[0] || "Creativity" },
      { label: "Energy Drain", value: energy?.drainers?.[0] || "Routine" },
    ],
    strength_patterns: energy?.pattern || [],
  });

  // 6. Strengths & Edges
  cores.push({
    core_id: "strengths_and_edges",
    title: "Strengths & Edges",
    variant: "standard",
    isLarge: true,
    fullWidth: true,
    gradient: `radial-gradient(111.33% 141.42% at 100% 100%, #0A0A0A 50.96%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #EF4444 0%, #F38744 100%)`,
    icon: "/figmaAssets/boxing-glove-collapsed.svg",
    hero_statement: `${strength_profile?.strengths?.[0] || "Expertise"} balanced with growth in ${strength_profile?.growth_edges?.[0] || "new areas"}.`,
    description: `You excel at ${strength_profile?.strengths?.[0] || "solving complex problems"}, but may encounter friction when ${strength_profile?.growth_edges?.[0] || "dealing with rigid bureaucracy"}.`,
    summary: `By leveraging your natural strengths in ${strength_profile?.strengths?.[0] || "strategic analysis"}, you counterbalance growth edges to maintain a high-performance profile across diverse professional challenges.`,
    key_signals: [
      {
        label: "Core Strength",
        value: strength_profile?.strengths?.[0] || "Analysis",
      },
      {
        label: "Edge Cases",
        value: strength_profile?.growth_edges?.[0] || "Bureaucracy",
      },
    ],
    strength_patterns: strength_profile?.strengths || [],
    blind_spots: strength_profile?.growth_edges || [],
  });

  return cores;
}
