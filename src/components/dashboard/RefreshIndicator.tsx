import { useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Clock, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';
import { formatDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export function RefreshIndicator() {
  const {
    isRealtimeConnected,
    isPolling,
    lastRefresh,
    refresh,
    refreshMode,
    setRefreshMode,
    pollingInterval,
    setPollingInterval,
  } = useDashboardRefresh();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    // Brief animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = () => {
    if (refreshMode === 'realtime') {
      return isRealtimeConnected ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-muted-foreground" />
      );
    }
    if (refreshMode === 'polling') {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (refreshMode === 'realtime') {
      return isRealtimeConnected ? 'Live' : 'Connecting...';
    }
    if (refreshMode === 'polling') {
      return `Every ${pollingInterval}s`;
    }
    return 'Manual';
  };

  const getStatusVariant = () => {
    if (refreshMode === 'realtime' && isRealtimeConnected) return 'default';
    if (refreshMode === 'polling' && isPolling) return 'secondary';
    return 'outline';
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8">
            {getStatusIcon()}
            <Badge variant={getStatusVariant()} className="font-normal">
              {getStatusText()}
            </Badge>
            <Settings2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Refresh Mode</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={refreshMode} onValueChange={(v) => setRefreshMode(v as any)}>
            <DropdownMenuRadioItem value="realtime" className="gap-2">
              <Wifi className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Realtime</span>
                <span className="text-xs text-muted-foreground">Live database updates</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="polling" className="gap-2">
              <Clock className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Polling</span>
                <span className="text-xs text-muted-foreground">Periodic refresh</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="manual" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Manual</span>
                <span className="text-xs text-muted-foreground">Refresh on demand</span>
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          {refreshMode === 'polling' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Polling Interval</DropdownMenuLabel>
              <DropdownMenuRadioGroup 
                value={String(pollingInterval)} 
                onValueChange={(v) => setPollingInterval(Number(v))}
              >
                <DropdownMenuRadioItem value="15">15 seconds</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="30">30 seconds</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="60">1 minute</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="120">2 minutes</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </>
          )}

          <DropdownMenuSeparator />
          {lastRefresh && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Last updated: {formatDate(lastRefresh, 'HH:mm:ss')}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="h-8"
      >
        <RefreshCw className={cn(
          "h-4 w-4",
          isRefreshing && "animate-spin"
        )} />
      </Button>
    </div>
  );
}
