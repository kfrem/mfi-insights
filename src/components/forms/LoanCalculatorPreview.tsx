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
import { Calculator, Calendar, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface LoanCalculatorPreviewProps {
  principal: number;
  interestRate: number;
  termMonths: number;
  repaymentFrequency: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  disbursementDate: string;
}

interface RepaymentScheduleItem {
  paymentNo: number;
  dueDate: Date;
  principal: number;
  interest: number;
  totalPayment: number;
  balance: number;
}

export function LoanCalculatorPreview({
  principal,
  interestRate,
  termMonths,
  repaymentFrequency,
  disbursementDate,
}: LoanCalculatorPreviewProps) {
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

    // Calculate number of payments based on frequency
    let numberOfPayments: number;
    let periodicRate: number;
    
    switch (repaymentFrequency) {
      case 'DAILY':
        numberOfPayments = termMonths * 30; // Approximate days in term
        periodicRate = interestRate / 100 / 365;
        break;
      case 'WEEKLY':
        numberOfPayments = termMonths * 4; // Approximate weeks
        periodicRate = interestRate / 100 / 52;
        break;
      case 'BI_WEEKLY':
        numberOfPayments = termMonths * 2; // Approximate bi-weeks
        periodicRate = interestRate / 100 / 26;
        break;
      case 'MONTHLY':
      default:
        numberOfPayments = termMonths;
        periodicRate = interestRate / 100 / 12;
        break;
    }

    // Calculate using flat rate (common in Ghana MFIs)
    const totalInterest = principal * (interestRate / 100) * (termMonths / 12);
    const totalRepayment = principal + totalInterest;
    const periodicPayment = totalRepayment / numberOfPayments;
    const principalPerPayment = principal / numberOfPayments;
    const interestPerPayment = totalInterest / numberOfPayments;

    // Generate schedule (show first 12 and last 3 payments for long schedules)
    const schedule: RepaymentScheduleItem[] = [];
    let balance = principal;
    const startDate = disbursementDate ? new Date(disbursementDate) : new Date();

    for (let i = 1; i <= numberOfPayments; i++) {
      let dueDate: Date;
      switch (repaymentFrequency) {
        case 'DAILY':
          dueDate = addDays(startDate, i);
          break;
        case 'WEEKLY':
          dueDate = addWeeks(startDate, i);
          break;
        case 'BI_WEEKLY':
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

    return {
      numberOfPayments,
      periodicPayment,
      totalInterest,
      totalRepayment,
      principalPerPayment,
      interestPerPayment,
      schedule,
      effectiveRate: ((totalRepayment / principal - 1) / (termMonths / 12)) * 100,
    };
  }, [principal, interestRate, termMonths, repaymentFrequency, disbursementDate]);

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

  const frequencyLabels = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    BI_WEEKLY: 'Bi-Weekly',
    MONTHLY: 'Monthly',
  };

  // For display, show limited schedule rows
  const displaySchedule = calculations.schedule.length > 15
    ? [
        ...calculations.schedule.slice(0, 6),
        null, // Placeholder for "..."
        ...calculations.schedule.slice(-3),
      ]
    : calculations.schedule;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Loan Calculator Preview
          <Badge variant="secondary" className="ml-auto">
            {frequencyLabels[repaymentFrequency]} Repayments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-3 w-3" />
              {frequencyLabels[repaymentFrequency]} Payment
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

        {/* Cost Breakdown */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex justify-between mb-1">
            <span>Principal Amount:</span>
            <span className="font-medium">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Interest ({interestRate}% p.a. flat):</span>
            <span className="font-medium text-amber-600">+ {formatCurrency(calculations.totalInterest)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total Amount Payable:</span>
            <span>{formatCurrency(calculations.totalRepayment)}</span>
          </div>
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
            <p>This is an estimated schedule using flat rate calculation. Actual payments may vary based on the institution's specific interest calculation method (flat vs. reducing balance) and any applicable fees or charges.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
