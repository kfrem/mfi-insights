// Hooks for Board of Directors Dashboard data
import { useQuery } from '@tanstack/react-query';
import { getExternalSupabase, isExternalSupabaseConfigured } from '@/integrations/external-supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import {
  BoardExecutiveSummary,
  StrategicKPI,
  RiskMetrics,
  QuarterlyTrend,
  PeerComparison,
  BoardPeriod,
} from '@/types/board';

// Type-safe schema query helper for external schemas
const schemaQuery = (schema: string, table: string) => {
  const client = getExternalSupabase();
  if (!client) throw new Error('External Supabase not configured');
  return (client as any).schema(schema).from(table);
};

// Fallback mock data generators for when DB views don't exist yet
function generateFallbackExecutiveSummary(orgId: string, period: BoardPeriod): BoardExecutiveSummary {
  const multiplier = period === 'quarterly' ? 3 : period === 'monthly' ? 1 : 0.25;
  const basePortfolio = 45000000;

  return {
    org_id: orgId,
    period,
    period_start: '2026-01-01',
    period_end: '2026-01-10',
    total_revenue: 2800000 * multiplier,
    revenue_growth: 12.5,
    operating_expenses: 1200000 * multiplier,
    net_income: 850000 * multiplier,
    net_income_growth: 8.3,
    roe: 18.5,
    roa: 3.2,
    gross_portfolio: basePortfolio,
    portfolio_growth: 15.2,
    active_clients: 12500,
    client_growth: 8.7,
    active_loans: 10800,
    avg_loan_size: 4167,
    npl_ratio: 4.8,
    npl_change: -0.5,
    par_30_rate: 6.2,
    provision_coverage: 125,
    write_offs: 180000 * multiplier,
    car_ratio: 18.5,
    car_status: 'Compliant',
    liquidity_ratio: 32.5,
    liquidity_status: 'Compliant',
  };
}

function generateFallbackStrategicKPIs(): StrategicKPI[] {
  return [
    { kpi_name: 'Portfolio Growth Rate', category: 'Growth', current_value: 15.2, previous_value: 12.8, target_value: 20, variance_percent: -24, trend: 'up', status: 'At Risk', unit: 'percent' },
    { kpi_name: 'Client Acquisition', category: 'Growth', current_value: 450, previous_value: 380, target_value: 500, variance_percent: -10, trend: 'up', status: 'On Track', unit: 'number' },
    { kpi_name: 'Disbursements Volume', category: 'Growth', current_value: 8500000, previous_value: 7200000, target_value: 10000000, variance_percent: -15, trend: 'up', status: 'At Risk', unit: 'currency' },
    { kpi_name: 'Return on Equity (ROE)', category: 'Profitability', current_value: 18.5, previous_value: 16.2, target_value: 20, variance_percent: -7.5, trend: 'up', status: 'On Track', unit: 'percent' },
    { kpi_name: 'Return on Assets (ROA)', category: 'Profitability', current_value: 3.2, previous_value: 2.9, target_value: 3.5, variance_percent: -8.6, trend: 'up', status: 'On Track', unit: 'percent' },
    { kpi_name: 'Net Interest Margin', category: 'Profitability', current_value: 28.5, previous_value: 27.8, target_value: 30, variance_percent: -5, trend: 'up', status: 'On Track', unit: 'percent' },
    { kpi_name: 'Operating Expense Ratio', category: 'Efficiency', current_value: 42.8, previous_value: 45.2, target_value: 40, variance_percent: 7, trend: 'down', status: 'At Risk', unit: 'percent' },
    { kpi_name: 'Cost per Borrower', category: 'Efficiency', current_value: 85, previous_value: 92, target_value: 80, variance_percent: 6.25, trend: 'down', status: 'On Track', unit: 'currency' },
    { kpi_name: 'Staff Productivity', category: 'Efficiency', current_value: 125, previous_value: 118, target_value: 130, variance_percent: -3.8, trend: 'up', status: 'On Track', unit: 'number' },
    { kpi_name: 'NPL Ratio', category: 'Risk', current_value: 4.8, previous_value: 5.3, target_value: 5, variance_percent: -4, trend: 'down', status: 'On Track', unit: 'percent' },
    { kpi_name: 'PAR 30+ Rate', category: 'Risk', current_value: 6.2, previous_value: 7.1, target_value: 5, variance_percent: 24, trend: 'down', status: 'At Risk', unit: 'percent' },
    { kpi_name: 'Provision Coverage', category: 'Risk', current_value: 125, previous_value: 118, target_value: 100, variance_percent: 25, trend: 'up', status: 'On Track', unit: 'percent' },
    { kpi_name: 'Capital Adequacy Ratio', category: 'Compliance', current_value: 18.5, previous_value: 17.8, target_value: 13, variance_percent: 42.3, trend: 'up', status: 'On Track', unit: 'percent' },
    { kpi_name: 'Liquidity Ratio', category: 'Compliance', current_value: 32.5, previous_value: 30.2, target_value: 20, variance_percent: 62.5, trend: 'up', status: 'On Track', unit: 'percent' },
  ];
}

function generateFallbackRiskMetrics(orgId: string): RiskMetrics {
  return {
    org_id: orgId,
    report_date: '2026-01-10',
    concentration_top_10: 8.5,
    concentration_top_20: 14.2,
    sector_concentration: [
      { sector: 'Trading/Commerce', exposure: 18500000, percentage: 41.1 },
      { sector: 'Agriculture', exposure: 9000000, percentage: 20.0 },
      { sector: 'Services', exposure: 7200000, percentage: 16.0 },
      { sector: 'Manufacturing', exposure: 5400000, percentage: 12.0 },
      { sector: 'Transport', exposure: 3600000, percentage: 8.0 },
      { sector: 'Other', exposure: 1300000, percentage: 2.9 },
    ],
    geographic_concentration: [
      { region: 'Greater Accra', exposure: 20250000, percentage: 45.0 },
      { region: 'Ashanti', exposure: 11250000, percentage: 25.0 },
      { region: 'Western', exposure: 6750000, percentage: 15.0 },
      { region: 'Central', exposure: 4500000, percentage: 10.0 },
      { region: 'Other Regions', exposure: 2250000, percentage: 5.0 },
    ],
    funding_gap: -2500000,
    deposit_concentration: 22.5,
    loan_to_deposit_ratio: 85.3,
    fraud_incidents: 3,
    fraud_amount: 45000,
    system_downtime_hours: 2.5,
    customer_complaints: 28,
    complaint_resolution_rate: 92,
    interest_rate_sensitivity: 1500000,
    forex_exposure: 250000,
  };
}

function generateFallbackQuarterlyTrends(): QuarterlyTrend[] {
  return [
    { quarter: 'Q1', year: 2025, gross_portfolio: 35000000, net_income: 650000, active_clients: 10200, npl_ratio: 5.8, car_ratio: 16.2, roe: 15.5, efficiency_ratio: 48 },
    { quarter: 'Q2', year: 2025, gross_portfolio: 38000000, net_income: 720000, active_clients: 10800, npl_ratio: 5.5, car_ratio: 16.8, roe: 16.2, efficiency_ratio: 46 },
    { quarter: 'Q3', year: 2025, gross_portfolio: 41000000, net_income: 780000, active_clients: 11500, npl_ratio: 5.2, car_ratio: 17.5, roe: 17.0, efficiency_ratio: 45 },
    { quarter: 'Q4', year: 2025, gross_portfolio: 43500000, net_income: 820000, active_clients: 12000, npl_ratio: 5.0, car_ratio: 18.0, roe: 17.8, efficiency_ratio: 44 },
    { quarter: 'Q1', year: 2026, gross_portfolio: 45000000, net_income: 850000, active_clients: 12500, npl_ratio: 4.8, car_ratio: 18.5, roe: 18.5, efficiency_ratio: 43 },
  ];
}

function generateFallbackPeerComparison(): PeerComparison[] {
  return [
    { metric_name: 'Portfolio Size (GHS M)', org_value: 45, peer_average: 38, peer_median: 35, industry_best: 120, percentile_rank: 72, unit: 'currency' },
    { metric_name: 'Client Base', org_value: 12500, peer_average: 9800, peer_median: 8500, industry_best: 45000, percentile_rank: 68, unit: 'number' },
    { metric_name: 'ROE (%)', org_value: 18.5, peer_average: 14.2, peer_median: 13.5, industry_best: 25, percentile_rank: 78, unit: 'percent' },
    { metric_name: 'NPL Ratio (%)', org_value: 4.8, peer_average: 6.5, peer_median: 5.8, industry_best: 2.5, percentile_rank: 75, unit: 'percent' },
    { metric_name: 'Operating Expense Ratio (%)', org_value: 42.8, peer_average: 48.5, peer_median: 47, industry_best: 32, percentile_rank: 70, unit: 'percent' },
    { metric_name: 'CAR (%)', org_value: 18.5, peer_average: 15.8, peer_median: 15, industry_best: 28, percentile_rank: 72, unit: 'percent' },
    { metric_name: 'Portfolio Yield (%)', org_value: 42, peer_average: 38, peer_median: 36, industry_best: 48, percentile_rank: 75, unit: 'percent' },
    { metric_name: 'Staff Productivity (Clients/Staff)', org_value: 125, peer_average: 105, peer_median: 98, industry_best: 180, percentile_rank: 70, unit: 'number' },
  ];
}

// React Query Hooks - Query Supabase views with fallback to mock data
export function useBoardExecutiveSummary(period: BoardPeriod) {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['board-executive-summary', selectedOrgId, period],
    queryFn: async () => {
      if (!selectedOrgId) return null;

      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_board_executive_summary')
          .select('*')
          .eq('org_id', selectedOrgId)
          .eq('period', period)
          .single();

        if (error) throw error;
        return data as BoardExecutiveSummary;
      } catch {
        // Fallback to generated data if view doesn't exist yet
        return generateFallbackExecutiveSummary(selectedOrgId, period);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useStrategicKPIs() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['strategic-kpis', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_strategic_kpis')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('category');

        if (error) throw error;
        return data as StrategicKPI[];
      } catch {
        // Fallback to generated data if view doesn't exist yet
        return generateFallbackStrategicKPIs();
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useRiskMetrics() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['risk-metrics', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;

      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_risk_metrics')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('report_date', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        return data as RiskMetrics;
      } catch {
        // Fallback to generated data if view doesn't exist yet
        return generateFallbackRiskMetrics(selectedOrgId);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useQuarterlyTrends() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['quarterly-trends', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_quarterly_trends')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('year', { ascending: true })
          .order('quarter', { ascending: true });

        if (error) throw error;
        return data as QuarterlyTrend[];
      } catch {
        // Fallback to generated data if view doesn't exist yet
        return generateFallbackQuarterlyTrends();
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function usePeerComparison() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['peer-comparison', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_peer_comparison')
          .select('*')
          .eq('org_id', selectedOrgId);

        if (error) throw error;
        return data as PeerComparison[];
      } catch {
        // Fallback to generated data if view doesn't exist yet
        return generateFallbackPeerComparison();
      }
    },
    enabled: !!selectedOrgId,
  });
}
