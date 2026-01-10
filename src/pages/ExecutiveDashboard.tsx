import { Wallet, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { BogClassificationTable } from '@/components/dashboard/BogClassificationTable';
import { useExecKpis, useBogClassification } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';

export default function ExecutiveDashboard() {
  const { selectedOrgId } = useOrganisation();
  const { data: kpis, isLoading: kpisLoading } = useExecKpis();
  const { data: bogData, isLoading: bogLoading } = useBogClassification();

  return (
    <div className="p-8">
      <header className="page-header">
        <h1 className="page-title">Executive Dashboard</h1>
        <p className="page-subtitle">Key performance indicators and portfolio health</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Gross Portfolio"
          value={kpis?.gross_portfolio ?? 0}
          format="currency"
          subtitle="Outstanding principal"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          variant="elevated"
        />
        <KPICard
          title="Active Loans"
          value={kpis?.active_loans ?? 0}
          format="number"
          subtitle="Currently disbursed"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <KPICard
          title="PAR 30+"
          value={kpis?.par_30_rate ?? 0}
          format="percent"
          subtitle={`GHS ${((kpis?.par_30_plus ?? 0) / 1000).toFixed(0)}k overdue`}
          icon={<AlertTriangle className="h-5 w-5 text-status-watch" />}
          trend={kpis?.par_30_rate && kpis.par_30_rate > 10 ? 'down' : 'neutral'}
          trendValue={kpis?.par_30_rate && kpis.par_30_rate > 10 ? 'Above target' : 'Within limits'}
        />
        <KPICard
          title="Provisions Required"
          value={kpis?.provisions_required ?? 0}
          format="currency"
          subtitle="Based on BOG classification"
          icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* BOG Classification Table */}
      <BogClassificationTable data={bogData ?? []} isLoading={bogLoading} />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="kpi-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Disbursed (All Time)</h3>
          <p className="text-2xl font-semibold">
            {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(kpis?.total_disbursed ?? 0)}
          </p>
        </div>
        <div className="kpi-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Repaid (All Time)</h3>
          <p className="text-2xl font-semibold">
            {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(kpis?.total_repaid ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
