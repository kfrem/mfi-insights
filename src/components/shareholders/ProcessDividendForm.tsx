import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Banknote, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Shareholder } from '@/types/shareholder';
import { formatGHS } from '@/lib/utils';

const dividendSchema = z.object({
  dividend_rate: z.coerce.number().min(0.001, 'Rate must be at least 0.1%').max(1, 'Rate cannot exceed 100%'),
  payout_date: z.string().min(1, 'Payout date is required'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  selected_shareholders: z.array(z.string()).min(1, 'Select at least one shareholder'),
});

type DividendFormData = z.infer<typeof dividendSchema>;

interface ProcessDividendFormProps {
  shareholders: Shareholder[];
}

export function ProcessDividendForm({ shareholders }: ProcessDividendFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  const activeShareholders = shareholders.filter(s => s.status === 'ACTIVE' && s.share_units > 0);

  const form = useForm<DividendFormData>({
    resolver: zodResolver(dividendSchema),
    defaultValues: {
      dividend_rate: 0.025, // 2.5% default
      payout_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      notes: '',
      selected_shareholders: activeShareholders.map(s => s.id),
    },
  });

  const selectedIds = form.watch('selected_shareholders');
  const dividendRate = form.watch('dividend_rate');

  // Calculate total dividend payout
  const calculateDividends = () => {
    return activeShareholders
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({
        shareholder: s,
        amount: s.share_units * Number(s.share_unit_value) * dividendRate,
      }));
  };

  const dividendBreakdown = calculateDividends();
  const totalPayout = dividendBreakdown.reduce((sum, d) => sum + d.amount, 0);

  const onSubmit = async (data: DividendFormData) => {
    if (!selectedOrgId) {
      toast.error('No organisation selected');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create dividend payout records for each selected shareholder
      const payoutRecords = dividendBreakdown.map(({ shareholder, amount }) => ({
        org_id: selectedOrgId,
        shareholder_id: shareholder.id,
        payout_date: data.payout_date,
        dividend_rate: data.dividend_rate,
        shares_at_payout: shareholder.share_units,
        amount: amount,
        payment_method: data.payment_method || null,
        status: 'PENDING' as const,
        notes: data.notes || null,
      }));

      const { error } = await supabase
        .from('dividend_payouts')
        .insert(payoutRecords);

      if (error) throw error;

      toast.success(`Dividend declared for ${dividendBreakdown.length} shareholders`);
      queryClient.invalidateQueries({ queryKey: ['dividends'] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      logger.error('Error processing dividend', 'ProcessDividendForm', { error: error?.message || String(error) });
      toast.error(error.message || 'Failed to process dividend');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      form.setValue('selected_shareholders', activeShareholders.map(s => s.id));
    } else {
      form.setValue('selected_shareholders', []);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Banknote className="h-4 w-4" />
          Declare Dividend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Declare Dividend Payout</DialogTitle>
          <DialogDescription>
            Calculate and record dividend payouts for shareholders.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dividend_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dividend Rate *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min={0.001} 
                          max={1} 
                          step="0.001" 
                          {...field} 
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ({(field.value * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Enter as decimal (e.g., 0.025 = 2.5%)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payout_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Date *</FormLabel>
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
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="REINVEST">Reinvest</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea placeholder="Quarterly dividend Q1 2025..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shareholder Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Select Shareholders</FormLabel>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedIds.length === activeShareholders.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="selected_shareholders"
                  render={() => (
                    <FormItem>
                      {activeShareholders.map((shareholder) => {
                        const dividendAmount = shareholder.share_units * Number(shareholder.share_unit_value) * dividendRate;
                        return (
                          <FormField
                            key={shareholder.id}
                            control={form.control}
                            name="selected_shareholders"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(shareholder.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, shareholder.id])
                                          : field.onChange(field.value?.filter((id) => id !== shareholder.id));
                                      }}
                                    />
                                  </FormControl>
                                  <div>
                                    <p className="font-medium text-sm">{shareholder.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {shareholder.share_units} shares @ {formatGHS(Number(shareholder.share_unit_value))}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-accent">
                                  {formatGHS(dividendAmount)}
                                </span>
                              </FormItem>
                            )}
                          />
                        );
                      })}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-accent/10 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected Shareholders:</span>
                <span className="font-medium">{dividendBreakdown.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dividend Rate:</span>
                <span className="font-medium">{(dividendRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-medium">Total Payout:</span>
                <span className="font-bold text-lg text-accent">{formatGHS(totalPayout)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || dividendBreakdown.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Declare Dividend
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
