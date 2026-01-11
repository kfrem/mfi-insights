import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the structure of our offline database
interface OfflineDBSchema extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-status': string; 'by-entity': string; 'by-timestamp': number };
  };
  offlineClients: {
    key: string;
    value: OfflineClient;
    indexes: { 'by-org': string; 'by-sync-status': string };
  };
  offlineLoans: {
    key: string;
    value: OfflineLoan;
    indexes: { 'by-org': string; 'by-client': string; 'by-sync-status': string };
  };
  offlineRepayments: {
    key: string;
    value: OfflineRepayment;
    indexes: { 'by-org': string; 'by-loan': string; 'by-sync-status': string };
  };
  offlineFieldCollections: {
    key: string;
    value: OfflineFieldCollection;
    indexes: { 'by-org': string; 'by-sync-status': string };
  };
  syncConflicts: {
    key: string;
    value: SyncConflict;
    indexes: { 'by-status': string; 'by-entity': string };
  };
  cachedData: {
    key: string;
    value: CachedDataItem;
    indexes: { 'by-type': string };
  };
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface SyncQueueItem {
  id: string;
  entityType: 'client' | 'loan' | 'repayment' | 'field_collection';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  orgId: string;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
}

export interface OfflineClient {
  id: string;
  localId: string;
  serverId?: string;
  orgId: string;
  data: Record<string, unknown>;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

export interface OfflineLoan {
  id: string;
  localId: string;
  serverId?: string;
  clientLocalId: string;
  clientServerId?: string;
  orgId: string;
  data: Record<string, unknown>;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

export interface OfflineRepayment {
  id: string;
  localId: string;
  serverId?: string;
  loanLocalId: string;
  loanServerId?: string;
  orgId: string;
  data: Record<string, unknown>;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

export interface OfflineFieldCollection {
  id: string;
  localId: string;
  serverId?: string;
  orgId: string;
  data: Record<string, unknown>;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SyncConflict {
  id: string;
  entityType: 'client' | 'loan' | 'repayment' | 'field_collection';
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictType: 'update_conflict' | 'delete_conflict' | 'duplicate';
  status: 'pending' | 'resolved_local' | 'resolved_server' | 'merged';
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface CachedDataItem {
  key: string;
  type: string;
  data: unknown;
  cachedAt: number;
  expiresAt: number;
}

const DB_NAME = 'mfi-clarity-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function getOfflineDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sync Queue Store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueueStore.createIndex('by-status', 'status');
        syncQueueStore.createIndex('by-entity', 'entityType');
        syncQueueStore.createIndex('by-timestamp', 'timestamp');
      }

      // Offline Clients Store
      if (!db.objectStoreNames.contains('offlineClients')) {
        const clientsStore = db.createObjectStore('offlineClients', { keyPath: 'id' });
        clientsStore.createIndex('by-org', 'orgId');
        clientsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Offline Loans Store
      if (!db.objectStoreNames.contains('offlineLoans')) {
        const loansStore = db.createObjectStore('offlineLoans', { keyPath: 'id' });
        loansStore.createIndex('by-org', 'orgId');
        loansStore.createIndex('by-client', 'clientLocalId');
        loansStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Offline Repayments Store
      if (!db.objectStoreNames.contains('offlineRepayments')) {
        const repaymentsStore = db.createObjectStore('offlineRepayments', { keyPath: 'id' });
        repaymentsStore.createIndex('by-org', 'orgId');
        repaymentsStore.createIndex('by-loan', 'loanLocalId');
        repaymentsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Offline Field Collections Store
      if (!db.objectStoreNames.contains('offlineFieldCollections')) {
        const collectionsStore = db.createObjectStore('offlineFieldCollections', { keyPath: 'id' });
        collectionsStore.createIndex('by-org', 'orgId');
        collectionsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Sync Conflicts Store
      if (!db.objectStoreNames.contains('syncConflicts')) {
        const conflictsStore = db.createObjectStore('syncConflicts', { keyPath: 'id' });
        conflictsStore.createIndex('by-status', 'status');
        conflictsStore.createIndex('by-entity', 'entityType');
      }

      // Cached Data Store
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
        cacheStore.createIndex('by-type', 'type');
      }
    },
  });

  return dbInstance;
}

// Generate a unique local ID
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Clear all offline data (useful for logout)
export async function clearOfflineData(): Promise<void> {
  const db = await getOfflineDb();
  await Promise.all([
    db.clear('syncQueue'),
    db.clear('offlineClients'),
    db.clear('offlineLoans'),
    db.clear('offlineRepayments'),
    db.clear('offlineFieldCollections'),
    db.clear('syncConflicts'),
    db.clear('cachedData'),
  ]);
}
