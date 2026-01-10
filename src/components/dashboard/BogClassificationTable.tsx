import { BogClassification } from '@/types/mfi';
import { BogBucketBadge } from './BogBucketBadge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { exportBogClassificationCSV, exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BogClassificationTableProps {
  data: BogClassification[];
  isLoading?: boolean;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function BogClassificationTable({ data, isLoading }: BogClassificationTableProps) {
  if (isLoading) {
    return (
      <div className="kpi-card">
        <h3 className="text-lg font-semibold mb-4">BOG Classification Summary</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const totalOutstanding = data.reduce((sum, row) => sum + row.outstanding_balance, 0);
  const totalProvisions = data.reduce((sum, row) => sum + row.provision_amount, 0);

  const handleExportCSV = () => exportBogClassificationCSV(data, 'org');
  const handleExportPDF = () => exportToPDF('bog-table', 'BOG Classification of Advances');

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">BOG Classification of Advances</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={data.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto" id="bog-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Classification</th>
              <th className="text-right">Loans</th>
              <th className="text-right">Outstanding</th>
              <th className="text-right">Provision %</th>
              <th className="text-right">Provision Amt</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.bog_bucket}>
                <td>
                  <BogBucketBadge bucket={row.bog_bucket} />
                </td>
                <td className="text-right font-medium">{row.loan_count}</td>
                <td className="text-right">{formatCurrency(row.outstanding_balance)}</td>
                <td className="text-right">{(row.provision_rate * 100).toFixed(0)}%</td>
                <td className="text-right">{formatCurrency(row.provision_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td>Total</td>
              <td className="text-right">{data.reduce((sum, r) => sum + r.loan_count, 0)}</td>
              <td className="text-right">{formatCurrency(totalOutstanding)}</td>
              <td className="text-right">—</td>
              <td className="text-right">{formatCurrency(totalProvisions)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
