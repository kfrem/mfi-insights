// Types for Financial Reporting - Balance Sheet, P&L, and Key Metrics

// Balance Sheet / Statement of Financial Position
export interface BalanceSheet {
  org_id: string;
  report_date: string;
  // Assets
  assets: {
    current_assets: {
      cash_on_hand: number;
      cash_at_bank: number;
      short_term_investments: number;
      gross_loan_portfolio: number;
      loan_loss_provisions: number;
      net_loan_portfolio: number;
      interest_receivable: number;
      other_receivables: number;
      prepaid_expenses: number;
      total_current_assets: number;
    };
    non_current_assets: {
      property_plant_equipment: number;
      accumulated_depreciation: number;
      net_fixed_assets: number;
      intangible_assets: number;
      long_term_investments: number;
      deferred_tax_assets: number;
      total_non_current_assets: number;
    };
    total_assets: number;
  };
  // Liabilities
  liabilities: {
    current_liabilities: {
      deposits_from_public: number;
      short_term_borrowings: number;
      accounts_payable: number;
      accrued_expenses: number;
      interest_payable: number;
      taxes_payable: number;
      deferred_income: number;
      total_current_liabilities: number;
    };
    non_current_liabilities: {
      long_term_borrowings: number;
      subordinated_debt: number;
      deferred_tax_liabilities: number;
      other_long_term_liabilities: number;
      total_non_current_liabilities: number;
    };
    total_liabilities: number;
  };
  // Equity
  equity: {
    paid_up_capital: number;
    share_premium: number;
    statutory_reserves: number;
    general_reserves: number;
    revaluation_reserves: number;
    retained_earnings: number;
    current_year_profit: number;
    total_equity: number;
  };
  // Validation
  total_liabilities_and_equity: number;
  is_balanced: boolean;
}

// Profit & Loss / Income Statement
export interface IncomeStatement {
  org_id: string;
  report_date: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  // Interest Income
  interest_income: {
    interest_on_loans_cash: number;
    interest_on_loans_accrued: number;
    interest_on_investments: number;
    interest_on_bank_deposits: number;
    total_interest_income_cash: number;
    total_interest_income_accrued: number;
    total_interest_income: number;
  };
  // Interest Expense
  interest_expense: {
    interest_on_deposits: number;
    interest_on_borrowings: number;
    other_interest_expense: number;
    total_interest_expense: number;
  };
  // Net Interest Income
  net_interest_income: number;
  // Other Income
  other_income: {
    fee_income: number;
    commission_income: number;
    forex_gains: number;
    other_operating_income: number;
    total_other_income: number;
  };
  // Operating Income
  gross_operating_income: number;
  // Provisions
  provisions: {
    loan_loss_provision: number;
    provision_reversal: number;
    net_provision_expense: number;
  };
  // Operating Expenses
  operating_expenses: {
    personnel_expenses: number;
    administrative_expenses: number;
    depreciation_amortization: number;
    other_operating_expenses: number;
    unverified_suspense_expenses: number; // Critical control - from audit
    total_operating_expenses: number;
  };
  // Results
  operating_profit: number;
  exceptional_items: number;
  profit_before_tax: number;
  income_tax: number;
  net_profit: number;
}

// Key Financial Ratios
export interface FinancialRatios {
  org_id: string;
  report_date: string;
  // Profitability
  net_interest_margin: number; // (Net Interest Income / Avg Earning Assets) * 100
  operational_self_sufficiency: number; // Operating Income / (OpEx + FinExp + Provisions) * 100
  return_on_assets: number; // Net Profit / Avg Total Assets * 100
  return_on_equity: number; // Net Profit / Avg Total Equity * 100
  cost_to_income_ratio: number; // Operating Expenses / Operating Income * 100
  cost_of_funds: number; // Interest Expense / Avg Interest Bearing Liabilities * 100
  yield_on_portfolio: number; // Interest Income (Cash) / Avg Gross Loan Portfolio * 100
  // Portfolio Quality
  par_1_rate: number;
  par_30_rate: number;
  par_60_rate: number;
  par_90_rate: number;
  par_180_rate: number;
  npl_ratio: number; // (PAR90+ / Gross Portfolio) * 100
  provision_coverage_ratio: number; // Total Provisions / PAR90+ * 100
  write_off_ratio: number;
  // Efficiency
  staff_productivity: number; // Active Borrowers / Loan Officers
  operating_expense_ratio: number; // OpEx / Avg Gross Portfolio * 100
  loan_officer_productivity: number; // Gross Portfolio / Loan Officers
  // Liquidity & Solvency
  current_ratio: number; // Current Assets / Current Liabilities
  quick_ratio: number; // (Current Assets - Inventory) / Current Liabilities
  gearing_ratio: number; // Total Debt / Total Equity
  debt_to_assets: number; // Total Liabilities / Total Assets
  // Compliance markers
  is_car_compliant: boolean;
  is_liquidity_compliant: boolean;
  is_oss_compliant: boolean; // OSS > 100%
}

// PAR Aging Buckets per CGAP/BoG Standards
export interface PARAgingBuckets {
  org_id: string;
  report_date: string;
  // Standard buckets
  current: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
  };
  par_1_30: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
    days_label: '1-30 days';
  };
  par_31_60: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
    days_label: '31-60 days';
  };
  par_61_90: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
    days_label: '61-90 days';
  };
  par_91_180: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
    days_label: '91-180 days';
  };
  par_180_plus: {
    loan_count: number;
    outstanding_balance: number;
    percentage: number;
    days_label: '180+ days';
  };
  // Totals
  total_loans: number;
  gross_portfolio: number;
  total_arrears: number;
  // Early warning metrics
  early_warning: {
    loans_1_7_days: number; // First sign of trouble
    loans_8_14_days: number;
    loans_15_30_days: number;
    deteriorating_trend: boolean;
    weekly_change: number; // % change in PAR from last week
  };
}

// Governance & Risk Metrics
export interface GovernanceRiskMetrics {
  org_id: string;
  report_date: string;
  // Audit Findings
  audit_findings: {
    total_findings: number;
    high_priority_open: number;
    medium_priority_open: number;
    low_priority_open: number;
    findings_closed_mtd: number;
    avg_days_to_close: number;
    overdue_findings: number;
  };
  // Control Weaknesses
  control_issues: {
    transactions_without_pv: number;
    unreconciled_suspense_items: number;
    suspense_items_value: number;
    duplicate_entries: number;
    unauthorized_transactions: number;
    missing_signatures: number;
  };
  // Fraud Indicators
  fraud_risk: {
    suspected_fraud_cases: number;
    confirmed_fraud_cases: number;
    fraud_value: number;
    cheque_discrepancies: number;
    duplicate_cheques: number;
    personal_name_withdrawals: number;
  };
  // Cash Reconciliation
  cash_reconciliation: {
    unreconciled_items_count: number;
    unreconciled_items_value: number;
    days_unreconciled_avg: number;
    last_reconciliation_date: string;
  };
  // Overall Health Score (0-100)
  governance_health_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
}

// Cash Flow Forecast
export interface CashFlowForecast {
  org_id: string;
  forecast_date: string;
  period: 'daily' | 'weekly' | 'monthly';
  // Opening Balance
  opening_cash_balance: number;
  // Inflows
  inflows: {
    loan_repayments_expected: number;
    interest_collections_expected: number;
    fee_income_expected: number;
    deposit_inflows: number;
    borrowing_drawdowns: number;
    other_inflows: number;
    total_inflows: number;
  };
  // Outflows
  outflows: {
    loan_disbursements_planned: number;
    operating_expenses: number;
    loan_repayments_to_lenders: number;
    deposit_withdrawals: number;
    capital_expenditure: number;
    other_outflows: number;
    total_outflows: number;
  };
  // Net Flow
  net_cash_flow: number;
  closing_cash_balance: number;
  // Liquidity Indicators
  days_cash_on_hand: number;
  liquidity_gap: number;
  is_liquidity_stressed: boolean;
}

// Deposit Concentration (for licensed deposit-takers)
export interface DepositConcentration {
  org_id: string;
  report_date: string;
  // Top depositor analysis
  top_10_depositors_value: number;
  top_10_depositors_percentage: number;
  top_20_depositors_value: number;
  top_20_depositors_percentage: number;
  // Deposit type breakdown
  demand_deposits: number;
  time_deposits: number;
  savings_deposits: number;
  total_deposits: number;
  // Maturity analysis
  deposits_due_7_days: number;
  deposits_due_30_days: number;
  deposits_due_90_days: number;
  deposits_due_over_90_days: number;
  // Risk indicators
  concentration_risk_level: 'Low' | 'Medium' | 'High';
  deposit_volatility: number;
}

// Income Quality Analysis (Cash vs Accrual)
export interface IncomeQuality {
  org_id: string;
  report_date: string;
  // Interest Income
  interest_income_cash: number;
  interest_income_accrued: number;
  accrued_income_percentage: number;
  // Phantom Income (accrued on NPLs)
  phantom_income_estimate: number;
  phantom_income_percentage: number;
  // Collection Efficiency
  interest_collection_rate: number;
  // Income at Risk
  income_from_par_30_plus: number;
  income_from_par_90_plus: number;
  at_risk_percentage: number;
  // Quality Indicators
  income_quality_score: number; // 0-100
  is_income_reliable: boolean;
}

// Disbursement Quality (not just volume)
export interface DisbursementQuality {
  org_id: string;
  report_date: string;
  period: 'monthly' | 'quarterly';
  // Volume
  total_disbursed: number;
  disbursement_count: number;
  avg_loan_size: number;
  // Quality Indicators
  repeat_borrowers_percentage: number;
  first_time_borrowers: number;
  // Early Performance of Recent Disbursements
  disbursements_last_quarter: number;
  par_30_of_recent_disbursements: number;
  early_default_rate: number; // % defaulting within 90 days
  // Risk Distribution
  high_risk_disbursements: number;
  medium_risk_disbursements: number;
  low_risk_disbursements: number;
  // DTI Analysis
  avg_dti_at_disbursement: number;
  disbursements_over_50_dti: number;
}
