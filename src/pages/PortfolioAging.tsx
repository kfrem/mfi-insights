import { usePortfolioAging } from '@/hooks/useMfiData';
import { BogBucketBadge } from '@/components/dashboard/BogBucketBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import { exportPortfolioAgingCSV, exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export default function PortfolioAging() {
  const { data: portfolio, isLoading } = usePortfolioAging();
  const [search, setSearch] = useState('');

  const filteredData = portfolio?.filter(
    (loan) =>
      loan.client_name.toLowerCase().includes(search.toLowerCase()) ||
      loan.loan_id.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleExportCSV = () => exportPortfolioAgingCSV(filteredData);
  const handleExportPDF = () => exportToPDF('portfolio-table', 'Portfolio Ageing Report');

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="page-header">
        <h1 className="page-title">Portfolio Ageing</h1>
        <p className="page-subtitle">Loans ordered by days overdue with BOG classification</p>
      </header>

      <div className="kpi-card">
        {/* Search */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or loan ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredData.length} loans
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={filteredData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
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
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <div className="table-responsive" id="portfolio-table">
            <table className="data-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Client</th>
                  <th className="text-right">Principal</th>
                  <th className="text-right">Outstanding</th>
                  <th className="text-right">Days Overdue</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No loans found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((loan) => (
                    <tr key={loan.loan_id}>
                      <td className="font-mono text-xs md:text-sm">{loan.loan_id.slice(0, 8)}...</td>
                      <td className="font-medium text-sm">{loan.client_name}</td>
                      <td className="text-right text-sm">{formatCurrency(loan.principal)}</td>
                      <td className="text-right text-sm">{formatCurrency(loan.outstanding_balance)}</td>
                      <td className="text-right">
                        <span className={loan.days_overdue > 90 ? 'text-status-loss font-semibold' : ''}>
                          {loan.days_overdue}
                        </span>
                      </td>
                      <td>
                        <BogBucketBadge bucket={loan.bog_bucket} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
