import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Shareholder } from '@/types/shareholder';

const transactionSchema = z.object({
  shareholder_id: z.string().min(1, 'Select a shareholder'),
  transaction_type: z.enum(['INVESTMENT', 'WITHDRAWAL', 'DIVIDEND_REINVEST', 'SHARE_TRANSFER_IN', 'SHARE_TRANSFER_OUT']),
  share_units: z.coerce.number().min(1, 'Must be at least 1 share'),
  unit_value: z.coerce.number().min(0.01, 'Unit value must be positive'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface RecordTransactionFormProps {
  shareholders: Shareholder[];
}

export function RecordTransactionForm({ shareholders }: RecordTransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedOrgId } = useOrganisation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      shareholder_id: '',
      transaction_type: 'INVESTMENT',
      share_units: 0,
      unit_value: 100,
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const transactionType = form.watch('transaction_type');
  const isAddition = ['INVESTMENT', 'DIVIDEND_REINVEST', 'SHARE_TRANSFER_IN'].includes(transactionType);

  const onSubmit = async (data: TransactionFormData) => {
    if (!selectedOrgId) {
      toast.error('No organisation selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = data.share_units * data.unit_value;

      // Insert transaction
      const { error: txError } = await supabase
        .from('shareholder_transactions')
        .insert({
          org_id: selectedOrgId,
          shareholder_id: data.shareholder_id,
          transaction_type: data.transaction_type,
          share_units: data.share_units,
          unit_value: data.unit_value,
          total_amount: totalAmount,
          transaction_date: data.transaction_date,
          notes: data.notes || null,
          processed_by: user?.id,
        });

      if (txError) throw txError;

      // Update shareholder's share_units and total_investment
      const shareholder = shareholders.find(s => s.id === data.shareholder_id);
      if (shareholder) {
        const newShareUnits = isAddition 
          ? shareholder.share_units + data.share_units
          : shareholder.share_units - data.share_units;
        
        const newTotalInvestment = isAddition
          ? Number(shareholder.total_investment) + totalAmount
          : Number(shareholder.total_investment) - totalAmount;

        const { error: updateError } = await supabase
          .from('shareholders')
          .update({
            share_units: Math.max(0, newShareUnits),
            total_investment: Math.max(0, newTotalInvestment),
            share_unit_value: data.unit_value,
          })
          .eq('id', data.shareholder_id);

        if (updateError) throw updateError;
      }

      toast.success('Transaction recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      queryClient.invalidateQueries({ queryKey: ['shareholder-transactions'] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error recording transaction:', error);
      toast.error(error.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Record Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Share Transaction</DialogTitle>
          <DialogDescription>
            Record investment, withdrawal, or transfer of shares.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shareholder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shareholders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} ({s.share_units} shares)
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
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INVESTMENT">New Investment</SelectItem>
                      <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                      <SelectItem value="DIVIDEND_REINVEST">Dividend Reinvestment</SelectItem>
                      <SelectItem value="SHARE_TRANSFER_IN">Transfer In</SelectItem>
                      <SelectItem value="SHARE_TRANSFER_OUT">Transfer Out</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="share_units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Share Units *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Value (GHS) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.01} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`rounded-lg p-3 ${isAddition ? 'bg-status-current/10' : 'bg-destructive/10'}`}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className={`font-bold ${isAddition ? 'text-status-current' : 'text-destructive'}`}>
                  {isAddition ? '+' : '-'} GHS {(form.watch('share_units') * form.watch('unit_value')).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
