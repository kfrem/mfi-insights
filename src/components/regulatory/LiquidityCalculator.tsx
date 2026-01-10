import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, Droplets } from 'lucide-react';
import { useLiquidityRatio } from '@/hooks/useRegulatoryData';
import { exportLiquidityToExcel } from '@/lib/exportExcel';
import { exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function LiquidityCalculator() {
  const { data: liquidity, isLoading } = useLiquidityRatio();

  const handleExportExcel = () => liquidity && exportLiquidityToExcel(liquidity);
  const handleExportPDF = () => exportToPDF('liquidity-report', 'Liquidity Ratio Report');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!liquidity) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  const liquidityProgress = Math.min(liquidity.liquidity_ratio, 200);

  return (
    <div className="space-y-6" id="liquidity-report">
      {/* Liquidity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={liquidity.is_compliant ? 'border-status-current' : 'border-status-loss'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Liquidity Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${liquidity.is_compliant ? 'text-status-current' : 'text-status-loss'}`}>
                {liquidity.liquidity_ratio.toFixed(2)}%
              </span>
              {liquidity.is_compliant ? (
                <CheckCircle className="h-6 w-6 text-status-current" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-status-loss" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum required: {liquidity.minimum_requirement}%
            </p>
            <Progress value={liquidityProgress / 2} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Liquid Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-primary">{formatCurrency(liquidity.total_liquid_assets)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{formatCurrency(liquidity.total_current_liabilities)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={liquidity.is_compliant ? 'default' : 'destructive'} className="text-sm">
              {liquidity.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Liquidity Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liquid Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">Liquid Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cash on Hand</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.cash_on_hand)}</td>
                </tr>
                <tr>
                  <td>Balances with BoG (CRR deposits)</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.balances_bog)}</td>
                </tr>
                <tr>
                  <td>Balances with Other Banks</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.balances_other_banks)}</td>
                </tr>
                <tr>
                  <td>Balances with Other FIs</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.balances_other_fi)}</td>
                </tr>
                <tr>
                  <td>GoG Securities (T-Bills, Bonds)</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.gog_securities)}</td>
                </tr>
                <tr>
                  <td>Interbank Placements (due ≤30 days)</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.interbank_placements_30d)}</td>
                </tr>
                <tr>
                  <td>Placements with Other FI (due ≤30 days)</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.placements_other_fi_30d)}</td>
                </tr>
                <tr>
                  <td>Inter-Affiliate Placements</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.inter_affiliate_placements)}</td>
                </tr>
                <tr>
                  <td>Other Liquid Assets (BoG approved)</td>
                  <td className="text-right">{formatCurrency(liquidity.liquid_assets.other_liquid_assets)}</td>
                </tr>
                <tr className="bg-muted font-semibold">
                  <td>TOTAL LIQUID ASSETS</td>
                  <td className="text-right">{formatCurrency(liquidity.total_liquid_assets)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Current Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Liabilities (Due &lt;12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deposits from the Public</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.deposits_from_public)}</td>
                </tr>
                <tr>
                  <td>Interbank Borrowings</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.interbank_borrowings)}</td>
                </tr>
                <tr>
                  <td>Inter-Affiliate Borrowings</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.inter_affiliate_borrowings)}</td>
                </tr>
                <tr>
                  <td>Other Short-term Borrowings</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.other_short_term_borrowings)}</td>
                </tr>
                <tr>
                  <td>Net Contingent Liabilities</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.net_contingent_liabilities)}</td>
                </tr>
                <tr>
                  <td>Other Current Liabilities</td>
                  <td className="text-right">{formatCurrency(liquidity.current_liabilities.other_current_liabilities)}</td>
                </tr>
                <tr className="bg-muted font-semibold">
                  <td>TOTAL CURRENT LIABILITIES</td>
                  <td className="text-right">{formatCurrency(liquidity.total_current_liabilities)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Liquidity Calculation Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Liquidity Ratio Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Liquidity Ratio = Total Liquid Assets ÷ Total Current Liabilities × 100
            </p>
            <p className="text-lg font-mono">
              Liquidity Ratio = {formatCurrency(liquidity.total_liquid_assets)} ÷ {formatCurrency(liquidity.total_current_liabilities)} × 100
            </p>
            <p className={`text-4xl font-bold mt-4 ${liquidity.is_compliant ? 'text-status-current' : 'text-status-loss'}`}>
              = {liquidity.liquidity_ratio.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              BoG Minimum Requirement: 10%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
