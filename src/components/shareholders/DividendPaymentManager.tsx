import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { CheckCircle2, Loader2, CreditCard, Search } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { formatGHS } from '@/lib/utils';
import { format } from 'date-fns';
import type { DividendPayout } from '@/types/shareholder';

interface PendingDividend extends DividendPayout {
  shareholder_name?: string;
}

export function DividendPaymentManager() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDividends, setSelectedDividends] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  // Fetch pending dividends with shareholder names
  const { data: pendingDividends, isLoading: loadingDividends } = useQuery({
    queryKey: ['pending-dividends', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      const { data, error } = await supabase
        .from('dividend_payouts')
        .select(`
          *,
          shareholders (
            full_name
          )
        `)
        .eq('org_id', selectedOrgId)
        .eq('status', 'PENDING')
        .order('payout_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(d => ({
        ...d,
        shareholder_name: d.shareholders?.full_name || 'Unknown',
      })) as PendingDividend[];
    },
    enabled: !!selectedOrgId && open,
  });

  // Filter dividends based on search
  const filteredDividends = (pendingDividends || []).filter(d => 
    d.shareholder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSelectedAmount = filteredDividends
    .filter(d => selectedDividends.includes(d.id))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDividends(filteredDividends.map(d => d.id));
    } else {
      setSelectedDividends([]);
    }
  };

  const handleSelectDividend = (dividendId: string, checked: boolean) => {
    if (checked) {
      setSelectedDividends(prev => [...prev, dividendId]);
    } else {
      setSelectedDividends(prev => prev.filter(id => id !== dividendId));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedDividends.length === 0) {
      toast.error('Please select at least one dividend to process');
      return;
    }

    if (!paymentReference.trim()) {
      toast.error('Please enter a payment reference');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('dividend_payouts')
        .update({
          status: 'PAID',
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim(),
          notes: paymentNotes.trim() || null,
        })
        .in('id', selectedDividends);

      if (error) throw error;

      toast.success(`${selectedDividends.length} dividend(s) marked as paid`);
      queryClient.invalidateQueries({ queryKey: ['pending-dividends'] });
      queryClient.invalidateQueries({ queryKey: ['dividends'] });
      
      // Reset form
      setSelectedDividends([]);
      setPaymentReference('');
      setPaymentNotes('');
      setOpen(false);
    } catch (error: any) {
      logger.error('Error processing payments', 'DividendPaymentManager', { error: error?.message || String(error) });
      toast.error(error.message || 'Failed to process payments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateBatchReference = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPaymentReference(`DIV-BATCH-${date}-${random}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Process Payments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Dividend Payments</DialogTitle>
          <DialogDescription>
            Mark pending dividends as paid with payment reference tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by shareholder name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              {(pendingDividends || []).length} pending
            </Badge>
          </div>

          {/* Pending Dividends List */}
          <div className="border rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedDividends.length === filteredDividends.length && filteredDividends.length > 0}
                  onCheckedChange={handleSelectAll}
                  disabled={filteredDividends.length === 0}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedDividends.length} selected
              </span>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto">
              {loadingDividends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDividends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending dividends found
                </div>
              ) : (
                filteredDividends.map((dividend) => (
                  <div
                    key={dividend.id}
                    className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                      selectedDividends.includes(dividend.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedDividends.includes(dividend.id)}
                        onCheckedChange={(checked) => handleSelectDividend(dividend.id, !!checked)}
                      />
                      <div>
                        <p className="font-medium text-sm">{dividend.shareholder_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(dividend.payout_date), 'MMM dd, yyyy')} • {dividend.shares_at_payout} shares @ {(Number(dividend.dividend_rate) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatGHS(Number(dividend.amount))}</p>
                      <Badge variant="secondary" className="text-xs">
                        {dividend.payment_method || 'Not set'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Details */}
          {selectedDividends.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-accent/10 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Payment Amount:</span>
                  <span className="text-xl font-bold text-accent">{formatGHS(totalSelectedAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Reference *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="TXN-123456..."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateBatchReference}
                      className="whitespace-nowrap"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Notes (Optional)</Label>
                <Textarea
                  placeholder="Batch payment for Q1 2025 dividends..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleMarkAsPaid} 
            disabled={isSubmitting || selectedDividends.length === 0 || !paymentReference.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark {selectedDividends.length} as Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
