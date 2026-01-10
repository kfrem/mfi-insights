import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { toast } from 'sonner';
import type { BogTierConfig, OrganisationSettings, BogMfiTier } from '@/types/bogTiers';

export function useBogTierConfigs() {
  return useQuery({
    queryKey: ['bog-tier-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bog_tier_config')
        .select('*')
        .order('tier');
      
      if (error) throw error;
      return data as BogTierConfig[];
    },
  });
}

export function useOrganisationSettings() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['organisation-settings', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      
      const { data, error } = await supabase
        .from('organisation_settings')
        .select('*')
        .eq('org_id', selectedOrgId)
        .maybeSingle();
      
      if (error) throw error;
      return data as OrganisationSettings | null;
    },
    enabled: !!selectedOrgId,
  });
}

export function useUpdateOrganisationSettings() {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<OrganisationSettings>) => {
      if (!selectedOrgId) throw new Error('No organisation selected');
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from('organisation_settings')
        .select('id')
        .eq('org_id', selectedOrgId)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('organisation_settings')
          .update(settings)
          .eq('org_id', selectedOrgId);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('organisation_settings')
          .insert({ ...settings, org_id: selectedOrgId });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Organisation settings updated');
      queryClient.invalidateQueries({ queryKey: ['organisation-settings', selectedOrgId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}

export function useTierLoanLimits() {
  const { data: settings } = useOrganisationSettings();
  const { data: tierConfigs } = useBogTierConfigs();
  
  const currentTierConfig = tierConfigs?.find(t => t.tier === settings?.bog_tier);
  
  const singleObligorPercent = currentTierConfig?.single_obligor_limit_percent || 25;
  const netWorth = settings?.net_worth || null;
  
  // Calculate single obligor limit: either custom override or percentage of net worth
  const calculatedSingleObligorLimit = netWorth 
    ? (netWorth * singleObligorPercent) / 100 
    : null;
  
  const singleObligorLimit = settings?.max_single_obligor_limit || calculatedSingleObligorLimit;
  
  return {
    settings,
    tierConfig: currentTierConfig,
    maxLoanAmount: settings?.max_loan_amount || currentTierConfig?.max_loan_per_borrower_ghs || null,
    singleObligorLimit,
    singleObligorPercent,
    netWorth,
    isNetWorthConfigured: netWorth !== null && netWorth > 0,
  };
}