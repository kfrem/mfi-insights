import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { classifyLoanByDaysOverdue, calculateProvision, calculatePARRate, calculateCAR, calculateLiquidityRatio } from '@/lib/financial';
import { buildCARInputs, buildLiquidityInputs, type TrialBalanceRow } from '@/lib/accountingMappings';
import type {
  CapitalAdequacyRatio,
  LiquidityRatio,
  PrudentialReturnSummary,
  PortfolioMetrics,
  TransactionReport,
} from '@/types/regulatory';
import { differenceInDays } from '@/lib/dateUtils';

// ─── Hooks that compute from real loan data ──────────────────────────────────

/**
 * Computes portfolio metrics (PAR rates, loan classification, provisions)
 * directly from the loans table.
 */
export function usePortfolioMetrics() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['portfolio-metrics', selectedOrgId],
    queryFn: async (): Promise<PortfolioMetrics | null> => {
      if (!selectedOrgId) return null;

      const { data: loans, error } = await supabase
        .from('loans')
        .select('loan_id, principal, outstanding_principal, status, expected_end_date, disbursement_date')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);

      if (error) throw new Error(`Failed to load portfolio metrics: ${error.message}`);
      if (!loans || loans.length === 0) return null;

      const today = new Date();
      let gross_portfolio = 0;
      let par_1_plus = 0;
      let par_30_plus = 0;
      let par_60_plus = 0;
      let par_90_plus = 0;
      let par_180_plus = 0;
      let current_loans = 0;
      let substandard_loans = 0;
      let doubtful_loans = 0;
      let loss_loans = 0;
      let total_provisions = 0;

      for (const loan of loans) {
        const balance = loan.outstanding_principal ?? loan.principal ?? 0;
        gross_portfolio += balance;

        const daysOverdue = loan.expected_end_date
          ? Math.max(0, differenceInDays(today, new Date(loan.expected_end_date)))
          : 0;

        const bucket = classifyLoanByDaysOverdue(daysOverdue);
        total_provisions += calculateProvision(balance, bucket);

        if (daysOverdue >= 1) par_1_plus += balance;
        if (daysOverdue >= 30) par_30_plus += balance;
        if (daysOverdue >= 60) par_60_plus += balance;
        if (daysOverdue >= 90) par_90_plus += balance;
        if (daysOverdue >= 180) par_180_plus += balance;

        if (bucket === 'Current' || bucket === 'OLEM') current_loans++;
        else if (bucket === 'Substandard') substandard_loans++;
        else if (bucket === 'Doubtful') doubtful_loans++;
        else if (bucket === 'Loss') loss_loans++;
      }

      const npl_balance = par_90_plus;
      const provision_coverage = npl_balance > 0 ? (total_provisions / npl_balance) * 100 : 0;

      return {
        org_id: selectedOrgId,
        report_date: today.toISOString().split('T')[0],
        total_loans: loans.length,
        gross_portfolio,
        par_1_plus,
        par_30_plus,
        par_60_plus,
        par_90_plus,
        par_180_plus,
        par_1_rate: calculatePARRate(par_1_plus, gross_portfolio),
        par_30_rate: calculatePARRate(par_30_plus, gross_portfolio),
        par_60_rate: calculatePARRate(par_60_plus, gross_portfolio),
        par_90_rate: calculatePARRate(par_90_plus, gross_portfolio),
        par_180_rate: calculatePARRate(par_180_plus, gross_portfolio),
        current_loans,
        substandard_loans,
        doubtful_loans,
        loss_loans,
        total_provisions: Math.round(total_provisions),
        provision_coverage_ratio: Math.round(provision_coverage * 10) / 10,
        npl_ratio: calculatePARRate(npl_balance, gross_portfolio),
      };
    },
    enabled: !!selectedOrgId,
  });
}

// ─── Hooks that compute from accounting data ─────────────────────────────────

/**
 * Capital Adequacy Ratio — computed from equity and asset accounts
 * in the chart of accounts, tagged with car_category.
 */
export function useCapitalAdequacy() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['capital-adequacy', selectedOrgId],
    queryFn: async (): Promise<CapitalAdequacyRatio | null> => {
      if (!selectedOrgId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_trial_balance', {
        p_org_id: selectedOrgId,
        p_as_of_date: today,
      });

      if (error) throw new Error(`Failed to load CAR data: ${error.message}`);
      if (!data || data.length === 0) return null;

      const rows = data as TrialBalanceRow[];
      if (rows.every(r => r.balance === 0)) return null;

      const { tier_one, tier_two, rwa } = buildCARInputs(rows);
      const result = calculateCAR(tier_one, tier_two, rwa, 10);

      return {
        org_id: selectedOrgId,
        report_date: today,
        tier_one,
        tier_two,
        risk_weighted_assets: rwa,
        adjusted_tier_one: result.adjusted_tier_one,
        total_tier_two: result.total_tier_two,
        capped_tier_two: result.capped_tier_two,
        adjusted_capital_base: result.adjusted_capital_base,
        total_rwa: result.total_rwa,
        car_ratio: result.car_ratio,
        is_compliant: result.is_compliant,
        minimum_requirement: 10,
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Liquidity Ratio — computed from liquid asset and current liability accounts
 * tagged with liquidity_category.
 */
export function useLiquidityRatio() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['liquidity-ratio', selectedOrgId],
    queryFn: async (): Promise<LiquidityRatio | null> => {
      if (!selectedOrgId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_trial_balance', {
        p_org_id: selectedOrgId,
        p_as_of_date: today,
      });

      if (error) throw new Error(`Failed to load liquidity data: ${error.message}`);
      if (!data || data.length === 0) return null;

      const rows = data as TrialBalanceRow[];
      if (rows.every(r => r.balance === 0)) return null;

      const { liquid_assets, current_liabilities } = buildLiquidityInputs(rows);
      const result = calculateLiquidityRatio(liquid_assets, current_liabilities, 10);

      return {
        org_id: selectedOrgId,
        report_date: today,
        liquid_assets,
        current_liabilities,
        total_liquid_assets: result.total_liquid_assets,
        total_current_liabilities: result.total_current_liabilities,
        liquidity_ratio: result.liquidity_ratio,
        is_compliant: result.is_compliant,
        minimum_requirement: 10,
      };
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Prudential Returns — tracking submission status.
 * Returns empty array until a submissions tracking table is created.
 */
export function usePrudentialReturns() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['prudential-returns', selectedOrgId],
    queryFn: async (): Promise<PrudentialReturnSummary[]> => {
      if (!selectedOrgId) return [];
      return [];
    },
    enabled: !!selectedOrgId,
  });
}

/**
 * Transaction Reports (CTR/STR) for AML compliance.
 * Returns empty array until a dedicated AML reporting table is created.
 */
export function useTransactionReports() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['transaction-reports', selectedOrgId],
    queryFn: async (): Promise<TransactionReport[]> => {
      if (!selectedOrgId) return [];
      return [];
    },
    enabled: !!selectedOrgId,
  });
}

// ─── Combined hook ───────────────────────────────────────────────────────────

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
