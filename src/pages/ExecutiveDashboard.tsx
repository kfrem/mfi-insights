import { Wallet, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { BogClassificationTable } from '@/components/dashboard/BogClassificationTable';
import { RefreshIndicator } from '@/components/dashboard/RefreshIndicator';
import { useExecKpis, useBogClassification } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { DrilldownConfig } from '@/components/drilldown/types';
import { 
  PortfolioDrilldown, 
  ActiveLoansDrilldown, 
  PARDrilldown, 
  ProvisionsDrilldown 
} from '@/components/drilldown/views';

export default function ExecutiveDashboard() {
  const { selectedOrgId } = useOrganisation();
  const { data: kpis, isLoading: kpisLoading } = useExecKpis();
  const { data: bogData, isLoading: bogLoading } = useBogClassification();

  const portfolioDrilldown: DrilldownConfig = {
    metricId: 'gross_portfolio',
    title: 'Gross Portfolio Breakdown',
    hasSource: true,
    calculation: 'Σ outstanding_principal WHERE status IN (ACTIVE, DISBURSED)',
    sourceDescription: 'Sum of outstanding principal for all active and disbursed loans',
    component: <PortfolioDrilldown />,
  };

  const activeLoansDrilldown: DrilldownConfig = {
    metricId: 'active_loans',
    title: 'Active Loans',
    hasSource: true,
    calculation: 'COUNT(*) WHERE status IN (ACTIVE, DISBURSED)',
    sourceDescription: 'All currently active and disbursed loans',
    component: <ActiveLoansDrilldown />,
  };

  const parDrilldown: DrilldownConfig = {
    metricId: 'par_30',
    title: 'PAR 30+ Loans',
    hasSource: true,
    calculation: '(Σ overdue_principal / Σ total_outstanding) × 100',
    sourceDescription: 'Loans with payments overdue by 30 days or more',
    component: <PARDrilldown />,
  };

  const provisionsDrilldown: DrilldownConfig = {
    metricId: 'provisions',
    title: 'Provisions by BOG Classification',
    hasSource: true,
    calculation: 'Based on BOG provisioning rates: Current 1%, OLEM 5%, Substandard 25%, Doubtful 50%, Loss 100%',
    sourceDescription: 'Loan loss provisions calculated per Bank of Ghana guidelines',
    component: <ProvisionsDrilldown />,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">Key performance indicators and portfolio health</p>
          </div>
          <RefreshIndicator />
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <KPICard
          title="Gross Portfolio"
          value={kpis?.gross_portfolio ?? 0}
          format="currency"
          subtitle="Outstanding principal"
          icon={<Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
          variant="elevated"
          drilldownConfig={portfolioDrilldown}
        />
        <KPICard
          title="Active Loans"
          value={kpis?.active_loans ?? 0}
          format="number"
          subtitle="Currently disbursed"
          icon={<Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />}
          drilldownConfig={activeLoansDrilldown}
        />
        <KPICard
          title="PAR 30+"
          value={kpis?.par_30_rate ?? 0}
          format="percent"
          subtitle={`GHS ${((kpis?.par_30_plus ?? 0) / 1000).toFixed(0)}k overdue`}
          icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-status-watch" />}
          trend={kpis?.par_30_rate && kpis.par_30_rate > 10 ? 'down' : 'neutral'}
          trendValue={kpis?.par_30_rate && kpis.par_30_rate > 10 ? 'Above target' : 'Within limits'}
          drilldownConfig={parDrilldown}
        />
        <KPICard
          title="Provisions Required"
          value={kpis?.provisions_required ?? 0}
          format="currency"
          subtitle="Based on BOG classification"
          icon={<ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />}
          drilldownConfig={provisionsDrilldown}
        />
      </div>

      {/* BOG Classification Table */}
      <div className="table-responsive">
        <BogClassificationTable data={bogData ?? []} isLoading={bogLoading} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="kpi-card">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Total Disbursed (All Time)</h3>
          <p className="text-lg md:text-2xl font-semibold truncate">
            {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(kpis?.total_disbursed ?? 0)}
          </p>
        </div>
        <div className="kpi-card">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Total Repaid (All Time)</h3>
          <p className="text-lg md:text-2xl font-semibold truncate">
            {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(kpis?.total_repaid ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
