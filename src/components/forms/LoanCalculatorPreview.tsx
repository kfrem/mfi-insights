import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Calendar, TrendingUp, Wallet, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type InterestCalcFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
export type InterestMethod = 'FLAT' | 'REDUCING_BALANCE';
export type RepaymentFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type PenaltyType = 'NONE' | 'FLAT_AMOUNT' | 'PERCENT_OVERDUE' | 'PERCENT_INSTALLMENT' | 'DAILY_RATE';

interface LoanCalculatorPreviewProps {
  principal: number;
  interestRate: number;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  disbursementDate: string;
  interestCalcFrequency?: InterestCalcFrequency;
  interestMethod?: InterestMethod;
  penaltyType?: PenaltyType;
  penaltyValue?: number;
  penaltyGraceDays?: number;
}

interface RepaymentScheduleItem {
  paymentNo: number;
  dueDate: Date;
  principal: number;
  interest: number;
  totalPayment: number;
  balance: number;
}

// Interest calculation periods per year
const PERIODS_PER_YEAR: Record<InterestCalcFrequency, number> = {
  DAILY: 365,
  WEEKLY: 52,
  FORTNIGHTLY: 26,
  MONTHLY: 12,
  QUARTERLY: 4,
  ANNUALLY: 1,
};

const INTEREST_FREQ_LABELS: Record<InterestCalcFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  FORTNIGHTLY: 'Fortnightly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

const REPAYMENT_FREQ_LABELS: Record<RepaymentFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  FORTNIGHTLY: 'Fortnightly',
  MONTHLY: 'Monthly',
};

export function LoanCalculatorPreview({
  principal,
  interestRate,
  termMonths,
  repaymentFrequency,
  disbursementDate,
  interestCalcFrequency = 'MONTHLY',
  interestMethod = 'FLAT',
  penaltyType = 'NONE',
  penaltyValue = 0,
  penaltyGraceDays = 0,
}: LoanCalculatorPreviewProps) {
  const useReducingBalance = interestMethod === 'REDUCING_BALANCE';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculations = useMemo(() => {
    if (!principal || principal <= 0 || !interestRate || !termMonths || termMonths <= 0) {
      return null;
    }

    // Calculate number of payments based on repayment frequency
    let numberOfPayments: number;
    switch (repaymentFrequency) {
      case 'DAILY':
        numberOfPayments = termMonths * 30;
        break;
      case 'WEEKLY':
        numberOfPayments = termMonths * 4;
        break;
      case 'FORTNIGHTLY':
        numberOfPayments = termMonths * 2;
        break;
      case 'MONTHLY':
      default:
        numberOfPayments = termMonths;
        break;
    }

    // Calculate periodic interest rate based on interest calculation frequency
    const periodsPerYear = PERIODS_PER_YEAR[interestCalcFrequency];
    const periodicInterestRate = interestRate / 100 / periodsPerYear;

    // Calculate repayment periodic rate for reducing balance
    let repaymentPeriodicRate: number;
    switch (repaymentFrequency) {
      case 'DAILY':
        repaymentPeriodicRate = interestRate / 100 / 365;
        break;
      case 'WEEKLY':
        repaymentPeriodicRate = interestRate / 100 / 52;
        break;
      case 'FORTNIGHTLY':
        repaymentPeriodicRate = interestRate / 100 / 26;
        break;
      case 'MONTHLY':
      default:
        repaymentPeriodicRate = interestRate / 100 / 12;
        break;
    }

    const schedule: RepaymentScheduleItem[] = [];
    let balance = principal;
    const startDate = disbursementDate ? new Date(disbursementDate) : new Date();
    let totalInterest = 0;
    let periodicPayment: number;

    if (useReducingBalance) {
      // Reducing Balance Method (Amortization)
      // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
      if (repaymentPeriodicRate === 0) {
        periodicPayment = principal / numberOfPayments;
      } else {
        const factor = Math.pow(1 + repaymentPeriodicRate, numberOfPayments);
        periodicPayment = principal * (repaymentPeriodicRate * factor) / (factor - 1);
      }

      for (let i = 1; i <= numberOfPayments; i++) {
        let dueDate: Date;
        switch (repaymentFrequency) {
          case 'DAILY':
            dueDate = addDays(startDate, i);
            break;
          case 'WEEKLY':
            dueDate = addWeeks(startDate, i);
            break;
          case 'FORTNIGHTLY':
            dueDate = addWeeks(startDate, i * 2);
            break;
          case 'MONTHLY':
          default:
            dueDate = addMonths(startDate, i);
            break;
        }

        const interestPayment = balance * repaymentPeriodicRate;
        const principalPayment = periodicPayment - interestPayment;
        balance = Math.max(0, balance - principalPayment);
        totalInterest += interestPayment;

        schedule.push({
          paymentNo: i,
          dueDate,
          principal: principalPayment,
          interest: interestPayment,
          totalPayment: periodicPayment,
          balance: i === numberOfPayments ? 0 : balance,
        });
      }
    } else {
      // Flat Rate Method - interest based on interest calculation frequency
      // Convert annual rate to the calculation period and then to total term
      const calcPeriodsInTerm = termMonths * (periodsPerYear / 12);
      totalInterest = principal * periodicInterestRate * calcPeriodsInTerm;
      
      const totalRepayment = principal + totalInterest;
      periodicPayment = totalRepayment / numberOfPayments;
      const principalPerPayment = principal / numberOfPayments;
      const interestPerPayment = totalInterest / numberOfPayments;

      for (let i = 1; i <= numberOfPayments; i++) {
        let dueDate: Date;
        switch (repaymentFrequency) {
          case 'DAILY':
            dueDate = addDays(startDate, i);
            break;
          case 'WEEKLY':
            dueDate = addWeeks(startDate, i);
            break;
          case 'FORTNIGHTLY':
            dueDate = addWeeks(startDate, i * 2);
            break;
          case 'MONTHLY':
          default:
            dueDate = addMonths(startDate, i);
            break;
        }

        balance = Math.max(0, balance - principalPerPayment);

        schedule.push({
          paymentNo: i,
          dueDate,
          principal: principalPerPayment,
          interest: interestPerPayment,
          totalPayment: periodicPayment,
          balance: i === numberOfPayments ? 0 : balance,
        });
      }
    }

    const totalRepayment = principal + totalInterest;

    return {
      numberOfPayments,
      periodicPayment,
      totalInterest,
      totalRepayment,
      schedule,
      effectiveRate: ((totalRepayment / principal - 1) / (termMonths / 12)) * 100,
    };
  }, [principal, interestRate, termMonths, repaymentFrequency, disbursementDate, useReducingBalance, interestCalcFrequency]);

  // Calculate penalty impact estimate
  const penaltyEstimate = useMemo(() => {
    if (!calculations || penaltyType === 'NONE' || !penaltyValue) {
      return null;
    }

    // Estimate based on 10% late payments (industry average for MFIs)
    const estimatedLatePayments = Math.ceil(calculations.numberOfPayments * 0.1);
    let estimatedPenalty = 0;

    switch (penaltyType) {
      case 'FLAT_AMOUNT':
        estimatedPenalty = penaltyValue * estimatedLatePayments;
        break;
      case 'PERCENT_OVERDUE':
        // Assume average overdue is 2 installments
        estimatedPenalty = (calculations.periodicPayment * 2) * (penaltyValue / 100) * estimatedLatePayments;
        break;
      case 'PERCENT_INSTALLMENT':
        estimatedPenalty = calculations.periodicPayment * (penaltyValue / 100) * estimatedLatePayments;
        break;
      case 'DAILY_RATE':
        // Assume average 7 days late
        const avgDaysLate = 7;
        estimatedPenalty = calculations.periodicPayment * (penaltyValue / 100) * avgDaysLate * estimatedLatePayments;
        break;
    }

    return {
      estimatedLatePayments,
      estimatedPenalty,
      worstCase: estimatedPenalty * 3, // If all payments are late
      totalWithPenalty: calculations.totalRepayment + estimatedPenalty,
    };
  }, [calculations, penaltyType, penaltyValue]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!principal || principal <= 0 || !interestRate || !termMonths || termMonths <= 0) {
      return null;
    }

    let numberOfPayments: number;
    let repaymentPeriodicRate: number;
    
    switch (repaymentFrequency) {
      case 'DAILY':
        numberOfPayments = termMonths * 30;
        repaymentPeriodicRate = interestRate / 100 / 365;
        break;
      case 'WEEKLY':
        numberOfPayments = termMonths * 4;
        repaymentPeriodicRate = interestRate / 100 / 52;
        break;
      case 'FORTNIGHTLY':
        numberOfPayments = termMonths * 2;
        repaymentPeriodicRate = interestRate / 100 / 26;
        break;
      case 'MONTHLY':
      default:
        numberOfPayments = termMonths;
        repaymentPeriodicRate = interestRate / 100 / 12;
        break;
    }

    // Flat rate total interest (using the configured frequency)
    const periodsPerYear = PERIODS_PER_YEAR[interestCalcFrequency];
    const periodicInterestRate = interestRate / 100 / periodsPerYear;
    const calcPeriodsInTerm = termMonths * (periodsPerYear / 12);
    const flatInterest = principal * periodicInterestRate * calcPeriodsInTerm;

    // Reducing balance total interest
    let reducingInterest = 0;
    if (repaymentPeriodicRate > 0) {
      const factor = Math.pow(1 + repaymentPeriodicRate, numberOfPayments);
      const pmt = principal * (repaymentPeriodicRate * factor) / (factor - 1);
      reducingInterest = (pmt * numberOfPayments) - principal;
    }

    return {
      flatInterest,
      reducingInterest,
      savings: flatInterest - reducingInterest,
    };
  }, [principal, interestRate, termMonths, repaymentFrequency, interestCalcFrequency]);

  if (!calculations) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Enter loan details to see repayment preview</p>
        </CardContent>
      </Card>
    );
  }

  const displaySchedule = calculations.schedule.length > 15
    ? [
        ...calculations.schedule.slice(0, 6),
        null,
        ...calculations.schedule.slice(-3),
      ]
    : calculations.schedule;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Loan Calculator Preview
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {REPAYMENT_FREQ_LABELS[repaymentFrequency]} Repayments
            </Badge>
            <Badge variant="outline">
              {useReducingBalance ? 'Reducing Balance' : 'Flat Rate'}
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              Interest: {INTEREST_FREQ_LABELS[interestCalcFrequency]}
            </Badge>
          </div>
        </div>
        
        {/* Interest Method Info */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {useReducingBalance ? 'Reducing Balance' : 'Flat Rate'} @ {interestRate}% p.a.
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Interest Calculation: {INTEREST_FREQ_LABELS[interestCalcFrequency]}</p>
                  <p className="text-xs mb-2">
                    Interest is calculated {INTEREST_FREQ_LABELS[interestCalcFrequency].toLowerCase()} 
                    ({PERIODS_PER_YEAR[interestCalcFrequency]} periods/year).
                  </p>
                  <p className="font-medium mb-1">{useReducingBalance ? 'Reducing Balance:' : 'Flat Rate:'}</p>
                  <p className="text-xs">
                    {useReducingBalance 
                      ? 'Interest calculated on remaining balance. Lower total interest as principal reduces.'
                      : 'Interest calculated on original principal throughout. Common in Ghana MFIs.'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm text-muted-foreground">
            {interestRate / PERIODS_PER_YEAR[interestCalcFrequency]}% per {INTEREST_FREQ_LABELS[interestCalcFrequency].toLowerCase().replace('ly', '')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-3 w-3" />
              {REPAYMENT_FREQ_LABELS[repaymentFrequency]} Payment
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(calculations.periodicPayment)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" />
              Total Interest
            </div>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(calculations.totalInterest)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calculator className="h-3 w-3" />
              Total Repayment
            </div>
            <p className="text-lg font-bold">
              {formatCurrency(calculations.totalRepayment)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="h-3 w-3" />
              No. of Payments
            </div>
            <p className="text-lg font-bold">
              {calculations.numberOfPayments}
            </p>
          </div>
        </div>

        {/* Penalty Impact Estimate */}
        {penaltyEstimate && (
          <div className="rounded-lg p-3 text-sm border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Late Payment Penalty Impact (Estimated)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Penalty Type:</p>
                <p className="font-medium capitalize">
                  {penaltyType.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Penalty Rate/Amount:</p>
                <p className="font-medium">
                  {penaltyType === 'FLAT_AMOUNT' 
                    ? formatCurrency(penaltyValue)
                    : `${penaltyValue}%`
                  }
                  {penaltyGraceDays > 0 && ` (after ${penaltyGraceDays} days)`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. Penalty (10% late):</p>
                <p className="font-medium text-orange-600">
                  + {formatCurrency(penaltyEstimate.estimatedPenalty)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total with Penalty:</p>
                <p className="font-medium">
                  {formatCurrency(penaltyEstimate.totalWithPenalty)}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800 text-xs text-muted-foreground">
              <p>
                * Estimate assumes {penaltyEstimate.estimatedLatePayments} late payments ({Math.round(penaltyEstimate.estimatedLatePayments / calculations.numberOfPayments * 100)}% of total).
                Worst case (all late): +{formatCurrency(penaltyEstimate.worstCase)}
              </p>
            </div>
          </div>
        )}

        {/* Comparison Card */}
        {comparisonData && comparisonData.savings > 0 && (
          <div className={`rounded-lg p-3 text-sm border ${useReducingBalance ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${useReducingBalance ? 'text-green-600' : 'text-blue-600'}`} />
              <span className="font-medium">Interest Method Comparison</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">Flat Rate Interest:</p>
                <p className="font-medium">{formatCurrency(comparisonData.flatInterest)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reducing Balance Interest:</p>
                <p className="font-medium">{formatCurrency(comparisonData.reducingInterest)}</p>
              </div>
            </div>
            <div className={`mt-2 pt-2 border-t ${useReducingBalance ? 'border-green-200 dark:border-green-800' : 'border-blue-200 dark:border-blue-800'}`}>
              <p className={`font-medium ${useReducingBalance ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {useReducingBalance 
                  ? `You save ${formatCurrency(comparisonData.savings)} with reducing balance!`
                  : `Switch to reducing balance to save ${formatCurrency(comparisonData.savings)}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex justify-between mb-1">
            <span>Principal Amount:</span>
            <span className="font-medium">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Interest ({interestRate}% p.a. {useReducingBalance ? 'reducing' : 'flat'}, {INTEREST_FREQ_LABELS[interestCalcFrequency].toLowerCase()} calc):</span>
            <span className="font-medium text-amber-600">+ {formatCurrency(calculations.totalInterest)}</span>
          </div>
          {penaltyEstimate && (
            <div className="flex justify-between mb-1 text-orange-600">
              <span>Est. Late Penalties (if 10% late):</span>
              <span className="font-medium">+ {formatCurrency(penaltyEstimate.estimatedPenalty)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total Amount Payable:</span>
            <span>{formatCurrency(calculations.totalRepayment)}</span>
          </div>
          {penaltyEstimate && (
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>With Est. Penalties:</span>
              <span>{formatCurrency(penaltyEstimate.totalWithPenalty)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Effective Annual Rate:</span>
            <span>{calculations.effectiveRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Repayment Schedule */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Repayment Schedule Preview
            <Badge variant="outline" className="text-xs">
              {useReducingBalance ? 'Reducing Balance' : 'Flat Rate'}
            </Badge>
          </h4>
          <ScrollArea className="h-64 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySchedule.map((item, index) => {
                  if (item === null) {
                    return (
                      <TableRow key="ellipsis" className="bg-muted/30">
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-2">
                          ... {calculations.numberOfPayments - 9} more payments ...
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={item.paymentNo} className={item.paymentNo === 1 ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                      <TableCell className="font-medium">{item.paymentNo}</TableCell>
                      <TableCell>{format(item.dueDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.principal)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(item.interest)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalPayment)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.balance)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-500">Note:</p>
            <p>
              This is an estimated schedule using <strong>{useReducingBalance ? 'reducing balance' : 'flat rate'}</strong> calculation 
              with <strong>{INTEREST_FREQ_LABELS[interestCalcFrequency].toLowerCase()}</strong> interest compounding.
              {useReducingBalance 
                ? ' With reducing balance, interest decreases as principal is paid down, resulting in lower total interest.'
                : ' With flat rate, interest is calculated on the original principal, resulting in higher total interest compared to reducing balance.'
              }
              {penaltyType !== 'NONE' && ' Penalty estimates assume 10% of payments are late.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
