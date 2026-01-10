import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldCollection, CreateFieldCollectionInput, CollectionStatus } from '@/types/audit';
import { toast } from 'sonner';

export function useFieldCollections(orgId: string | undefined, filters?: {
  collectedBy?: string;
  status?: CollectionStatus;
  clientId?: string;
  loanId?: string;
}) {
  return useQuery({
    queryKey: ['field-collections', orgId, filters],
    queryFn: async () => {
      if (!orgId) return [];

      let query = supabase
        .from('field_collections')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (filters?.collectedBy) {
        query = query.eq('collected_by', filters.collectedBy);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.loanId) {
        query = query.eq('loan_id', filters.loanId);
      }

      const { data: collections, error } = await query;
      
      if (error) throw error;
      
      // Fetch client and loan details separately
      const clientIds = [...new Set(collections?.map(c => c.client_id) || [])];
      const loanIds = [...new Set(collections?.map(c => c.loan_id) || [])];
      
      const [{ data: clients }, { data: loans }] = await Promise.all([
        supabase.from('clients').select('client_id, first_name, last_name, phone').in('client_id', clientIds),
        supabase.from('loans').select('loan_id, principal, outstanding_principal').in('loan_id', loanIds),
      ]);
      
      const clientMap = new Map(clients?.map(c => [c.client_id, c]) || []);
      const loanMap = new Map(loans?.map(l => [l.loan_id, l]) || []);
      
      return (collections || []).map(collection => ({
        ...collection,
        clients: clientMap.get(collection.client_id) || null,
        loans: loanMap.get(collection.loan_id) || null,
      })) as (FieldCollection & {
        clients: { first_name: string; last_name: string; phone: string | null } | null;
        loans: { principal: number; outstanding_principal: number | null } | null;
      })[];
    },
    enabled: !!orgId,
  });
}

export function useCreateFieldCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFieldCollectionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('field_collections')
        .insert({
          ...input,
          collected_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-collections'] });
      toast.success('Field collection recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to record collection: ${error.message}`);
    },
  });
}

export function useVerifyFieldCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      status, 
      rejectionReason 
    }: { 
      collectionId: string; 
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('field_collections')
        .update({
          status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['field-collections'] });
      toast.success(`Collection ${variables.status.toLowerCase()}`);
    },
    onError: (error) => {
      toast.error(`Failed to verify collection: ${error.message}`);
    },
  });
}

export function useUploadEvidence() {
  return useMutation({
    mutationFn: async ({ 
      file, 
      type, 
      collectionId 
    }: { 
      file: File; 
      type: 'receipt' | 'signature'; 
      collectionId: string;
    }) => {
      const fileName = `${collectionId}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('field-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('field-evidence')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });
}

export function useGeolocation() {
  const getLocation = (): Promise<{ 
    latitude: number; 
    longitude: number; 
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { getLocation };
}
