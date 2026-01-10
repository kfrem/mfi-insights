import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { usePrudentialReturns } from '@/hooks/useRegulatoryData';
import { exportToCSV, exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays, parseISO } from 'date-fns';

export function PrudentialReturnsTracker() {
  const { data: returns, isLoading } = usePrudentialReturns();

  const handleExportCSV = () => {
    if (!returns) return;
    exportToCSV(returns, `prudential-returns-${format(new Date(), 'yyyy-MM-dd')}`, [
      { key: 'return_category', header: 'Category' },
      { key: 'return_name', header: 'Return Name' },
      { key: 'frequency', header: 'Frequency' },
      { key: 'last_submitted', header: 'Last Submitted' },
      { key: 'next_due', header: 'Next Due' },
      { key: 'status', header: 'Status' },
    ]);
  };

  const handleExportPDF = () => exportToPDF('prudential-returns', 'BoG Prudential Returns Status');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!returns || returns.length === 0) {
    return <div className="text-muted-foreground">No prudential returns configured</div>;
  }

  // Group by category
  const groupedReturns = returns.reduce((acc, ret) => {
    if (!acc[ret.return_category]) {
      acc[ret.return_category] = [];
    }
    acc[ret.return_category].push(ret);
    return acc;
  }, {} as Record<string, typeof returns>);

  const getStatusBadge = (status: string, nextDue: string) => {
    const daysUntilDue = differenceInDays(parseISO(nextDue), new Date());
    
    if (status === 'Submitted') {
      return (
        <Badge variant="outline" className="bg-status-current/10 text-status-current border-status-current">
          <CheckCircle className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      );
    }
    if (status === 'Overdue' || daysUntilDue < 0) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="bg-status-watch/10 text-status-watch border-status-watch">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Due Soon
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Summary stats
  const submitted = returns.filter(r => r.status === 'Submitted').length;
  const pending = returns.filter(r => r.status === 'Pending').length;
  const overdue = returns.filter(r => r.status === 'Overdue' || differenceInDays(parseISO(r.next_due), new Date()) < 0).length;

  return (
    <div className="space-y-6" id="prudential-returns">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{returns.length}</span>
          </CardContent>
        </Card>
        <Card className="border-status-current">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-current">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-status-current">{submitted}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{pending}</span>
          </CardContent>
        </Card>
        <Card className={overdue > 0 ? 'border-status-loss' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-loss">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-3xl font-bold ${overdue > 0 ? 'text-status-loss' : ''}`}>{overdue}</span>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Returns Status
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

      {/* Returns by Category */}
      {Object.entries(groupedReturns).map(([category, categoryReturns]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Return Name</th>
                  <th>Frequency</th>
                  <th>Last Submitted</th>
                  <th>Next Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {categoryReturns.map((ret, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{ret.return_name}</td>
                    <td>
                      <Badge variant="outline" className="font-normal">
                        {ret.frequency}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">
                      {ret.last_submitted ? format(parseISO(ret.last_submitted), 'dd MMM yyyy') : '-'}
                    </td>
                    <td>
                      {format(parseISO(ret.next_due), 'dd MMM yyyy')}
                    </td>
                    <td>
                      {getStatusBadge(ret.status, ret.next_due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {/* Reference Note */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Prudential returns are submitted via the BoG ORASS portal. 
            Contact <span className="font-mono text-primary">bsd@bog.gov.gh</span> for template requests 
            or submission issues. Full list of 40+ required returns per BoG Annexure VIII.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
