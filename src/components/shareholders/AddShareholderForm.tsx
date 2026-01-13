import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const shareholderSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  share_units: z.coerce.number().min(1, 'Must purchase at least 1 share'),
  share_unit_value: z.coerce.number().min(1, 'Unit value must be positive'),
  investment_date: z.string().min(1, 'Investment date is required'),
});

type ShareholderFormData = z.infer<typeof shareholderSchema>;

export function AddShareholderForm() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  const form = useForm<ShareholderFormData>({
    resolver: zodResolver(shareholderSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      share_units: 100,
      share_unit_value: 100,
      investment_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ShareholderFormData) => {
    if (!selectedOrgId) {
      toast.error('No organisation selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalInvestment = data.share_units * data.share_unit_value;

      // Insert shareholder
      const { data: shareholder, error: shareholderError } = await supabase
        .from('shareholders')
        .insert({
          org_id: selectedOrgId,
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          share_units: data.share_units,
          share_unit_value: data.share_unit_value,
          total_investment: totalInvestment,
          investment_date: data.investment_date,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (shareholderError) throw shareholderError;

      // Record initial investment transaction
      const { error: txError } = await supabase
        .from('shareholder_transactions')
        .insert({
          org_id: selectedOrgId,
          shareholder_id: shareholder.id,
          transaction_type: 'INVESTMENT',
          share_units: data.share_units,
          unit_value: data.share_unit_value,
          total_amount: totalInvestment,
          transaction_date: data.investment_date,
          notes: 'Initial investment',
        });

      if (txError) throw txError;

      toast.success('Shareholder added successfully');
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error adding shareholder:', error);
      toast.error(error.message || 'Failed to add shareholder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Investor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Investor</DialogTitle>
          <DialogDescription>
            Register a new shareholder and record their initial investment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter investor's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+233..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Investor's address" {...field} />
                  </FormControl>
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
                name="share_unit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Value (GHS) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="investment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Investment:</span>
                <span className="font-bold">
                  GHS {(form.watch('share_units') * form.watch('share_unit_value')).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Investor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
