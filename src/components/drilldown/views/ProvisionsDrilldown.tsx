import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper to calculate days difference
const daysDifference = (date1: Date, date2: Date) => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const BOG_PROVISION_RATES = [
  { bucket: 'Current', daysRange: '0', rate: 1, description: 'No arrears' },
  { bucket: 'OLEM', daysRange: '1-30', rate: 5, description: 'Other Loans Especially Mentioned' },
  { bucket: 'Substandard', daysRange: '31-90', rate: 25, description: 'Substandard loans' },
  { bucket: 'Doubtful', daysRange: '91-180', rate: 50, description: 'Doubtful recovery' },
  { bucket: 'Loss', daysRange: '180+', rate: 100, description: 'Write-off candidates' },
];

export function ProvisionsDrilldown() {
  const { selectedOrgId } = useOrganisation();

  const { data, isLoading } = useQuery({
    queryKey: ['provisions-drilldown', selectedOrgId],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          loan_id,
          outstanding_principal,
          expected_end_date,
          status
        `)
        .eq('org_id', selectedOrgId!)
        .in('status', ['ACTIVE', 'DISBURSED']);

      if (error) throw error;

      const today = new Date();
      const buckets = {
        Current: { count: 0, principal: 0, provision: 0 },
        OLEM: { count: 0, principal: 0, provision: 0 },
        Substandard: { count: 0, principal: 0, provision: 0 },
        Doubtful: { count: 0, principal: 0, provision: 0 },
        Loss: { count: 0, principal: 0, provision: 0 },
      };

      loans?.forEach((loan) => {
        const outstanding = loan.outstanding_principal ?? 0;
        let daysOverdue = 0;
        
        if (loan.expected_end_date) {
          daysOverdue = Math.max(0, daysDifference(today, new Date(loan.expected_end_date)));
        }

        let bucket: keyof typeof buckets = 'Current';
        let rate = 1;

        if (daysOverdue > 180) {
          bucket = 'Loss';
          rate = 100;
        } else if (daysOverdue > 90) {
          bucket = 'Doubtful';
          rate = 50;
        } else if (daysOverdue > 30) {
          bucket = 'Substandard';
          rate = 25;
        } else if (daysOverdue > 0) {
          bucket = 'OLEM';
          rate = 5;
        }

        buckets[bucket].count++;
        buckets[bucket].principal += outstanding;
        buckets[bucket].provision += outstanding * (rate / 100);
      });

      return buckets;
    },
    enabled: !!selectedOrgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const totalProvision = Object.values(data ?? {}).reduce((sum, b) => sum + b.provision, 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total Provisions Required: <strong className="text-foreground">
          {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(totalProvision)}
        </strong>
      </div>

      <div className="grid gap-3">
        {BOG_PROVISION_RATES.map((tier) => {
          const bucketData = data?.[tier.bucket as keyof typeof data];
          return (
            <Card key={tier.bucket} className="border-l-4" style={{ borderLeftColor: tier.rate >= 50 ? 'hsl(var(--destructive))' : tier.rate >= 25 ? 'hsl(var(--warning, 45 93% 47%))' : 'hsl(var(--muted))' }}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{tier.bucket}</span>
                  <span className="text-muted-foreground font-normal">{tier.daysRange} days @ {tier.rate}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Loans</div>
                    <div className="font-semibold">{bucketData?.count ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Outstanding</div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact' }).format(bucketData?.principal ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Provision</div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact' }).format(bucketData?.provision ?? 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
