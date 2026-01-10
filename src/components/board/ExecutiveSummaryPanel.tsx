import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BoardExecutiveSummary, BoardPeriod } from '@/types/board';
import { TrendingUp, TrendingDown, Users, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';

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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.revenue_growth} />
                <span className="text-xs text-muted-foreground">vs last {periodLabel.toLowerCase()}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.net_income)}</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={data.net_income_growth} />
                <span className="text-xs text-muted-foreground">growth</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(data.roe)}</div>
              <span className="text-xs text-muted-foreground">Return on Equity</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(data.roa)}</div>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.gross_portfolio)}</div>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.active_loans.toLocaleString()}</div>
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
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">NPL Ratio</p>
                  <p className="text-xl font-bold">{formatPercent(data.npl_ratio)}</p>
                  <TrendIndicator value={data.npl_change} inverse />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">PAR 30+</p>
                  <p className="text-xl font-bold">{formatPercent(data.par_30_rate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Provision Coverage</p>
                  <p className="text-xl font-bold">{formatPercent(data.provision_coverage)}</p>
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
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Capital Adequacy Ratio</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold">{formatPercent(data.car_ratio)}</p>
                    <ComplianceBadge status={data.car_status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum: 13%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Liquidity Ratio</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold">{formatPercent(data.liquidity_ratio)}</p>
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
