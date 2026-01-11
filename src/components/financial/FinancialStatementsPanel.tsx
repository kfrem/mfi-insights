import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { useBalanceSheet, useIncomeStatement } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export function FinancialStatementsPanel() {
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: incomeStatement, isLoading: isLoading } = useIncomeStatement();

  if (bsLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="balance-sheet">
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="space-y-6 mt-4">
          {balanceSheet && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(balanceSheet.assets.total_assets)}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{formatCurrency(balanceSheet.liabilities.total_liabilities)}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold text-status-current">{formatCurrency(balanceSheet.equity.total_equity)}</span>
                  </CardContent>
                </Card>
                <Card className={balanceSheet.is_balanced ? 'border-status-current' : 'border-status-loss'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Balance Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={balanceSheet.is_balanced ? 'default' : 'destructive'}>
                      {balanceSheet.is_balanced ? 'BALANCED' : 'UNBALANCED'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Assets</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr><td>Cash on Hand</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.cash_on_hand)}</td></tr>
                          <tr><td>Cash at Bank</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.cash_at_bank)}</td></tr>
                          <tr><td>Short-term Investments</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.short_term_investments)}</td></tr>
                          <tr><td>Gross Loan Portfolio</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.gross_loan_portfolio)}</td></tr>
                          <tr className="text-status-loss"><td>Less: Loan Loss Provisions</td><td className="text-right">({formatCurrency(Math.abs(balanceSheet.assets.current_assets.loan_loss_provisions))})</td></tr>
                          <tr className="font-medium"><td>Net Loan Portfolio</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.net_loan_portfolio)}</td></tr>
                          <tr><td>Interest Receivable</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.interest_receivable)}</td></tr>
                          <tr><td>Other Receivables</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.other_receivables)}</td></tr>
                          <tr className="border-t font-semibold"><td>Total Current Assets</td><td className="text-right">{formatCurrency(balanceSheet.assets.current_assets.total_current_assets)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Non-Current Assets</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr><td>Net Fixed Assets</td><td className="text-right">{formatCurrency(balanceSheet.assets.non_current_assets.net_fixed_assets)}</td></tr>
                          <tr><td>Intangible Assets</td><td className="text-right">{formatCurrency(balanceSheet.assets.non_current_assets.intangible_assets)}</td></tr>
                          <tr><td>Long-term Investments</td><td className="text-right">{formatCurrency(balanceSheet.assets.non_current_assets.long_term_investments)}</td></tr>
                          <tr className="border-t font-semibold"><td>Total Non-Current</td><td className="text-right">{formatCurrency(balanceSheet.assets.non_current_assets.total_non_current_assets)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL ASSETS</span>
                        <span>{formatCurrency(balanceSheet.assets.total_assets)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Liabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Liabilities</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr><td>Deposits from Public</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.deposits_from_public)}</td></tr>
                          <tr><td>Short-term Borrowings</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.short_term_borrowings)}</td></tr>
                          <tr><td>Accounts Payable</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.accounts_payable)}</td></tr>
                          <tr><td>Accrued Expenses</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.accrued_expenses)}</td></tr>
                          <tr><td>Interest Payable</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.interest_payable)}</td></tr>
                          <tr><td>Taxes Payable</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.taxes_payable)}</td></tr>
                          <tr className="border-t font-semibold"><td>Total Current</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.current_liabilities.total_current_liabilities)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Non-Current Liabilities</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr><td>Long-term Borrowings</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.non_current_liabilities.long_term_borrowings)}</td></tr>
                          <tr><td>Subordinated Debt</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.non_current_liabilities.subordinated_debt)}</td></tr>
                          <tr><td>Other Long-term</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.non_current_liabilities.other_long_term_liabilities)}</td></tr>
                          <tr className="border-t font-semibold"><td>Total Non-Current</td><td className="text-right">{formatCurrency(balanceSheet.liabilities.non_current_liabilities.total_non_current_liabilities)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL LIABILITIES</span>
                        <span>{formatCurrency(balanceSheet.liabilities.total_liabilities)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Equity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-status-current">Shareholders' Equity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td>Paid-up Capital</td><td className="text-right">{formatCurrency(balanceSheet.equity.paid_up_capital)}</td></tr>
                        <tr><td>Share Premium</td><td className="text-right">{formatCurrency(balanceSheet.equity.share_premium)}</td></tr>
                        <tr><td>Statutory Reserves</td><td className="text-right">{formatCurrency(balanceSheet.equity.statutory_reserves)}</td></tr>
                        <tr><td>General Reserves</td><td className="text-right">{formatCurrency(balanceSheet.equity.general_reserves)}</td></tr>
                        <tr><td>Revaluation Reserves</td><td className="text-right">{formatCurrency(balanceSheet.equity.revaluation_reserves)}</td></tr>
                        <tr><td>Retained Earnings</td><td className="text-right">{formatCurrency(balanceSheet.equity.retained_earnings)}</td></tr>
                        <tr className="text-status-current"><td>Current Year Profit</td><td className="text-right">{formatCurrency(balanceSheet.equity.current_year_profit)}</td></tr>
                      </tbody>
                    </table>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL EQUITY</span>
                        <span className="text-status-current">{formatCurrency(balanceSheet.equity.total_equity)}</span>
                      </div>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg border-2 border-primary">
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL L + E</span>
                        <span>{formatCurrency(balanceSheet.total_liabilities_and_equity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-6 mt-4">
          {incomeStatement && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Interest Income (Cash)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xl font-bold text-status-current">{formatCurrency(incomeStatement.interest_income.total_interest_income_cash)}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{formatCurrency(incomeStatement.interest_income.total_interest_income_accrued)} accrued
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Interest Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xl font-bold">{formatCurrency(incomeStatement.net_interest_income)}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Operating Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xl font-bold">{formatCurrency(incomeStatement.operating_expenses.total_operating_expenses)}</span>
                    {incomeStatement.operating_expenses.unverified_suspense_expenses > 0 && (
                      <p className="text-xs text-status-loss mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formatCurrency(incomeStatement.operating_expenses.unverified_suspense_expenses)} unverified
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Provisions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xl font-bold text-status-loss">{formatCurrency(incomeStatement.provisions.net_provision_expense)}</span>
                  </CardContent>
                </Card>
                <Card className="border-status-current">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={`text-xl font-bold ${incomeStatement.net_profit >= 0 ? 'text-status-current' : 'text-status-loss'}`}>
                      {formatCurrency(incomeStatement.net_profit)}
                    </span>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-status-current">Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th className="text-right">Amount (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-medium bg-muted/50"><td colSpan={2}>Interest Income</td></tr>
                        <tr><td className="pl-4">Interest on Loans (Cash)</td><td className="text-right">{formatCurrency(incomeStatement.interest_income.interest_on_loans_cash)}</td></tr>
                        <tr className="text-muted-foreground"><td className="pl-4">Interest on Loans (Accrued)</td><td className="text-right">{formatCurrency(incomeStatement.interest_income.interest_on_loans_accrued)}</td></tr>
                        <tr><td className="pl-4">Interest on Investments</td><td className="text-right">{formatCurrency(incomeStatement.interest_income.interest_on_investments)}</td></tr>
                        <tr><td className="pl-4">Interest on Bank Deposits</td><td className="text-right">{formatCurrency(incomeStatement.interest_income.interest_on_bank_deposits)}</td></tr>
                        <tr className="font-semibold border-t"><td>Total Interest Income</td><td className="text-right">{formatCurrency(incomeStatement.interest_income.total_interest_income)}</td></tr>
                        
                        <tr className="font-medium bg-muted/50"><td colSpan={2}>Interest Expense</td></tr>
                        <tr><td className="pl-4">Interest on Deposits</td><td className="text-right">({formatCurrency(incomeStatement.interest_expense.interest_on_deposits)})</td></tr>
                        <tr><td className="pl-4">Interest on Borrowings</td><td className="text-right">({formatCurrency(incomeStatement.interest_expense.interest_on_borrowings)})</td></tr>
                        <tr className="font-semibold border-t"><td>Net Interest Income</td><td className="text-right text-primary">{formatCurrency(incomeStatement.net_interest_income)}</td></tr>
                        
                        <tr className="font-medium bg-muted/50"><td colSpan={2}>Other Income</td></tr>
                        <tr><td className="pl-4">Fee Income</td><td className="text-right">{formatCurrency(incomeStatement.other_income.fee_income)}</td></tr>
                        <tr><td className="pl-4">Commission Income</td><td className="text-right">{formatCurrency(incomeStatement.other_income.commission_income)}</td></tr>
                        <tr><td className="pl-4">Other Operating Income</td><td className="text-right">{formatCurrency(incomeStatement.other_income.other_operating_income)}</td></tr>
                        <tr className="font-semibold border-t"><td>Total Other Income</td><td className="text-right">{formatCurrency(incomeStatement.other_income.total_other_income)}</td></tr>
                        
                        <tr className="bg-primary/10 font-bold"><td>GROSS OPERATING INCOME</td><td className="text-right">{formatCurrency(incomeStatement.gross_operating_income)}</td></tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Expenses Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Expenses & Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th className="text-right">Amount (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-medium bg-muted/50"><td colSpan={2}>Provisions for Loan Losses</td></tr>
                        <tr><td className="pl-4">Loan Loss Provision</td><td className="text-right">({formatCurrency(incomeStatement.provisions.loan_loss_provision)})</td></tr>
                        <tr className="text-status-current"><td className="pl-4">Provision Reversal</td><td className="text-right">{formatCurrency(Math.abs(incomeStatement.provisions.provision_reversal))}</td></tr>
                        <tr className="font-semibold border-t text-status-loss"><td>Net Provision Expense</td><td className="text-right">({formatCurrency(incomeStatement.provisions.net_provision_expense)})</td></tr>
                        
                        <tr className="font-medium bg-muted/50"><td colSpan={2}>Operating Expenses</td></tr>
                        <tr><td className="pl-4">Personnel Expenses</td><td className="text-right">({formatCurrency(incomeStatement.operating_expenses.personnel_expenses)})</td></tr>
                        <tr><td className="pl-4">Administrative Expenses</td><td className="text-right">({formatCurrency(incomeStatement.operating_expenses.administrative_expenses)})</td></tr>
                        <tr><td className="pl-4">Depreciation & Amortization</td><td className="text-right">({formatCurrency(incomeStatement.operating_expenses.depreciation_amortization)})</td></tr>
                        <tr><td className="pl-4">Other Operating Expenses</td><td className="text-right">({formatCurrency(incomeStatement.operating_expenses.other_operating_expenses)})</td></tr>
                        {incomeStatement.operating_expenses.unverified_suspense_expenses > 0 && (
                          <tr className="text-status-loss bg-status-loss/10">
                            <td className="pl-4 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Unverified/Suspense Expenses
                            </td>
                            <td className="text-right">({formatCurrency(incomeStatement.operating_expenses.unverified_suspense_expenses)})</td>
                          </tr>
                        )}
                        <tr className="font-semibold border-t"><td>Total Operating Expenses</td><td className="text-right">({formatCurrency(incomeStatement.operating_expenses.total_operating_expenses)})</td></tr>
                        
                        <tr className="bg-muted font-bold"><td>OPERATING PROFIT</td><td className="text-right">{formatCurrency(incomeStatement.operating_profit)}</td></tr>
                        <tr><td>Income Tax</td><td className="text-right">({formatCurrency(incomeStatement.income_tax)})</td></tr>
                        <tr className={`font-bold text-lg ${incomeStatement.net_profit >= 0 ? 'bg-status-current/10 text-status-current' : 'bg-status-loss/10 text-status-loss'}`}>
                          <td>NET PROFIT</td>
                          <td className="text-right">{formatCurrency(incomeStatement.net_profit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
