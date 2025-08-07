export interface Product {
  name: string;
  province: string;
  commune: string;
  cropDuration: string;
  sumInsured: string;
  premiumCap: string;
  notes: string;
}

export interface CoveragePeriod {
  id: string;
  startDate: string;
  endDate: string;
  perilType: "LRI" | "ERI" | "BOTH";
}

export interface OptimizationResult {
  id: string;
  optionType?: "most_affordable" | "best_coverage" | "premium_choice";
  label?: string;
  description?: string;
  premiumIncrease?: string;
  lossRatio: number;
  expectedPayout: number;
  premiumRate: number;
  premiumCost?: number;
  triggers: {
    lri?: { threshold: number; payout: number };
    eri?: { threshold: number; payout: number };
  };
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  periods?: any[];
  max_payout?: number;
  period_breakdown?: any[];
  yearly_results?: any[];
  coverage_score?: number;
  payout_stability_score?: number;
  coverage_penalty?: number;
  periods_with_no_payouts?: number;
  payout_years?: number;
}
