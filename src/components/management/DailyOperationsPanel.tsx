import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyMetrics, useTargetVsActual } from '@/hooks/useManagementData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Wallet, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { useDrilldown } from '@/components/drilldown/DrilldownContext';
import { DrilldownConfig } from '@/components/drilldown/types';
import { CollectionsDrilldown, DisbursementsDrilldown } from '@/components/drilldown/views';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function DailyOperationsPanel() {
  const { data: metrics, isLoading } = useDailyMetrics();
  const { data: targets } = useTargetVsActual();
  const drilldown = useDrilldown();

  const collectionsConfig: DrilldownConfig = {
    metricId: 'daily_collections',
    title: "Today's Collections",
    hasSource: true,
    sourceDescription: 'All repayments collected today',
    calculation: 'Sum of all repayment amounts with payment_date = today',
    component: <CollectionsDrilldown />
  };

  const disbursementsConfig: DrilldownConfig = {
    metricId: 'daily_disbursements',
    title: "Today's Disbursements",
    hasSource: true,
    sourceDescription: 'All loans disbursed today',
    calculation: 'Sum of disbursed_amount where disbursement_date = today',
    component: <DisbursementsDrilldown />
  };

  const arrearsRecoveryConfig: DrilldownConfig = {
    metricId: 'arrears_recovery',
    title: 'Arrears Recovery',
    hasSource: true,
    sourceDescription: 'Payments received from loans that were in arrears',
    calculation: 'Sum of repayments on loans with days_overdue > 0'
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-status-current';
    if (rate >= 75) return 'bg-status-watch';
    return 'bg-status-loss';
  };

  return (
    <div className="space-y-6">
      {/* Today's Date Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Live Dashboard
        </Badge>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Collections */}
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(collectionsConfig)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Today's Collections</span>
              <Target className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
              {formatCurrency(metrics.collections_actual)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Target: {formatCurrency(metrics.collections_target)}
              </span>
              <Badge 
                variant="outline" 
                className={metrics.collections_rate >= 90 ? 'bg-status-current/10 text-status-current' : metrics.collections_rate >= 75 ? 'bg-status-watch/10 text-status-watch' : 'bg-status-loss/10 text-status-loss'}
              >
                {metrics.collections_rate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.collections_rate} className="mt-2 h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{metrics.payments_received} payments</span>
              <span>{metrics.clients_visited} visits</span>
            </div>
          </CardContent>
        </Card>

        {/* Disbursements */}
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(disbursementsConfig)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Today's Disbursements</span>
              <Wallet className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
              {formatCurrency(metrics.disbursement_actual)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Target: {formatCurrency(metrics.disbursement_target)}
              </span>
              <Badge 
                variant="outline" 
                className={metrics.disbursement_rate >= 90 ? 'bg-status-current/10 text-status-current' : metrics.disbursement_rate >= 75 ? 'bg-status-watch/10 text-status-watch' : 'bg-status-loss/10 text-status-loss'}
              >
                {metrics.disbursement_rate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.disbursement_rate} className="mt-2 h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{metrics.loans_disbursed} loans</span>
              <span>{metrics.applications_approved} approved</span>
            </div>
          </CardContent>
        </Card>

        {/* Arrears Recovery */}
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(arrearsRecoveryConfig)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Arrears Recovery</span>
              <Users className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
              {formatCurrency(metrics.arrears_recovered)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Total Arrears: {formatCurrency(metrics.total_arrears)}
              </span>
              <Badge variant="outline" className="bg-muted">
                {metrics.recovery_rate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.recovery_rate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>


      {/* Target vs Actual Table */}
      {targets && targets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target vs Actual Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Daily Target</th>
                  <th className="text-right">Daily Actual</th>
                  <th className="text-right">Weekly</th>
                  <th className="text-right">Monthly</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => (
                  <tr key={t.metric}>
                    <td className="font-medium">{t.metric}</td>
                    <td className="text-right text-muted-foreground">
                      {t.metric.includes('Collection') || t.metric.includes('Disbursement') 
                        ? formatCurrency(t.daily_target) 
                        : t.daily_target}
                    </td>
                    <td className="text-right">
                      <span className={t.daily_actual >= t.daily_target ? 'text-status-current' : 'text-status-loss'}>
                        {t.metric.includes('Collection') || t.metric.includes('Disbursement') 
                          ? formatCurrency(t.daily_actual) 
                          : t.daily_actual}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={t.weekly_actual >= t.weekly_target ? 'text-status-current' : 'text-status-loss'}>
                          {Math.round((t.weekly_actual / t.weekly_target) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={t.monthly_actual >= t.monthly_target ? 'text-status-current' : 'text-status-loss'}>
                          {Math.round((t.monthly_actual / t.monthly_target) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {t.trend === 'up' ? (
                        <div className="flex items-center gap-1 text-status-current">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">Up</span>
                        </div>
                      ) : t.trend === 'down' ? (
                        <div className="flex items-center gap-1 text-status-loss">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs">Down</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Minus className="h-4 w-4" />
                          <span className="text-xs">Stable</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
