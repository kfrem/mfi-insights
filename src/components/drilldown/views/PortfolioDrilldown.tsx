import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { DrilldownTable } from '../DrilldownTable';
import { DrilldownColumn } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

export function PortfolioDrilldown() {
  const { selectedOrgId } = useOrganisation();

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-drilldown', selectedOrgId],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          loan_id,
          principal,
          outstanding_principal,
          status,
          loan_type,
          disbursement_date,
          clients (first_name, last_name)
        `)
        .eq('org_id', selectedOrgId!)
        .in('status', ['ACTIVE', 'DISBURSED'])
        .order('outstanding_principal', { ascending: false })
        .limit(50);

      if (error) throw error;
      return loans;
    },
    enabled: !!selectedOrgId,
  });

  const columns: DrilldownColumn[] = [
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'loan_type', label: 'Loan Type', type: 'text' },
    { key: 'principal', label: 'Principal', type: 'currency' },
    { key: 'outstanding_principal', label: 'Outstanding', type: 'currency' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'disbursement_date', label: 'Disbursed', type: 'date' },
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
    principal: loan.principal,
    outstanding_principal: loan.outstanding_principal ?? 0,
    status: loan.status,
    disbursement_date: loan.disbursement_date,
  })) ?? [];

  const total = formattedData.reduce((sum, loan) => sum + (loan.outstanding_principal || 0), 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing top 50 loans by outstanding balance. Total: <strong className="text-foreground">
          {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(total)}
        </strong>
      </div>
      <DrilldownTable columns={columns} data={formattedData} />
    </div>
  );
}
