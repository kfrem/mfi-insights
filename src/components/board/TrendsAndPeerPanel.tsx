import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuarterlyTrend, PeerComparison } from '@/types/board';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { TrendingUp, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/export';

interface TrendsPanelProps {
  trendsData: QuarterlyTrend[] | undefined;
  peerData: PeerComparison[] | undefined;
  isLoading: boolean;
}

function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'currency':
      return value >= 1 ? `${value.toFixed(0)}M` : `${(value * 1000).toFixed(0)}K`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
}

export function TrendsAndPeerPanel({ trendsData, peerData, isLoading }: TrendsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trendsData || !peerData) return null;

  const chartData = trendsData.map(t => ({
    name: `${t.quarter} ${t.year}`,
    portfolio: t.gross_portfolio / 1000000,
    income: t.net_income / 1000000,
    clients: t.active_clients / 1000,
    npl: t.npl_ratio,
    car: t.car_ratio,
    roe: t.roe,
  }));

  const handleExportTrends = () => {
    const exportData = trendsData.map(t => ({
      quarter: `${t.quarter} ${t.year}`,
      gross_portfolio: t.gross_portfolio,
      net_income: t.net_income,
      active_clients: t.active_clients,
      npl_ratio: `${t.npl_ratio}%`,
      car_ratio: `${t.car_ratio}%`,
      roe: `${t.roe}%`,
    }));
    
    exportToCSV(exportData, 'quarterly-trends', [
      { key: 'quarter', header: 'Quarter' },
      { key: 'gross_portfolio', header: 'Gross Portfolio (GHS)' },
      { key: 'net_income', header: 'Net Income (GHS)' },
      { key: 'active_clients', header: 'Active Clients' },
      { key: 'npl_ratio', header: 'NPL Ratio' },
      { key: 'car_ratio', header: 'CAR' },
      { key: 'roe', header: 'ROE' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Quarterly Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quarterly Performance Trends
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportTrends}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio & Income Trend */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Portfolio & Net Income (GHS M)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="portfolio" stroke="hsl(var(--primary))" strokeWidth={2} name="Portfolio (M)" />
                  <Line yAxisId="right" type="monotone" dataKey="income" stroke="hsl(var(--accent))" strokeWidth={2} name="Net Income (M)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Ratios Trend */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Key Ratios (%)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 25]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={13} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Min CAR" />
                  <Line type="monotone" dataKey="car" stroke="#2563eb" strokeWidth={2} name="CAR" />
                  <Line type="monotone" dataKey="roe" stroke="#059669" strokeWidth={2} name="ROE" />
                  <Line type="monotone" dataKey="npl" stroke="#dc2626" strokeWidth={2} name="NPL" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peer Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Comparison Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparison Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peerData.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="metric_name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="org_value" fill="hsl(var(--primary))" name="Your MFI" radius={[0, 4, 4, 0]} />
                <Bar dataKey="peer_average" fill="hsl(var(--muted-foreground))" name="Peer Avg" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Comparison Table */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Your MFI</TableHead>
                    <TableHead className="text-right">Peer Avg</TableHead>
                    <TableHead className="text-right">Best</TableHead>
                    <TableHead className="text-right">%ile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peerData.map(peer => (
                    <TableRow key={peer.metric_name}>
                      <TableCell className="font-medium text-sm">{peer.metric_name}</TableCell>
                      <TableCell className="text-right font-semibold">{formatValue(peer.org_value, peer.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatValue(peer.peer_average, peer.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatValue(peer.industry_best, peer.unit)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${peer.percentile_rank >= 75 ? 'text-emerald-600' : peer.percentile_rank >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {peer.percentile_rank}th
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
