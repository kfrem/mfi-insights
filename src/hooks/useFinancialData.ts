import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import type {
  BalanceSheet,
  IncomeStatement,
  FinancialRatios,
  PARAgingBuckets,
  GovernanceRiskMetrics,
  CashFlowForecast,
  DepositConcentration,
  IncomeQuality,
  DisbursementQuality,
} from '@/types/financial';
import { formatDate, subDays, subMonths } from '@/lib/dateUtils';

// Mock Balance Sheet
const generateMockBalanceSheet = (orgId: string): BalanceSheet => {
  const assets = {
    current_assets: {
      cash_on_hand: 1500000,
      cash_at_bank: 2800000,
      short_term_investments: 3000000,
      gross_loan_portfolio: 24500000,
      loan_loss_provisions: -1140000,
      net_loan_portfolio: 23360000,
      interest_receivable: 420000,
      other_receivables: 180000,
      prepaid_expenses: 85000,
      total_current_assets: 31345000,
    },
    non_current_assets: {
      property_plant_equipment: 1800000,
      accumulated_depreciation: -450000,
      net_fixed_assets: 1350000,
      intangible_assets: 150000,
      long_term_investments: 500000,
      deferred_tax_assets: 45000,
      total_non_current_assets: 2045000,
    },
    total_assets: 33390000,
  };

  const liabilities = {
    current_liabilities: {
      deposits_from_public: 4000000,
      short_term_borrowings: 2500000,
      accounts_payable: 320000,
      accrued_expenses: 180000,
      interest_payable: 95000,
      taxes_payable: 125000,
      deferred_income: 50000,
      total_current_liabilities: 7270000,
    },
    non_current_liabilities: {
      long_term_borrowings: 8500000,
      subordinated_debt: 200000,
      deferred_tax_liabilities: 85000,
      other_long_term_liabilities: 120000,
      total_non_current_liabilities: 8905000,
    },
    total_liabilities: 16175000,
  };

  const equity = {
    paid_up_capital: 5000000,
    share_premium: 1200000,
    statutory_reserves: 1500000,
    general_reserves: 800000,
    revaluation_reserves: 300000,
    retained_earnings: 7200000,
    current_year_profit: 1215000,
    total_equity: 17215000,
  };

  return {
    org_id: orgId,
    report_date: formatDate(new Date(), 'yyyy-MM-dd'),
    assets,
    liabilities,
    equity,
    total_liabilities_and_equity: liabilities.total_liabilities + equity.total_equity,
    is_balanced: Math.abs(assets.total_assets - (liabilities.total_liabilities + equity.total_equity)) < 1,
  };
};

// Mock Income Statement
const generateMockIncomeStatement = (orgId: string): IncomeStatement => {
  const interest_income = {
    interest_on_loans_cash: 4850000,
    interest_on_loans_accrued: 680000,
    interest_on_investments: 320000,
    interest_on_bank_deposits: 85000,
    total_interest_income_cash: 5255000,
    total_interest_income_accrued: 680000,
    total_interest_income: 5935000,
  };

  const interest_expense = {
    interest_on_deposits: 280000,
    interest_on_borrowings: 920000,
    other_interest_expense: 35000,
    total_interest_expense: 1235000,
  };

  const net_interest_income = interest_income.total_interest_income - interest_expense.total_interest_expense;

  const other_income = {
    fee_income: 385000,
    commission_income: 125000,
    forex_gains: 15000,
    other_operating_income: 45000,
    total_other_income: 570000,
  };

  const gross_operating_income = net_interest_income + other_income.total_other_income;

  const provisions = {
    loan_loss_provision: 520000,
    provision_reversal: -85000,
    net_provision_expense: 435000,
  };

  const operating_expenses = {
    personnel_expenses: 1850000,
    administrative_expenses: 680000,
    depreciation_amortization: 180000,
    other_operating_expenses: 320000,
    unverified_suspense_expenses: 45000, // Critical audit finding
    total_operating_expenses: 3075000,
  };

  const operating_profit = gross_operating_income - provisions.net_provision_expense - operating_expenses.total_operating_expenses;
  const profit_before_tax = operating_profit;
  const income_tax = profit_before_tax * 0.25;
  const net_profit = profit_before_tax - income_tax;

  return {
    org_id: orgId,
    report_date: formatDate(new Date(), 'yyyy-MM-dd'),
    period: 'yearly',
    interest_income,
    interest_expense,
    net_interest_income,
    other_income,
    gross_operating_income,
    provisions,
    operating_expenses,
    operating_profit,
    exceptional_items: 0,
    profit_before_tax,
    income_tax,
    net_profit,
  };
};

// Mock Financial Ratios
const generateMockFinancialRatios = (orgId: string): FinancialRatios => ({
  org_id: orgId,
  report_date: formatDate(new Date(), 'yyyy-MM-dd'),
  // Profitability
  net_interest_margin: 18.2,
  operational_self_sufficiency: 115.8,
  return_on_assets: 3.64,
  return_on_equity: 7.06,
  cost_to_income_ratio: 58.4,
  cost_of_funds: 9.2,
  yield_on_portfolio: 24.2,
  // Portfolio Quality
  par_1_rate: 8.98,
  par_30_rate: 7.55,
  par_60_rate: 5.10,
  par_90_rate: 3.67,
  par_180_rate: 1.14,
  npl_ratio: 3.67,
  provision_coverage_ratio: 126.5,
  write_off_ratio: 0.8,
  // Efficiency
  staff_productivity: 85.5,
  operating_expense_ratio: 12.6,
  loan_officer_productivity: 612500,
  // Liquidity & Solvency
  current_ratio: 4.31,
  quick_ratio: 4.31,
  gearing_ratio: 0.94,
  debt_to_assets: 0.48,
  // Compliance
  is_car_compliant: true,
  is_liquidity_compliant: true,
  is_oss_compliant: true,
});

// Mock PAR Aging with proper buckets
const generateMockPARAgingBuckets = (orgId: string): PARAgingBuckets => {
  const gross_portfolio = 24500000;
  
  return {
    org_id: orgId,
    report_date: formatDate(new Date(), 'yyyy-MM-dd'),
    current: {
      loan_count: 285,
      outstanding_balance: 20540000,
      percentage: 83.84,
    },
    par_1_30: {
      loan_count: 22,
      outstanding_balance: 856000,
      percentage: 3.49,
      days_label: '1-30 days',
    },
    par_31_60: {
      loan_count: 15,
      outstanding_balance: 600000,
      percentage: 2.45,
      days_label: '31-60 days',
    },
    par_61_90: {
      loan_count: 10,
      outstanding_balance: 455000,
      percentage: 1.86,
      days_label: '61-90 days',
    },
    par_91_180: {
      loan_count: 7,
      outstanding_balance: 621000,
      percentage: 2.53,
      days_label: '91-180 days',
    },
    par_180_plus: {
      loan_count: 3,
      outstanding_balance: 280000,
      percentage: 1.14,
      days_label: '180+ days',
    },
    total_loans: 342,
    gross_portfolio,
    total_arrears: 2812000,
    early_warning: {
      loans_1_7_days: 8,
      loans_8_14_days: 6,
      loans_15_30_days: 8,
      deteriorating_trend: false,
      weekly_change: -2.3,
    },
  };
};

// Mock Governance & Risk Metrics
const generateMockGovernanceRiskMetrics = (orgId: string): GovernanceRiskMetrics => ({
  org_id: orgId,
  report_date: formatDate(new Date(), 'yyyy-MM-dd'),
  audit_findings: {
    total_findings: 24,
    high_priority_open: 3,
    medium_priority_open: 8,
    low_priority_open: 5,
    findings_closed_mtd: 8,
    avg_days_to_close: 18,
    overdue_findings: 2,
  },
  control_issues: {
    transactions_without_pv: 12,
    unreconciled_suspense_items: 8,
    suspense_items_value: 45000,
    duplicate_entries: 3,
    unauthorized_transactions: 1,
    missing_signatures: 5,
  },
  fraud_risk: {
    suspected_fraud_cases: 2,
    confirmed_fraud_cases: 0,
    fraud_value: 0,
    cheque_discrepancies: 4,
    duplicate_cheques: 1,
    personal_name_withdrawals: 3,
  },
  cash_reconciliation: {
    unreconciled_items_count: 15,
    unreconciled_items_value: 28500,
    days_unreconciled_avg: 5,
    last_reconciliation_date: formatDate(subDays(new Date(), 1), 'yyyy-MM-dd'),
  },
  governance_health_score: 72,
  risk_level: 'Medium',
});

// Mock Cash Flow Forecast
const generateMockCashFlowForecast = (orgId: string): CashFlowForecast => {
  const inflows = {
    loan_repayments_expected: 2850000,
    interest_collections_expected: 420000,
    fee_income_expected: 45000,
    deposit_inflows: 350000,
    borrowing_drawdowns: 500000,
    other_inflows: 25000,
    total_inflows: 4190000,
  };

  const outflows = {
    loan_disbursements_planned: 3200000,
    operating_expenses: 580000,
    loan_repayments_to_lenders: 450000,
    deposit_withdrawals: 280000,
    capital_expenditure: 50000,
    other_outflows: 35000,
    total_outflows: 4595000,
  };

  const opening_cash_balance = 4300000;
  const net_cash_flow = inflows.total_inflows - outflows.total_outflows;
  const closing_cash_balance = opening_cash_balance + net_cash_flow;

  return {
    org_id: orgId,
    forecast_date: formatDate(new Date(), 'yyyy-MM-dd'),
    period: 'weekly',
    opening_cash_balance,
    inflows,
    outflows,
    net_cash_flow,
    closing_cash_balance,
    days_cash_on_hand: Math.round(closing_cash_balance / (outflows.total_outflows / 7)),
    liquidity_gap: net_cash_flow,
    is_liquidity_stressed: net_cash_flow < 0,
  };
};

// Mock Deposit Concentration
const generateMockDepositConcentration = (orgId: string): DepositConcentration => ({
  org_id: orgId,
  report_date: formatDate(new Date(), 'yyyy-MM-dd'),
  top_10_depositors_value: 1200000,
  top_10_depositors_percentage: 30.0,
  top_20_depositors_value: 1800000,
  top_20_depositors_percentage: 45.0,
  demand_deposits: 1500000,
  time_deposits: 1800000,
  savings_deposits: 700000,
  total_deposits: 4000000,
  deposits_due_7_days: 800000,
  deposits_due_30_days: 1200000,
  deposits_due_90_days: 1000000,
  deposits_due_over_90_days: 1000000,
  concentration_risk_level: 'Medium',
  deposit_volatility: 12.5,
});

// Mock Income Quality
const generateMockIncomeQuality = (orgId: string): IncomeQuality => ({
  org_id: orgId,
  report_date: formatDate(new Date(), 'yyyy-MM-dd'),
  interest_income_cash: 5255000,
  interest_income_accrued: 680000,
  accrued_income_percentage: 11.5,
  phantom_income_estimate: 185000,
  phantom_income_percentage: 3.1,
  interest_collection_rate: 91.2,
  income_from_par_30_plus: 425000,
  income_from_par_90_plus: 145000,
  at_risk_percentage: 7.2,
  income_quality_score: 78,
  is_income_reliable: true,
});

// Mock Disbursement Quality
const generateMockDisbursementQuality = (orgId: string): DisbursementQuality => ({
  org_id: orgId,
  report_date: formatDate(new Date(), 'yyyy-MM-dd'),
  period: 'quarterly',
  total_disbursed: 8500000,
  disbursement_count: 145,
  avg_loan_size: 58620,
  repeat_borrowers_percentage: 62.5,
  first_time_borrowers: 54,
  disbursements_last_quarter: 8500000,
  par_30_of_recent_disbursements: 425000,
  early_default_rate: 5.0,
  high_risk_disbursements: 12,
  medium_risk_disbursements: 45,
  low_risk_disbursements: 88,
  avg_dti_at_disbursement: 38.5,
  disbursements_over_50_dti: 18,
});

// Hooks
export function useBalanceSheet() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['balance-sheet', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockBalanceSheet(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useIncomeStatement() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['income-statement', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockIncomeStatement(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useFinancialRatios() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['financial-ratios', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockFinancialRatios(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function usePARAgingBuckets() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['par-aging-buckets', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockPARAgingBuckets(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useGovernanceRisk() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['governance-risk', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockGovernanceRiskMetrics(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useCashFlowForecast() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['cash-flow-forecast', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockCashFlowForecast(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useDepositConcentration() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['deposit-concentration', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockDepositConcentration(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useIncomeQuality() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['income-quality', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockIncomeQuality(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useDisbursementQuality() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['disbursement-quality', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockDisbursementQuality(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

// Combined hook for comprehensive financial data
export function useFinancialData() {
  const balanceSheet = useBalanceSheet();
  const incomeStatement = useIncomeStatement();
  const financialRatios = useFinancialRatios();
  const parAging = usePARAgingBuckets();
  const governanceRisk = useGovernanceRisk();
  const cashFlowForecast = useCashFlowForecast();
  const depositConcentration = useDepositConcentration();
  const incomeQuality = useIncomeQuality();
  const disbursementQuality = useDisbursementQuality();

  return {
    balanceSheet: balanceSheet.data,
    incomeStatement: incomeStatement.data,
    financialRatios: financialRatios.data,
    parAging: parAging.data,
    governanceRisk: governanceRisk.data,
    cashFlowForecast: cashFlowForecast.data,
    depositConcentration: depositConcentration.data,
    incomeQuality: incomeQuality.data,
    disbursementQuality: disbursementQuality.data,
    isLoading: balanceSheet.isLoading || incomeStatement.isLoading || financialRatios.isLoading,
  };
}
