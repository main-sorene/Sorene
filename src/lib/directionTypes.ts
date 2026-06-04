export type FourFilterItem = {
  score: number; // 0–100
  reason: string; // 1 sentence
};

export type DirectionCardData = {
  title: string;
  compatibility: number;
  oneliner: string;
  description: string;
  why_now: string;
  simple_positioning: string;
  unfair_advantage: string;
  four_filters: {
    alignment: FourFilterItem;
    skills_match: FourFilterItem;
    lifestyle_fit: FourFilterItem;
    financial_viability: FourFilterItem;
    market_potential: FourFilterItem;
  };
  composite_score: number;
  high_risk_flags: string[];
  startup_cost_usd: string;
  time_to_first_revenue_weeks: string;
  hours_per_week: string;
  constraint_check: {
    status: "Pass" | "Warn" | "Fail";
    reason?: string;
  };
  first_10_customers: string;
  competition: {
    layer1_workaround: string;
    layer2_incumbent: string;
    layer3_simple_competitors: string;
  };
  economic_urgency: string;
  ocean_classification: {
    type: "Blue" | "Purple" | "Red";
    density: string;
  };
  trend_connection: string;
  complaint_source: string;
  window_risk: string;
};
