import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, AlertTriangle, Eye } from 'lucide-react';
import { useTransactionReports } from '@/hooks/useRegulatoryData';
import { exportToCSV, exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, parseISO } from '@/lib/dateUtils';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function AMLReportsPanel() {
  const { data: reports, isLoading } = useTransactionReports();

  const handleExportCSV = () => {
    if (!reports) return;
    exportToCSV(reports, `aml-reports-${formatDate(new Date(), 'yyyy-MM-dd')}`, [
      { key: 'report_id', header: 'Report ID' },
      { key: 'report_type', header: 'Type' },
      { key: 'client_name', header: 'Client Name' },
      { key: 'ghana_card', header: 'Ghana Card' },
      { key: 'transaction_date', header: 'Transaction Date' },
      { key: 'transaction_amount', header: 'Amount (GHS)' },
      { key: 'transaction_type', header: 'Transaction Type' },
      { key: 'status', header: 'Status' },
      { key: 'fic_reference', header: 'FIC Reference' },
    ]);
  };

  const handleExportPDF = () => exportToPDF('aml-reports', 'AML CTR/STR Reports');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const ctrReports = reports?.filter(r => r.report_type === 'CTR') ?? [];
  const strReports = reports?.filter(r => r.report_type === 'STR') ?? [];
  const pendingReports = reports?.filter(r => r.status === 'Pending') ?? [];

  return (
    <div className="space-y-6" id="aml-reports">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{reports?.length ?? 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CTR (Cash Transactions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{ctrReports.length}</span>
            <p className="text-xs text-muted-foreground mt-1">≥ GHS 50,000 threshold</p>
          </CardContent>
        </Card>
        <Card className="border-status-watch">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-watch flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              STR (Suspicious)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-status-watch">{strReports.length}</span>
          </CardContent>
        </Card>
        <Card className={pendingReports.length > 0 ? 'border-status-loss' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-3xl font-bold ${pendingReports.length > 0 ? 'text-status-loss' : ''}`}>
              {pendingReports.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export AML Reports
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Reports (CTR/STR)</CardTitle>
        </CardHeader>
        <CardContent>
          {!reports || reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reportable transactions in the current period
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Ghana Card</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th>Transaction</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.report_id}>
                    <td className="font-mono text-sm">{report.report_id}</td>
                    <td>
                      <Badge 
                        variant={report.report_type === 'STR' ? 'destructive' : 'outline'}
                        className={report.report_type === 'CTR' ? 'bg-primary/10 text-primary border-primary' : ''}
                      >
                        {report.report_type}
                      </Badge>
                    </td>
                    <td className="font-medium">{report.client_name}</td>
                    <td className="font-mono text-xs">{report.ghana_card}</td>
                    <td>{formatDate(parseISO(report.transaction_date), 'dd MMM yyyy')}</td>
                    <td className="text-right font-medium">{formatCurrency(report.transaction_amount)}</td>
                    <td className="text-sm">{report.transaction_type}</td>
                    <td>
                      {report.status === 'Submitted' ? (
                        <Badge variant="outline" className="bg-status-current/10 text-status-current border-status-current">
                          Submitted
                        </Badge>
                      ) : report.status === 'Acknowledged' ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          Acknowledged
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-status-watch/10 text-status-watch border-status-watch">
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* STR Details if any */}
      {strReports.length > 0 && (
        <Card className="border-status-watch">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-watch" />
              Suspicious Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strReports.map((str) => (
              <div key={str.report_id} className="p-4 bg-status-watch/5 rounded-lg border border-status-watch/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono text-sm text-muted-foreground">{str.report_id}</span>
                    <h4 className="font-medium">{str.client_name}</h4>
                  </div>
                  <Badge variant={str.status === 'Submitted' ? 'outline' : 'destructive'}>
                    {str.status}
                  </Badge>
                </div>
                {str.risk_indicators && (
                  <p className="text-sm text-status-watch bg-status-watch/10 p-2 rounded mt-2">
                    <strong>Risk Indicators:</strong> {str.risk_indicators}
                  </p>
                )}
                {str.fic_reference && (
                  <p className="text-xs text-muted-foreground mt-2">
                    FIC Reference: <span className="font-mono">{str.fic_reference}</span>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AML Guidelines Reference */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>BoG AML/CFT&P 2022 Requirements:</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li><strong>CTR:</strong> Cash transactions ≥ GHS 50,000 must be reported within 24 hours</li>
            <li><strong>STR:</strong> Suspicious transactions must be reported immediately to FIC</li>
            <li>All reports submitted via FIC portal: <span className="font-mono text-primary">goaml.fic.gov.gh</span></li>
            <li>Ghana Card number mandatory for all customer identification</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
