import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BoardExecutiveSummary, BoardPeriod } from '@/types/board';
import { TrendingUp, TrendingDown, Users, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useDrilldown } from '@/components/drilldown/DrilldownContext';
import { DrilldownConfig } from '@/components/drilldown/types';
import { PortfolioDrilldown, ActiveLoansDrilldown, PARDrilldown, ProvisionsDrilldown } from '@/components/drilldown/views';

interface ExecutiveSummaryPanelProps {
  data: BoardExecutiveSummary | undefined;
  isLoading: boolean;
  period: BoardPeriod;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `GHS ${(value / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function TrendIndicator({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  
  return (
    <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon className="h-4 w-4" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function ComplianceBadge({ status }: { status: 'Compliant' | 'Watch' | 'Non-Compliant' }) {
  const variant = status === 'Compliant' ? 'default' : status === 'Watch' ? 'secondary' : 'destructive';
  return <Badge variant={variant}>{status}</Badge>;
}

export function ExecutiveSummaryPanel({ data, isLoading, period }: ExecutiveSummaryPanelProps) {
  const drilldown = useDrilldown();

  // Drilldown configurations
  const portfolioConfig: DrilldownConfig = {
    metricId: 'gross_portfolio',
    title: 'Gross Portfolio',
    hasSource: true,
    sourceDescription: 'All active loans in the portfolio',
    calculation: 'Sum of outstanding_principal for all ACTIVE and DISBURSED loans',
    component: <PortfolioDrilldown />
  };

  const activeLoansConfig: DrilldownConfig = {
    metricId: 'active_loans',
    title: 'Active Loans',
    hasSource: true,
    sourceDescription: 'All currently disbursed loans',
    calculation: 'Count of loans with status = ACTIVE or DISBURSED',
    component: <ActiveLoansDrilldown />
  };

  const parConfig: DrilldownConfig = {
    metricId: 'par_30',
    title: 'PAR 30+ Rate',
    hasSource: true,
    sourceDescription: 'Loans with payments overdue by 30+ days',
    calculation: '(Outstanding principal of loans with days_overdue >= 30) / Gross Portfolio',
    component: <PARDrilldown />
  };

  const provisionConfig: DrilldownConfig = {
    metricId: 'provision_coverage',
    title: 'Provision Coverage',
    hasSource: true,
    sourceDescription: 'Loan loss provisions relative to at-risk portfolio',
    calculation: 'Total Provisions / PAR 30+ Portfolio',
    component: <ProvisionsDrilldown />
  };

  const revenueConfig: DrilldownConfig = {
    metricId: 'total_revenue',
    title: 'Total Revenue',
    hasSource: false,
    calculation: 'Interest Income (Cash) + Fees & Charges + Other Operating Income'
  };

  const netIncomeConfig: DrilldownConfig = {
    metricId: 'net_income',
    title: 'Net Income',
    hasSource: false,
    calculation: 'Total Revenue - Operating Expenses - Provision Expenses - Interest Expenses - Tax'
  };

  const roeConfig: DrilldownConfig = {
    metricId: 'roe',
    title: 'Return on Equity',
    hasSource: false,
    calculation: '(Net Income / Average Shareholders Equity) × 100'
  };

  const roaConfig: DrilldownConfig = {
    metricId: 'roa',
    title: 'Return on Assets',
    hasSource: false,
    calculation: '(Net Income / Average Total Assets) × 100'
  };

  const nplConfig: DrilldownConfig = {
    metricId: 'npl_ratio',
    title: 'NPL Ratio',
    hasSource: true,
    sourceDescription: 'Non-performing loans (90+ days overdue)',
    calculation: '(Outstanding principal of loans with days_overdue >= 90) / Gross Portfolio'
  };

  const carConfig: DrilldownConfig = {
    metricId: 'car_ratio',
    title: 'Capital Adequacy Ratio',
    hasSource: false,
    calculation: '(Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets × 100'
  };

  const liquidityConfig: DrilldownConfig = {
    metricId: 'liquidity_ratio',
    title: 'Liquidity Ratio',
    hasSource: false,
    calculation: 'Liquid Assets / Short-Term Liabilities × 100'
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const periodLabel = period === 'weekly' ? 'Week' : period === 'monthly' ? 'Month' : 'Quarter';

  return (
    <div className="space-y-6">
      {/* Financial Highlights */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Financial Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(revenueConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {formatCurrency(data.total_revenue)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.revenue_growth} />
                <span className="text-xs text-muted-foreground">vs last {periodLabel.toLowerCase()}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(netIncomeConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {formatCurrency(data.net_income)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.net_income_growth} />
                <span className="text-xs text-muted-foreground">growth</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(roeConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {formatPercent(data.roe)}
              </div>
              <span className="text-xs text-muted-foreground">Return on Equity</span>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(roaConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {formatPercent(data.roa)}
              </div>
              <span className="text-xs text-muted-foreground">Return on Assets</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portfolio Highlights */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Portfolio Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(portfolioConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {formatCurrency(data.gross_portfolio)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.portfolio_growth} />
                <span className="text-xs text-muted-foreground">growth</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.active_clients.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.client_growth} />
                <span className="text-xs text-muted-foreground">growth</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(activeLoansConfig)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                {data.active_loans.toLocaleString()}
              </div>
              <span className="text-xs text-muted-foreground">Currently disbursed</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Loan Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.avg_loan_size)}</div>
              <span className="text-xs text-muted-foreground">Per borrower</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Asset Quality & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-watch" />
            Asset Quality
          </h3>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="space-y-1 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => drilldown.openDrilldown(nplConfig)}
                >
                  <p className="text-sm text-muted-foreground">NPL Ratio</p>
                  <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                    {formatPercent(data.npl_ratio)}
                  </p>
                  <TrendIndicator value={data.npl_change} inverse />
                </div>
                <div 
                  className="space-y-1 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => drilldown.openDrilldown(parConfig)}
                >
                  <p className="text-sm text-muted-foreground">PAR 30+</p>
                  <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                    {formatPercent(data.par_30_rate)}
                  </p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => drilldown.openDrilldown(provisionConfig)}
                >
                  <p className="text-sm text-muted-foreground">Provision Coverage</p>
                  <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                    {formatPercent(data.provision_coverage)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Write-offs ({periodLabel})</p>
                  <p className="text-xl font-bold">{formatCurrency(data.write_offs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Regulatory Compliance
          </h3>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="space-y-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => drilldown.openDrilldown(carConfig)}
                >
                  <p className="text-sm text-muted-foreground">Capital Adequacy Ratio</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                      {formatPercent(data.car_ratio)}
                    </p>
                    <ComplianceBadge status={data.car_status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum: 13%</p>
                </div>
                <div 
                  className="space-y-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => drilldown.openDrilldown(liquidityConfig)}
                >
                  <p className="text-sm text-muted-foreground">Liquidity Ratio</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                      {formatPercent(data.liquidity_ratio)}
                    </p>
                    <ComplianceBadge status={data.liquidity_status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum: 20%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
