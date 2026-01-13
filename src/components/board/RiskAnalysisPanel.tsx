import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskMetrics } from '@/types/board';
import { AlertTriangle, Shield, Building, Globe, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useDrilldown } from '@/components/drilldown/DrilldownContext';
import { DrilldownConfig } from '@/components/drilldown/types';

interface RiskAnalysisPanelProps {
  data: RiskMetrics | undefined;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `GHS ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `GHS ${(value / 1000).toFixed(0)}K`;
  return `GHS ${value.toFixed(0)}`;
}

const COLORS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export function RiskAnalysisPanel({ data, isLoading }: RiskAnalysisPanelProps) {
  const drilldown = useDrilldown();

  const concentrationConfig: DrilldownConfig = {
    metricId: 'concentration_risk',
    title: 'Portfolio Concentration Risk',
    hasSource: true,
    sourceDescription: 'Top borrowers by outstanding principal',
    calculation: 'Sum of outstanding principal for top N borrowers / Total Gross Portfolio'
  };

  const sectorConfig: DrilldownConfig = {
    metricId: 'sector_concentration',
    title: 'Sector Concentration',
    hasSource: false,
    calculation: 'Outstanding principal by sector / Total Gross Portfolio'
  };

  const liquidityConfig: DrilldownConfig = {
    metricId: 'liquidity_risk',
    title: 'Liquidity Risk',
    hasSource: false,
    calculation: 'Funding Gap = (Assets maturing in 30 days) - (Liabilities maturing in 30 days)'
  };

  const operationalConfig: DrilldownConfig = {
    metricId: 'operational_risk',
    title: 'Operational Risk',
    hasSource: false,
    calculation: 'Aggregated from fraud incidents, system downtime, and customer complaints'
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Credit Risk */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Credit Risk
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concentration Risk */}
          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(concentrationConfig)}
          >
            <CardHeader>
              <CardTitle className="text-base">Portfolio Concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Top 10 Borrowers</span>
                    <span className={`underline decoration-dotted underline-offset-4 decoration-primary/40 ${data.concentration_top_10 > 15 ? 'text-red-500 font-medium' : ''}`}>
                      {data.concentration_top_10.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.concentration_top_10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Threshold: 15%</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Top 20 Borrowers</span>
                    <span className={`underline decoration-dotted underline-offset-4 decoration-primary/40 ${data.concentration_top_20 > 25 ? 'text-red-500 font-medium' : ''}`}>
                      {data.concentration_top_20.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.concentration_top_20} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Threshold: 25%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Concentration */}
          <Card 
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => drilldown.openDrilldown(sectorConfig)}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Sector Concentration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.sector_concentration}
                    dataKey="percentage"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ sector, percentage }) => `${percentage.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.sector_concentration.map((entry, index) => (
                      <Cell key={entry.sector} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Geographic Concentration */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.geographic_concentration} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="region" width={100} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Portfolio Share']} />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Liquidity & Operational Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liquidity Risk */}
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(liquidityConfig)}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Liquidity Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Gap</p>
                  <p className={`text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40 ${data.funding_gap < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {formatCurrency(data.funding_gap)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan-to-Deposit</p>
                  <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                    {data.loan_to_deposit_ratio.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Deposit Concentration (Top 10)</span>
                  <span className="underline decoration-dotted underline-offset-4 decoration-primary/40">
                    {data.deposit_concentration.toFixed(1)}%
                  </span>
                </div>
                <Progress value={data.deposit_concentration} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Risk */}
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(operationalConfig)}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Operational Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fraud Incidents</p>
                <p className="text-xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
                  {data.fraud_incidents}
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(data.fraud_amount)} total</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Downtime</p>
                <p className="text-xl font-bold">{data.system_downtime_hours} hrs</p>
                <p className="text-xs text-muted-foreground">This period</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Complaints</p>
                <p className="text-xl font-bold">{data.customer_complaints}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-xl font-bold text-emerald-600">{data.complaint_resolution_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Risk Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Interest Rate Sensitivity</p>
              <p className="text-2xl font-bold">{formatCurrency(data.interest_rate_sensitivity)}</p>
              <p className="text-xs text-muted-foreground">Impact of 1% rate change on NII</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Foreign Exchange Exposure</p>
              <p className="text-2xl font-bold">{formatCurrency(data.forex_exposure)}</p>
              <p className="text-xs text-muted-foreground">Net open position</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
