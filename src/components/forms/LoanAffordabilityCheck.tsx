import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Wallet,
  PiggyBank,
  Calculator,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LoanAffordabilityCheckProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRepayment: number;
  principal: number;
}

interface AffordabilityResult {
  status: 'APPROVED' | 'CAUTION' | 'REJECTED';
  dti: number; // Debt-to-Income ratio
  disposableIncome: number;
  netDisposableAfterLoan: number;
  cushion: number; // Safety margin percentage
  messages: string[];
  recommendations: string[];
}

export function LoanAffordabilityCheck({
  monthlyIncome,
  monthlyExpenses,
  monthlyRepayment,
  principal,
}: LoanAffordabilityCheckProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const affordability = useMemo((): AffordabilityResult | null => {
    if (!monthlyIncome || monthlyIncome <= 0) {
      return null;
    }

    const disposableIncome = monthlyIncome - monthlyExpenses;
    const netDisposableAfterLoan = disposableIncome - monthlyRepayment;
    const dti = (monthlyRepayment / monthlyIncome) * 100;
    const cushion = (netDisposableAfterLoan / monthlyIncome) * 100;
    const expenseRatio = (monthlyExpenses / monthlyIncome) * 100;
    
    const messages: string[] = [];
    const recommendations: string[] = [];
    let status: 'APPROVED' | 'CAUTION' | 'REJECTED';

    // BoG and industry standard thresholds
    // DTI should typically be below 40% for microfinance
    // Net disposable should be at least 20% of income for emergencies
    
    if (dti <= 30 && cushion >= 20 && netDisposableAfterLoan > 0) {
      status = 'APPROVED';
      messages.push('Loan repayment is well within client\'s capacity');
      messages.push('Good safety margin for unexpected expenses');
      if (cushion > 40) {
        recommendations.push('Client may qualify for a higher loan amount if needed');
      }
    } else if (dti <= 40 && cushion >= 10 && netDisposableAfterLoan > 0) {
      status = 'CAUTION';
      messages.push('Loan is affordable but leaves limited financial cushion');
      if (dti > 30) {
        messages.push(`DTI ratio of ${dti.toFixed(1)}% is higher than recommended 30%`);
      }
      recommendations.push('Consider reducing loan amount or extending term');
      recommendations.push('Verify income sources are stable and recurring');
      if (expenseRatio > 60) {
        recommendations.push('Review if declared expenses are accurate');
      }
    } else {
      status = 'REJECTED';
      if (netDisposableAfterLoan < 0) {
        messages.push('Monthly repayment exceeds available disposable income');
      }
      if (dti > 40) {
        messages.push(`DTI ratio of ${dti.toFixed(1)}% exceeds maximum threshold of 40%`);
      }
      if (cushion < 10) {
        messages.push('Insufficient safety margin for emergencies');
      }
      recommendations.push('Reduce loan principal amount');
      recommendations.push('Extend repayment term to lower monthly payments');
      recommendations.push('Request client to provide additional income sources');
      if (expenseRatio > 70) {
        recommendations.push('Consider expense reduction strategies with client');
      }
    }

    return {
      status,
      dti,
      disposableIncome,
      netDisposableAfterLoan,
      cushion,
      messages,
      recommendations,
    };
  }, [monthlyIncome, monthlyExpenses, monthlyRepayment]);

  if (!monthlyIncome || monthlyIncome <= 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Affordability Check Unavailable</p>
          <p className="text-sm mt-1">Client's monthly income is required to assess loan affordability.</p>
          <p className="text-xs mt-2">Update client profile with income and expense information.</p>
        </CardContent>
      </Card>
    );
  }

  if (!affordability) return null;

  const statusConfig = {
    APPROVED: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      badgeVariant: 'default' as const,
      label: 'Affordable',
    },
    CAUTION: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeVariant: 'secondary' as const,
      label: 'Proceed with Caution',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      badgeVariant: 'destructive' as const,
      label: 'Not Affordable',
    },
  };

  const config = statusConfig[affordability.status];
  const StatusIcon = config.icon;

  // Calculate progress bar values
  const incomeBreakdown = {
    expenses: Math.min((monthlyExpenses / monthlyIncome) * 100, 100),
    repayment: Math.min((monthlyRepayment / monthlyIncome) * 100, 100),
    remaining: Math.max(affordability.cushion, 0),
  };

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Affordability Assessment
          </div>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-3 w-3" />
              Monthly Income
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" />
              Monthly Expenses
            </div>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <PiggyBank className="h-3 w-3" />
              Disposable Income
            </div>
            <p className={`text-lg font-bold ${affordability.disposableIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(affordability.disposableIncome)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calculator className="h-3 w-3" />
              DTI Ratio
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Debt-to-Income ratio. Should be below 40%.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className={`text-lg font-bold ${affordability.dti <= 30 ? 'text-green-600' : affordability.dti <= 40 ? 'text-amber-600' : 'text-red-600'}`}>
              {affordability.dti.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Income Allocation Visual */}
        <div className="bg-background rounded-lg p-4 border">
          <h4 className="text-sm font-medium mb-3">Monthly Income Allocation</h4>
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex">
              <div 
                className="h-full bg-amber-500 transition-all" 
                style={{ width: `${incomeBreakdown.expenses}%` }}
              />
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${incomeBreakdown.repayment}%` }}
              />
              <div 
                className="h-full bg-green-500 transition-all" 
                style={{ width: `${incomeBreakdown.remaining}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Expenses: {formatCurrency(monthlyExpenses)} ({incomeBreakdown.expenses.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Loan Repayment: {formatCurrency(monthlyRepayment)} ({incomeBreakdown.repayment.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Remaining: {formatCurrency(Math.max(affordability.netDisposableAfterLoan, 0))} ({Math.max(incomeBreakdown.remaining, 0).toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* After Loan Summary */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex justify-between mb-1">
            <span>Disposable Income:</span>
            <span className="font-medium">{formatCurrency(affordability.disposableIncome)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Less: Monthly Repayment:</span>
            <span className="font-medium text-primary">- {formatCurrency(monthlyRepayment)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Net Disposable After Loan:</span>
            <span className={affordability.netDisposableAfterLoan >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(affordability.netDisposableAfterLoan)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Safety Cushion:</span>
            <span className={affordability.cushion >= 20 ? 'text-green-600' : affordability.cushion >= 10 ? 'text-amber-600' : 'text-red-600'}>
              {affordability.cushion.toFixed(1)}% of income
            </span>
          </div>
        </div>

        {/* Status Messages */}
        <div className={`rounded-lg p-3 ${config.bgColor} border ${config.borderColor}`}>
          <div className="flex items-start gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
            <div className="space-y-2">
              <p className={`font-medium ${config.color}`}>Assessment Result</p>
              <ul className="text-sm space-y-1">
                {affordability.messages.map((msg, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
              {affordability.recommendations.length > 0 && (
                <>
                  <p className="font-medium text-sm mt-3">Recommendations:</p>
                  <ul className="text-sm space-y-1">
                    {affordability.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Threshold Reference */}
        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border">
          <p className="font-medium mb-2">BoG Recommended Thresholds:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <span className="text-green-600">✓</span> DTI ≤ 30%: Optimal
            </div>
            <div>
              <span className="text-amber-600">⚠</span> DTI 30-40%: Acceptable
            </div>
            <div>
              <span className="text-red-600">✗</span> DTI &gt; 40%: High Risk
            </div>
            <div>
              <span className="text-green-600">✓</span> Cushion ≥ 20%: Safe
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
