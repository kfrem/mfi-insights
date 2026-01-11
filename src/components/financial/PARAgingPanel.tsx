import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { usePARAgingBuckets } from '@/hooks/useFinancialData';
import { usePortfolioMetrics } from '@/hooks/useRegulatoryData';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const formatPercent = (val: number) => `${val.toFixed(2)}%`;

export function PARAgingPanel() {
  const { data: parAging, isLoading: parLoading } = usePARAgingBuckets();
  const { data: portfolioMetrics, isLoading: pmLoading } = usePortfolioMetrics();

  if (parLoading || pmLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const bucketColors = {
    current: '#22c55e',
    par_1_30: '#eab308',
    par_31_60: '#f97316',
    par_61_90: '#ef4444',
    par_91_180: '#dc2626',
    par_180_plus: '#991b1b',
  };

  const chartData = parAging ? [
    { name: 'Current', value: parAging.current.outstanding_balance, color: bucketColors.current },
    { name: '1-30', value: parAging.par_1_30.outstanding_balance, color: bucketColors.par_1_30 },
    { name: '31-60', value: parAging.par_31_60.outstanding_balance, color: bucketColors.par_31_60 },
    { name: '61-90', value: parAging.par_61_90.outstanding_balance, color: bucketColors.par_61_90 },
    { name: '91-180', value: parAging.par_91_180.outstanding_balance, color: bucketColors.par_91_180 },
    { name: '180+', value: parAging.par_180_plus.outstanding_balance, color: bucketColors.par_180_plus },
  ] : [];

  return (
    <div className="space-y-6">
      {/* PAR Summary Cards */}
      {parAging && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="border-status-current">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Current (0 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-status-current">{formatPercent(parAging.current.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.current.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.current.outstanding_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">PAR 1-30</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-yellow-600">{formatPercent(parAging.par_1_30.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.par_1_30.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.par_1_30.outstanding_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">PAR 31-60</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">{formatPercent(parAging.par_31_60.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.par_31_60.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.par_31_60.outstanding_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">PAR 61-90</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">{formatPercent(parAging.par_61_90.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.par_61_90.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.par_61_90.outstanding_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-red-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">PAR 91-180</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-700">{formatPercent(parAging.par_91_180.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.par_91_180.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.par_91_180.outstanding_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">PAR 180+</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-900">{formatPercent(parAging.par_180_plus.percentage)}</div>
                <p className="text-xs text-muted-foreground">{parAging.par_180_plus.loan_count} loans</p>
                <p className="text-xs font-medium">{formatCurrency(parAging.par_180_plus.outstanding_balance)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Early Warning Section */}
          <Card className={parAging.early_warning.deteriorating_trend ? 'border-status-loss' : 'border-yellow-500'}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Early Warning Indicators
                {parAging.early_warning.deteriorating_trend && (
                  <Badge variant="destructive">DETERIORATING TREND</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500">
                  <div className="text-2xl font-bold text-yellow-600">{parAging.early_warning.loans_1_7_days}</div>
                  <div className="text-sm text-muted-foreground">Loans 1-7 Days Overdue</div>
                  <p className="text-xs text-yellow-600 mt-1">First sign of trouble - requires immediate follow-up</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500">
                  <div className="text-2xl font-bold text-orange-600">{parAging.early_warning.loans_8_14_days}</div>
                  <div className="text-sm text-muted-foreground">Loans 8-14 Days Overdue</div>
                  <p className="text-xs text-orange-600 mt-1">Escalate to supervisor</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500">
                  <div className="text-2xl font-bold text-red-600">{parAging.early_warning.loans_15_30_days}</div>
                  <div className="text-sm text-muted-foreground">Loans 15-30 Days Overdue</div>
                  <p className="text-xs text-red-600 mt-1">Pre-NPL category</p>
                </div>
                <div className={`p-4 rounded-lg border ${parAging.early_warning.weekly_change < 0 ? 'bg-status-current/10 border-status-current' : 'bg-status-loss/10 border-status-loss'}`}>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${parAging.early_warning.weekly_change < 0 ? 'text-status-current' : 'text-status-loss'}`}>
                    {parAging.early_warning.weekly_change < 0 ? <TrendingDown /> : <TrendingUp />}
                    {Math.abs(parAging.early_warning.weekly_change)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Weekly PAR Change</div>
                  <p className="text-xs mt-1">{parAging.early_warning.weekly_change < 0 ? 'Improving' : 'Deteriorating'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PAR Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Portfolio Aging Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `GHS ${(val / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Portfolio Quality Metrics */}
      {portfolioMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Quality Metrics (CGAP/BoG Standard)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">PAR Rates</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PAR 1+</span>
                    <Badge variant="secondary">{formatPercent(portfolioMetrics.par_1_rate)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PAR 30+</span>
                    <Badge variant={portfolioMetrics.par_30_rate <= 5 ? 'default' : 'destructive'}>
                      {formatPercent(portfolioMetrics.par_30_rate)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PAR 60+</span>
                    <Badge variant={portfolioMetrics.par_60_rate <= 3 ? 'default' : 'destructive'}>
                      {formatPercent(portfolioMetrics.par_60_rate)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PAR 90+ (NPL)</span>
                    <Badge variant={portfolioMetrics.par_90_rate <= 2 ? 'default' : 'destructive'}>
                      {formatPercent(portfolioMetrics.par_90_rate)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">BoG Classification</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current</span>
                    <span className="font-medium">{portfolioMetrics.current_loans}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Substandard</span>
                    <span className="font-medium text-yellow-600">{portfolioMetrics.substandard_loans}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Doubtful</span>
                    <span className="font-medium text-orange-600">{portfolioMetrics.doubtful_loans}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Loss</span>
                    <span className="font-medium text-status-loss">{portfolioMetrics.loss_loans}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Provisions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Provisions</span>
                    <span className="font-medium">{formatCurrency(portfolioMetrics.total_provisions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Coverage Ratio</span>
                    <Badge variant={portfolioMetrics.provision_coverage_ratio >= 100 ? 'default' : 'destructive'}>
                      {formatPercent(portfolioMetrics.provision_coverage_ratio)}
                    </Badge>
                  </div>
                </div>
                <Progress value={Math.min(portfolioMetrics.provision_coverage_ratio, 150)} max={150} className="h-2" />
                <p className="text-xs text-muted-foreground">Target: 100% coverage of NPL</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Portfolio Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Loans</span>
                    <span className="font-bold">{portfolioMetrics.total_loans}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gross Portfolio</span>
                    <span className="font-bold">{formatCurrency(portfolioMetrics.gross_portfolio)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NPL Ratio (PAR90+)</span>
                    <Badge variant={portfolioMetrics.npl_ratio <= 5 ? 'default' : 'destructive'}>
                      {formatPercent(portfolioMetrics.npl_ratio)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
