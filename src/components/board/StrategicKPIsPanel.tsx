import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StrategicKPI } from '@/types/board';
import { TrendingUp, TrendingDown, Minus, Target, TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface StrategicKPIsPanelProps {
  data: StrategicKPI[] | undefined;
  isLoading: boolean;
}

function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'currency':
      if (value >= 1000000) return `GHS ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `GHS ${(value / 1000).toFixed(0)}K`;
      return `GHS ${value.toFixed(0)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: 'On Track' | 'At Risk' | 'Off Track' }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    'On Track': 'default',
    'At Risk': 'secondary',
    'Off Track': 'destructive',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Growth: 'bg-blue-100 text-blue-800',
    Profitability: 'bg-emerald-100 text-emerald-800',
    Efficiency: 'bg-purple-100 text-purple-800',
    Risk: 'bg-amber-100 text-amber-800',
    Compliance: 'bg-teal-100 text-teal-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
      {category}
    </span>
  );
}

export function StrategicKPIsPanel({ data, isLoading }: StrategicKPIsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const handleExportCSV = () => {
    const exportData = data.map(kpi => ({
      kpi_name: kpi.kpi_name,
      category: kpi.category,
      current_value: formatValue(kpi.current_value, kpi.unit),
      target_value: formatValue(kpi.target_value, kpi.unit),
      variance_percent: `${kpi.variance_percent.toFixed(1)}%`,
      status: kpi.status,
    }));
    
    exportToCSV(exportData, 'strategic-kpis', [
      { key: 'kpi_name', header: 'KPI Name' },
      { key: 'category', header: 'Category' },
      { key: 'current_value', header: 'Current' },
      { key: 'target_value', header: 'Target' },
      { key: 'variance_percent', header: 'Variance' },
      { key: 'status', header: 'Status' },
    ]);
  };

  // Group by category
  const categories = ['Growth', 'Profitability', 'Efficiency', 'Risk', 'Compliance'];
  const groupedKPIs = categories.map(cat => ({
    category: cat,
    kpis: data.filter(k => k.category === cat),
  }));

  const onTrackCount = data.filter(k => k.status === 'On Track').length;
  const atRiskCount = data.filter(k => k.status === 'At Risk').length;
  const offTrackCount = data.filter(k => k.status === 'Off Track').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">On Track</p>
                <p className="text-3xl font-bold text-emerald-800">{onTrackCount}</p>
              </div>
              <Target className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">At Risk</p>
                <p className="text-3xl font-bold text-amber-800">{atRiskCount}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Off Track</p>
                <p className="text-3xl font-bold text-red-800">{offTrackCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic KPIs Dashboard
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToPDF('strategic-kpis-table', 'Strategic KPIs Report')}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div id="strategic-kpis-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedKPIs.map(group => (
                  group.kpis.map((kpi, idx) => (
                    <TableRow key={kpi.kpi_name}>
                      <TableCell className="font-medium">{kpi.kpi_name}</TableCell>
                      <TableCell><CategoryBadge category={kpi.category} /></TableCell>
                      <TableCell className="text-right font-semibold">{formatValue(kpi.current_value, kpi.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatValue(kpi.previous_value, kpi.unit)}</TableCell>
                      <TableCell className="text-right">{formatValue(kpi.target_value, kpi.unit)}</TableCell>
                      <TableCell className={`text-right ${kpi.variance_percent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {kpi.variance_percent >= 0 ? '+' : ''}{kpi.variance_percent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center"><TrendIcon trend={kpi.trend} /></TableCell>
                      <TableCell className="text-center"><StatusBadge status={kpi.status} /></TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
