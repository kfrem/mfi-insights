// Hooks for Departmental Reports data
import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import {
  GLSummary,
  TrialBalance,
  IncomeStatement,
  RecoveryMetrics,
  CollectorPerformance,
  ApprovalMetrics,
  RejectionAnalysis,
  CreditOfficerPerformance,
  ProductPerformance,
  ApplicationPipeline,
  ReportPeriod,
} from '@/types/departmental';

// ==================== ACCOUNTS MOCK DATA ====================

function generateMockGLSummary(orgId: string, period: ReportPeriod): GLSummary {
  return {
    org_id: orgId,
    report_date: '2026-01-10',
    period,
    total_assets: 52000000,
    total_liabilities: 38500000,
    total_equity: 13500000,
    total_income: 2800000,
    total_expenses: 1950000,
    net_income: 850000,
    accounts: [
      { account_code: '1100', account_name: 'Cash and Cash Equivalents', account_type: 'Asset', opening_balance: 4200000, debits: 8500000, credits: 7800000, closing_balance: 4900000, movement: 700000 },
      { account_code: '1200', account_name: 'Loan Portfolio - Gross', account_type: 'Asset', opening_balance: 43000000, debits: 8500000, credits: 6500000, closing_balance: 45000000, movement: 2000000 },
      { account_code: '1250', account_name: 'Loan Loss Provisions', account_type: 'Asset', opening_balance: -1800000, debits: 200000, credits: 350000, closing_balance: -1950000, movement: -150000 },
      { account_code: '1300', account_name: 'Other Assets', account_type: 'Asset', opening_balance: 3800000, debits: 450000, credits: 200000, closing_balance: 4050000, movement: 250000 },
      { account_code: '2100', account_name: 'Client Deposits', account_type: 'Liability', opening_balance: 28000000, debits: 5200000, credits: 6800000, closing_balance: 29600000, movement: 1600000 },
      { account_code: '2200', account_name: 'Borrowings', account_type: 'Liability', opening_balance: 8500000, debits: 1000000, credits: 1400000, closing_balance: 8900000, movement: 400000 },
      { account_code: '3100', account_name: 'Paid-up Capital', account_type: 'Equity', opening_balance: 8000000, debits: 0, credits: 0, closing_balance: 8000000, movement: 0 },
      { account_code: '3200', account_name: 'Retained Earnings', account_type: 'Equity', opening_balance: 4650000, debits: 0, credits: 850000, closing_balance: 5500000, movement: 850000 },
      { account_code: '4100', account_name: 'Interest Income', account_type: 'Income', opening_balance: 0, debits: 0, credits: 2400000, closing_balance: 2400000, movement: 2400000 },
      { account_code: '4200', account_name: 'Fees and Commissions', account_type: 'Income', opening_balance: 0, debits: 0, credits: 400000, closing_balance: 400000, movement: 400000 },
      { account_code: '5100', account_name: 'Interest Expense', account_type: 'Expense', opening_balance: 0, debits: 650000, credits: 0, closing_balance: 650000, movement: 650000 },
      { account_code: '5200', account_name: 'Personnel Costs', account_type: 'Expense', opening_balance: 0, debits: 780000, credits: 0, closing_balance: 780000, movement: 780000 },
      { account_code: '5300', account_name: 'Administrative Expenses', account_type: 'Expense', opening_balance: 0, debits: 420000, credits: 0, closing_balance: 420000, movement: 420000 },
      { account_code: '5400', account_name: 'Provision Expense', account_type: 'Expense', opening_balance: 0, debits: 100000, credits: 0, closing_balance: 100000, movement: 100000 },
    ],
  };
}

function generateMockTrialBalance(orgId: string): TrialBalance {
  const entries = [
    { account_code: '1100', account_name: 'Cash and Cash Equivalents', account_type: 'Asset' as const, debit_balance: 4900000, credit_balance: 0 },
    { account_code: '1200', account_name: 'Loan Portfolio - Gross', account_type: 'Asset' as const, debit_balance: 45000000, credit_balance: 0 },
    { account_code: '1250', account_name: 'Loan Loss Provisions', account_type: 'Asset' as const, debit_balance: 0, credit_balance: 1950000 },
    { account_code: '1300', account_name: 'Fixed Assets', account_type: 'Asset' as const, debit_balance: 2800000, credit_balance: 0 },
    { account_code: '1400', account_name: 'Other Assets', account_type: 'Asset' as const, debit_balance: 1250000, credit_balance: 0 },
    { account_code: '2100', account_name: 'Client Deposits', account_type: 'Liability' as const, debit_balance: 0, credit_balance: 29600000 },
    { account_code: '2200', account_name: 'Borrowings', account_type: 'Liability' as const, debit_balance: 0, credit_balance: 8900000 },
    { account_code: '3100', account_name: 'Paid-up Capital', account_type: 'Equity' as const, debit_balance: 0, credit_balance: 8000000 },
    { account_code: '3200', account_name: 'Retained Earnings', account_type: 'Equity' as const, debit_balance: 0, credit_balance: 4650000 },
    { account_code: '4100', account_name: 'Interest Income', account_type: 'Income' as const, debit_balance: 0, credit_balance: 2400000 },
    { account_code: '4200', account_name: 'Fees and Commissions', account_type: 'Income' as const, debit_balance: 0, credit_balance: 400000 },
    { account_code: '5100', account_name: 'Interest Expense', account_type: 'Expense' as const, debit_balance: 650000, credit_balance: 0 },
    { account_code: '5200', account_name: 'Personnel Costs', account_type: 'Expense' as const, debit_balance: 780000, credit_balance: 0 },
    { account_code: '5300', account_name: 'Administrative Expenses', account_type: 'Expense' as const, debit_balance: 420000, credit_balance: 0 },
    { account_code: '5400', account_name: 'Provision Expense', account_type: 'Expense' as const, debit_balance: 100000, credit_balance: 0 },
  ];

  const totalDebits = entries.reduce((sum, e) => sum + e.debit_balance, 0);
  const totalCredits = entries.reduce((sum, e) => sum + e.credit_balance, 0);

  return {
    org_id: orgId,
    as_of_date: '2026-01-10',
    entries,
    total_debits: totalDebits,
    total_credits: totalCredits,
    is_balanced: Math.abs(totalDebits - totalCredits) < 1,
    variance: totalDebits - totalCredits,
  };
}

function generateMockIncomeStatement(orgId: string): IncomeStatement {
  return {
    org_id: orgId,
    period_start: '2026-01-01',
    period_end: '2026-01-10',
    lines: [
      { line_item: 'Interest on Loans', category: 'Interest Income', current_period: 2200000, previous_period: 1950000, budget: 2100000, variance: 100000, variance_percent: 4.8 },
      { line_item: 'Interest on Investments', category: 'Interest Income', current_period: 200000, previous_period: 180000, budget: 190000, variance: 10000, variance_percent: 5.3 },
      { line_item: 'Loan Fees', category: 'Non-Interest Income', current_period: 280000, previous_period: 240000, budget: 250000, variance: 30000, variance_percent: 12 },
      { line_item: 'Other Fees', category: 'Non-Interest Income', current_period: 120000, previous_period: 100000, budget: 110000, variance: 10000, variance_percent: 9.1 },
      { line_item: 'Interest on Deposits', category: 'Interest Expense', current_period: -450000, previous_period: -400000, budget: -420000, variance: -30000, variance_percent: 7.1 },
      { line_item: 'Interest on Borrowings', category: 'Interest Expense', current_period: -200000, previous_period: -180000, budget: -190000, variance: -10000, variance_percent: 5.3 },
      { line_item: 'Salaries and Benefits', category: 'Operating Expenses', current_period: -780000, previous_period: -720000, budget: -750000, variance: -30000, variance_percent: 4 },
      { line_item: 'Rent and Utilities', category: 'Operating Expenses', current_period: -180000, previous_period: -165000, budget: -170000, variance: -10000, variance_percent: 5.9 },
      { line_item: 'Other Admin Expenses', category: 'Operating Expenses', current_period: -240000, previous_period: -220000, budget: -230000, variance: -10000, variance_percent: 4.3 },
      { line_item: 'Loan Loss Provisions', category: 'Provisions', current_period: -100000, previous_period: -120000, budget: -110000, variance: 10000, variance_percent: -9.1 },
      { line_item: 'Income Tax', category: 'Taxes', current_period: -212500, previous_period: -186250, budget: -200000, variance: -12500, variance_percent: 6.25 },
    ],
    gross_interest_income: 2400000,
    net_interest_income: 1750000,
    operating_income: 2150000,
    profit_before_tax: 1062500,
    profit_after_tax: 850000,
  };
}

// ==================== COLLECTIONS MOCK DATA ====================

function generateMockRecoveryMetrics(orgId: string, period: ReportPeriod): RecoveryMetrics {
  const multiplier = period === 'monthly' ? 4 : period === 'weekly' ? 1 : period === 'quarterly' ? 12 : 0.25;
  return {
    org_id: orgId,
    period,
    period_start: '2026-01-01',
    period_end: '2026-01-10',
    opening_arrears: 2800000,
    new_arrears: 450000 * multiplier,
    recovered_arrears: 520000 * multiplier,
    written_off: 50000 * multiplier,
    closing_arrears: 2680000,
    recovery_rate: 68.5,
    bucket_1_30: { amount: 850000, recovered: 620000, rate: 72.9 },
    bucket_31_60: { amount: 650000, recovered: 420000, rate: 64.6 },
    bucket_61_90: { amount: 480000, recovered: 280000, rate: 58.3 },
    bucket_91_180: { amount: 420000, recovered: 180000, rate: 42.9 },
    bucket_180_plus: { amount: 280000, recovered: 70000, rate: 25.0 },
  };
}

function generateMockCollectorPerformance(): CollectorPerformance[] {
  const officers = [
    { name: 'Kwame Mensah', branch: 'Accra Central' },
    { name: 'Ama Serwaa', branch: 'Kumasi' },
    { name: 'Kofi Asante', branch: 'Takoradi' },
    { name: 'Abena Pokua', branch: 'Accra East' },
    { name: 'Yaw Boateng', branch: 'Tema' },
  ];

  return officers.map((officer, idx) => ({
    officer_id: `CO-${1001 + idx}`,
    officer_name: officer.name,
    branch: officer.branch,
    clients_assigned: 85 + Math.floor(Math.random() * 30),
    portfolio_assigned: 2500000 + Math.random() * 1500000,
    arrears_assigned: 350000 + Math.random() * 200000,
    clients_visited: 60 + Math.floor(Math.random() * 25),
    visit_rate: 70 + Math.random() * 20,
    amount_collected: 180000 + Math.random() * 100000,
    collection_rate: 55 + Math.random() * 25,
    promises_obtained: 25 + Math.floor(Math.random() * 15),
    promises_kept: 18 + Math.floor(Math.random() * 10),
    promise_to_pay_rate: 65 + Math.random() * 20,
    roll_forward_count: 3 + Math.floor(Math.random() * 5),
    roll_back_count: 8 + Math.floor(Math.random() * 8),
    accounts_cured: 12 + Math.floor(Math.random() * 10),
    cure_rate: 12 + Math.random() * 8,
  }));
}

// ==================== CREDIT MOCK DATA ====================

function generateMockApprovalMetrics(orgId: string, period: ReportPeriod): ApprovalMetrics {
  const multiplier = period === 'monthly' ? 4 : period === 'weekly' ? 1 : period === 'quarterly' ? 12 : 0.25;
  return {
    org_id: orgId,
    period,
    period_start: '2026-01-01',
    period_end: '2026-01-10',
    applications_received: Math.round(180 * multiplier),
    applications_processed: Math.round(165 * multiplier),
    applications_approved: Math.round(142 * multiplier),
    applications_rejected: Math.round(23 * multiplier),
    applications_pending: 15,
    approval_rate: 86.1,
    amount_requested: 9200000 * multiplier,
    amount_approved: 7800000 * multiplier,
    amount_disbursed: 7200000 * multiplier,
    avg_approved_amount: 54930,
    avg_processing_days: 3.2,
    avg_disbursement_days: 1.5,
    first_payment_default_rate: 2.8,
    early_delinquency_rate: 5.2,
  };
}

function generateMockRejectionAnalysis(orgId: string, period: ReportPeriod): RejectionAnalysis {
  return {
    org_id: orgId,
    period,
    total_rejections: 23,
    total_amount_declined: 1400000,
    reasons: [
      { reason_code: 'IC', reason_description: 'Insufficient Collateral', count: 8, percentage: 34.8, amount_declined: 520000 },
      { reason_code: 'PC', reason_description: 'Poor Credit History', count: 5, percentage: 21.7, amount_declined: 280000 },
      { reason_code: 'II', reason_description: 'Inadequate Income', count: 4, percentage: 17.4, amount_declined: 240000 },
      { reason_code: 'ID', reason_description: 'Incomplete Documentation', count: 3, percentage: 13.0, amount_declined: 180000 },
      { reason_code: 'OL', reason_description: 'Over-leveraged', count: 2, percentage: 8.7, amount_declined: 120000 },
      { reason_code: 'OT', reason_description: 'Other Reasons', count: 1, percentage: 4.3, amount_declined: 60000 },
    ],
    rejection_by_product: [
      { product: 'Business Loan', count: 10, rate: 15.2 },
      { product: 'Personal Loan', count: 6, rate: 12.5 },
      { product: 'Agriculture Loan', count: 5, rate: 18.5 },
      { product: 'Asset Finance', count: 2, rate: 8.3 },
    ],
    rejection_by_branch: [
      { branch: 'Accra Central', count: 8, rate: 14.5 },
      { branch: 'Kumasi', count: 6, rate: 12.8 },
      { branch: 'Takoradi', count: 5, rate: 16.1 },
      { branch: 'Tema', count: 4, rate: 11.4 },
    ],
  };
}

function generateMockCreditOfficerPerformance(): CreditOfficerPerformance[] {
  const officers = [
    { name: 'Emmanuel Adjei', branch: 'Accra Central' },
    { name: 'Grace Owusu', branch: 'Kumasi' },
    { name: 'Daniel Tetteh', branch: 'Takoradi' },
    { name: 'Patience Amoah', branch: 'Accra East' },
    { name: 'Michael Ansah', branch: 'Tema' },
    { name: 'Rita Mensah', branch: 'Accra Central' },
  ];

  return officers.map((officer, idx) => ({
    officer_id: `LO-${2001 + idx}`,
    officer_name: officer.name,
    branch: officer.branch,
    clients_managed: 95 + Math.floor(Math.random() * 35),
    active_loans: 85 + Math.floor(Math.random() * 30),
    portfolio_value: 3500000 + Math.random() * 2000000,
    applications_processed: 28 + Math.floor(Math.random() * 15),
    approval_rate: 80 + Math.random() * 12,
    avg_processing_time: 2.5 + Math.random() * 2,
    par_30_rate: 3 + Math.random() * 5,
    first_payment_default_rate: 1.5 + Math.random() * 3,
    write_off_rate: 0.5 + Math.random() * 1,
    disbursement_target: 800000,
    disbursement_actual: 650000 + Math.random() * 250000,
    target_achievement: 81 + Math.random() * 20,
  }));
}

function generateMockApplicationPipeline(): ApplicationPipeline[] {
  return [
    { stage: 'New', count: 28, total_amount: 1850000, avg_days_in_stage: 1.2, oldest_application_days: 3 },
    { stage: 'Documents', count: 22, total_amount: 1420000, avg_days_in_stage: 2.5, oldest_application_days: 5 },
    { stage: 'Appraisal', count: 18, total_amount: 1180000, avg_days_in_stage: 3.8, oldest_application_days: 8 },
    { stage: 'Committee', count: 12, total_amount: 780000, avg_days_in_stage: 1.5, oldest_application_days: 4 },
    { stage: 'Approval', count: 15, total_amount: 920000, avg_days_in_stage: 0.8, oldest_application_days: 2 },
    { stage: 'Disbursement', count: 8, total_amount: 520000, avg_days_in_stage: 1.0, oldest_application_days: 2 },
  ];
}

function generateMockProductPerformance(): ProductPerformance[] {
  return [
    { product_id: 'BL', product_name: 'Business Loan', active_loans: 4200, portfolio_outstanding: 22500000, portfolio_share: 50.0, applications_mtd: 85, disbursements_mtd: 3800000, par_30_rate: 5.8, avg_yield: 42, interest_income: 1100000, fee_income: 150000, provisions: 180000, net_contribution: 1070000 },
    { product_id: 'PL', product_name: 'Personal Loan', active_loans: 2800, portfolio_outstanding: 9000000, portfolio_share: 20.0, applications_mtd: 65, disbursements_mtd: 1600000, par_30_rate: 4.2, avg_yield: 45, interest_income: 480000, fee_income: 80000, provisions: 60000, net_contribution: 500000 },
    { product_id: 'AL', product_name: 'Agriculture Loan', active_loans: 1800, portfolio_outstanding: 7200000, portfolio_share: 16.0, applications_mtd: 35, disbursements_mtd: 1200000, par_30_rate: 8.5, avg_yield: 38, interest_income: 320000, fee_income: 45000, provisions: 95000, net_contribution: 270000 },
    { product_id: 'AF', product_name: 'Asset Finance', active_loans: 1200, portfolio_outstanding: 5400000, portfolio_share: 12.0, applications_mtd: 22, disbursements_mtd: 900000, par_30_rate: 3.2, avg_yield: 35, interest_income: 220000, fee_income: 35000, provisions: 28000, net_contribution: 227000 },
    { product_id: 'GL', product_name: 'Group Loan', active_loans: 800, portfolio_outstanding: 900000, portfolio_share: 2.0, applications_mtd: 18, disbursements_mtd: 200000, par_30_rate: 2.5, avg_yield: 48, interest_income: 52000, fee_income: 12000, provisions: 4000, net_contribution: 60000 },
  ];
}

// ==================== REACT QUERY HOOKS ====================

// Accounts Hooks
export function useGLSummary(period: ReportPeriod = 'monthly') {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['gl-summary', selectedOrgId, period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockGLSummary(selectedOrgId || 'default', period);
    },
    enabled: !!selectedOrgId,
  });
}

export function useTrialBalance() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['trial-balance', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockTrialBalance(selectedOrgId || 'default');
    },
    enabled: !!selectedOrgId,
  });
}

export function useIncomeStatement() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['income-statement', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockIncomeStatement(selectedOrgId || 'default');
    },
    enabled: !!selectedOrgId,
  });
}

// Collections Hooks
export function useRecoveryMetrics(period: ReportPeriod = 'monthly') {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['recovery-metrics', selectedOrgId, period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockRecoveryMetrics(selectedOrgId || 'default', period);
    },
    enabled: !!selectedOrgId,
  });
}

export function useCollectorPerformance() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['collector-performance', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockCollectorPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

// Credit Hooks
export function useApprovalMetrics(period: ReportPeriod = 'monthly') {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['approval-metrics', selectedOrgId, period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockApprovalMetrics(selectedOrgId || 'default', period);
    },
    enabled: !!selectedOrgId,
  });
}

export function useRejectionAnalysis(period: ReportPeriod = 'monthly') {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['rejection-analysis', selectedOrgId, period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockRejectionAnalysis(selectedOrgId || 'default', period);
    },
    enabled: !!selectedOrgId,
  });
}

export function useCreditOfficerPerformance() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['credit-officer-performance', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockCreditOfficerPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

export function useProductPerformance() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['product-performance', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockProductPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

export function useApplicationPipeline() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['application-pipeline', selectedOrgId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockApplicationPipeline();
    },
    enabled: !!selectedOrgId,
  });
}
