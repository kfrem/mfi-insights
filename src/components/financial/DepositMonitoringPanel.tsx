import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, AlertTriangle, TrendingDown, PieChart, Clock } from 'lucide-react';
import { useDepositConcentration, useCashFlowForecast } from '@/hooks/useFinancialData';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DepositMonitoringPanel() {
  const { data: deposits, isLoading: depositsLoading } = useDepositConcentration();
  const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlowForecast();

  const formatCurrency = (amount: number) => {
    return `GH₵${(amount / 1000000).toFixed(2)}M`;
  };

  if (depositsLoading || cashFlowLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading deposit data...</div>;
  }

  if (!deposits || !cashFlow) {
    return <div className="text-center py-8 text-muted-foreground">No deposit data available</div>;
  }

  // Prepare pie chart data for deposit types
  const depositTypeData = [
    { name: 'Demand Deposits', value: deposits.demand_deposits },
    { name: 'Time Deposits', value: deposits.time_deposits },
    { name: 'Savings Deposits', value: deposits.savings_deposits },
  ];

  // Prepare pie chart data for maturity profile
  const maturityData = [
    { name: 'Due < 7 days', value: deposits.deposits_due_7_days },
    { name: 'Due 7-30 days', value: deposits.deposits_due_30_days - deposits.deposits_due_7_days },
    { name: 'Due 30-90 days', value: deposits.deposits_due_90_days - deposits.deposits_due_30_days },
    { name: 'Due > 90 days', value: deposits.deposits_due_over_90_days },
  ].filter(d => d.value > 0);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Low':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Low Risk</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium Risk</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-700 border-red-200">High Risk</Badge>;
      default:
        return null;
    }
  };

  // Calculate liquidity reserve ratio (liquid assets / deposits)
  const liquidAssets = cashFlow.closing_cash_balance;
  const liquidityReserveRatio = (liquidAssets / deposits.total_deposits) * 100;
  const isLiquidityAdequate = liquidityReserveRatio >= 10; // BoG typically requires 10%+

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(deposits.total_deposits)}</p>
          </CardContent>
        </Card>

        <Card className={!isLiquidityAdequate ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Liquidity Reserve Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${!isLiquidityAdequate ? 'text-red-600' : 'text-green-600'}`}>
              {liquidityReserveRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Requirement: ≥10%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Days Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cashFlow.days_cash_on_hand}</p>
            <p className="text-xs text-muted-foreground">
              Based on current outflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Concentration Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getRiskBadge(deposits.concentration_risk_level)}
            <p className="text-xs text-muted-foreground mt-1">
              Top 10: {deposits.top_10_depositors_percentage.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Concentration Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Deposit Type Breakdown
            </CardTitle>
            <CardDescription>Distribution by deposit category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={depositTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {depositTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Maturity Profile
            </CardTitle>
            <CardDescription>When deposits become due for withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={maturityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {maturityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Concentration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Depositor Concentration Analysis
          </CardTitle>
          <CardDescription>
            High concentration indicates dependency on few large depositors - a liquidity risk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Top 10 Depositors</span>
                <span className="text-sm font-mono">{deposits.top_10_depositors_percentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={deposits.top_10_depositors_percentage} 
                className={`h-3 ${deposits.top_10_depositors_percentage > 40 ? '[&>div]:bg-red-500' : deposits.top_10_depositors_percentage > 25 ? '[&>div]:bg-yellow-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Value: {formatCurrency(deposits.top_10_depositors_value)} | Threshold: &lt;25% (Good), 25-40% (Monitor), &gt;40% (High Risk)
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Top 20 Depositors</span>
                <span className="text-sm font-mono">{deposits.top_20_depositors_percentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={deposits.top_20_depositors_percentage} 
                className={`h-3 ${deposits.top_20_depositors_percentage > 60 ? '[&>div]:bg-red-500' : deposits.top_20_depositors_percentage > 40 ? '[&>div]:bg-yellow-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Value: {formatCurrency(deposits.top_20_depositors_value)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Deposit Volatility</p>
              <p className="text-lg font-semibold">{deposits.deposit_volatility.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Monthly coefficient of variation</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Within 7 Days</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(deposits.deposits_due_7_days)}</p>
              <p className="text-xs text-muted-foreground">Immediate liquidity requirement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Compliance Note */}
      {!isLiquidityAdequate && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Liquidity Reserve Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Your liquidity reserve ratio of {liquidityReserveRatio.toFixed(1)}% is below the 
              Bank of Ghana minimum requirement of 10%. Immediate action is required to increase 
              liquid assets or reduce short-term deposit liabilities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
