import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ShieldAlert, 
  FileWarning,
  Receipt,
  Ban,
  Clock,
  TrendingDown,
  Download
} from 'lucide-react';
import { useGovernanceRisk, useCashFlowForecast } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function GovernanceRiskPanel() {
  const { data: governance, isLoading: govLoading } = useGovernanceRisk();
  const { data: cashFlow, isLoading: cfLoading } = useCashFlowForecast();

  if (govLoading || cfLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-status-current bg-status-current/10 border-status-current';
      case 'Medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500';
      case 'High': return 'text-orange-600 bg-orange-500/10 border-orange-500';
      case 'Critical': return 'text-status-loss bg-status-loss/10 border-status-loss';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Health Score */}
      {governance && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className={`border-2 ${getRiskColor(governance.risk_level)}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Governance Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">{governance.governance_health_score}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <Badge className={`mt-2 ${getRiskColor(governance.risk_level)}`}>
                  {governance.risk_level} Risk
                </Badge>
              </CardContent>
            </Card>

            <Card className={governance.audit_findings.high_priority_open > 0 ? 'border-status-loss' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileWarning className="h-4 w-4" />
                  Open Audit Findings (High Risk)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`text-3xl font-bold ${governance.audit_findings.high_priority_open > 0 ? 'text-status-loss' : 'text-status-current'}`}>
                  {governance.audit_findings.high_priority_open}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {governance.audit_findings.overdue_findings} overdue for closure
                </p>
              </CardContent>
            </Card>

            <Card className={governance.control_issues.unreconciled_suspense_items > 0 ? 'border-yellow-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Unreconciled Suspense Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold text-yellow-600">
                  {governance.control_issues.unreconciled_suspense_items}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Value: {formatCurrency(governance.control_issues.suspense_items_value)}
                </p>
              </CardContent>
            </Card>

            <Card className={governance.fraud_risk.suspected_fraud_cases > 0 ? 'border-status-loss' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Fraud Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`text-3xl font-bold ${governance.fraud_risk.suspected_fraud_cases > 0 ? 'text-status-loss' : 'text-status-current'}`}>
                  {governance.fraud_risk.suspected_fraud_cases}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Suspected cases under review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audit Findings Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileWarning className="h-5 w-5" />
                  Internal Audit Findings Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-status-loss/10 rounded-lg border border-status-loss">
                      <div className="text-2xl font-bold text-status-loss">{governance.audit_findings.high_priority_open}</div>
                      <div className="text-xs text-muted-foreground">High Priority</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500">
                      <div className="text-2xl font-bold text-yellow-600">{governance.audit_findings.medium_priority_open}</div>
                      <div className="text-xs text-muted-foreground">Medium Priority</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{governance.audit_findings.low_priority_open}</div>
                      <div className="text-xs text-muted-foreground">Low Priority</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Open Findings</span>
                      <span className="font-medium">{governance.audit_findings.high_priority_open + governance.audit_findings.medium_priority_open + governance.audit_findings.low_priority_open}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Closed This Month</span>
                      <span className="font-medium text-status-current">{governance.audit_findings.findings_closed_mtd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Days to Close</span>
                      <span className="font-medium">{governance.audit_findings.avg_days_to_close} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overdue for Closure</span>
                      <span className={`font-medium ${governance.audit_findings.overdue_findings > 0 ? 'text-status-loss' : ''}`}>
                        {governance.audit_findings.overdue_findings}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Control Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Control Weaknesses (From Audit)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-status-loss" />
                      Transactions without Payment Vouchers
                    </span>
                    <Badge variant="destructive">{governance.control_issues.transactions_without_pv}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Unreconciled Suspense Items (&gt;7 days)
                    </span>
                    <Badge variant="secondary">{governance.control_issues.unreconciled_suspense_items}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Duplicate Entries Detected
                    </span>
                    <Badge variant="secondary">{governance.control_issues.duplicate_entries}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-status-loss" />
                      Unauthorized Transactions
                    </span>
                    <Badge variant="destructive">{governance.control_issues.unauthorized_transactions}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm flex items-center gap-2">
                      <FileWarning className="h-4 w-4" />
                      Missing Signatures
                    </span>
                    <Badge variant="secondary">{governance.control_issues.missing_signatures}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Risk Indicators */}
            <Card className={governance.fraud_risk.suspected_fraud_cases > 0 ? 'border-status-loss' : ''}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Fraud Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {governance.fraud_risk.suspected_fraud_cases > 0 && (
                    <div className="bg-status-loss/10 border border-status-loss rounded-lg p-3">
                      <div className="flex items-center gap-2 text-status-loss font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Active Investigation Required
                      </div>
                      <p className="text-sm mt-1">
                        {governance.fraud_risk.suspected_fraud_cases} suspected fraud case(s) under review
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{governance.fraud_risk.cheque_discrepancies}</div>
                      <div className="text-xs text-muted-foreground">Cheque Amount Discrepancies</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{governance.fraud_risk.duplicate_cheques}</div>
                      <div className="text-xs text-muted-foreground">Duplicate Cheque Recording</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{governance.fraud_risk.personal_name_withdrawals}</div>
                      <div className="text-xs text-muted-foreground">Personal Name Withdrawals</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{governance.fraud_risk.confirmed_fraud_cases}</div>
                      <div className="text-xs text-muted-foreground">Confirmed Cases (Value: {formatCurrency(governance.fraud_risk.fraud_value)})</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Reconciliation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Cash Reconciliation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{governance.cash_reconciliation.unreconciled_items_count}</div>
                      <div className="text-xs text-muted-foreground">Unreconciled Items</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{formatCurrency(governance.cash_reconciliation.unreconciled_items_value)}</div>
                      <div className="text-xs text-muted-foreground">Unreconciled Value</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Days Unreconciled</span>
                      <span className={`font-medium ${governance.cash_reconciliation.days_unreconciled_avg > 7 ? 'text-status-loss' : ''}`}>
                        {governance.cash_reconciliation.days_unreconciled_avg} days
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Reconciliation</span>
                      <span className="font-medium">{governance.cash_reconciliation.last_reconciliation_date}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Cash Flow Forecast */}
      {cashFlow && (
        <Card className={cashFlow.is_liquidity_stressed ? 'border-status-loss' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Weekly Cash Flow Forecast
              {cashFlow.is_liquidity_stressed && (
                <Badge variant="destructive">LIQUIDITY STRESS</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-xl font-bold">{formatCurrency(cashFlow.opening_cash_balance)}</div>
                <div className="text-xs text-muted-foreground">Opening Balance</div>
              </div>
              <div className="text-center p-4 bg-status-current/10 rounded-lg">
                <div className="text-xl font-bold text-status-current">+{formatCurrency(cashFlow.inflows.total_inflows)}</div>
                <div className="text-xs text-muted-foreground">Expected Inflows</div>
              </div>
              <div className="text-center p-4 bg-status-loss/10 rounded-lg">
                <div className="text-xl font-bold text-status-loss">-{formatCurrency(cashFlow.outflows.total_outflows)}</div>
                <div className="text-xs text-muted-foreground">Expected Outflows</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${cashFlow.net_cash_flow >= 0 ? 'bg-status-current/10' : 'bg-status-loss/10'}`}>
                <div className={`text-xl font-bold ${cashFlow.net_cash_flow >= 0 ? 'text-status-current' : 'text-status-loss'}`}>
                  {cashFlow.net_cash_flow >= 0 ? '+' : ''}{formatCurrency(cashFlow.net_cash_flow)}
                </div>
                <div className="text-xs text-muted-foreground">Net Cash Flow</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="text-xl font-bold">{formatCurrency(cashFlow.closing_cash_balance)}</div>
                <div className="text-xs text-muted-foreground">Closing Balance</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-status-current">Expected Inflows</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Loan Repayments</span><span>{formatCurrency(cashFlow.inflows.loan_repayments_expected)}</span></div>
                  <div className="flex justify-between"><span>Interest Collections</span><span>{formatCurrency(cashFlow.inflows.interest_collections_expected)}</span></div>
                  <div className="flex justify-between"><span>Fee Income</span><span>{formatCurrency(cashFlow.inflows.fee_income_expected)}</span></div>
                  <div className="flex justify-between"><span>Deposit Inflows</span><span>{formatCurrency(cashFlow.inflows.deposit_inflows)}</span></div>
                  <div className="flex justify-between"><span>Borrowing Drawdowns</span><span>{formatCurrency(cashFlow.inflows.borrowing_drawdowns)}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-status-loss">Expected Outflows</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Loan Disbursements</span><span>{formatCurrency(cashFlow.outflows.loan_disbursements_planned)}</span></div>
                  <div className="flex justify-between"><span>Operating Expenses</span><span>{formatCurrency(cashFlow.outflows.operating_expenses)}</span></div>
                  <div className="flex justify-between"><span>Loan Repayments to Lenders</span><span>{formatCurrency(cashFlow.outflows.loan_repayments_to_lenders)}</span></div>
                  <div className="flex justify-between"><span>Deposit Withdrawals</span><span>{formatCurrency(cashFlow.outflows.deposit_withdrawals)}</span></div>
                  <div className="flex justify-between"><span>Capital Expenditure</span><span>{formatCurrency(cashFlow.outflows.capital_expenditure)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Days Cash on Hand</span>
                <span className={`text-xl font-bold ${cashFlow.days_cash_on_hand < 7 ? 'text-status-loss' : cashFlow.days_cash_on_hand < 14 ? 'text-yellow-600' : 'text-status-current'}`}>
                  {cashFlow.days_cash_on_hand} days
                </span>
              </div>
              {cashFlow.days_cash_on_hand < 7 && (
                <p className="text-sm text-status-loss mt-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical: Less than 7 days of operating cash. Immediate action required.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
