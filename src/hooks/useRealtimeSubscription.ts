import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'loans' | 'repayments' | 'clients' | 'field_collections';

interface UseRealtimeOptions {
  tables?: TableName[];
  enabled?: boolean;
}

// Map table changes to query keys that need to be invalidated
const TABLE_TO_QUERY_KEYS: Record<TableName, string[][]> = {
  loans: [
    ['active-loans'],
    ['exec-kpis'],
    ['portfolio-aging'],
    ['bog-classification'],
    ['management-operations'],
    ['loan-pipeline'],
  ],
  repayments: [
    ['repayments-daily'],
    ['exec-kpis'],
    ['management-collections'],
    ['field-collections'],
  ],
  clients: [
    ['clients'],
    ['exec-kpis'],
  ],
  field_collections: [
    ['field-collections'],
    ['management-collections'],
  ],
};

export function useRealtimeSubscription(options: UseRealtimeOptions = {}) {
  const { tables = ['loans', 'repayments', 'clients', 'field_collections'], enabled = true } = options;
  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrganisation();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  const invalidateQueriesForTable = useCallback((table: TableName) => {
    const queryKeys = TABLE_TO_QUERY_KEYS[table] || [];
    queryKeys.forEach(queryKey => {
      // Invalidate all queries that start with this key
      queryClient.invalidateQueries({ 
        queryKey,
        refetchType: 'active',
      });
    });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || !selectedOrgId || isSubscribedRef.current) return;

    const channelName = `dashboard-realtime-${selectedOrgId}`;
    
    // Create a channel for all table subscriptions
    const channel = supabase.channel(channelName);

    // Subscribe to each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `org_id=eq.${selectedOrgId}`,
        },
        (payload) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);
          invalidateQueriesForTable(table);
        }
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to dashboard updates');
        isSubscribedRef.current = true;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error, will retry...');
        isSubscribedRef.current = false;
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        console.log('[Realtime] Unsubscribing from dashboard updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [enabled, selectedOrgId, tables, invalidateQueriesForTable]);

  return {
    isConnected: isSubscribedRef.current,
  };
}
