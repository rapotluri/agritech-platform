export type PremiumResponse = {
  status: string;
  premium: {
    rate: number;
    etotal: number;
    max_payout: number;
  };
  phase_analysis: {
    [phase: string]: {
      indexes: {
        [index: string]: {
          average_payout_percentage: number;
          total_payout: number;
          max_payout: number;
          min_payout: number;
        };
      };
      total_contribution: number;
    };
  };
  risk_metrics: {
    years_analyzed: number;
    payout_years: number;
    payout_probability: number;
    average_annual_payout: number;
    max_annual_payout: number;
    min_annual_payout: number;
  };
  yearly_analysis: Array<{
    year: number;
    total_payout: number;
    triggers: Array<{
      phase: string;
      index_type: string;
      rainfall: number;
      trigger_value: number;
      payout: number;
    }>;
  }>;
}; 