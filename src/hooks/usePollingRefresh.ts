import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface UsePollingRefreshOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Query keys to refresh */
  queryKeys?: string[][];
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Only poll when tab is visible */
  pauseOnHidden?: boolean;
}

const DEFAULT_INTERVAL = 30000; // 30 seconds

export function usePollingRefresh(options: UsePollingRefreshOptions = {}) {
  const {
    interval = DEFAULT_INTERVAL,
    queryKeys = [],
    enabled = true,
    pauseOnHidden = true,
  } = options;
  
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const refresh = useCallback(() => {
    if (queryKeys.length === 0) {
      // Invalidate all active queries
      queryClient.invalidateQueries({ refetchType: 'active' });
    } else {
      // Invalidate specific query keys
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
      });
    }
    setLastRefresh(new Date());
  }, [queryClient, queryKeys]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(refresh, interval);
    logger.debug(`Started with ${interval}ms interval`, 'PollingRefresh');
  }, [interval, refresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
      logger.debug('Stopped', 'PollingRefresh');
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        // Immediate refresh when becoming visible
        refresh();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, pauseOnHidden, refresh, startPolling, stopPolling]);

  // Start/stop polling based on enabled prop
  useEffect(() => {
    if (enabled && !document.hidden) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return {
    refresh,
    lastRefresh,
    isPolling,
    startPolling,
    stopPolling,
  };
}
