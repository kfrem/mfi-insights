import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, X, GitCompare, User, CreditCard, Wallet } from 'lucide-react';
import { SyncConflict } from '@/lib/offlineDb';
import { resolveConflict } from '@/lib/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from 'sonner';

const entityIcons = {
  client: User,
  loan: CreditCard,
  repayment: Wallet,
  field_collection: Wallet,
};

const entityLabels = {
  client: 'Client',
  loan: 'Loan',
  repayment: 'Repayment',
  field_collection: 'Field Collection',
};

export function SyncConflictResolver() {
  const { conflicts, updatePendingCount } = useNetworkStatus();
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (conflictId: string, resolution: 'local' | 'server') => {
    setResolving(conflictId);
    try {
      await resolveConflict(conflictId, resolution, 'current-user'); // TODO: Get actual user ID
      toast.success(`Conflict resolved using ${resolution === 'local' ? 'local' : 'server'} data`);
      await updatePendingCount();
    } catch (error) {
      toast.error('Failed to resolve conflict');
      console.error(error);
    } finally {
      setResolving(null);
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">No Conflicts</h3>
          <p className="text-muted-foreground text-center mt-2">
            All data is synchronized. No manual review needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="font-medium">{conflicts.length} Sync Conflicts</p>
          <p className="text-sm text-muted-foreground">
            These records have conflicting changes that need your review
          </p>
        </div>
      </div>

      {conflicts.map((conflict) => {
        const Icon = entityIcons[conflict.entityType];
        const isResolving = resolving === conflict.id;

        return (
          <Card key={conflict.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-base">
                    {entityLabels[conflict.entityType]} Conflict
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-yellow-600">
                  {conflict.conflictType === 'duplicate' ? 'Duplicate' : 'Update Conflict'}
                </Badge>
              </div>
              <CardDescription>
                Created {new Date(conflict.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="compare" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compare">
                    <GitCompare className="h-4 w-4 mr-1" />
                    Compare
                  </TabsTrigger>
                  <TabsTrigger value="local">Local</TabsTrigger>
                  <TabsTrigger value="server">Server</TabsTrigger>
                </TabsList>
                
                <TabsContent value="compare" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3 bg-blue-500/5">
                      <p className="text-sm font-medium mb-2 text-blue-600">Your Changes (Local)</p>
                      <pre className="text-xs overflow-auto max-h-40">
                        {JSON.stringify(conflict.localData, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-lg border p-3 bg-green-500/5">
                      <p className="text-sm font-medium mb-2 text-green-600">Server Version</p>
                      <pre className="text-xs overflow-auto max-h-40">
                        {JSON.stringify(conflict.serverData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="local" className="mt-4">
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
                    {JSON.stringify(conflict.localData, null, 2)}
                  </pre>
                </TabsContent>
                
                <TabsContent value="server" className="mt-4">
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
                    {JSON.stringify(conflict.serverData, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleResolve(conflict.id, 'local')}
                  disabled={isResolving}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Keep Local
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleResolve(conflict.id, 'server')}
                  disabled={isResolving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Use Server
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
