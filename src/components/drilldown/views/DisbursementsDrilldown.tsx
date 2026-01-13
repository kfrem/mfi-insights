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

export function DisbursementsDrilldown() {
  const { selectedOrgId } = useOrganisation();
  const today = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ['disbursements-drilldown', selectedOrgId, getTodayDateString()],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          loan_id,
          principal,
          disbursed_amount,
          loan_type,
          interest_rate,
          term_months,
          disbursement_date,
          clients (first_name, last_name)
        `)
        .eq('org_id', selectedOrgId!)
        .gte('disbursement_date', getStartOfDay(today).toISOString())
        .lte('disbursement_date', getEndOfDay(today).toISOString())
        .order('disbursement_date', { ascending: false });

      if (error) throw error;
      return loans;
    },
    enabled: !!selectedOrgId,
  });

  const columns: DrilldownColumn[] = [
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'loan_type', label: 'Loan Type', type: 'text' },
    { key: 'disbursed_amount', label: 'Amount', type: 'currency' },
    { key: 'interest_rate', label: 'Rate', type: 'percent' },
    { key: 'term_months', label: 'Term', type: 'text' },
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

  const formattedData = data?.map((loan) => ({
    client: loan.clients ? `${loan.clients.first_name} ${loan.clients.last_name}` : 'Unknown',
    loan_type: loan.loan_type,
    disbursed_amount: loan.disbursed_amount ?? loan.principal,
    interest_rate: loan.interest_rate,
    term_months: `${loan.term_months} months`,
  })) ?? [];

  const total = formattedData.reduce((sum, l) => sum + (l.disbursed_amount as number), 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Today's disbursements ({formattedData.length} loans): <strong className="text-foreground">
          {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(total)}
        </strong>
      </div>
      {formattedData.length > 0 ? (
        <DrilldownTable columns={columns} data={formattedData} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No disbursements recorded today
        </div>
      )}
    </div>
  );
}
