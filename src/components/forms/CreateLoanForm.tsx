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
import { Badge } from '@/components/ui/badge';
import { useCreateLoan, useClients } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { LOAN_CATEGORIES, getLoanProduct, getLoanProductsByCategory } from '@/data/ghanaLoanTypes';
import { LoanCalculatorPreview } from './LoanCalculatorPreview';

const loanSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  loan_category: z.string().min(1, 'Please select a loan category'),
  loan_product: z.string().min(1, 'Please select a loan product'),
  principal: z.coerce.number().min(100, 'Minimum principal is GHS 100').max(5000000, 'Maximum principal is GHS 5,000,000'),
  interest_rate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  term_months: z.coerce.number().min(1, 'Minimum term is 1 month').max(240, 'Maximum term is 240 months'),
  disbursement_date: z.string().min(1, 'Disbursement date is required'),
  purpose: z.string().min(10, 'Please describe the loan purpose (min 10 characters)').max(500),
  repayment_frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'], { required_error: 'Select repayment frequency' }),
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      client_id: '',
      loan_category: '',
      loan_product: '',
      principal: 5000,
      interest_rate: 30,
      term_months: 12,
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
      purpose: '',
      repayment_frequency: 'MONTHLY',
      collateral_type: '',
      collateral_value: 0,
      guarantor_name: '',
      guarantor_phone: '',
    },
  });

  const watchLoanProduct = form.watch('loan_product');
  
  // Watch form values for calculator preview
  const watchedValues = useWatch({
    control: form.control,
    name: ['principal', 'interest_rate', 'term_months', 'repayment_frequency', 'disbursement_date'],
  });
  
  const [watchedPrincipal, watchedInterestRate, watchedTermMonths, watchedFrequency, watchedDisbursementDate] = watchedValues;
  
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

    await createLoan.mutateAsync({
      org_id: selectedOrgId,
      client_id: values.client_id,
      principal: values.principal,
      interest_rate: values.interest_rate,
      term_months: values.term_months,
      disbursement_date: values.disbursement_date,
    });

    form.reset();
    setSelectedCategory('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="form-section">
      <h2 className="text-lg font-semibold mb-2">Create New Loan</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select a loan product and configure the terms for disbursement
      </p>

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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={clientsLoading ? 'Loading...' : 'Search or select a client'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients && clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem key={client.client_id} value={client.client_id}>
                            {client.first_name} {client.last_name} ({client.ghana_card_number})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          {clientsLoading ? 'Loading...' : 'No clients found. Create one first.'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <FormLabel>Annual Interest Rate (%) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" max="100" {...field} />
                    </FormControl>
                    <FormDescription>Per annum (flat or reducing)</FormDescription>
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

          {/* Section: Loan Calculator Preview */}
          <div className="space-y-4 pt-4 border-t">
            <LoanCalculatorPreview
              principal={watchedPrincipal || 0}
              interestRate={watchedInterestRate || 0}
              termMonths={watchedTermMonths || 0}
              repaymentFrequency={watchedFrequency || 'MONTHLY'}
              disbursementDate={watchedDisbursementDate || ''}
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
