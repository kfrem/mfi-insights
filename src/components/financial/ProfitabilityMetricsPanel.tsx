import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle } from 'lucide-react';
import { useFinancialRatios, useIncomeQuality, useDisbursementQuality } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';

const formatPercent = (val: number) => `${val.toFixed(1)}%`;
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  benchmark?: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
}

function MetricCard({ title, value, subtitle, benchmark, status = 'neutral', trend }: MetricCardProps) {
  const statusColors = {
    good: 'border-status-current bg-status-current/5',
    warning: 'border-yellow-500 bg-yellow-500/5',
    critical: 'border-status-loss bg-status-loss/5',
    neutral: 'border-border',
  };

  return (
    <Card className={statusColors[status]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          {title}
          {trend && (
            <span className={trend === 'up' ? 'text-status-current' : trend === 'down' ? 'text-status-loss' : 'text-muted-foreground'}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : trend === 'down' ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className={`text-2xl font-bold ${status === 'good' ? 'text-status-current' : status === 'critical' ? 'text-status-loss' : ''}`}>
          {value}
        </span>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {benchmark && <p className="text-xs text-muted-foreground mt-1">Benchmark: {benchmark}</p>}
      </CardContent>
    </Card>
  );
}

export function ProfitabilityMetricsPanel() {
  const { data: ratios, isLoading: ratiosLoading } = useFinancialRatios();
  const { data: incomeQuality, isLoading: iqLoading } = useIncomeQuality();
  const { data: disbQuality, isLoading: dqLoading } = useDisbursementQuality();

  if (ratiosLoading || iqLoading || dqLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Profitability Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Profitability Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ratios && (
            <>
              <MetricCard
                title="Net Interest Margin (NIM)"
                value={formatPercent(ratios.net_interest_margin)}
                subtitle="(Net Interest Income / Avg Earning Assets)"
                benchmark=">15%"
                status={ratios.net_interest_margin >= 15 ? 'good' : ratios.net_interest_margin >= 10 ? 'warning' : 'critical'}
                trend="up"
              />
              <MetricCard
                title="Operational Self-Sufficiency"
                value={formatPercent(ratios.operational_self_sufficiency)}
                subtitle="Operating Income / Total Costs"
                benchmark=">100%"
                status={ratios.operational_self_sufficiency >= 100 ? 'good' : ratios.operational_self_sufficiency >= 80 ? 'warning' : 'critical'}
                trend={ratios.operational_self_sufficiency >= 100 ? 'up' : 'down'}
              />
              <MetricCard
                title="Cost-to-Income Ratio"
                value={formatPercent(ratios.cost_to_income_ratio)}
                subtitle="Operating Expenses / Operating Income"
                benchmark="<60%"
                status={ratios.cost_to_income_ratio <= 60 ? 'good' : ratios.cost_to_income_ratio <= 75 ? 'warning' : 'critical'}
                trend={ratios.cost_to_income_ratio <= 60 ? 'up' : 'down'}
              />
              <MetricCard
                title="Cost of Funds"
                value={formatPercent(ratios.cost_of_funds)}
                subtitle="Interest Expense / Avg IBL"
                benchmark="<12%"
                status={ratios.cost_of_funds <= 12 ? 'good' : ratios.cost_of_funds <= 15 ? 'warning' : 'critical'}
              />
            </>
          )}
        </div>
      </div>

      {/* Return Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Return Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ratios && (
            <>
              <MetricCard
                title="Return on Assets (ROA)"
                value={formatPercent(ratios.return_on_assets)}
                benchmark=">2%"
                status={ratios.return_on_assets >= 2 ? 'good' : ratios.return_on_assets >= 1 ? 'warning' : 'critical'}
              />
              <MetricCard
                title="Return on Equity (ROE)"
                value={formatPercent(ratios.return_on_equity)}
                benchmark=">10%"
                status={ratios.return_on_equity >= 10 ? 'good' : ratios.return_on_equity >= 5 ? 'warning' : 'critical'}
              />
              <MetricCard
                title="Yield on Portfolio"
                value={formatPercent(ratios.yield_on_portfolio)}
                subtitle="Interest Income (Cash) / Avg Gross Portfolio"
                benchmark=">20%"
                status={ratios.yield_on_portfolio >= 20 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Operating Expense Ratio"
                value={formatPercent(ratios.operating_expense_ratio)}
                subtitle="OpEx / Avg Gross Portfolio"
                benchmark="<15%"
                status={ratios.operating_expense_ratio <= 15 ? 'good' : ratios.operating_expense_ratio <= 20 ? 'warning' : 'critical'}
              />
            </>
          )}
        </div>
      </div>

      {/* Income Quality Analysis */}
      {incomeQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Income Quality Analysis
              <Badge variant={incomeQuality.is_income_reliable ? 'default' : 'destructive'}>
                Score: {incomeQuality.income_quality_score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Cash vs Accrued Income</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Interest Income (Cash)</span>
                    <span className="font-medium text-status-current">{formatCurrency(incomeQuality.interest_income_cash)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Interest Income (Accrued)</span>
                    <span className="font-medium text-muted-foreground">{formatCurrency(incomeQuality.interest_income_accrued)}</span>
                  </div>
                  <Progress value={(incomeQuality.interest_income_cash / (incomeQuality.interest_income_cash + incomeQuality.interest_income_accrued)) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(100 - incomeQuality.accrued_income_percentage)} cash-based (target: &gt;85%)
                  </p>
                </div>
                
                {incomeQuality.phantom_income_percentage > 2 && (
                  <div className="bg-status-loss/10 border border-status-loss rounded-lg p-3">
                    <div className="flex items-center gap-2 text-status-loss font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Phantom Income Risk
                    </div>
                    <p className="text-sm mt-1">
                      Estimated {formatCurrency(incomeQuality.phantom_income_estimate)} ({formatPercent(incomeQuality.phantom_income_percentage)}) 
                      of accrued interest may be uncollectible (from NPLs).
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Collection Efficiency</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={incomeQuality.interest_collection_rate} className="h-3" />
                  </div>
                  <span className={`font-bold ${incomeQuality.interest_collection_rate >= 90 ? 'text-status-current' : 'text-status-loss'}`}>
                    {formatPercent(incomeQuality.interest_collection_rate)}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium">Income at Risk</h4>
                  <div className="flex justify-between text-sm">
                    <span>From PAR 30+ Loans</span>
                    <span className="text-yellow-600">{formatCurrency(incomeQuality.income_from_par_30_plus)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>From PAR 90+ Loans</span>
                    <span className="text-status-loss">{formatCurrency(incomeQuality.income_from_par_90_plus)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(incomeQuality.at_risk_percentage)} of interest income is at risk
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Quality */}
      {disbQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disbursement Quality (Not Just Volume)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{formatCurrency(disbQuality.total_disbursed)}</div>
                <div className="text-sm text-muted-foreground">Total Disbursed</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{disbQuality.disbursement_count}</div>
                <div className="text-sm text-muted-foreground">Loans Disbursed</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{formatCurrency(disbQuality.avg_loan_size)}</div>
                <div className="text-sm text-muted-foreground">Avg Loan Size</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{formatPercent(disbQuality.repeat_borrowers_percentage)}</div>
                <div className="text-sm text-muted-foreground">Repeat Borrowers</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Early Performance of Recent Disbursements</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PAR 30 of Q4 Disbursements</span>
                    <Badge variant={disbQuality.early_default_rate <= 3 ? 'default' : 'destructive'}>
                      {formatPercent(disbQuality.early_default_rate)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(disbQuality.par_30_of_recent_disbursements)} of recent loans already showing stress
                  </p>
                  {disbQuality.early_default_rate > 5 && (
                    <div className="bg-status-loss/10 border border-status-loss rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-status-loss mt-0.5" />
                      <span className="text-sm">High early default rate indicates poor credit quality at origination</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Risk Distribution of Disbursements</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-status-current"></span>
                      Low Risk
                    </span>
                    <span>{disbQuality.low_risk_disbursements} loans</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Medium Risk
                    </span>
                    <span>{disbQuality.medium_risk_disbursements} loans</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-status-loss"></span>
                      High Risk
                    </span>
                    <span>{disbQuality.high_risk_disbursements} loans</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Avg DTI at Disbursement</span>
                      <Badge variant={disbQuality.avg_dti_at_disbursement <= 40 ? 'default' : 'destructive'}>
                        {formatPercent(disbQuality.avg_dti_at_disbursement)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {disbQuality.disbursements_over_50_dti} loans disbursed with DTI &gt;50%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Efficiency Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Efficiency Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ratios && (
            <>
              <MetricCard
                title="Staff Productivity"
                value={`${ratios.staff_productivity.toFixed(0)} borrowers/officer`}
                benchmark="150-300"
                status={ratios.staff_productivity >= 100 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Loan Officer Productivity"
                value={formatCurrency(ratios.loan_officer_productivity)}
                subtitle="Portfolio per Officer"
                benchmark=">GHS 500,000"
                status={ratios.loan_officer_productivity >= 500000 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Write-off Ratio"
                value={formatPercent(ratios.write_off_ratio)}
                benchmark="<2%"
                status={ratios.write_off_ratio <= 2 ? 'good' : ratios.write_off_ratio <= 5 ? 'warning' : 'critical'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
