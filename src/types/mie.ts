export interface MIESignal {
  title: string;
  description: string;
  category: string;
  velocity: "V2" | "V3";
  confidence: "Medium" | "High" | "Very High";
  relevance_to_user: string;
}

export interface MIEOpportunity {
  id: string;
  title: string;
  one_line: string;
  description: string;
  dna_fit_score: number;
  fit_explanation: string;
  velocity_tier: "V1" | "V2" | "V3";
  startup_cost: "Low" | "Medium" | "High";
  startup_cost_range: string;
  time_to_revenue: string;
  first_10_customers: string;
  window_risk: string;
  underlying_signal: string;
}

export interface MIEHorizonSignal {
  title: string;
  description: string;
  horizon: string;
}

export interface MIEReport {
  rising_signals: MIESignal[];
  falling_signals: MIESignal[];
  opportunities: MIEOpportunity[];
  horizon_signals: MIEHorizonSignal[];
  generated_at: string;
}

export type MIEStatus = "idle" | "loading" | "complete" | "error";
