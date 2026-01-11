import { SyncConflictResolver } from '@/components/offline/SyncConflictResolver';

export default function SyncConflicts() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sync Conflicts</h1>
        <p className="text-muted-foreground">
          Review and resolve data conflicts from offline operations
        </p>
      </div>

      <SyncConflictResolver />
    </div>
  );
}
