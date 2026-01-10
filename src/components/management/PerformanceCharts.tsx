import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCollectionsPerformance, useDisbursementPerformance } from '@/hooks/useManagementData';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const chartConfig = {
  target: {
    label: 'Target',
    color: 'hsl(var(--muted-foreground))',
  },
  actual: {
    label: 'Actual',
    color: 'hsl(var(--primary))',
  },
};

export function CollectionsChart() {
  const { data: collections, isLoading } = useCollectionsPerformance();

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (!collections || collections.length === 0) {
    return <div className="text-muted-foreground">No collections data available</div>;
  }

  // Calculate summary stats
  const totalTarget = collections.reduce((sum, c) => sum + c.target, 0);
  const totalActual = collections.reduce((sum, c) => sum + c.actual, 0);
  const overallRate = (totalActual / totalTarget) * 100;
  const avgDaily = totalActual / collections.length;

  // Format data for chart - show last 14 days
  const chartData = collections.slice(-14).map(c => ({
    date: format(parseISO(c.period), 'MMM d'),
    target: c.target,
    actual: c.actual,
    rate: c.rate,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Collections Performance</CardTitle>
          <Badge 
            variant="outline" 
            className={overallRate >= 90 ? 'bg-status-current/10 text-status-current' : overallRate >= 75 ? 'bg-status-watch/10 text-status-watch' : 'bg-status-loss/10 text-status-loss'}
          >
            {overallRate.toFixed(1)}% MTD
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">MTD Target</p>
            <p className="text-lg font-semibold">{formatCurrency(totalTarget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MTD Actual</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily</p>
            <p className="text-lg font-semibold">{formatCurrency(avgDaily)}</p>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={chartData}>
            <XAxis 
              dataKey="date" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted))"
              strokeDasharray="4 4"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DisbursementsChart() {
  const { data: disbursements, isLoading } = useDisbursementPerformance();

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (!disbursements || disbursements.length === 0) {
    return <div className="text-muted-foreground">No disbursement data available</div>;
  }

  // Calculate summary stats
  const totalTarget = disbursements.reduce((sum, d) => sum + d.target, 0);
  const totalActual = disbursements.reduce((sum, d) => sum + d.actual, 0);
  const totalLoans = disbursements.reduce((sum, d) => sum + d.loan_count, 0);
  const overallRate = (totalActual / totalTarget) * 100;
  const avgLoanSize = totalActual / totalLoans;

  // Format data for chart - show last 14 days
  const chartData = disbursements.slice(-14).map(d => ({
    date: format(parseISO(d.period), 'MMM d'),
    target: d.target,
    actual: d.actual,
    loans: d.loan_count,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Disbursement Performance</CardTitle>
          <Badge 
            variant="outline" 
            className={overallRate >= 90 ? 'bg-status-current/10 text-status-current' : overallRate >= 75 ? 'bg-status-watch/10 text-status-watch' : 'bg-status-loss/10 text-status-loss'}
          >
            {overallRate.toFixed(1)}% MTD
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">MTD Target</p>
            <p className="text-lg font-semibold">{formatCurrency(totalTarget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MTD Actual</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Loans</p>
            <p className="text-lg font-semibold">{totalLoans}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Size</p>
            <p className="text-lg font-semibold">{formatCurrency(avgLoanSize)}</p>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="date" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="target"
              fill="hsl(var(--muted))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="actual"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
