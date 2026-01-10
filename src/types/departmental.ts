// Types for Departmental Reports

export type DepartmentType = 'accounts' | 'collections' | 'credit';
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// ==================== ACCOUNTS DEPARTMENT ====================

// General Ledger Summary
export interface GLAccount {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  opening_balance: number;
  debits: number;
  credits: number;
  closing_balance: number;
  movement: number;
}

export interface GLSummary {
  org_id: string;
  report_date: string;
  period: ReportPeriod;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_income: number;
  total_expenses: number;
  net_income: number;
  accounts: GLAccount[];
}

// Trial Balance
export interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalance {
  org_id: string;
  as_of_date: string;
  entries: TrialBalanceEntry[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  variance: number;
}

// Income Statement
export interface IncomeStatementLine {
  line_item: string;
  category: 'Interest Income' | 'Non-Interest Income' | 'Interest Expense' | 'Operating Expenses' | 'Provisions' | 'Taxes';
  current_period: number;
  previous_period: number;
  budget: number;
  variance: number;
  variance_percent: number;
}

export interface IncomeStatement {
  org_id: string;
  period_start: string;
  period_end: string;
  lines: IncomeStatementLine[];
  gross_interest_income: number;
  net_interest_income: number;
  operating_income: number;
  profit_before_tax: number;
  profit_after_tax: number;
}

// ==================== COLLECTIONS DEPARTMENT ====================

// Recovery Metrics
export interface RecoveryMetrics {
  org_id: string;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  // Arrears Recovery
  opening_arrears: number;
  new_arrears: number;
  recovered_arrears: number;
  written_off: number;
  closing_arrears: number;
  recovery_rate: number;
  // By Bucket
  bucket_1_30: { amount: number; recovered: number; rate: number };
  bucket_31_60: { amount: number; recovered: number; rate: number };
  bucket_61_90: { amount: number; recovered: number; rate: number };
  bucket_91_180: { amount: number; recovered: number; rate: number };
  bucket_180_plus: { amount: number; recovered: number; rate: number };
}

// Agent/Officer Performance
export interface CollectorPerformance {
  officer_id: string;
  officer_name: string;
  branch: string;
  // Assigned Portfolio
  clients_assigned: number;
  portfolio_assigned: number;
  arrears_assigned: number;
  // Collections Performance
  clients_visited: number;
  visit_rate: number;
  amount_collected: number;
  collection_rate: number;
  // Promises
  promises_obtained: number;
  promises_kept: number;
  promise_to_pay_rate: number;
  // Effectiveness
  roll_forward_count: number;
  roll_back_count: number;
  accounts_cured: number;
  cure_rate: number;
}

// Collection Activity Log
export interface CollectionActivity {
  activity_id: string;
  timestamp: string;
  officer_name: string;
  client_name: string;
  loan_id: string;
  activity_type: 'Visit' | 'Call' | 'SMS' | 'Letter' | 'Promise' | 'Payment' | 'Escalation';
  outcome: string;
  amount?: number;
  next_action?: string;
  next_action_date?: string;
}

// Aging Movement Report
export interface AgingMovement {
  from_bucket: string;
  to_bucket: string;
  loan_count: number;
  amount: number;
  movement_type: 'Roll Forward' | 'Roll Back' | 'Cure' | 'Write-Off';
}

// ==================== CREDIT DEPARTMENT ====================

// Application Pipeline
export interface ApplicationPipeline {
  stage: 'New' | 'Documents' | 'Appraisal' | 'Committee' | 'Approval' | 'Disbursement';
  count: number;
  total_amount: number;
  avg_days_in_stage: number;
  oldest_application_days: number;
}

// Approval Metrics
export interface ApprovalMetrics {
  org_id: string;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  // Applications
  applications_received: number;
  applications_processed: number;
  applications_approved: number;
  applications_rejected: number;
  applications_pending: number;
  approval_rate: number;
  // Amounts
  amount_requested: number;
  amount_approved: number;
  amount_disbursed: number;
  avg_approved_amount: number;
  // Turnaround
  avg_processing_days: number;
  avg_disbursement_days: number;
  // Quality
  first_payment_default_rate: number;
  early_delinquency_rate: number;
}

// Rejection Analysis
export interface RejectionReason {
  reason_code: string;
  reason_description: string;
  count: number;
  percentage: number;
  amount_declined: number;
}

export interface RejectionAnalysis {
  org_id: string;
  period: ReportPeriod;
  total_rejections: number;
  total_amount_declined: number;
  reasons: RejectionReason[];
  rejection_by_product: { product: string; count: number; rate: number }[];
  rejection_by_branch: { branch: string; count: number; rate: number }[];
}

// Credit Officer Performance
export interface CreditOfficerPerformance {
  officer_id: string;
  officer_name: string;
  branch: string;
  // Portfolio
  clients_managed: number;
  active_loans: number;
  portfolio_value: number;
  // Processing
  applications_processed: number;
  approval_rate: number;
  avg_processing_time: number;
  // Quality
  par_30_rate: number;
  first_payment_default_rate: number;
  write_off_rate: number;
  // Targets
  disbursement_target: number;
  disbursement_actual: number;
  target_achievement: number;
}

// Product Performance
export interface ProductPerformance {
  product_id: string;
  product_name: string;
  // Volume
  active_loans: number;
  portfolio_outstanding: number;
  portfolio_share: number;
  // Performance
  applications_mtd: number;
  disbursements_mtd: number;
  par_30_rate: number;
  avg_yield: number;
  // Profitability
  interest_income: number;
  fee_income: number;
  provisions: number;
  net_contribution: number;
}
