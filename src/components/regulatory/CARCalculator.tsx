import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCapitalAdequacy } from '@/hooks/useRegulatoryData';
import { exportCARToExcel } from '@/lib/exportExcel';
import { exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function CARCalculator() {
  const { data: car, isLoading } = useCapitalAdequacy();

  const handleExportExcel = () => car && exportCARToExcel(car);
  const handleExportPDF = () => exportToPDF('car-report', 'Capital Adequacy Ratio Report');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!car) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6" id="car-report">
      {/* CAR Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={car.is_compliant ? 'border-status-current' : 'border-status-loss'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capital Adequacy Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${car.is_compliant ? 'text-status-current' : 'text-status-loss'}`}>
                {car.car_ratio.toFixed(2)}%
              </span>
              {car.is_compliant ? (
                <CheckCircle className="h-6 w-6 text-status-current" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-status-loss" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum required: {car.minimum_requirement}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adjusted Capital Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{formatCurrency(car.adjusted_capital_base)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk-Weighted Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{formatCurrency(car.total_rwa)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={car.is_compliant ? 'default' : 'destructive'} className="text-sm">
              {car.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
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
              Export CAR Report
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

      {/* Tier I Capital */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tier I Capital</CardTitle>
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
                <td>Paid-up Capital (Equity Shares)</td>
                <td className="text-right">{formatCurrency(car.tier_one.paid_up_capital)}</td>
              </tr>
              <tr>
                <td>Statutory Reserves</td>
                <td className="text-right">{formatCurrency(car.tier_one.statutory_reserves)}</td>
              </tr>
              <tr>
                <td>General Reserves</td>
                <td className="text-right">{formatCurrency(car.tier_one.general_reserves)}</td>
              </tr>
              <tr>
                <td>Special Reserves</td>
                <td className="text-right">{formatCurrency(car.tier_one.special_reserves)}</td>
              </tr>
              <tr>
                <td>Disclosed Reserves</td>
                <td className="text-right">{formatCurrency(car.tier_one.disclosed_reserves)}</td>
              </tr>
              <tr className="border-t-2">
                <td className="font-medium">Gross Tier I Capital</td>
                <td className="text-right font-medium">
                  {formatCurrency(
                    car.tier_one.paid_up_capital +
                    car.tier_one.statutory_reserves +
                    car.tier_one.general_reserves +
                    car.tier_one.special_reserves +
                    car.tier_one.disclosed_reserves
                  )}
                </td>
              </tr>
              <tr className="text-status-loss">
                <td>Less: Goodwill & Intangibles</td>
                <td className="text-right">({formatCurrency(car.tier_one.goodwill_intangibles)})</td>
              </tr>
              <tr className="text-status-loss">
                <td>Less: Losses Not Provided For</td>
                <td className="text-right">({formatCurrency(car.tier_one.losses_not_provided)})</td>
              </tr>
              <tr className="text-status-loss">
                <td>Less: Investments in Subsidiaries</td>
                <td className="text-right">({formatCurrency(car.tier_one.investments_subsidiaries)})</td>
              </tr>
              <tr className="text-status-loss">
                <td>Less: Investments in Other Banks/FI</td>
                <td className="text-right">({formatCurrency(car.tier_one.investments_other_banks)})</td>
              </tr>
              <tr className="text-status-loss">
                <td>Less: Connected Lending (Long-term)</td>
                <td className="text-right">({formatCurrency(car.tier_one.connected_lending)})</td>
              </tr>
              <tr className="bg-muted font-semibold">
                <td>ADJUSTED TIER I CAPITAL</td>
                <td className="text-right">{formatCurrency(car.adjusted_tier_one)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tier II Capital */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tier II Capital</CardTitle>
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
                <td>Undisclosed Reserves (Unaudited Y-T-D Profit)</td>
                <td className="text-right">{formatCurrency(car.tier_two.undisclosed_reserves)}</td>
              </tr>
              <tr>
                <td>Revaluation Reserves - Property (Limited to 50%)</td>
                <td className="text-right">{formatCurrency(car.tier_two.revaluation_reserves)}</td>
              </tr>
              <tr>
                <td>Subordinated Term Debt (Max 50% of Tier I)</td>
                <td className="text-right">{formatCurrency(car.tier_two.subordinated_debt)}</td>
              </tr>
              <tr>
                <td>Hybrid Capital</td>
                <td className="text-right">{formatCurrency(car.tier_two.hybrid_capital)}</td>
              </tr>
              <tr>
                <td>Deposits for Shares & Other Allowed Capital</td>
                <td className="text-right">{formatCurrency(car.tier_two.deposits_for_shares)}</td>
              </tr>
              <tr className="border-t-2">
                <td className="font-medium">Total Tier II Capital</td>
                <td className="text-right font-medium">{formatCurrency(car.total_tier_two)}</td>
              </tr>
              <tr className="bg-muted font-semibold">
                <td>CAPPED TIER II (≤100% of Tier I)</td>
                <td className="text-right">{formatCurrency(car.capped_tier_two)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* CAR Calculation Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">CAR Calculation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              CAR = Adjusted Capital Base ÷ Risk-Weighted Assets × 100
            </p>
            <p className="text-lg font-mono">
              CAR = {formatCurrency(car.adjusted_capital_base)} ÷ {formatCurrency(car.total_rwa)} × 100
            </p>
            <p className={`text-4xl font-bold mt-4 ${car.is_compliant ? 'text-status-current' : 'text-status-loss'}`}>
              = {car.car_ratio.toFixed(2)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
