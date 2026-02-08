import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { classifyLoanByDaysOverdue, calculateProvision, calculatePARRate } from '@/lib/financial';
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
 * directly from the loans table. No mock data.
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

// ─── Hooks that require accounting tables (not yet in schema) ────────────────
//
// CAR, Liquidity, Prudential Returns, and CTR/STR require accounting data
// (chart of accounts, journal entries, capital structure, liquid assets)
// that doesn't exist in the current database schema.
//
// These hooks return null until the accounting tables are created.
// The pure calculation functions in src/lib/financial.ts are ready to use
// once the data inputs are available.

export function useCapitalAdequacy() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['capital-adequacy', selectedOrgId],
    queryFn: async (): Promise<CapitalAdequacyRatio | null> => {
      if (!selectedOrgId) return null;
      // CAR requires Tier I/II capital components and risk-weighted asset data
      // which need dedicated accounting tables. Return null until available.
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useLiquidityRatio() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['liquidity-ratio', selectedOrgId],
    queryFn: async (): Promise<LiquidityRatio | null> => {
      if (!selectedOrgId) return null;
      // Liquidity ratio requires liquid asset and current liability breakdowns
      // which need dedicated accounting tables. Return null until available.
      return null;
    },
    enabled: !!selectedOrgId,
  });
}

export function usePrudentialReturns() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['prudential-returns', selectedOrgId],
    queryFn: async (): Promise<PrudentialReturnSummary[]> => {
      if (!selectedOrgId) return [];
      // Prudential returns tracking needs a submissions table. Return empty until available.
      return [];
    },
    enabled: !!selectedOrgId,
  });
}

export function useTransactionReports() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['transaction-reports', selectedOrgId],
    queryFn: async (): Promise<TransactionReport[]> => {
      if (!selectedOrgId) return [];
      // CTR/STR reports need a dedicated AML transaction reporting table. Return empty until available.
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
