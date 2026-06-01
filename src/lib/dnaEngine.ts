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

  let bestModel: StructuralModel = eligible[0] || "Low-Risk Hybrid";
  let bestScore = -Infinity;
  let bestRiskDist = Infinity;
  let bestConstraintDist = Infinity;

  for (const m of eligible) {
    const p = MODEL_PROFILES[m];
    const distance =
      Math.abs(scores.risk_score - p.risk) +
      Math.abs(scores.uncertainty_score - p.uncertainty) +
      Math.abs(scores.energy_stability_score - p.energy) +
      Math.abs(scores.structure_score - p.structure);
    const compatibility = 100 * (1 - distance / 40);
    const riskDist = Math.abs(scores.risk_score - p.risk);
    const constraintDist = Math.abs(scores.constraint_score - 6); // neutral reference

    if (
      compatibility > bestScore ||
      (compatibility === bestScore && riskDist < bestRiskDist) ||
      (compatibility === bestScore && riskDist === bestRiskDist && constraintDist < bestConstraintDist)
    ) {
      bestScore = compatibility;
      bestModel = m;
      bestRiskDist = riskDist;
      bestConstraintDist = constraintDist;
    }
  }

  return { eligible: true, model: bestModel, scores };
}
