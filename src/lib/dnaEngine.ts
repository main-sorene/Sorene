"use client";
export type RawAnswers = Record<string, string>;

export type DnaScores = {
  risk_score: 1 | 3 | 5 | 8 | 10;
  uncertainty_score: 2 | 5 | 9;
  energy_stability_score: 2 | 5 | 8;
  constraint_score: 3 | 6 | 9;
  readiness_score: 3 | 5 | 8;
  structure_score: 4 | 6 | 7 | 9;
  motivation_driver: string;
  strengths_summary: string;
  non_negotiable: string;
  success_feeling: string;
  energy_source: string;
  energy_drains: string;
  quit_reason: string;
  // Derived text labels for display
  primary_motivation?: string;
  collaboration_mode?: string;
  structure_preference?: string;
  ambiguity_tolerance?: string;
  emotional_risk?: string;
  financial_risk?: string;
  time_availability?: string;
  readiness_label?: string;
  strength_patterns?: string[];
};

export type StructuralModel =
  | "Skill-Leveraged Service"
  | "Productized Expertise"
  | "In-Role Redesign"
  | "Low-Risk Hybrid"
  | "Startup";

export type DirectionEligibility =
  | { eligible: true; model: StructuralModel; scores: DnaScores }
  | { eligible: false; reason: string; scores: DnaScores };

function snapRisk(value: number): 1 | 3 | 5 | 8 | 10 {
  const allowed = [1, 3, 5, 8, 10] as const;
  let best: 1 | 3 | 5 | 8 | 10 = allowed[0];
  let bestDist = Math.abs(value - best);
  for (const v of allowed) {
    const d = Math.abs(value - v);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best;
}

function computeScores(answers: RawAnswers): DnaScores {
  const q1 = answers["q1_energy"] || "";
  const q1f = answers["q1_followup"] || "";
  const q1b = answers["q1b_quit_reason"] || "";
  const q2 = answers["q2_pattern"] || "";
  const q3 = answers["q3_centrality"] || "";
  const q4 = answers["q4_time"] || "";
  const q5 = answers["q5_finance"] || "";
  const q6 = answers["q6_tradeoff"] || "";
  const q6f = answers["q6_tradeoff_followup"] || "";
  const q7 = answers["q7_uncertainty"] || "";
  const q8 = answers["q8_workmode"] || "";
  const q9 = answers["q9_success"] || "";
  const q10 = answers["q10_regret"] || "";
  const q11 = answers["q11_readiness"] || "";

  // risk_score
  let riskBase = 5;
  if (q6.includes("Profitable but meaningless")) riskBase = 5;
  else if (q6.includes("Meaningful but barely pays")) riskBase = 3;
  else if (q6.includes("Stable but creatively limiting")) riskBase = 3;
  else if (q6.includes("Exciting but completely unpredictable")) riskBase = 8;

  if (q10.includes("Not trying at all")) riskBase = Math.min(riskBase + 2, 10);
  else if (q10.includes("Trying and failing")) riskBase = Math.max(riskBase - 2, 1);

  const risk_score = snapRisk(riskBase);

  // uncertainty_score
  let uncertainty_score: 2 | 5 | 9 = 5;
  if (q7.includes("Keep going and iterate") || q7.includes("Pivot to test something else")) uncertainty_score = 9;
  else if (q7.includes("Seek outside perspective") || q7.includes("Step back and rethink")) uncertainty_score = 5;
  else if (q7.includes("Feel anxious") || q7.includes("need more proof")) uncertainty_score = 2;

  // energy_stability_score
  let energy_stability_score: 2 | 5 | 8 = 5;
  if (q2.includes("All the time") || q2.includes("Pretty often")) energy_stability_score = 8;
  else if (q2.includes("Occasionally")) energy_stability_score = 5;
  else if (q2.includes("Rarely")) energy_stability_score = 2;

  // constraint_score
  let constraintBase = 6;
  if (q4.includes("0–5 hours") || q4.includes("0-5 hours")) constraintBase = 3;
  else if (q4.includes("5–10") || q4.includes("5-10") || q4.includes("10–20") || q4.includes("10-20")) constraintBase = 6;
  else if (q4.includes("20–30") || q4.includes("20-30") || q4.includes("30+")) constraintBase = 9;

  if (q5.includes("Within 3 months")) constraintBase -= 3;
  else if (q5.includes("12+ months") || q5.includes("Income isn't")) constraintBase += 3;

  const constraint_score = (Math.max(3, Math.min(9, constraintBase)) === 3
    ? 3
    : Math.max(3, Math.min(9, constraintBase)) <= 6
    ? 6
    : 9) as 3 | 6 | 9;

  // readiness_score
  let readiness_score: 3 | 5 | 8 = 5;
  if (q11.includes("Exploring") || q11.includes("Stuck")) readiness_score = 3;
  else if (q11.includes("Deciding") || q11.includes("Transitioning")) readiness_score = 5;
  else if (q11.includes("Ready to start")) readiness_score = 8;

  // structure_score
  let structure_score: 4 | 6 | 7 | 9 = 7;
  if (q8.includes("Alone, then share")) structure_score = 9;
  else if (q8.includes("With a few trusted people") || q8.includes("Alone at first, team later")) structure_score = 7;
  else if (q8.includes("With a team or community")) structure_score = 4;

  // motivation_driver
  let centralityContext = "";
  if (q3.includes("center")) centralityContext = "core focus";
  else if (q3.includes("key part")) centralityContext = "important component";
  else if (q3.includes("one element")) centralityContext = "supporting element";
  const q9Preview = q9.slice(0, 80);
  const motivation_driver = centralityContext
    ? `This work functions as a ${centralityContext} for you, and success feels like: ${q9Preview}.`
    : `Success feels like: ${q9Preview}.`;

  const strengths_summary = q1.slice(0, 100);
  const non_negotiable = (q6.slice(0, 100) + (q6f ? " " + q6f.slice(0, 100) : "")).trim();
  const success_feeling = q9.slice(0, 150);
  const energy_source = q1.slice(0, 150);
  const energy_drains = q1f.slice(0, 150);
  const quit_reason = q1b.slice(0, 200);

  // Derived text labels
  const primary_motivation = q1.split(/[.,!?]/)[0].trim().slice(0, 50) || q1.slice(0, 50);

  const collaboration_mode =
    q8.includes("Alone, then share") ? "Independent" :
    q8.includes("With a few trusted") || q8.includes("Alone at first, team later") ? "Small Group" :
    q8.includes("With a team or community") ? "Collaborative" : "Small Group";

  const structure_preference =
    structure_score >= 9 ? "Independent" :
    structure_score >= 6 ? "Small Team" : "Collaborative";

  const ambiguity_tolerance =
    uncertainty_score >= 9 ? "High" : uncertainty_score >= 5 ? "Medium" : "Low";

  const emotional_risk =
    risk_score >= 8 ? "High" : risk_score >= 5 ? "Medium" : "Low";

  const financial_risk =
    q5.includes("Within 3 months") ? "Low" :
    q5.includes("12+ months") || q5.includes("Income isn't") ? "High" : "Medium";

  const time_availability =
    constraint_score >= 9 ? "High" : constraint_score >= 6 ? "Medium" : "Limited";

  const readiness_label =
    readiness_score >= 8 ? "Ready" : readiness_score >= 5 ? "Deciding" : "Exploring";

  // Derive up to 5 strength patterns from answers
  const rawStrengths: string[] = [];
  if (q1) rawStrengths.push(q1.split(/[.,!?]/)[0].trim().slice(0, 40));
  if (q2.includes("All the time") || q2.includes("Pretty often")) rawStrengths.push("Consistent energy");
  if (q8.includes("Alone, then share")) rawStrengths.push("Deep focus");
  if (q8.includes("With a few trusted")) rawStrengths.push("Collaborative builder");
  if (uncertainty_score >= 9) rawStrengths.push("High adaptability");
  if (risk_score >= 8) rawStrengths.push("Bold decision-making");
  if (readiness_score >= 8) rawStrengths.push("Execution-ready");
  if (q9) rawStrengths.push(q9.split(/[.,!?]/)[0].trim().slice(0, 40));
  if (constraint_score >= 9) rawStrengths.push("High commitment");
  const strength_patterns = [...new Set(rawStrengths)].slice(0, 5);

  return {
    risk_score,
    uncertainty_score,
    energy_stability_score,
    constraint_score,
    readiness_score,
    structure_score,
    motivation_driver,
    strengths_summary,
    non_negotiable,
    success_feeling,
    energy_source,
    energy_drains,
<<<<<<< HEAD
    primary_motivation,
    collaboration_mode,
    structure_preference,
    ambiguity_tolerance,
    emotional_risk,
    financial_risk,
    time_availability,
    readiness_label,
    strength_patterns,
=======
    quit_reason,
>>>>>>> 1dcba53 (Add quit-reason question and negative filter to direction engine)
  };
}

const MODEL_PROFILES: Record<StructuralModel, { risk: number; uncertainty: number; energy: number; structure: number }> = {
  "Skill-Leveraged Service": { risk: 4, uncertainty: 4, energy: 5, structure: 7 },
  "Productized Expertise":   { risk: 6, uncertainty: 6, energy: 6, structure: 7 },
  "In-Role Redesign":        { risk: 3, uncertainty: 3, energy: 4, structure: 5 },
  "Low-Risk Hybrid":         { risk: 4, uncertainty: 4, energy: 5, structure: 6 },
  "Startup":                 { risk: 9, uncertainty: 9, energy: 8, structure: 5 },
};

export function computeDirection(answers: RawAnswers): DirectionEligibility {
  const scores = computeScores(answers);
  const { readiness_score, energy_stability_score, constraint_score } = scores;

  // Eligibility gates
  if (readiness_score <= 3) {
    return {
      eligible: false,
      reason: "You're still in exploration mode. The priority right now is clarifying what you want, not choosing a direction.",
      scores,
    };
  }
  if (energy_stability_score <= 2) {
    return {
      eligible: false,
      reason: "Your energy pattern suggests this isn't the right moment to start. Stabilising comes first.",
      scores,
    };
  }
  if (constraint_score === 3 && readiness_score < 5) {
    return {
      eligible: false,
      reason: "Your current constraints are too tight to build something new right now.",
      scores,
    };
  }

  // Disqualifications and scoring
  const allModels = Object.keys(MODEL_PROFILES) as StructuralModel[];
  const eligible = allModels.filter((m) => {
    if (m === "Startup" && scores.risk_score <= 3) return false;
    if ((m === "Startup" || m === "Productized Expertise") && energy_stability_score <= 2) return false;
    if (m === "Startup" && constraint_score === 3) return false;
    return true;
  });

  const ranked = rankModels(scores, eligible);
  const bestModel = ranked[0]?.model ?? "Low-Risk Hybrid";

  return { eligible: true, model: bestModel, scores };
}

export type RankedModel = { model: StructuralModel; compatibility: number };

export function rankModels(scores: DnaScores, eligibleModels?: StructuralModel[]): RankedModel[] {
  const models =
    eligibleModels ??
    (Object.keys(MODEL_PROFILES) as StructuralModel[]).filter((m) => {
      if (m === "Startup" && scores.risk_score <= 3) return false;
      if ((m === "Startup" || m === "Productized Expertise") && scores.energy_stability_score <= 2) return false;
      if (m === "Startup" && scores.constraint_score === 3) return false;
      return true;
    });

  return models
    .map((m) => {
      const p = MODEL_PROFILES[m];
      const distance =
        Math.abs(scores.risk_score - p.risk) +
        Math.abs(scores.uncertainty_score - p.uncertainty) +
        Math.abs(scores.energy_stability_score - p.energy) +
        Math.abs(scores.structure_score - p.structure);
      const compatibility = Math.max(0, Math.round(100 * (1 - distance / 40)));
      return { model: m, compatibility };
    })
    .sort((a, b) => b.compatibility - a.compatibility);
}
