import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { DrilldownTable } from '../DrilldownTable';
import { DrilldownColumn } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Helper to calculate days difference
const daysDifference = (date1: Date, date2: Date) => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export function PARDrilldown() {
  const { selectedOrgId } = useOrganisation();

  const { data, isLoading } = useQuery({
    queryKey: ['par-drilldown', selectedOrgId],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          loan_id,
          principal,
          outstanding_principal,
          status,
          loan_type,
          expected_end_date,
          clients (first_name, last_name, assigned_officer_id)
        `)
        .eq('org_id', selectedOrgId!)
        .in('status', ['ACTIVE', 'DISBURSED'])
        .not('expected_end_date', 'is', null)
        .order('expected_end_date', { ascending: true });

      if (error) throw error;

      // Filter to only overdue loans (30+ days)
      const today = new Date();
      return loans?.filter((loan) => {
        if (!loan.expected_end_date) return false;
        const daysOverdue = daysDifference(today, new Date(loan.expected_end_date));
        return daysOverdue >= 30;
      }).map((loan) => {
        const daysOverdue = daysDifference(today, new Date(loan.expected_end_date!));
        let bucket = '30-60';
        if (daysOverdue > 180) bucket = '180+';
        else if (daysOverdue > 90) bucket = '91-180';
        else if (daysOverdue > 60) bucket = '61-90';
        
        return {
          ...loan,
          days_overdue: daysOverdue,
          bucket,
        };
      });
    },
    enabled: !!selectedOrgId,
  });

  const columns: DrilldownColumn[] = [
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'loan_type', label: 'Loan Type', type: 'text' },
    { key: 'outstanding_principal', label: 'Outstanding', type: 'currency' },
    { key: 'days_overdue', label: 'Days Overdue', type: 'number' },
    { key: 'bucket', label: 'PAR Bucket', type: 'text' },
    { key: 'expected_end_date', label: 'Due Date', type: 'date' },
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
    outstanding_principal: loan.outstanding_principal ?? 0,
    days_overdue: loan.days_overdue,
    bucket: loan.bucket,
    expected_end_date: loan.expected_end_date,
  })) ?? [];

  // Group by bucket for summary
  const bucketSummary = formattedData.reduce((acc, loan) => {
    if (!acc[loan.bucket]) acc[loan.bucket] = { count: 0, amount: 0 };
    acc[loan.bucket].count++;
    acc[loan.bucket].amount += loan.outstanding_principal;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(bucketSummary).map(([bucket, { count, amount }]) => (
          <Badge key={bucket} variant="outline" className="text-xs">
            {bucket} days: {count} loans (GHS {amount.toLocaleString()})
          </Badge>
        ))}
      </div>
      <DrilldownTable columns={columns} data={formattedData} />
    </div>
  );
}
