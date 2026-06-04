export type IkigaiFilterItem = {
  score: number; // 0–100
  reason: string; // 1 sentence
};

export type DirectionCardData = {
  title: string;
  compatibility: number;
  oneliner: string;
  description: string;
  why_fits_you: string[];
  key_risks: string[];
  why_now: string;
  simple_positioning: string;
  unfair_advantage: string;
  ikigai_filters: {
    what_you_love: IkigaiFilterItem;
    what_you_are_good_at: IkigaiFilterItem;
    what_world_needs: IkigaiFilterItem;
    what_you_can_be_paid_for: IkigaiFilterItem;
    lifestyle_fit: IkigaiFilterItem;
  };
  // backward compat for old cards
  four_filters?: {
    alignment?: { score: number; reason: string };
    skills_match?: { score: number; reason: string };
    lifestyle_fit?: { score: number; reason: string };
    financial_viability?: { score: number; reason: string };
    market_potential?: { score: number; reason: string };
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
  path_label?: "Safe" | "Aligned" | "Stretch";
  market_signal_confidence?: "Complaint-validated" | "Inferred" | "Insufficient signal";
  distribution_path?: string;
  industry_shift?: string;
  liked_work_check?: string | null;
};
