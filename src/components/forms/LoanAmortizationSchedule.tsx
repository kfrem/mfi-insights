import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, TrendingDown, AlertTriangle, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface AmortizationScheduleProps {
  principal: number;
  interestRate: number; // Annual rate as percentage
  termMonths: number;
  interestMethod: 'FLAT' | 'REDUCING_BALANCE';
  interestCalcFrequency: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  repaymentFrequency: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
  penaltyType: 'NONE' | 'FLAT_AMOUNT' | 'PERCENTAGE_OVERDUE' | 'PERCENTAGE_INSTALLMENT' | 'DAILY_RATE';
  penaltyValue?: number;
  penaltyGraceDays?: number;
  startDate: string;
  showFullSchedule?: boolean;
}

interface ScheduleRow {
  paymentNumber: number;
  dueDate: Date;
  openingBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  closingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  estimatedPenalty: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GH', { 
    style: 'currency', 
    currency: 'GHS', 
    minimumFractionDigits: 2 
  }).format(value);
};

// Calculate number of payments based on repayment frequency and term
const getNumberOfPayments = (termMonths: number, frequency: string): number => {
  switch (frequency) {
    case 'DAILY': return termMonths * 30; // Approximate
    case 'WEEKLY': return termMonths * 4;
    case 'BI_WEEKLY':
    case 'FORTNIGHTLY': return termMonths * 2;
    case 'MONTHLY': return termMonths;
    default: return termMonths;
  }
};

// Get next payment date based on frequency
const getNextPaymentDate = (currentDate: Date, frequency: string): Date => {
  switch (frequency) {
    case 'DAILY': return addDays(currentDate, 1);
    case 'WEEKLY': return addWeeks(currentDate, 1);
    case 'BI_WEEKLY':
    case 'FORTNIGHTLY': return addWeeks(currentDate, 2);
    case 'MONTHLY': return addMonths(currentDate, 1);
    default: return addMonths(currentDate, 1);
  }
};

// Get periods per year for interest calculation
const getPeriodsPerYear = (frequency: string): number => {
  switch (frequency) {
    case 'DAILY': return 365;
    case 'WEEKLY': return 52;
    case 'FORTNIGHTLY':
    case 'BI_WEEKLY': return 26;
    case 'MONTHLY': return 12;
    case 'QUARTERLY': return 4;
    case 'ANNUALLY': return 1;
    default: return 12;
  }
};

// Calculate estimated penalty for a late payment
const calculatePenalty = (
  penaltyType: string,
  penaltyValue: number,
  overdueAmount: number,
  installmentAmount: number,
  daysLate: number = 5 // Default assumption for estimation
): number => {
  if (!penaltyValue || penaltyType === 'NONE') return 0;
  
  switch (penaltyType) {
    case 'FLAT_AMOUNT':
      return penaltyValue;
    case 'PERCENTAGE_OVERDUE':
      return (overdueAmount * penaltyValue) / 100;
    case 'PERCENTAGE_INSTALLMENT':
      return (installmentAmount * penaltyValue) / 100;
    case 'DAILY_RATE':
      return (overdueAmount * penaltyValue * daysLate) / 100;
    default:
      return 0;
  }
};

export function LoanAmortizationSchedule({
  principal,
  interestRate,
  termMonths,
  interestMethod,
  interestCalcFrequency,
  repaymentFrequency,
  penaltyType,
  penaltyValue = 0,
  penaltyGraceDays = 0,
  startDate,
  showFullSchedule = true,
}: AmortizationScheduleProps) {
  const [expanded, setExpanded] = useState(false);
  
  const schedule = useMemo<ScheduleRow[]>(() => {
    const rows: ScheduleRow[] = [];
    const numberOfPayments = getNumberOfPayments(termMonths, repaymentFrequency);
    const periodsPerYear = getPeriodsPerYear(interestCalcFrequency);
    const ratePerPeriod = interestRate / 100 / periodsPerYear;
    
    let balance = principal;
    let currentDate = new Date(startDate);
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    
    if (interestMethod === 'FLAT') {
      // Flat rate: Total interest is calculated upfront on original principal
      const totalInterest = (principal * interestRate * termMonths) / (12 * 100);
      const totalRepayable = principal + totalInterest;
      const monthlyPayment = totalRepayable / numberOfPayments;
      const principalPerPayment = principal / numberOfPayments;
      const interestPerPayment = totalInterest / numberOfPayments;
      
      for (let i = 1; i <= numberOfPayments; i++) {
        currentDate = getNextPaymentDate(currentDate, repaymentFrequency);
        cumulativePrincipal += principalPerPayment;
        cumulativeInterest += interestPerPayment;
        
        const estimatedPenalty = calculatePenalty(
          penaltyType,
          penaltyValue,
          monthlyPayment,
          monthlyPayment
        );
        
        rows.push({
          paymentNumber: i,
          dueDate: currentDate,
          openingBalance: balance,
          principalPayment: principalPerPayment,
          interestPayment: interestPerPayment,
          totalPayment: monthlyPayment,
          closingBalance: Math.max(0, balance - principalPerPayment),
          cumulativePrincipal,
          cumulativeInterest,
          estimatedPenalty,
        });
        
        balance -= principalPerPayment;
      }
    } else {
      // Reducing balance: Interest calculated on remaining principal
      // PMT formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const paymentPeriodsPerYear = getPeriodsPerYear(repaymentFrequency);
      const effectiveRate = interestRate / 100 / paymentPeriodsPerYear;
      
      // Calculate fixed payment amount using PMT formula
      const pmt = effectiveRate > 0
        ? (principal * effectiveRate * Math.pow(1 + effectiveRate, numberOfPayments)) /
          (Math.pow(1 + effectiveRate, numberOfPayments) - 1)
        : principal / numberOfPayments;
      
      for (let i = 1; i <= numberOfPayments; i++) {
        currentDate = getNextPaymentDate(currentDate, repaymentFrequency);
        
        const interestPayment = balance * effectiveRate;
        const principalPayment = Math.min(pmt - interestPayment, balance);
        const totalPayment = principalPayment + interestPayment;
        
        cumulativePrincipal += principalPayment;
        cumulativeInterest += interestPayment;
        
        const estimatedPenalty = calculatePenalty(
          penaltyType,
          penaltyValue,
          totalPayment,
          pmt
        );
        
        rows.push({
          paymentNumber: i,
          dueDate: currentDate,
          openingBalance: balance,
          principalPayment,
          interestPayment,
          totalPayment,
          closingBalance: Math.max(0, balance - principalPayment),
          cumulativePrincipal,
          cumulativeInterest,
          estimatedPenalty,
        });
        
        balance = Math.max(0, balance - principalPayment);
      }
    }
    
    return rows;
  }, [principal, interestRate, termMonths, interestMethod, interestCalcFrequency, repaymentFrequency, penaltyType, penaltyValue, startDate]);

  const totals = useMemo(() => {
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalPayment, 0);
    const totalInterest = schedule.reduce((sum, row) => sum + row.interestPayment, 0);
    const totalPayments = schedule.reduce((sum, row) => sum + row.totalPayment, 0);
    const totalPenalties = schedule.reduce((sum, row) => sum + row.estimatedPenalty, 0);
    
    return { totalPrincipal, totalInterest, totalPayments, totalPenalties };
  }, [schedule]);

  const displayedSchedule = expanded || !showFullSchedule 
    ? schedule 
    : schedule.slice(0, 6);

  const frequencyLabel = {
    'DAILY': 'Daily',
    'WEEKLY': 'Weekly',
    'BI_WEEKLY': 'Bi-Weekly',
    'FORTNIGHTLY': 'Fortnightly',
    'MONTHLY': 'Monthly',
  }[repaymentFrequency] || 'Monthly';

  const penaltyLabel = {
    'NONE': 'None',
    'FLAT_AMOUNT': `${formatCurrency(penaltyValue)} flat`,
    'PERCENTAGE_OVERDUE': `${penaltyValue}% of overdue`,
    'PERCENTAGE_INSTALLMENT': `${penaltyValue}% of installment`,
    'DAILY_RATE': `${penaltyValue}% daily`,
  }[penaltyType] || 'None';

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Amortization Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {schedule.length} payments
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {frequencyLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Principal</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(totals.totalPrincipal)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Interest</p>
            <p className="text-sm font-semibold text-amber-600">{formatCurrency(totals.totalInterest)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Repayable</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(totals.totalPayments)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Potential Penalties</p>
            <p className="text-sm font-semibold text-destructive">{formatCurrency(totals.totalPenalties)}</p>
          </div>
        </div>

        {/* Penalty Info */}
        {penaltyType !== 'NONE' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>
              Late penalty: <strong>{penaltyLabel}</strong>
              {penaltyGraceDays > 0 && ` (${penaltyGraceDays} day grace period)`}
            </span>
          </div>
        )}

        {/* Schedule Table */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="mt-3">
            <ScrollArea className={showFullSchedule && expanded ? "h-[400px]" : "h-auto"}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-right text-xs">Principal</TableHead>
                    <TableHead className="text-right text-xs">Interest</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                    <TableHead className="text-right text-xs">Balance</TableHead>
                    {penaltyType !== 'NONE' && (
                      <TableHead className="text-right text-xs">Penalty*</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSchedule.map((row) => (
                    <TableRow key={row.paymentNumber} className="text-xs">
                      <TableCell className="font-medium">{row.paymentNumber}</TableCell>
                      <TableCell>{format(row.dueDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(row.interestPayment)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.totalPayment)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(row.closingBalance)}</TableCell>
                      {penaltyType !== 'NONE' && (
                        <TableCell className="text-right text-destructive">{formatCurrency(row.estimatedPenalty)}</TableCell>
                      )}
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-medium text-xs">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalPrincipal)}</TableCell>
                    <TableCell className="text-right text-amber-600">{formatCurrency(totals.totalInterest)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalPayments)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    {penaltyType !== 'NONE' && (
                      <TableCell className="text-right text-destructive">{formatCurrency(totals.totalPenalties)}</TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="cumulative" className="mt-3">
            <ScrollArea className={showFullSchedule && expanded ? "h-[400px]" : "h-auto"}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-right text-xs">Cum. Principal</TableHead>
                    <TableHead className="text-right text-xs">Cum. Interest</TableHead>
                    <TableHead className="text-right text-xs">Cum. Total</TableHead>
                    <TableHead className="text-right text-xs">% Complete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSchedule.map((row) => {
                    const percentComplete = (row.cumulativePrincipal / principal) * 100;
                    return (
                      <TableRow key={row.paymentNumber} className="text-xs">
                        <TableCell className="font-medium">{row.paymentNumber}</TableCell>
                        <TableCell>{format(row.dueDate, 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.cumulativePrincipal)}</TableCell>
                        <TableCell className="text-right text-amber-600">{formatCurrency(row.cumulativeInterest)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.cumulativePrincipal + row.cumulativeInterest)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={percentComplete >= 100 ? 'default' : 'outline'} className="text-xs">
                            {percentComplete.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Expand/Collapse Button */}
        {showFullSchedule && schedule.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {schedule.length} Payments
              </>
            )}
          </Button>
        )}

        {penaltyType !== 'NONE' && (
          <p className="text-xs text-muted-foreground text-center">
            * Estimated penalty assumes 5 days late payment after grace period
          </p>
        )}
      </CardContent>
    </Card>
  );
}