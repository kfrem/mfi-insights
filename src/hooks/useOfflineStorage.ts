import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getOfflineDb,
  generateLocalId,
  OfflineClient,
  OfflineLoan,
  OfflineRepayment,
  OfflineFieldCollection,
} from '@/lib/offlineDb';
import { addToSyncQueue, getPendingSyncCount } from '@/lib/syncService';

// Offline-aware client creation
export function useCreateClientOffline() {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Record<string, unknown>) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      // Try online first
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            ...clientData,
            org_id: selectedOrgId,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return { data, isOffline: false };
      }

      // Offline: store locally
      const db = await getOfflineDb();
      const localId = generateLocalId();
      
      const offlineClient: OfflineClient = {
        id: localId,
        localId,
        orgId: selectedOrgId,
        data: clientData,
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.add('offlineClients', offlineClient);
      await addToSyncQueue('client', localId, 'create', clientData, selectedOrgId);

      return { data: { client_id: localId, ...clientData }, isOffline: true };
    },
    onSuccess: (result) => {
      if (result.isOffline) {
        toast.info('Client saved offline. Will sync when online.');
      } else {
        toast.success('Client created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client');
    },
  });
}

// Offline-aware loan creation
export function useCreateLoanOffline() {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanData: Record<string, unknown>) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      const clientId = loanData.client_id as string;

      // Try online first (only if client is not a local ID)
      if (navigator.onLine && !clientId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('loans')
          .insert({
            ...loanData,
            org_id: selectedOrgId,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return { data, isOffline: false };
      }

      // Offline: store locally
      const db = await getOfflineDb();
      const localId = generateLocalId();
      
      const offlineLoan: OfflineLoan = {
        id: localId,
        localId,
        clientLocalId: clientId,
        orgId: selectedOrgId,
        data: loanData,
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.add('offlineLoans', offlineLoan);
      await addToSyncQueue('loan', localId, 'create', loanData, selectedOrgId);

      return { data: { loan_id: localId, ...loanData }, isOffline: true };
    },
    onSuccess: (result) => {
      if (result.isOffline) {
        toast.info('Loan saved offline. Will sync when online.');
      } else {
        toast.success('Loan created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create loan');
    },
  });
}

// Offline-aware repayment creation
export function usePostRepaymentOffline() {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repaymentData: Record<string, unknown>) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      const loanId = repaymentData.loan_id as string;

      // Try online first (only if loan is not a local ID)
      if (navigator.onLine && !loanId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('repayments')
          .insert({
            ...repaymentData,
            org_id: selectedOrgId,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return { data, isOffline: false };
      }

      // Offline: store locally
      const db = await getOfflineDb();
      const localId = generateLocalId();
      
      const offlineRepayment: OfflineRepayment = {
        id: localId,
        localId,
        loanLocalId: loanId,
        orgId: selectedOrgId,
        data: repaymentData,
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.add('offlineRepayments', offlineRepayment);
      await addToSyncQueue('repayment', localId, 'create', repaymentData, selectedOrgId);

      return { data: { repayment_id: localId, ...repaymentData }, isOffline: true };
    },
    onSuccess: (result) => {
      if (result.isOffline) {
        toast.info('Repayment saved offline. Will sync when online.');
      } else {
        toast.success('Repayment recorded successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['repayments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record repayment');
    },
  });
}

// Offline-aware field collection creation
export function useCreateFieldCollectionOffline() {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionData: Record<string, unknown>) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      const loanId = collectionData.loan_id as string;
      const clientId = collectionData.client_id as string;

      // Try online first (only if IDs are not local)
      if (navigator.onLine && !loanId.startsWith('local_') && !clientId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('field_collections')
          .insert({
            ...collectionData,
            org_id: selectedOrgId,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return { data, isOffline: false };
      }

      // Offline: store locally
      const db = await getOfflineDb();
      const localId = generateLocalId();
      
      const offlineCollection: OfflineFieldCollection = {
        id: localId,
        localId,
        orgId: selectedOrgId,
        data: collectionData,
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.add('offlineFieldCollections', offlineCollection);
      await addToSyncQueue('field_collection', localId, 'create', collectionData, selectedOrgId);

      return { data: { id: localId, ...collectionData }, isOffline: true };
    },
    onSuccess: (result) => {
      if (result.isOffline) {
        toast.info('Field collection saved offline. Will sync when online.');
      } else {
        toast.success('Field collection recorded successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['field-collections'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record field collection');
    },
  });
}

// Get offline data counts
export async function getOfflineCounts(): Promise<{
  clients: number;
  loans: number;
  repayments: number;
  fieldCollections: number;
  pendingSync: number;
}> {
  const db = await getOfflineDb();
  const pendingClients = await db.getAllFromIndex('offlineClients', 'by-sync-status', 'pending');
  const pendingLoans = await db.getAllFromIndex('offlineLoans', 'by-sync-status', 'pending');
  const pendingRepayments = await db.getAllFromIndex('offlineRepayments', 'by-sync-status', 'pending');
  const pendingCollections = await db.getAllFromIndex('offlineFieldCollections', 'by-sync-status', 'pending');
  const pendingSync = await getPendingSyncCount();

  return {
    clients: pendingClients.length,
    loans: pendingLoans.length,
    repayments: pendingRepayments.length,
    fieldCollections: pendingCollections.length,
    pendingSync,
  };
}
