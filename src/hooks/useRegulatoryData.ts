import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import type {
  CapitalAdequacyRatio,
  LiquidityRatio,
  PrudentialReturnSummary,
  PortfolioMetrics,
  TransactionReport,
  TierOneCapital,
  TierTwoCapital,
  RiskWeightedAssets,
  LiquidAssets,
  CurrentLiabilities,
} from '@/types/regulatory';

// Mock data generators for demo
const generateMockCAR = (orgId: string): CapitalAdequacyRatio => {
  const tier_one: TierOneCapital = {
    paid_up_capital: 5000000,
    statutory_reserves: 1200000,
    general_reserves: 800000,
    special_reserves: 200000,
    disclosed_reserves: 2200000,
    goodwill_intangibles: 150000,
    losses_not_provided: 0,
    investments_subsidiaries: 0,
    investments_other_banks: 100000,
    connected_lending: 50000,
  };

  const tier_two: TierTwoCapital = {
    undisclosed_reserves: 500000,
    revaluation_reserves: 300000,
    subordinated_debt: 200000,
    hybrid_capital: 0,
    deposits_for_shares: 100000,
  };

  const rwa: RiskWeightedAssets = {
    total_assets: 25000000,
    cash_on_hand: 1500000,
    gog_securities: 3000000,
    bog_securities: 500000,
    cheques_other_banks: 200000,
    claims_on_banks: 800000,
    residential_mortgages: 2000000,
    export_financing: 500000,
    public_institution_loans: 1000000,
    contingent_liabilities_class1: 300000,
    contingent_liabilities_class2: 200000,
    net_open_position: 150000,
    operational_risk_charge: 450000,
  };

  const gross_tier_one = tier_one.paid_up_capital + tier_one.statutory_reserves + 
    tier_one.general_reserves + tier_one.special_reserves + tier_one.disclosed_reserves;
  const deductions = tier_one.goodwill_intangibles + tier_one.losses_not_provided + 
    tier_one.investments_subsidiaries + tier_one.investments_other_banks + tier_one.connected_lending;
  const adjusted_tier_one = gross_tier_one - deductions;

  const total_tier_two = tier_two.undisclosed_reserves + tier_two.revaluation_reserves + 
    tier_two.subordinated_debt + tier_two.hybrid_capital + tier_two.deposits_for_shares;
  const capped_tier_two = Math.min(total_tier_two, adjusted_tier_one);

  const adjusted_capital_base = adjusted_tier_one + capped_tier_two;

  // RWA Calculation
  const zero_weight = rwa.cash_on_hand + rwa.gog_securities + rwa.bog_securities;
  const twenty_weight = (rwa.cheques_other_banks + rwa.claims_on_banks) * 0.2;
  const fifty_weight = (rwa.residential_mortgages + rwa.export_financing + rwa.public_institution_loans) * 0.5;
  const contingent = (rwa.contingent_liabilities_class1 * 0.5) + (rwa.contingent_liabilities_class2 * 0.8);
  const market_risk = rwa.net_open_position * 0.5;
  
  const total_rwa = rwa.total_assets - zero_weight - (rwa.cheques_other_banks + rwa.claims_on_banks) * 0.8 
    - (rwa.residential_mortgages + rwa.export_financing + rwa.public_institution_loans) * 0.5
    + contingent + market_risk + rwa.operational_risk_charge;

  const car_ratio = (adjusted_capital_base / total_rwa) * 100;

  return {
    org_id: orgId,
    report_date: new Date().toISOString().split('T')[0],
    tier_one,
    tier_two,
    risk_weighted_assets: rwa,
    adjusted_tier_one,
    total_tier_two,
    capped_tier_two,
    adjusted_capital_base,
    total_rwa,
    car_ratio,
    is_compliant: car_ratio >= 10,
    minimum_requirement: 10,
  };
};

const generateMockLiquidity = (orgId: string): LiquidityRatio => {
  const liquid_assets: LiquidAssets = {
    cash_on_hand: 1500000,
    balances_bog: 800000,
    balances_other_banks: 1200000,
    balances_other_fi: 300000,
    gog_securities: 2500000,
    interbank_placements_30d: 500000,
    placements_other_fi_30d: 200000,
    inter_affiliate_placements: 100000,
    other_liquid_assets: 150000,
  };

  const current_liabilities: CurrentLiabilities = {
    deposits_from_public: 4000000,
    interbank_borrowings: 500000,
    inter_affiliate_borrowings: 200000,
    other_short_term_borrowings: 300000,
    net_contingent_liabilities: 150000,
    other_current_liabilities: 250000,
  };

  const total_liquid_assets = Object.values(liquid_assets).reduce((a, b) => a + b, 0);
  const total_current_liabilities = Object.values(current_liabilities).reduce((a, b) => a + b, 0);
  const liquidity_ratio = (total_liquid_assets / total_current_liabilities) * 100;

  return {
    org_id: orgId,
    report_date: new Date().toISOString().split('T')[0],
    liquid_assets,
    current_liabilities,
    total_liquid_assets,
    total_current_liabilities,
    liquidity_ratio,
    is_compliant: liquidity_ratio >= 10,
    minimum_requirement: 10,
  };
};

const generateMockPrudentialReturns = (): PrudentialReturnSummary[] => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  return [
    { return_category: 'Balance Sheet', return_name: 'Statement of Assets and Liabilities', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
    { return_category: 'Capital', return_name: 'Capital Adequacy Position', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
    { return_category: 'Lending', return_name: 'Classification of Advances', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Submitted' },
    { return_category: 'Lending', return_name: 'Details of Loans, Overdraft and Advances', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
    { return_category: 'Risk', return_name: 'Maturity Analysis - Domestic Currency', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
    { return_category: 'Income Statement', return_name: 'Statement of Profit or Loss', frequency: 'Quarterly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
    { return_category: 'Cash Flow', return_name: 'Cash Flow Statement (Unaudited)', frequency: 'Quarterly', status: 'Pending', next_due: today.toISOString().split('T')[0] },
    { return_category: 'IFRS 9', return_name: 'Provision and Impairment Reconciliation', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Submitted' },
    { return_category: 'Compliance', return_name: 'Fraud and Defalcations Register', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Submitted' },
    { return_category: 'Compliance', return_name: 'Operational Risk Events Register', frequency: 'Monthly', last_submitted: lastMonth.toISOString().split('T')[0], next_due: today.toISOString().split('T')[0], status: 'Pending' },
  ];
};

const generateMockPortfolioMetrics = (orgId: string): PortfolioMetrics => {
  return {
    org_id: orgId,
    report_date: new Date().toISOString().split('T')[0],
    total_loans: 342,
    gross_portfolio: 2450000,
    par_1_plus: 220000,
    par_30_plus: 185000,
    par_60_plus: 125000,
    par_90_plus: 90000,
    par_180_plus: 28000,
    par_1_rate: 8.98,
    par_30_rate: 7.55,
    par_60_rate: 5.10,
    par_90_rate: 3.67,
    par_180_rate: 1.14,
    current_loans: 285,
    substandard_loans: 32,
    doubtful_loans: 22,
    loss_loans: 3,
    total_provisions: 114000,
    provision_coverage_ratio: 61.6,
    npl_ratio: 3.67,
  };
};

const generateMockCTRSTR = (orgId: string): TransactionReport[] => {
  return [
    {
      report_id: 'CTR-2026-001',
      org_id: orgId,
      report_type: 'CTR',
      client_id: 'C001',
      client_name: 'Kwame Asante Enterprises',
      ghana_card: 'GHA-123456789-1',
      transaction_date: '2026-01-08',
      transaction_amount: 85000,
      transaction_type: 'Cash Deposit',
      status: 'Pending',
    },
    {
      report_id: 'STR-2026-001',
      org_id: orgId,
      report_type: 'STR',
      client_id: 'C045',
      client_name: 'Abena Osei',
      ghana_card: 'GHA-987654321-2',
      transaction_date: '2026-01-07',
      transaction_amount: 45000,
      transaction_type: 'Loan Repayment',
      risk_indicators: 'Unusual pattern: Full loan repayment significantly earlier than scheduled',
      status: 'Submitted',
      submitted_date: '2026-01-08',
      fic_reference: 'FIC-2026-00123',
    },
  ];
};

// Hooks
export function useCapitalAdequacy() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['capital-adequacy', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      // In production, fetch from mfi_reporting.v_capital_adequacy
      return generateMockCAR(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useLiquidityRatio() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['liquidity-ratio', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      // In production, fetch from mfi_reporting.v_liquidity_ratio
      return generateMockLiquidity(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function usePrudentialReturns() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['prudential-returns', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockPrudentialReturns();
    },
    enabled: !!selectedOrgId,
  });
}

export function usePortfolioMetrics() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['portfolio-metrics', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockPortfolioMetrics(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useTransactionReports() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['transaction-reports', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockCTRSTR(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

// Combined hook for easy access to key regulatory metrics
export function useRegulatoryData() {
  const { data: carData } = useCapitalAdequacy();
  const { data: liquidityData } = useLiquidityRatio();
  const { data: prudentialReturns } = usePrudentialReturns();
  const { data: portfolioMetrics } = usePortfolioMetrics();

  return {
    carData,
    liquidityData,
    prudentialReturns,
    portfolioMetrics,
  };
}
