// Types for BoG Regulatory Reporting

// Capital Adequacy Ratio (CAR) components per BoG Annexure I
export interface TierOneCapital {
  paid_up_capital: number;
  statutory_reserves: number;
  general_reserves: number;
  special_reserves: number;
  disclosed_reserves: number;
  // Deductions
  goodwill_intangibles: number;
  losses_not_provided: number;
  investments_subsidiaries: number;
  investments_other_banks: number;
  connected_lending: number;
}

export interface TierTwoCapital {
  undisclosed_reserves: number;
  revaluation_reserves: number;
  subordinated_debt: number;
  hybrid_capital: number;
  deposits_for_shares: number;
}

export interface RiskWeightedAssets {
  total_assets: number;
  // 0% risk weight (deducted)
  cash_on_hand: number;
  gog_securities: number;
  bog_securities: number;
  // 20% risk weight (80% deducted)
  cheques_other_banks: number;
  claims_on_banks: number;
  // 50% risk weight (50% deducted)
  residential_mortgages: number;
  export_financing: number;
  public_institution_loans: number;
  // Other adjustments
  contingent_liabilities_class1: number;
  contingent_liabilities_class2: number;
  net_open_position: number;
  operational_risk_charge: number;
}

export interface CapitalAdequacyRatio {
  org_id: string;
  report_date: string;
  tier_one: TierOneCapital;
  tier_two: TierTwoCapital;
  risk_weighted_assets: RiskWeightedAssets;
  // Calculated values
  adjusted_tier_one: number;
  total_tier_two: number;
  capped_tier_two: number;
  adjusted_capital_base: number;
  total_rwa: number;
  car_ratio: number;
  is_compliant: boolean;
  minimum_requirement: number;
}

// Liquidity Ratio components per BoG Annexure V
export interface LiquidAssets {
  cash_on_hand: number;
  balances_bog: number;
  balances_other_banks: number;
  balances_other_fi: number;
  gog_securities: number;
  interbank_placements_30d: number;
  placements_other_fi_30d: number;
  inter_affiliate_placements: number;
  other_liquid_assets: number;
}

export interface CurrentLiabilities {
  deposits_from_public: number;
  interbank_borrowings: number;
  inter_affiliate_borrowings: number;
  other_short_term_borrowings: number;
  net_contingent_liabilities: number;
  other_current_liabilities: number;
}

export interface LiquidityRatio {
  org_id: string;
  report_date: string;
  liquid_assets: LiquidAssets;
  current_liabilities: CurrentLiabilities;
  // Calculated values
  total_liquid_assets: number;
  total_current_liabilities: number;
  liquidity_ratio: number;
  is_compliant: boolean;
  minimum_requirement: number;
}

// Prudential Returns Summary
export interface PrudentialReturnSummary {
  return_category: string;
  return_name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  last_submitted?: string;
  next_due: string;
  status: 'Submitted' | 'Pending' | 'Overdue';
  value?: number;
}

// Time period filters
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ReportDateRange {
  start_date: string;
  end_date: string;
  period: ReportPeriod;
}

// Portfolio metrics for regulatory reporting
export interface PortfolioMetrics {
  org_id: string;
  report_date: string;
  total_loans: number;
  gross_portfolio: number;
  par_1_plus: number;
  par_30_plus: number;
  par_60_plus: number;
  par_90_plus: number;
  par_180_plus: number;
  par_1_rate: number;
  par_30_rate: number;
  par_60_rate: number;
  par_90_rate: number;
  par_180_rate: number;
  current_loans: number;
  substandard_loans: number;
  doubtful_loans: number;
  loss_loans: number;
  total_provisions: number;
  provision_coverage_ratio: number;
  npl_ratio: number;
}

// CTR/STR (Cash Transaction Report / Suspicious Transaction Report) for AML
export interface TransactionReport {
  report_id: string;
  org_id: string;
  report_type: 'CTR' | 'STR';
  client_id: string;
  client_name: string;
  ghana_card: string;
  transaction_date: string;
  transaction_amount: number;
  transaction_type: 'Cash Deposit' | 'Cash Withdrawal' | 'Transfer' | 'Loan Disbursement' | 'Loan Repayment';
  risk_indicators?: string;
  status: 'Pending' | 'Submitted' | 'Acknowledged';
  submitted_date?: string;
  fic_reference?: string;
}
