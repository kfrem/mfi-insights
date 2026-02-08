import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { classifyLoanByDaysOverdue, calculateProvision, calculatePARRate } from '@/lib/financial';
import { differenceInDays } from '@/lib/dateUtils';
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

// ─── Hooks that compute from real loan data ──────────────────────────────────

/**
 * Computes PAR aging buckets directly from the loans table.
 */
export function usePARAgingBuckets() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['par-aging-buckets', selectedOrgId],
    queryFn: async (): Promise<PARAgingBuckets | null> => {
      if (!selectedOrgId) return null;

      const { data: loans, error } = await supabase
        .from('loans')
        .select('loan_id, principal, outstanding_principal, status, expected_end_date')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);

      if (error) throw new Error(`Failed to load PAR aging: ${error.message}`);
      if (!loans || loans.length === 0) return null;

      const today = new Date();
      const buckets = {
        current: { loan_count: 0, outstanding_balance: 0 },
        par_1_30: { loan_count: 0, outstanding_balance: 0 },
        par_31_60: { loan_count: 0, outstanding_balance: 0 },
        par_61_90: { loan_count: 0, outstanding_balance: 0 },
        par_91_180: { loan_count: 0, outstanding_balance: 0 },
        par_180_plus: { loan_count: 0, outstanding_balance: 0 },
      };
      let gross_portfolio = 0;
      let total_arrears = 0;
      let loans_1_7 = 0;
      let loans_8_14 = 0;
      let loans_15_30 = 0;

      for (const loan of loans) {
        const balance = loan.outstanding_principal ?? loan.principal ?? 0;
        gross_portfolio += balance;

        const daysOverdue = loan.expected_end_date
          ? Math.max(0, differenceInDays(today, new Date(loan.expected_end_date)))
          : 0;

        if (daysOverdue <= 0) {
          buckets.current.loan_count++;
          buckets.current.outstanding_balance += balance;
        } else {
          total_arrears += balance;
          if (daysOverdue <= 7) loans_1_7++;
          else if (daysOverdue <= 14) loans_8_14++;
          else if (daysOverdue <= 30) loans_15_30++;

          if (daysOverdue <= 30) {
            buckets.par_1_30.loan_count++;
            buckets.par_1_30.outstanding_balance += balance;
          } else if (daysOverdue <= 60) {
            buckets.par_31_60.loan_count++;
            buckets.par_31_60.outstanding_balance += balance;
          } else if (daysOverdue <= 90) {
            buckets.par_61_90.loan_count++;
            buckets.par_61_90.outstanding_balance += balance;
          } else if (daysOverdue <= 180) {
            buckets.par_91_180.loan_count++;
            buckets.par_91_180.outstanding_balance += balance;
          } else {
            buckets.par_180_plus.loan_count++;
            buckets.par_180_plus.outstanding_balance += balance;
          }
        }
      }

      const pct = (val: number) => gross_portfolio > 0 ? Math.round((val / gross_portfolio) * 10000) / 100 : 0;

      return {
        org_id: selectedOrgId,
        report_date: today.toISOString().split('T')[0],
        current: {
          loan_count: buckets.current.loan_count,
          outstanding_balance: buckets.current.outstanding_balance,
          percentage: pct(buckets.current.outstanding_balance),
        },
        par_1_30: {
          loan_count: buckets.par_1_30.loan_count,
          outstanding_balance: buckets.par_1_30.outstanding_balance,
          percentage: pct(buckets.par_1_30.outstanding_balance),
          days_label: '1-30 days',
        },
        par_31_60: {
          loan_count: buckets.par_31_60.loan_count,
          outstanding_balance: buckets.par_31_60.outstanding_balance,
          percentage: pct(buckets.par_31_60.outstanding_balance),
          days_label: '31-60 days',
        },
        par_61_90: {
          loan_count: buckets.par_61_90.loan_count,
          outstanding_balance: buckets.par_61_90.outstanding_balance,
          percentage: pct(buckets.par_61_90.outstanding_balance),
          days_label: '61-90 days',
        },
        par_91_180: {
          loan_count: buckets.par_91_180.loan_count,
          outstanding_balance: buckets.par_91_180.outstanding_balance,
          percentage: pct(buckets.par_91_180.outstanding_balance),
          days_label: '91-180 days',
        },
        par_180_plus: {
          loan_count: buckets.par_180_plus.loan_count,
          outstanding_balance: buckets.par_180_plus.outstanding_balance,
          percentage: pct(buckets.par_180_plus.outstanding_balance),
          days_label: '180+ days',
        },
        total_loans: loans.length,
        gross_portfolio,
        total_arrears,
        early_warning: {
          loans_1_7_days: loans_1_7,
          loans_8_14_days: loans_8_14,
          loans_15_30_days: loans_15_30,
          deteriorating_trend: false,
          weekly_change: 0,
        },
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Computes disbursement quality metrics from the loans table.
 */
export function useDisbursementQuality() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['disbursement-quality', selectedOrgId],
    queryFn: async (): Promise<DisbursementQuality | null> => {
      if (!selectedOrgId) return null;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: loans, error } = await supabase
        .from('loans')
        .select('loan_id, principal, status, disbursement_date, expected_end_date, outstanding_principal, client_id')
        .eq('org_id', selectedOrgId)
        .not('disbursement_date', 'is', null);

      if (error) throw new Error(`Failed to load disbursement quality: ${error.message}`);
      if (!loans || loans.length === 0) return null;

      const today = new Date();
      const recentLoans = loans.filter(l =>
        l.disbursement_date && new Date(l.disbursement_date) >= threeMonthsAgo
      );

      let total_disbursed = 0;
      let par_30_recent = 0;
      let high_risk = 0;
      let medium_risk = 0;
      let low_risk = 0;

      // Track unique clients to identify repeat borrowers
      const clientIds = new Set<string>();
      const repeatClientIds = new Set<string>();

      for (const loan of loans) {
        if (loan.client_id) {
          if (clientIds.has(loan.client_id)) {
            repeatClientIds.add(loan.client_id);
          }
          clientIds.add(loan.client_id);
        }
      }

      for (const loan of recentLoans) {
        total_disbursed += loan.principal ?? 0;

        const daysOverdue = loan.expected_end_date
          ? Math.max(0, differenceInDays(today, new Date(loan.expected_end_date)))
          : 0;

        if (daysOverdue >= 30) {
          par_30_recent += (loan.outstanding_principal ?? loan.principal ?? 0);
        }

        // Classify risk based on principal size relative to average
        const avgSize = total_disbursed / (recentLoans.indexOf(loan) + 1);
        if ((loan.principal ?? 0) > avgSize * 2) high_risk++;
        else if ((loan.principal ?? 0) > avgSize) medium_risk++;
        else low_risk++;
      }

      const disbursement_count = recentLoans.length;
      const avg_loan_size = disbursement_count > 0 ? Math.round(total_disbursed / disbursement_count) : 0;
      const early_default_rate = total_disbursed > 0 ? (par_30_recent / total_disbursed) * 100 : 0;
      const repeat_pct = clientIds.size > 0 ? (repeatClientIds.size / clientIds.size) * 100 : 0;
      const first_time = clientIds.size - repeatClientIds.size;

      return {
        org_id: selectedOrgId,
        report_date: today.toISOString().split('T')[0],
        period: 'quarterly',
        total_disbursed,
        disbursement_count,
        avg_loan_size,
        repeat_borrowers_percentage: Math.round(repeat_pct * 10) / 10,
        first_time_borrowers: first_time,
        disbursements_last_quarter: total_disbursed,
        par_30_of_recent_disbursements: par_30_recent,
        early_default_rate: Math.round(early_default_rate * 10) / 10,
        high_risk_disbursements: high_risk,
        medium_risk_disbursements: medium_risk,
        low_risk_disbursements: low_risk,
        avg_dti_at_disbursement: 0, // Requires client income data cross-reference
        disbursements_over_50_dti: 0,
      };
    },
    enabled: !!selectedOrgId,
  });
}

// ─── Hooks that require accounting tables (not yet in schema) ────────────────
//
// Balance sheets, income statements, financial ratios, governance metrics,
// cash flow forecasts, deposit analysis, and income quality all require
// a proper accounting system (chart of accounts, journal entries, general ledger)
// which doesn't exist in the current database schema.
//
// These hooks return null until the accounting infrastructure is built.

export function useBalanceSheet() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['balance-sheet', selectedOrgId],
    queryFn: async (): Promise<BalanceSheet | null> => {
      if (!selectedOrgId) return null;
      // Requires chart of accounts + journal entries tables
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useIncomeStatement() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['income-statement', selectedOrgId],
    queryFn: async (): Promise<IncomeStatement | null> => {
      if (!selectedOrgId) return null;
      // Requires revenue/expense tracking via general ledger
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useFinancialRatios() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['financial-ratios', selectedOrgId],
    queryFn: async (): Promise<FinancialRatios | null> => {
      if (!selectedOrgId) return null;
      // Most ratios depend on balance sheet and income statement data
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useGovernanceRisk() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['governance-risk', selectedOrgId],
    queryFn: async (): Promise<GovernanceRiskMetrics | null> => {
      if (!selectedOrgId) return null;
      // Requires audit findings and control issues tracking tables
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useCashFlowForecast() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['cash-flow-forecast', selectedOrgId],
    queryFn: async (): Promise<CashFlowForecast | null> => {
      if (!selectedOrgId) return null;
      // Requires budgeting and cash management tables
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useDepositConcentration() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['deposit-concentration', selectedOrgId],
    queryFn: async (): Promise<DepositConcentration | null> => {
      if (!selectedOrgId) return null;
      // Requires deposits table (not in current schema)
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useIncomeQuality() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['income-quality', selectedOrgId],
    queryFn: async (): Promise<IncomeQuality | null> => {
      if (!selectedOrgId) return null;
      // Requires income tracking via general ledger
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

// ─── Combined hook ───────────────────────────────────────────────────────────

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
