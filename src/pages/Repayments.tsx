import { useRepaymentDaily } from '@/hooks/useMfiData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportRepaymentsCSV, exportToPDF } from '@/lib/export';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const formatCompact = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(val);

export default function Repayments() {
  const { data: repayments, isLoading } = useRepaymentDaily();

  const totalAmount = repayments?.reduce((sum, r) => sum + r.total_amount, 0) ?? 0;
  const totalPayments = repayments?.reduce((sum, r) => sum + r.payment_count, 0) ?? 0;
  const avgDaily = repayments && repayments.length > 0 ? totalAmount / repayments.length : 0;

  const chartData = repayments?.map((r) => ({
    ...r,
    date: format(parseISO(r.payment_date), 'MMM dd'),
  })) ?? [];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header with Export */}
      <header className="page-header flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="page-title">Repayments</h1>
          <p className="page-subtitle">Daily collection trends over the last 60 days</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => repayments && exportRepaymentsCSV(repayments)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToPDF('repayments-table', 'Daily Repayments Report')}>
              <FileText className="h-4 w-4 mr-2" />
              Export Table as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="kpi-card">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Collected (60 days)</p>
          <p className="text-lg md:text-2xl font-semibold mt-1 truncate">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Payments</p>
          <p className="text-lg md:text-2xl font-semibold mt-1">{totalPayments.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">Avg. Daily Collection</p>
          <p className="text-lg md:text-2xl font-semibold mt-1 truncate">{formatCurrency(avgDaily)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="kpi-card mb-6 md:mb-8">
        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Daily Collection Trend</h3>
        {isLoading ? (
          <div className="h-48 md:h-72 bg-muted animate-pulse rounded" />
        ) : (
          <div className="h-48 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_amount"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Breakdown Table */}
      <div className="kpi-card">
        <h3 className="text-base md:text-lg font-semibold mb-4">Daily Breakdown</h3>
        <div className="table-responsive max-h-80 md:max-h-96 overflow-y-auto">
          <table id="repayments-table" className="data-table min-w-[400px]">
            <thead className="sticky top-0 bg-card">
              <tr>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Payments</th>
              </tr>
            </thead>
            <tbody>
              {[...(repayments ?? [])].reverse().map((r) => (
                <tr key={r.payment_date}>
                  <td className="text-sm">{format(parseISO(r.payment_date), 'MMM dd yyyy')}</td>
                  <td className="text-right font-medium text-sm">{formatCurrency(r.total_amount)}</td>
                  <td className="text-right text-sm">{r.payment_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
