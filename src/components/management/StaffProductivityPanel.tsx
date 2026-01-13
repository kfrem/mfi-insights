import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStaffProductivity, useBranchPerformance } from '@/hooks/useManagementData';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileSpreadsheet, FileText, Users, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/dateUtils';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function StaffProductivityPanel() {
  const { data: staff, isLoading } = useStaffProductivity();
  const { data: branches } = useBranchPerformance();

  const handleExportCSV = () => {
    if (!staff) return;
    exportToCSV(staff, `staff-productivity-${formatDate(new Date(), 'yyyy-MM-dd')}`, [
      { key: 'staff_name', header: 'Staff Name' },
      { key: 'role', header: 'Role' },
      { key: 'branch', header: 'Branch' },
      { key: 'clients_managed', header: 'Clients' },
      { key: 'active_loans', header: 'Active Loans' },
      { key: 'portfolio_value', header: 'Portfolio (GHS)' },
      { key: 'collection_rate', header: 'Collection Rate (%)' },
      { key: 'par_30_rate', header: 'PAR 30 (%)' },
    ]);
  };

  const handleExportPDF = () => exportToPDF('staff-productivity', 'Staff Productivity Report');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Sort by collection rate
  const sortedStaff = [...(staff ?? [])].sort((a, b) => b.collection_rate - a.collection_rate);
  const topPerformer = sortedStaff[0];
  const needsAttention = sortedStaff.filter(s => s.collection_rate < 80);

  return (
    <div className="space-y-6" id="staff-productivity">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{staff?.length ?? 0}</span>
          </CardContent>
        </Card>

        <Card className="border-status-current">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-current">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformer && (
              <>
                <span className="text-lg font-semibold">{topPerformer.staff_name}</span>
                <p className="text-sm text-muted-foreground">
                  {topPerformer.collection_rate.toFixed(1)}% collection rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={needsAttention.length > 0 ? 'border-status-watch' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-3xl font-bold ${needsAttention.length > 0 ? 'text-status-watch' : ''}`}>
              {needsAttention.length}
            </span>
            <p className="text-xs text-muted-foreground">Below 80% collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{branches?.length ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
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

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Branch</th>
                <th className="text-right">Clients</th>
                <th className="text-right">Portfolio</th>
                <th className="text-right">Collection Rate</th>
                <th className="text-right">PAR 30</th>
                <th className="text-right">Visits Today</th>
              </tr>
            </thead>
            <tbody>
              {sortedStaff.map((s) => (
                <tr key={s.staff_id}>
                  <td className="font-medium">{s.staff_name}</td>
                  <td>
                    <Badge variant="outline" className="font-normal text-xs">
                      {s.role}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{s.branch}</td>
                  <td className="text-right">{s.clients_managed}</td>
                  <td className="text-right">{s.portfolio_value > 0 ? formatCurrency(s.portfolio_value) : '-'}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={s.collection_rate} className="w-16 h-2" />
                      <span className={s.collection_rate >= 90 ? 'text-status-current' : s.collection_rate >= 80 ? 'text-status-watch' : 'text-status-loss'}>
                        {s.collection_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right">
                    {s.par_30_rate > 0 ? (
                      <span className={s.par_30_rate <= 5 ? 'text-status-current' : s.par_30_rate <= 10 ? 'text-status-watch' : 'text-status-loss'}>
                        {s.par_30_rate.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-right">
                    <Badge variant="outline">{s.visits_today}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Branch Performance */}
      {branches && branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th className="text-right">Staff</th>
                  <th className="text-right">Clients</th>
                  <th className="text-right">Active Loans</th>
                  <th className="text-right">Portfolio</th>
                  <th className="text-right">PAR 30</th>
                  <th className="text-right">Collections</th>
                  <th className="text-right">Disbursed MTD</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.branch_id}>
                    <td className="font-medium">{b.branch_name}</td>
                    <td className="text-right">{b.staff_count}</td>
                    <td className="text-right">{b.active_clients}</td>
                    <td className="text-right">{b.active_loans}</td>
                    <td className="text-right">{formatCurrency(b.portfolio_value)}</td>
                    <td className="text-right">
                      <span className={b.par_30_rate <= 5 ? 'text-status-current' : b.par_30_rate <= 10 ? 'text-status-watch' : 'text-status-loss'}>
                        {b.par_30_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={b.collections_rate >= 90 ? 'text-status-current' : b.collections_rate >= 80 ? 'text-status-watch' : 'text-status-loss'}>
                        {b.collections_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right">{formatCurrency(b.disbursement_mtd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
