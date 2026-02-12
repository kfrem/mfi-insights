import { useState, useEffect, useCallback } from 'react';
import { syncAll, getPendingSyncCount, getPendingConflicts, SyncResult } from '@/lib/syncService';
import { SyncConflict } from '@/lib/offlineDb';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface NetworkStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  conflicts: SyncConflict[];
  lastSyncTime: Date | null;
  isSyncing: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    pendingSyncCount: 0,
    conflicts: [],
    lastSyncTime: null,
    isSyncing: false,
  });

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      const conflicts = await getPendingConflicts();
      setStatus((prev) => ({ ...prev, pendingSyncCount: count, conflicts }));
    } catch (error) {
      logger.error('Error updating pending count', 'NetworkStatus', { error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult | null> => {
    if (!navigator.onLine) {
      toast.error('No internet connection');
      return null;
    }

    setStatus((prev) => ({ ...prev, isSyncing: true }));

    try {
      const result = await syncAll();
      
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} items successfully`);
      }
      
      if (result.conflicts > 0) {
        toast.warning(`${result.conflicts} conflicts need review`);
      }
      
      if (result.errors > 0) {
        toast.error(`${result.errors} items failed to sync`);
      }

      await updatePendingCount();
      setStatus((prev) => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date() 
      }));

      return result;
    } catch (error) {
      logger.error('Sync error', 'NetworkStatus', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Sync failed');
      setStatus((prev) => ({ ...prev, isSyncing: false }));
      return null;
    }
  }, [updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      toast.success('Back online! Syncing data...');
      triggerSync();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      toast.warning('You are offline. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    updatePendingCount();

    // Poll for pending items every 30 seconds
    const interval = setInterval(updatePendingCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (status.isOnline && status.pendingSyncCount > 0 && !status.isSyncing) {
      const autoSyncTimer = setTimeout(() => {
        triggerSync();
      }, 2000); // Wait 2 seconds after coming online

      return () => clearTimeout(autoSyncTimer);
    }
  }, [status.isOnline, status.pendingSyncCount, status.isSyncing, triggerSync]);

  return { ...status, triggerSync, updatePendingCount };
}
