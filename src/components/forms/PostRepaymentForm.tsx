import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { usePostRepayment, useActiveLoans } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const repaymentSchema = z.object({
  loan_id: z.string().min(1, 'Please select a loan'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference: z.string().min(1, 'Reference is required').max(100, 'Reference too long'),
});

type RepaymentFormValues = z.infer<typeof repaymentSchema>;

export function PostRepaymentForm() {
  const { selectedOrgId } = useOrganisation();
  const postRepayment = usePostRepayment();
  const { data: loans, isLoading: loansLoading } = useActiveLoans();

  const form = useForm<RepaymentFormValues>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      loan_id: '',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      reference: '',
    },
  });

  const generateReference = () => {
    const prefix = 'REP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    form.setValue('reference', `${prefix}-${timestamp}-${random}`);
  };

  const onSubmit = async (values: RepaymentFormValues) => {
    if (!selectedOrgId) return;

    await postRepayment.mutateAsync({
      org_id: selectedOrgId,
      loan_id: values.loan_id,
      amount: values.amount,
      payment_date: values.payment_date,
      reference: values.reference,
    });

    form.reset({
      loan_id: '',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      reference: '',
    });
  };

  return (
    <div className="form-section">
      <h2 className="text-lg font-semibold mb-6">Post Repayment</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="loan_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loansLoading ? 'Loading...' : 'Select a loan'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loans?.map((loan) => (
                      <SelectItem key={loan.loan_id} value={loan.loan_id}>
                        {loan.loan_id} - {loan.clients?.first_name} {loan.clients?.last_name} (GHS {loan.principal.toLocaleString()})
                      </SelectItem>
                    ))}
                    {(!loans || loans.length === 0) && !loansLoading && (
                      <SelectItem value="" disabled>
                        No active loans found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (GHS) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date *</FormLabel>
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
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="REP-XYZ123" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateReference}>
                    Generate
                  </Button>
                </div>
                <FormDescription>Must be unique for each repayment</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={postRepayment.isPending || !selectedOrgId}>
            {postRepayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Repayment
          </Button>
        </form>
      </Form>
    </div>
  );
}
