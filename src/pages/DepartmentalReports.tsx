import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Users, CreditCard, Building } from 'lucide-react';
import { useGLSummary, useTrialBalance, useIncomeStatement, useRecoveryMetrics, useCollectorPerformance, useApprovalMetrics, useRejectionAnalysis, useCreditOfficerPerformance, useProductPerformance } from '@/hooks/useDepartmentalData';
import { ReportPeriod } from '@/types/departmental';
import { exportToCSV } from '@/lib/export';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

export default function DepartmentalReports() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');

  // Accounts data
  const { data: glData, isLoading: glLoading } = useGLSummary(period);
  const { data: trialBalance } = useTrialBalance();
  const { data: incomeStatement } = useIncomeStatement();

  // Collections data
  const { data: recovery } = useRecoveryMetrics(period);
  const { data: collectors } = useCollectorPerformance();

  // Credit data
  const { data: approvals } = useApprovalMetrics(period);
  const { data: rejections } = useRejectionAnalysis(period);
  const { data: creditOfficers } = useCreditOfficerPerformance();
  const { data: products } = useProductPerformance();

  return (
    <div className="p-8">
      <header className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building className="h-6 w-6" />
            Departmental Reports
          </h1>
          <p className="page-subtitle">Accounts, Collections, and Credit department analytics</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Tabs defaultValue="accounts" className="mt-6">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-2"><FileText className="h-4 w-4" />Accounts</TabsTrigger>
          <TabsTrigger value="collections" className="gap-2"><Users className="h-4 w-4" />Collections</TabsTrigger>
          <TabsTrigger value="credit" className="gap-2"><CreditCard className="h-4 w-4" />Credit</TabsTrigger>
        </TabsList>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="mt-6 space-y-6">
          {/* GL Summary Cards */}
          {glData && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Assets</p><p className="text-lg font-bold">{formatCurrency(glData.total_assets)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Liabilities</p><p className="text-lg font-bold">{formatCurrency(glData.total_liabilities)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Equity</p><p className="text-lg font-bold">{formatCurrency(glData.total_equity)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(glData.total_income)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-lg font-bold text-red-500">{formatCurrency(glData.total_expenses)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net Income</p><p className="text-lg font-bold text-primary">{formatCurrency(glData.net_income)}</p></CardContent></Card>
            </div>
          )}

          {/* Trial Balance */}
          {trialBalance && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Trial Balance</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={trialBalance.is_balanced ? 'default' : 'destructive'}>{trialBalance.is_balanced ? 'Balanced' : 'Unbalanced'}</Badge>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(trialBalance.entries as any, 'trial-balance', [{ key: 'account_code', header: 'Code' }, { key: 'account_name', header: 'Account' }, { key: 'debit_balance', header: 'Debit' }, { key: 'credit_balance', header: 'Credit' }])}><Download className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.entries.slice(0, 10).map(e => (
                      <TableRow key={e.account_code}>
                        <TableCell>{e.account_code}</TableCell><TableCell>{e.account_name}</TableCell><TableCell><Badge variant="outline">{e.account_type}</Badge></TableCell>
                        <TableCell className="text-right">{e.debit_balance > 0 ? formatCurrency(e.debit_balance) : '-'}</TableCell>
                        <TableCell className="text-right">{e.credit_balance > 0 ? formatCurrency(e.credit_balance) : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>TOTALS</TableCell>
                      <TableCell className="text-right">{formatCurrency(trialBalance.total_debits)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trialBalance.total_credits)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COLLECTIONS TAB */}
        <TabsContent value="collections" className="mt-6 space-y-6">
          {recovery && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Opening Arrears</p><p className="text-lg font-bold">{formatCurrency(recovery.opening_arrears)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Recovered</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(recovery.recovered_arrears)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">New Arrears</p><p className="text-lg font-bold text-red-500">{formatCurrency(recovery.new_arrears)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Closing Arrears</p><p className="text-lg font-bold">{formatCurrency(recovery.closing_arrears)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Recovery Rate</p><p className="text-lg font-bold text-primary">{recovery.recovery_rate.toFixed(1)}%</p></CardContent></Card>
              </div>
              
              {collectors && (
                <Card>
                  <CardHeader><CardTitle>Collector Performance</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Officer</TableHead><TableHead>Branch</TableHead><TableHead className="text-right">Assigned</TableHead><TableHead className="text-right">Collected</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Cured</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectors.map(c => (
                          <TableRow key={c.officer_id}>
                            <TableCell className="font-medium">{c.officer_name}</TableCell><TableCell>{c.branch}</TableCell>
                            <TableCell className="text-right">{formatCurrency(c.arrears_assigned)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatCurrency(c.amount_collected)}</TableCell>
                            <TableCell className="text-right">{c.collection_rate.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{c.clients_visited}</TableCell>
                            <TableCell className="text-right">{c.accounts_cured}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* CREDIT TAB */}
        <TabsContent value="credit" className="mt-6 space-y-6">
          {approvals && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Applications</p><p className="text-lg font-bold">{approvals.applications_received}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-lg font-bold text-emerald-600">{approvals.applications_approved}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-lg font-bold text-red-500">{approvals.applications_rejected}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Approval Rate</p><p className="text-lg font-bold">{approvals.approval_rate.toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Disbursed</p><p className="text-lg font-bold text-primary">{formatCurrency(approvals.amount_disbursed)}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg TAT</p><p className="text-lg font-bold">{approvals.avg_processing_days.toFixed(1)} days</p></CardContent></Card>
            </div>
          )}

          {products && (
            <Card>
              <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead><TableHead className="text-right">Active Loans</TableHead><TableHead className="text-right">Portfolio</TableHead><TableHead className="text-right">Share</TableHead><TableHead className="text-right">PAR 30</TableHead><TableHead className="text-right">Yield</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="text-right">{p.active_loans.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.portfolio_outstanding)}</TableCell>
                        <TableCell className="text-right">{p.portfolio_share.toFixed(1)}%</TableCell>
                        <TableCell className={`text-right ${p.par_30_rate > 5 ? 'text-red-500' : ''}`}>{p.par_30_rate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{p.avg_yield}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
