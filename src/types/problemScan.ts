export interface ProblemOpportunity {
  id: string;
  title: string;
  one_line: string;
  problem: string;
  who_suffers: string;
  evidence: string;
  existing_solutions?: string;
  competitor_count?: number;
  market_gap_score?: number;
  business_idea: string;
  revenue_model: string;
  mvp_steps: string;
  why_fits_you: string;
  confidence: number; // 0-20
}

export interface ProblemScanReport {
  opportunities: ProblemOpportunity[];
  generated_at: string;
}

export type ProblemScanStatus = "idle" | "loading" | "complete" | "error";
