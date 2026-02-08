import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { calculatePARRate } from '@/lib/financial';
import { differenceInDays } from '@/lib/dateUtils';
import {
  buildBalanceSheet,
  buildIncomeStatement,
  type TrialBalanceRow,
  type PeriodMovementRow,
} from '@/lib/accountingMappings';
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
        avg_dti_at_disbursement: 0,
        disbursements_over_50_dti: 0,
      };
    },
    enabled: !!selectedOrgId,
  });
}

// ─── Hooks that compute from accounting data (journal entries) ──────────────

/**
 * Balance Sheet — computed from the trial balance (all posted journal entries up to today).
 */
export function useBalanceSheet() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['balance-sheet', selectedOrgId],
    queryFn: async (): Promise<BalanceSheet | null> => {
      if (!selectedOrgId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_trial_balance', {
        p_org_id: selectedOrgId,
        p_as_of_date: today,
      });

      if (error) throw new Error(`Failed to load balance sheet: ${error.message}`);
      if (!data || data.length === 0) return null;

      const bsRows = (data as TrialBalanceRow[]).filter(
        r => r.account_type === 'ASSET' || r.account_type === 'LIABILITY' || r.account_type === 'EQUITY'
      );

      if (bsRows.every(r => r.balance === 0)) return null;

      return buildBalanceSheet(selectedOrgId, today, bsRows);
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Income Statement — computed from period movements (income/expense journal entries).
 */
export function useIncomeStatement() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['income-statement', selectedOrgId],
    queryFn: async (): Promise<IncomeStatement | null> => {
      if (!selectedOrgId) return null;

      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const fromDate = yearStart.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_period_movements', {
        p_org_id: selectedOrgId,
        p_from_date: fromDate,
        p_to_date: toDate,
      });

      if (error) throw new Error(`Failed to load income statement: ${error.message}`);
      if (!data || data.length === 0) return null;

      const rows = data as PeriodMovementRow[];
      if (rows.every(r => r.net_amount === 0)) return null;

      return buildIncomeStatement(selectedOrgId, toDate, 'yearly', rows);
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Financial Ratios — derived from balance sheet, income statement, and portfolio data.
 */
export function useFinancialRatios() {
  const { selectedOrgId } = useOrganisation();
  const { data: balanceSheet } = useBalanceSheet();
  const { data: incomeStatement } = useIncomeStatement();
  const { data: parAging } = usePARAgingBuckets();

  return useQuery({
    queryKey: ['financial-ratios', selectedOrgId, !!balanceSheet, !!incomeStatement],
    queryFn: async (): Promise<FinancialRatios | null> => {
      if (!selectedOrgId || !balanceSheet || !incomeStatement) return null;

      const bs = balanceSheet;
      const is_ = incomeStatement;
      const totalAssets = bs.assets.total_assets || 1;
      const totalEquity = bs.equity.total_equity || 1;
      const grossPortfolio = bs.assets.current_assets.gross_loan_portfolio || 1;
      const operatingIncome = is_.gross_operating_income || 1;

      const totalFinExp = is_.interest_expense.total_interest_expense;
      const totalProvisions = is_.provisions.net_provision_expense;
      const totalOpEx = is_.operating_expenses.total_operating_expenses;
      const oss = (operatingIncome / (totalOpEx + totalFinExp + totalProvisions)) * 100;

      const par = parAging;

      return {
        org_id: selectedOrgId,
        report_date: bs.report_date,
        net_interest_margin: (is_.net_interest_income / totalAssets) * 100,
        operational_self_sufficiency: oss,
        return_on_assets: (is_.net_profit / totalAssets) * 100,
        return_on_equity: (is_.net_profit / totalEquity) * 100,
        cost_to_income_ratio: (totalOpEx / operatingIncome) * 100,
        cost_of_funds: totalFinExp > 0 ? (totalFinExp / (bs.liabilities.total_liabilities || 1)) * 100 : 0,
        yield_on_portfolio: (is_.interest_income.total_interest_income_cash / grossPortfolio) * 100,
        par_1_rate: par ? calculatePARRate(par.par_1_30.outstanding_balance, par.gross_portfolio) : 0,
        par_30_rate: par ? calculatePARRate(
          par.par_1_30.outstanding_balance + par.par_31_60.outstanding_balance +
          par.par_61_90.outstanding_balance + par.par_91_180.outstanding_balance +
          par.par_180_plus.outstanding_balance, par.gross_portfolio) : 0,
        par_60_rate: par ? calculatePARRate(
          par.par_31_60.outstanding_balance + par.par_61_90.outstanding_balance +
          par.par_91_180.outstanding_balance + par.par_180_plus.outstanding_balance, par.gross_portfolio) : 0,
        par_90_rate: par ? calculatePARRate(
          par.par_61_90.outstanding_balance + par.par_91_180.outstanding_balance +
          par.par_180_plus.outstanding_balance, par.gross_portfolio) : 0,
        par_180_rate: par ? calculatePARRate(par.par_180_plus.outstanding_balance, par.gross_portfolio) : 0,
        npl_ratio: par ? calculatePARRate(
          par.par_91_180.outstanding_balance + par.par_180_plus.outstanding_balance, par.gross_portfolio) : 0,
        provision_coverage_ratio: 0,
        write_off_ratio: 0,
        staff_productivity: 0,
        operating_expense_ratio: (totalOpEx / grossPortfolio) * 100,
        loan_officer_productivity: 0,
        current_ratio: bs.liabilities.current_liabilities.total_current_liabilities > 0
          ? bs.assets.current_assets.total_current_assets / bs.liabilities.current_liabilities.total_current_liabilities : 0,
        quick_ratio: bs.liabilities.current_liabilities.total_current_liabilities > 0
          ? bs.assets.current_assets.total_current_assets / bs.liabilities.current_liabilities.total_current_liabilities : 0,
        gearing_ratio: totalEquity > 0 ? bs.liabilities.total_liabilities / totalEquity : 0,
        debt_to_assets: totalAssets > 0 ? bs.liabilities.total_liabilities / totalAssets : 0,
        is_car_compliant: false,
        is_liquidity_compliant: false,
        is_oss_compliant: oss >= 100,
      };
    },
    enabled: !!selectedOrgId && !!balanceSheet && !!incomeStatement,
  });
}

/**
 * Cash Flow Forecast — derived from cash account movements + loan repayment schedule.
 */
export function useCashFlowForecast() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['cash-flow-forecast', selectedOrgId],
    queryFn: async (): Promise<CashFlowForecast | null> => {
      if (!selectedOrgId) return null;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const { data: tb, error: tbErr } = await supabase.rpc('get_trial_balance', {
        p_org_id: selectedOrgId,
        p_as_of_date: todayStr,
      });
      if (tbErr) throw new Error(`Failed to load cash flow: ${tbErr.message}`);
      if (!tb || tb.length === 0) return null;

      const rows = tb as TrialBalanceRow[];
      const cashOnHand = rows.find(r => r.report_mapping === 'CASH_ON_HAND')?.balance ?? 0;
      const cashAtBank = rows.find(r => r.report_mapping === 'CASH_AT_BANK')?.balance ?? 0;
      const openingCash = cashOnHand + cashAtBank;

      if (openingCash === 0 && rows.every(r => r.balance === 0)) return null;

      // Upcoming expected loan repayments (next 30 days)
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const { data: loans } = await supabase
        .from('loans')
        .select('outstanding_principal, expected_end_date')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);

      let expectedRepayments = 0;
      if (loans) {
        for (const loan of loans) {
          if (loan.expected_end_date) {
            const endDate = new Date(loan.expected_end_date);
            if (endDate >= today && endDate <= thirtyDaysLater) {
              expectedRepayments += loan.outstanding_principal ?? 0;
            }
          }
        }
      }

      // Estimate monthly opex from income statement
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const { data: movements } = await supabase.rpc('get_period_movements', {
        p_org_id: selectedOrgId,
        p_from_date: yearStart.toISOString().split('T')[0],
        p_to_date: todayStr,
      });

      let monthlyOpex = 0;
      if (movements) {
        const opexRows = (movements as PeriodMovementRow[]).filter(
          r => r.account_subtype === 'OPERATING_EXPENSE'
        );
        const totalOpex = opexRows.reduce((sum, r) => sum + (r.net_amount ?? 0), 0);
        const monthsElapsed = Math.max(1, today.getMonth() + 1);
        monthlyOpex = totalOpex / monthsElapsed;
      }

      const totalInflows = expectedRepayments;
      const totalOutflows = monthlyOpex;
      const netCashFlow = totalInflows - totalOutflows;
      const closingCash = openingCash + netCashFlow;
      const daysCashOnHand = monthlyOpex > 0 ? Math.round((closingCash / (monthlyOpex / 30)) * 10) / 10 : 999;

      return {
        org_id: selectedOrgId,
        forecast_date: todayStr,
        period: 'monthly',
        opening_cash_balance: openingCash,
        inflows: {
          loan_repayments_expected: expectedRepayments,
          interest_collections_expected: 0,
          fee_income_expected: 0,
          deposit_inflows: 0,
          borrowing_drawdowns: 0,
          other_inflows: 0,
          total_inflows: totalInflows,
        },
        outflows: {
          loan_disbursements_planned: 0,
          operating_expenses: monthlyOpex,
          loan_repayments_to_lenders: 0,
          deposit_withdrawals: 0,
          capital_expenditure: 0,
          other_outflows: 0,
          total_outflows: totalOutflows,
        },
        net_cash_flow: netCashFlow,
        closing_cash_balance: closingCash,
        days_cash_on_hand: daysCashOnHand,
        liquidity_gap: netCashFlow,
        is_liquidity_stressed: daysCashOnHand < 30,
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Deposit Concentration — computed from deposits table.
 */
export function useDepositConcentration() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['deposit-concentration', selectedOrgId],
    queryFn: async (): Promise<DepositConcentration | null> => {
      if (!selectedOrgId) return null;

      const { data: deposits, error } = await supabase
        .from('deposits')
        .select('deposit_id, client_id, deposit_type, balance, maturity_date')
        .eq('org_id', selectedOrgId)
        .eq('status', 'ACTIVE');

      if (error) throw new Error(`Failed to load deposit data: ${error.message}`);
      if (!deposits || deposits.length === 0) return null;

      const today = new Date();
      let demand = 0, time = 0, savings = 0, total = 0;
      let due7 = 0, due30 = 0, due90 = 0, dueOver90 = 0;
      const clientBalances = new Map<string, number>();

      for (const dep of deposits) {
        const bal = dep.balance ?? 0;
        total += bal;

        if (dep.deposit_type === 'DEMAND') demand += bal;
        else if (dep.deposit_type === 'TIME') time += bal;
        else if (dep.deposit_type === 'SAVINGS') savings += bal;

        if (dep.maturity_date) {
          const days = differenceInDays(new Date(dep.maturity_date), today);
          if (days <= 7) due7 += bal;
          else if (days <= 30) due30 += bal;
          else if (days <= 90) due90 += bal;
          else dueOver90 += bal;
        } else {
          due7 += bal;
        }

        const existing = clientBalances.get(dep.client_id) ?? 0;
        clientBalances.set(dep.client_id, existing + bal);
      }

      const sortedClients = Array.from(clientBalances.values()).sort((a, b) => b - a);
      const top10Value = sortedClients.slice(0, 10).reduce((s, v) => s + v, 0);
      const top20Value = sortedClients.slice(0, 20).reduce((s, v) => s + v, 0);
      const top10Pct = total > 0 ? (top10Value / total) * 100 : 0;
      const top20Pct = total > 0 ? (top20Value / total) * 100 : 0;

      const riskLevel: 'Low' | 'Medium' | 'High' =
        top10Pct > 50 ? 'High' : top10Pct > 30 ? 'Medium' : 'Low';

      return {
        org_id: selectedOrgId,
        report_date: today.toISOString().split('T')[0],
        top_10_depositors_value: top10Value,
        top_10_depositors_percentage: Math.round(top10Pct * 10) / 10,
        top_20_depositors_value: top20Value,
        top_20_depositors_percentage: Math.round(top20Pct * 10) / 10,
        demand_deposits: demand,
        time_deposits: time,
        savings_deposits: savings,
        total_deposits: total,
        deposits_due_7_days: due7,
        deposits_due_30_days: due30,
        deposits_due_90_days: due90,
        deposits_due_over_90_days: dueOver90,
        concentration_risk_level: riskLevel,
        deposit_volatility: 0,
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Income Quality — compares cash vs accrued interest income from accounting data.
 */
export function useIncomeQuality() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['income-quality', selectedOrgId],
    queryFn: async (): Promise<IncomeQuality | null> => {
      if (!selectedOrgId) return null;

      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);

      const { data, error } = await supabase.rpc('get_period_movements', {
        p_org_id: selectedOrgId,
        p_from_date: yearStart.toISOString().split('T')[0],
        p_to_date: today.toISOString().split('T')[0],
      });

      if (error) throw new Error(`Failed to load income quality: ${error.message}`);
      if (!data || data.length === 0) return null;

      const rows = data as PeriodMovementRow[];
      const cashInterest = rows.find(r => r.report_mapping === 'INT_ON_LOANS_CASH')?.net_amount ?? 0;
      const accruedInterest = rows.find(r => r.report_mapping === 'INT_ON_LOANS_ACCRUED')?.net_amount ?? 0;
      const totalInterest = cashInterest + accruedInterest;

      if (totalInterest === 0) return null;

      const accruedPct = (accruedInterest / totalInterest) * 100;
      const collectionRate = totalInterest > 0 ? (cashInterest / totalInterest) * 100 : 0;
      const phantomEstimate = accruedInterest * 0.3;
      const phantomPct = totalInterest > 0 ? (phantomEstimate / totalInterest) * 100 : 0;
      const qualityScore = Math.min(100, Math.max(0, collectionRate - phantomPct));

      return {
        org_id: selectedOrgId,
        report_date: today.toISOString().split('T')[0],
        interest_income_cash: cashInterest,
        interest_income_accrued: accruedInterest,
        accrued_income_percentage: Math.round(accruedPct * 10) / 10,
        phantom_income_estimate: Math.round(phantomEstimate),
        phantom_income_percentage: Math.round(phantomPct * 10) / 10,
        interest_collection_rate: Math.round(collectionRate * 10) / 10,
        income_from_par_30_plus: 0,
        income_from_par_90_plus: 0,
        at_risk_percentage: 0,
        income_quality_score: Math.round(qualityScore),
        is_income_reliable: qualityScore >= 70,
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Governance Risk — derived from activity audit log patterns.
 */
export function useGovernanceRisk() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['governance-risk', selectedOrgId],
    queryFn: async (): Promise<GovernanceRiskMetrics | null> => {
      if (!selectedOrgId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: auditLogs, error } = await supabase
        .from('activity_audit_log')
        .select('action_type, entity_type, created_at')
        .eq('org_id', selectedOrgId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw new Error(`Failed to load governance data: ${error.message}`);
      if (!auditLogs || auditLogs.length === 0) return null;

      const totalActions = auditLogs.length;
      const unauthorizedCount = auditLogs.filter(l => l.action_type === 'UNAUTHORIZED_ACCESS').length;
      const modificationCount = auditLogs.filter(l =>
        l.action_type === 'UPDATE' || l.action_type === 'DELETE'
      ).length;

      let riskScore = 100;
      if (unauthorizedCount > 0) riskScore -= unauthorizedCount * 10;
      if (modificationCount > totalActions * 0.5) riskScore -= 20;
      riskScore = Math.max(0, Math.min(100, riskScore));

      const riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' =
        riskScore >= 80 ? 'Low' : riskScore >= 60 ? 'Medium' : riskScore >= 40 ? 'High' : 'Critical';

      return {
        org_id: selectedOrgId,
        report_date: new Date().toISOString().split('T')[0],
        audit_findings: {
          total_findings: 0, high_priority_open: 0, medium_priority_open: 0,
          low_priority_open: 0, findings_closed_mtd: 0, avg_days_to_close: 0, overdue_findings: 0,
        },
        control_issues: {
          transactions_without_pv: 0, unreconciled_suspense_items: 0, suspense_items_value: 0,
          duplicate_entries: 0, unauthorized_transactions: unauthorizedCount, missing_signatures: 0,
        },
        fraud_risk: {
          suspected_fraud_cases: 0, confirmed_fraud_cases: 0, fraud_value: 0,
          cheque_discrepancies: 0, duplicate_cheques: 0, personal_name_withdrawals: 0,
        },
        cash_reconciliation: {
          unreconciled_items_count: 0, unreconciled_items_value: 0,
          days_unreconciled_avg: 0, last_reconciliation_date: '',
        },
        governance_health_score: riskScore,
        risk_level: riskLevel,
      };
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
