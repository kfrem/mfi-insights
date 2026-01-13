import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { DrilldownTable } from '../DrilldownTable';
import { DrilldownColumn } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

// Helper functions to avoid date-fns dependency
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export function CollectionsDrilldown() {
  const { selectedOrgId } = useOrganisation();
  const today = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ['collections-drilldown', selectedOrgId, getTodayDateString()],
    queryFn: async () => {
      const { data: repayments, error } = await supabase
        .from('repayments')
        .select(`
          repayment_id,
          amount,
          principal_portion,
          interest_portion,
          penalty_portion,
          payment_method,
          payment_date,
          reference,
          loans (
            loan_id,
            loan_type,
            clients (first_name, last_name)
          )
        `)
        .eq('org_id', selectedOrgId!)
        .gte('payment_date', getStartOfDay(today).toISOString())
        .lte('payment_date', getEndOfDay(today).toISOString())
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return repayments;
    },
    enabled: !!selectedOrgId,
  });

  const columns: DrilldownColumn[] = [
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'loan_type', label: 'Loan Type', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'principal', label: 'Principal', type: 'currency' },
    { key: 'interest', label: 'Interest', type: 'currency' },
    { key: 'payment_method', label: 'Method', type: 'text' },
    { key: 'reference', label: 'Reference', type: 'text' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const formattedData = data?.map((repayment) => ({
    client: repayment.loans?.clients 
      ? `${repayment.loans.clients.first_name} ${repayment.loans.clients.last_name}` 
      : 'Unknown',
    loan_type: repayment.loans?.loan_type ?? 'N/A',
    amount: repayment.amount,
    principal: repayment.principal_portion ?? 0,
    interest: repayment.interest_portion ?? 0,
    payment_method: repayment.payment_method ?? 'Cash',
    reference: repayment.reference ?? '-',
  })) ?? [];

  const total = formattedData.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Today's collections ({formattedData.length} transactions): <strong className="text-foreground">
          {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(total)}
        </strong>
      </div>
      {formattedData.length > 0 ? (
        <DrilldownTable columns={columns} data={formattedData} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No collections recorded today
        </div>
      )}
    </div>
  );
}
