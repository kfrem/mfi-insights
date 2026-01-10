import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ClientSearchSelect } from './ClientSearchSelect';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateLoan, useClients, useClientExposure } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useTierLoanLimits } from '@/hooks/useBogTiers';
import { Loader2, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { LOAN_CATEGORIES, getLoanProduct, getLoanProductsByCategory } from '@/data/ghanaLoanTypes';
import { LoanCalculatorPreview } from './LoanCalculatorPreview';
import { LoanAffordabilityCheck } from './LoanAffordabilityCheck';
import { BOG_TIER_LABELS } from '@/types/bogTiers';

// Interest calculation frequency options
const INTEREST_CALC_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily', description: 'Interest calculated daily' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Interest calculated weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly', description: 'Interest calculated every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly', description: 'Interest calculated monthly' },
  { value: 'QUARTERLY', label: 'Quarterly', description: 'Interest calculated every 3 months' },
  { value: 'ANNUALLY', label: 'Annually', description: 'Interest calculated yearly' },
] as const;

// Late payment penalty types
const PENALTY_TYPES = [
  { value: 'NONE', label: 'No Penalty', description: 'No late payment charges' },
  { value: 'FLAT_AMOUNT', label: 'Flat Amount', description: 'Fixed GHS amount per late payment' },
  { value: 'PERCENTAGE_OVERDUE', label: '% of Overdue', description: 'Percentage of overdue amount' },
  { value: 'PERCENTAGE_INSTALLMENT', label: '% of Installment', description: 'Percentage of missed installment' },
  { value: 'DAILY_RATE', label: 'Daily Rate', description: 'Daily percentage on overdue balance' },
] as const;

const loanSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  loan_category: z.string().min(1, 'Please select a loan category'),
  loan_product: z.string().min(1, 'Please select a loan product'),
  principal: z.coerce.number().min(100, 'Minimum principal is GHS 100').max(5000000, 'Maximum principal is GHS 5,000,000'),
  interest_rate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  interest_calc_frequency: z.enum(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'], { required_error: 'Select interest calculation frequency' }),
  interest_method: z.enum(['FLAT', 'REDUCING_BALANCE'], { required_error: 'Select interest method' }),
  term_months: z.coerce.number().min(1, 'Minimum term is 1 month').max(240, 'Maximum term is 240 months'),
  disbursement_date: z.string().min(1, 'Disbursement date is required'),
  purpose: z.string().min(10, 'Please describe the loan purpose (min 10 characters)').max(500),
  repayment_frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'], { required_error: 'Select repayment frequency' }),
  // Late payment penalty settings (optional)
  penalty_type: z.enum(['NONE', 'FLAT_AMOUNT', 'PERCENTAGE_OVERDUE', 'PERCENTAGE_INSTALLMENT', 'DAILY_RATE']).default('NONE'),
  penalty_value: z.coerce.number().min(0).optional(),
  penalty_grace_days: z.coerce.number().min(0).max(30).optional(),
  // Collateral & Guarantor
  collateral_type: z.string().optional(),
  collateral_value: z.coerce.number().min(0).optional(),
  guarantor_name: z.string().max(200).optional(),
  guarantor_phone: z.string().max(20).optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function CreateLoanForm() {
  const { selectedOrgId } = useOrganisation();
  const createLoan = useCreateLoan();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { settings: tierSettings, tierConfig, maxLoanAmount, singleObligorLimit, singleObligorPercent, isNetWorthConfigured } = useTierLoanLimits();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      client_id: '',
      loan_category: '',
      loan_product: '',
      principal: 5000,
      interest_rate: 30,
      interest_calc_frequency: 'MONTHLY',
      interest_method: 'FLAT',
      term_months: 12,
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
      purpose: '',
      repayment_frequency: 'MONTHLY',
      penalty_type: 'NONE',
      penalty_value: 0,
      penalty_grace_days: 3,
      collateral_type: '',
      collateral_value: 0,
      guarantor_name: '',
      guarantor_phone: '',
    },
  });

  const watchLoanProduct = form.watch('loan_product');
  const watchClientId = form.watch('client_id');
  
  // Fetch client's existing loan exposure
  const { data: clientExposure, isLoading: exposureLoading } = useClientExposure(watchClientId || null);
  
  // Watch form values for calculator preview
  const watchedValues = useWatch({
    control: form.control,
    name: ['principal', 'interest_rate', 'term_months', 'repayment_frequency', 'disbursement_date'],
  });
  
  const [watchedPrincipal, watchedInterestRate, watchedTermMonths, watchedFrequency, watchedDisbursementDate] = watchedValues;

  // Calculate total exposure including new loan
  const existingExposure = clientExposure?.totalExposure || 0;
  const proposedTotalExposure = existingExposure + (watchedPrincipal || 0);

  // Get selected client's financial info for affordability check
  const selectedClient = useMemo(() => {
    if (!watchClientId || !clients) return null;
    return clients.find(c => c.client_id === watchClientId);
  }, [watchClientId, clients]);

  // Calculate monthly repayment for affordability check (using flat rate)
  const monthlyRepayment = useMemo(() => {
    if (!watchedPrincipal || !watchedInterestRate || !watchedTermMonths) return 0;
    const totalInterest = watchedPrincipal * (watchedInterestRate / 100) * (watchedTermMonths / 12);
    const totalRepayment = watchedPrincipal + totalInterest;
    
    // Convert to monthly equivalent based on frequency
    let numberOfPayments: number;
    switch (watchedFrequency) {
      case 'DAILY':
        numberOfPayments = watchedTermMonths * 30;
        break;
      case 'WEEKLY':
        numberOfPayments = watchedTermMonths * 4;
        break;
      case 'BI_WEEKLY':
        numberOfPayments = watchedTermMonths * 2;
        break;
      case 'MONTHLY':
      default:
        numberOfPayments = watchedTermMonths;
        break;
    }
    
    const periodicPayment = totalRepayment / numberOfPayments;
    
    // Convert to monthly equivalent
    switch (watchedFrequency) {
      case 'DAILY':
        return periodicPayment * 30;
      case 'WEEKLY':
        return periodicPayment * 4;
      case 'BI_WEEKLY':
        return periodicPayment * 2;
      case 'MONTHLY':
      default:
        return periodicPayment;
    }
  }, [watchedPrincipal, watchedInterestRate, watchedTermMonths, watchedFrequency]);
  
  const productOptions = useMemo(() => {
    return selectedCategory ? getLoanProductsByCategory(selectedCategory) : [];
  }, [selectedCategory]);

  const selectedProductInfo = useMemo(() => {
    return watchLoanProduct ? getLoanProduct(watchLoanProduct) : null;
  }, [watchLoanProduct]);

  // Auto-fill typical rate when product is selected
  const handleProductChange = (productCode: string) => {
    form.setValue('loan_product', productCode);
    const product = getLoanProduct(productCode);
    if (product) {
      form.setValue('interest_rate', product.typicalRate);
      // Set default term to minimum
      if (form.getValues('term_months') < product.minTerm) {
        form.setValue('term_months', product.minTerm);
      }
      if (form.getValues('term_months') > product.maxTerm) {
        form.setValue('term_months', product.maxTerm);
      }
    }
  };

  const onSubmit = async (values: LoanFormValues) => {
    if (!selectedOrgId) return;

    // Map form repayment_frequency to DB enum
    const mapRepaymentFrequency = (freq: string): 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' => {
      if (freq === 'BI_WEEKLY') return 'FORTNIGHTLY';
      return freq as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    };

    // Map form penalty_type to DB enum
    const mapPenaltyType = (type: string): 'NONE' | 'FLAT_AMOUNT' | 'PERCENT_OVERDUE' | 'PERCENT_INSTALLMENT' | 'DAILY_RATE' => {
      const mapping: Record<string, 'NONE' | 'FLAT_AMOUNT' | 'PERCENT_OVERDUE' | 'PERCENT_INSTALLMENT' | 'DAILY_RATE'> = {
        'NONE': 'NONE',
        'FLAT_AMOUNT': 'FLAT_AMOUNT',
        'PERCENTAGE_OVERDUE': 'PERCENT_OVERDUE',
        'PERCENTAGE_INSTALLMENT': 'PERCENT_INSTALLMENT',
        'DAILY_RATE': 'DAILY_RATE',
      };
      return mapping[type] || 'NONE';
    };

    await createLoan.mutateAsync({
      org_id: selectedOrgId,
      client_id: values.client_id,
      loan_type: values.loan_product, // Map loan_product to loan_type
      purpose: values.purpose || undefined,
      principal: values.principal,
      interest_rate: values.interest_rate,
      term_months: values.term_months,
      interest_method: values.interest_method as 'FLAT' | 'REDUCING_BALANCE',
      interest_calc_frequency: values.interest_calc_frequency as 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
      repayment_frequency: mapRepaymentFrequency(values.repayment_frequency),
      penalty_type: mapPenaltyType(values.penalty_type),
      penalty_value: values.penalty_value || 0,
      penalty_grace_days: values.penalty_grace_days || 0,
      disbursement_date: values.disbursement_date,
    });

    form.reset();
    setSelectedCategory('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
  };

  // Check if principal exceeds tier limit or single obligor limit (using total exposure)
  const exceedsTierLimit = maxLoanAmount && watchedPrincipal > maxLoanAmount;
  const exceedsSingleObligorLimit = singleObligorLimit && proposedTotalExposure > singleObligorLimit;
  const tierLabel = tierSettings?.bog_tier ? BOG_TIER_LABELS[tierSettings.bog_tier] : null;

  return (
    <div className="form-section">
      <h2 className="text-lg font-semibold mb-2">Create New Loan</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select a loan product and configure the terms for disbursement
      </p>

      {/* Tier Limit Info */}
      {tierSettings && tierLabel && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <Badge className={`${tierLabel.color} text-white`}>{tierLabel.shortName}</Badge>
            <span>
              {maxLoanAmount 
                ? `Max loan: ${formatCurrency(maxLoanAmount)}`
                : 'No per-borrower limit'}
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              Single Obligor: {singleObligorLimit 
                ? formatCurrency(singleObligorLimit)
                : `${singleObligorPercent}% of net worth (not configured)`}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Net Worth Not Configured Warning */}
      {tierSettings && !isNetWorthConfigured && (
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Institution net worth is not configured. Go to Settings → Organisation to set net worth for single obligor limit validation.
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Limit Warning */}
      {exceedsTierLimit && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Principal of {formatCurrency(watchedPrincipal)} exceeds the BoG tier limit of {formatCurrency(maxLoanAmount!)} for {tierLabel?.name}.
          </AlertDescription>
        </Alert>
      )}

      {/* Single Obligor Limit Warning - based on total exposure */}
      {exceedsSingleObligorLimit && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Single Obligor Limit Breach:</strong> Total exposure of {formatCurrency(proposedTotalExposure)} 
            (Existing: {formatCurrency(existingExposure)} + New: {formatCurrency(watchedPrincipal)}) 
            exceeds the limit of {formatCurrency(singleObligorLimit!)} ({singleObligorPercent}% of net worth).
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Client Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Client
            </h3>
            
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client *</FormLabel>
                  <FormControl>
                    <ClientSearchSelect
                      clients={clients}
                      isLoading={clientsLoading}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search by name, Ghana Card, or phone..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Client Summary */}
            {selectedClient && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Full Name</p>
                      <p className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Ghana Card</p>
                      <p className="font-medium font-mono text-xs">{selectedClient.ghana_card_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Monthly Income</p>
                      <p className="font-medium text-green-600">
                        {selectedClient.monthly_income ? formatCurrency(selectedClient.monthly_income) : 'Not declared'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Monthly Expenses</p>
                      <p className="font-medium text-amber-600">
                        {selectedClient.monthly_expenses ? formatCurrency(selectedClient.monthly_expenses) : 'Not declared'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Current Exposure</p>
                      {exposureLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <p className={`font-medium ${existingExposure > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {existingExposure > 0 
                            ? `${formatCurrency(existingExposure)} (${clientExposure?.loanCount} loan${clientExposure?.loanCount !== 1 ? 's' : ''})`
                            : 'No active loans'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Exposure Summary Card when client has existing loans */}
                  {existingExposure > 0 && singleObligorLimit && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Existing:</span>
                          <Badge variant="secondary">{formatCurrency(existingExposure)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">+ New Loan:</span>
                          <Badge variant="outline">{formatCurrency(watchedPrincipal || 0)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">=</span>
                          <Badge variant={exceedsSingleObligorLimit ? "destructive" : "default"}>
                            {formatCurrency(proposedTotalExposure)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">/ Limit:</span>
                          <Badge variant="outline">{formatCurrency(singleObligorLimit)}</Badge>
                        </div>
                        <div className={`font-medium ${exceedsSingleObligorLimit ? 'text-destructive' : 'text-green-600'}`}>
                          ({((proposedTotalExposure / singleObligorLimit) * 100).toFixed(1)}% utilization)
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section: Loan Product */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Loan Product
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loan_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Category *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                        form.setValue('loan_product', '');
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOAN_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.code} value={cat.code}>
                            <div className="flex flex-col">
                              <span>{cat.name}</span>
                              <span className="text-xs text-muted-foreground">{cat.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loan_product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Product *</FormLabel>
                    <Select 
                      onValueChange={handleProductChange} 
                      value={field.value}
                      disabled={!selectedCategory}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCategory ? "Select product" : "Select category first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product.code} value={product.code}>
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">{product.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Info Card */}
            {selectedProductInfo && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedProductInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedProductInfo.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount Range</p>
                      <p className="font-medium">{formatCurrency(selectedProductInfo.minAmount)} - {formatCurrency(selectedProductInfo.maxAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term Range</p>
                      <p className="font-medium">{selectedProductInfo.minTerm} - {selectedProductInfo.maxTerm} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Typical Rate</p>
                      <p className="font-medium">{selectedProductInfo.typicalRate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Collateral</p>
                      <Badge variant={selectedProductInfo.requiresCollateral ? "destructive" : "secondary"}>
                        {selectedProductInfo.requiresCollateral ? "Required" : "Not Required"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: {selectedProductInfo.targetGroup}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section: Loan Terms */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Loan Terms
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount (GHS) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="100" min="100" {...field} />
                    </FormControl>
                    {selectedProductInfo && (
                      <FormDescription>
                        Range: {formatCurrency(selectedProductInfo.minAmount)} - {formatCurrency(selectedProductInfo.maxAmount)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" max="100" {...field} />
                    </FormControl>
                    <FormDescription>Based on calculation frequency below</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interest Calculation Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="interest_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FLAT">Flat Rate</SelectItem>
                        <SelectItem value="REDUCING_BALANCE">Reducing Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === 'FLAT' ? 'Interest on original principal' : 'Interest on outstanding balance'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interest_calc_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Calculation Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTEREST_CALC_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            <div className="flex flex-col">
                              <span>{freq.label}</span>
                              <span className="text-xs text-muted-foreground">{freq.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Term (Months) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={selectedProductInfo?.minTerm || 1} 
                        max={selectedProductInfo?.maxTerm || 240} 
                        {...field} 
                      />
                    </FormControl>
                    {selectedProductInfo && (
                      <FormDescription>
                        {selectedProductInfo.minTerm} - {selectedProductInfo.maxTerm} months
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="term_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Term (Months) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={selectedProductInfo?.minTerm || 1} 
                        max={selectedProductInfo?.maxTerm || 240} 
                        {...field} 
                      />
                    </FormControl>
                    {selectedProductInfo && (
                      <FormDescription>
                        {selectedProductInfo.minTerm} - {selectedProductInfo.maxTerm} months
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repayment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repayment Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BI_WEEKLY">Bi-Weekly (Every 2 weeks)</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="disbursement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disbursement Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how the loan will be used (e.g., Purchase stock for retail shop, Pay for funeral expenses, Buy farming inputs for maize cultivation)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Required for credit assessment and monitoring</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Late Payment Penalties */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Late Payment Penalties (Optional)
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure penalties for missed or late payments. Leave as "No Penalty" if not applicable.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="penalty_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalty Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select penalty type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PENALTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span>{type.label}</span>
                              <span className="text-xs text-muted-foreground">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('penalty_type') !== 'NONE' && (
                <>
                  <FormField
                    control={form.control}
                    name="penalty_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch('penalty_type') === 'FLAT_AMOUNT' 
                            ? 'Penalty Amount (GHS)' 
                            : 'Penalty Rate (%)'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step={form.watch('penalty_type') === 'FLAT_AMOUNT' ? '1' : '0.1'} 
                            min="0" 
                            max={form.watch('penalty_type') === 'FLAT_AMOUNT' ? '10000' : '100'}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('penalty_type') === 'FLAT_AMOUNT' && 'Fixed amount charged per late payment'}
                          {form.watch('penalty_type') === 'PERCENTAGE_OVERDUE' && 'Percentage of total overdue amount'}
                          {form.watch('penalty_type') === 'PERCENTAGE_INSTALLMENT' && 'Percentage of missed installment'}
                          {form.watch('penalty_type') === 'DAILY_RATE' && 'Daily rate on overdue balance'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="penalty_grace_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grace Period (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="30" {...field} />
                        </FormControl>
                        <FormDescription>
                          Days after due date before penalty applies
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            
            {form.watch('penalty_type') !== 'NONE' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Penalty Summary:</strong>{' '}
                  {form.watch('penalty_type') === 'FLAT_AMOUNT' && (
                    <>GHS {form.watch('penalty_value') || 0} per late payment</>
                  )}
                  {form.watch('penalty_type') === 'PERCENTAGE_OVERDUE' && (
                    <>{form.watch('penalty_value') || 0}% of overdue amount</>
                  )}
                  {form.watch('penalty_type') === 'PERCENTAGE_INSTALLMENT' && (
                    <>{form.watch('penalty_value') || 0}% of missed installment</>
                  )}
                  {form.watch('penalty_type') === 'DAILY_RATE' && (
                    <>{form.watch('penalty_value') || 0}% per day on overdue balance</>
                  )}
                  {form.watch('penalty_grace_days') > 0 && (
                    <>, after {form.watch('penalty_grace_days')} day grace period</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Section: Loan Calculator Preview */}
          <div className="space-y-4 pt-4 border-t">
            <LoanCalculatorPreview
              principal={watchedPrincipal || 0}
              interestRate={watchedInterestRate || 0}
              termMonths={watchedTermMonths || 0}
              repaymentFrequency={watchedFrequency || 'MONTHLY'}
              disbursementDate={watchedDisbursementDate || ''}
              interestCalcFrequency={form.watch('interest_calc_frequency') || 'MONTHLY'}
              interestMethod={form.watch('interest_method') || 'FLAT'}
              penaltyType={form.watch('penalty_type') || 'NONE'}
              penaltyValue={form.watch('penalty_value') || 0}
              penaltyGraceDays={form.watch('penalty_grace_days') || 0}
            />
          </div>

          {/* Section: Affordability Check */}
          <div className="space-y-4 pt-4 border-t">
            <LoanAffordabilityCheck
              monthlyIncome={selectedClient?.monthly_income || 0}
              monthlyExpenses={selectedClient?.monthly_expenses || 0}
              monthlyRepayment={monthlyRepayment}
              principal={watchedPrincipal || 0}
            />
          </div>

          {/* Section: Collateral & Guarantor */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Collateral & Guarantor (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collateral_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select collateral type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No Collateral</SelectItem>
                        <SelectItem value="VEHICLE">Vehicle (Car, Motorbike)</SelectItem>
                        <SelectItem value="PROPERTY">Property / Land</SelectItem>
                        <SelectItem value="EQUIPMENT">Business Equipment</SelectItem>
                        <SelectItem value="INVENTORY">Stock / Inventory</SelectItem>
                        <SelectItem value="SAVINGS">Fixed Deposit / Savings</SelectItem>
                        <SelectItem value="HOUSEHOLD">Household Items (TV, Fridge)</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collateral_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Value (GHS)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="100" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Estimated market value</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guarantor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guarantor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name of guarantor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guarantor_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guarantor Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="0201234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={createLoan.isPending || !selectedOrgId}>
            {createLoan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Loan Application
          </Button>
        </form>
      </Form>
    </div>
  );
}
