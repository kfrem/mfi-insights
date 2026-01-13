import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';

interface DashboardRefreshContextType {
  /** Whether realtime is connected */
  isRealtimeConnected: boolean;
  /** Whether polling is active */
  isPolling: boolean;
  /** Last time data was refreshed */
  lastRefresh: Date | null;
  /** Manually trigger a refresh */
  refresh: () => void;
  /** Current refresh mode */
  refreshMode: 'realtime' | 'polling' | 'manual';
  /** Set the refresh mode */
  setRefreshMode: (mode: 'realtime' | 'polling' | 'manual') => void;
  /** Polling interval in seconds */
  pollingInterval: number;
  /** Set polling interval */
  setPollingInterval: (seconds: number) => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | null>(null);

interface DashboardRefreshProviderProps {
  children: ReactNode;
}

// Default polling interval for computed/aggregate metrics
const DEFAULT_POLLING_INTERVAL = 30; // seconds

export function DashboardRefreshProvider({ children }: DashboardRefreshProviderProps) {
  const queryClient = useQueryClient();
  const [refreshMode, setRefreshMode] = useState<'realtime' | 'polling' | 'manual'>('realtime');
  const [pollingInterval, setPollingInterval] = useState(DEFAULT_POLLING_INTERVAL);
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);

  // Realtime subscription for direct table changes
  const { isConnected: isRealtimeConnected } = useRealtimeSubscription({
    enabled: refreshMode === 'realtime',
  });

  // Polling for computed metrics (views, aggregations)
  const { 
    isPolling, 
    lastRefresh: pollingLastRefresh,
    refresh: pollingRefresh 
  } = usePollingRefresh({
    interval: pollingInterval * 1000,
    enabled: refreshMode === 'polling',
    queryKeys: [
      ['exec-kpis'],
      ['bog-classification'],
      ['portfolio-aging'],
      ['repayments-daily'],
      ['board-executive-summary'],
      ['strategic-kpis'],
      ['risk-metrics'],
      ['quarterly-trends'],
      ['management-operations'],
      ['financial-data'],
    ],
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ refetchType: 'active' });
    setLastManualRefresh(new Date());
  }, [queryClient]);

  const lastRefresh = refreshMode === 'polling' 
    ? pollingLastRefresh 
    : lastManualRefresh;

  const value: DashboardRefreshContextType = {
    isRealtimeConnected,
    isPolling,
    lastRefresh,
    refresh: refreshMode === 'polling' ? pollingRefresh : refresh,
    refreshMode,
    setRefreshMode,
    pollingInterval,
    setPollingInterval,
  };

  return (
    <DashboardRefreshContext.Provider value={value}>
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  const context = useContext(DashboardRefreshContext);
  if (!context) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
}
