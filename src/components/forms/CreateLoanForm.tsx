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
import { useCreateLoan, useClients } from '@/hooks/useMfiData';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const loanSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  principal: z.coerce.number().min(100, 'Minimum principal is GHS 100').max(1000000, 'Maximum principal is GHS 1,000,000'),
  interest_rate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  term_months: z.coerce.number().min(1, 'Minimum term is 1 month').max(60, 'Maximum term is 60 months'),
  disbursement_date: z.string().min(1, 'Disbursement date is required'),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function CreateLoanForm() {
  const { selectedOrgId } = useOrganisation();
  const createLoan = useCreateLoan();
  const { data: clients, isLoading: clientsLoading } = useClients();

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      client_id: '',
      principal: 5000,
      interest_rate: 24,
      term_months: 12,
      disbursement_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

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
  };

  return (
    <div className="form-section">
      <h2 className="text-lg font-semibold mb-6">Create New Loan</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={clientsLoading ? 'Loading...' : 'Select a client'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients && clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.client_id} value={client.client_id}>
                          {client.first_name} {client.last_name}
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal (GHS) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="100" {...field} />
                  </FormControl>
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
                    <Input type="number" step="0.5" {...field} />
                  </FormControl>
                  <FormDescription>Per annum</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="term_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Term (Months) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="60" {...field} />
                  </FormControl>
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

          <Button type="submit" disabled={createLoan.isPending || !selectedOrgId}>
            {createLoan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Loan
          </Button>
        </form>
      </Form>
    </div>
  );
}
