import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RejectionAnalysis } from '@/types/departmental';
import { AlertTriangle, TrendingDown, Building, Package } from 'lucide-react';

interface RejectionAnalysisChartsProps {
  data: RejectionAnalysis;
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--muted-foreground))'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

export default function RejectionAnalysisCharts({ data }: RejectionAnalysisChartsProps) {
  const pieData = data.reasons.map((r, idx) => ({
    name: r.reason_description,
    value: r.count,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Total Rejections</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{data.total_rejections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Amount Declined</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data.total_amount_declined)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Top Rejection Reason</p>
            </div>
            <p className="text-lg font-bold">{data.reasons[0]?.reason_description}</p>
            <p className="text-xs text-muted-foreground">{data.reasons[0]?.percentage.toFixed(1)}% of rejections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Avg Amount/Rejection</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data.total_amount_declined / data.total_rejections)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rejection Reasons Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rejection Reasons Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} applications`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rejection Reasons Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rejection Reasons Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.reasons.map((reason, idx) => (
              <div key={reason.reason_code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{reason.reason_description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{reason.count}</Badge>
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {formatCurrency(reason.amount_declined)}
                    </span>
                  </div>
                </div>
                <Progress value={reason.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rejection by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Rejection Rate by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.rejection_by_product} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="product" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Rejection Rate']}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rejection by Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Rejection Rate by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.rejection_by_branch} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="branch" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Rejection Rate']}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
