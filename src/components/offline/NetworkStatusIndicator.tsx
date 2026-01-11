import { Wifi, WifiOff, RefreshCw, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { format } from 'date-fns';

export function NetworkStatusIndicator() {
  const { 
    isOnline, 
    pendingSyncCount, 
    conflicts, 
    lastSyncTime, 
    isSyncing,
    triggerSync 
  } = useNetworkStatus();

  const hasIssues = !isOnline || pendingSyncCount > 0 || conflicts.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative gap-2"
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          
          {pendingSyncCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {pendingSyncCount}
            </Badge>
          )}
          
          {conflicts.length > 0 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Cloud className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Online</p>
                  <p className="text-sm text-muted-foreground">
                    Connected to server
                  </p>
                </div>
              </>
            ) : (
              <>
                <CloudOff className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Offline</p>
                  <p className="text-sm text-muted-foreground">
                    Working locally - changes will sync when online
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Pending Sync */}
          {pendingSyncCount > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{pendingSyncCount} pending</p>
                  <p className="text-sm text-muted-foreground">
                    Items waiting to sync
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerSync()}
                  disabled={!isOnline || isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-medium">{conflicts.length} conflicts</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manual review required
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => {/* TODO: Navigate to conflict resolution */}}
              >
                Review Conflicts
              </Button>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground text-center">
              Last synced: {format(lastSyncTime, 'MMM d, h:mm a')}
            </p>
          )}

          {/* All synced message */}
          {isOnline && pendingSyncCount === 0 && conflicts.length === 0 && (
            <p className="text-sm text-center text-green-600 dark:text-green-400">
              ✓ All data synced
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
