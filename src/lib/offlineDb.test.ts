/**
 * Tests for offlineDb.ts — IndexedDB offline storage layer
 *
 * Uses fake-indexeddb to provide a real IndexedDB implementation in Node/jsdom.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOfflineDb,
  generateLocalId,
  clearOfflineData,
  type SyncQueueItem,
  type OfflineClient,
  type OfflineLoan,
  type OfflineRepayment,
  type OfflineFieldCollection,
  type SyncConflict,
  type CachedDataItem,
} from './offlineDb';

// Reset the DB between tests by clearing all stores
beforeEach(async () => {
  await clearOfflineData();
});

// ─── generateLocalId ────────────────────────────────────────────────────────

describe('generateLocalId', () => {
  it('returns a string starting with "local_"', () => {
    const id = generateLocalId();
    expect(id).toMatch(/^local_/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateLocalId()));
    expect(ids.size).toBe(100);
  });

  it('contains a timestamp component', () => {
    const before = Date.now();
    const id = generateLocalId();
    const after = Date.now();
    const parts = id.split('_');
    const timestamp = Number(parts[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// ─── Database initialization ────────────────────────────────────────────────

describe('getOfflineDb', () => {
  it('returns a database instance', async () => {
    const db = await getOfflineDb();
    expect(db).toBeDefined();
    expect(db.name).toBe('mfi-clarity-offline');
  });

  it('returns the same instance on subsequent calls', async () => {
    const db1 = await getOfflineDb();
    const db2 = await getOfflineDb();
    expect(db1).toBe(db2);
  });

  it('creates all 7 object stores', async () => {
    const db = await getOfflineDb();
    expect(db.objectStoreNames).toContain('syncQueue');
    expect(db.objectStoreNames).toContain('offlineClients');
    expect(db.objectStoreNames).toContain('offlineLoans');
    expect(db.objectStoreNames).toContain('offlineRepayments');
    expect(db.objectStoreNames).toContain('offlineFieldCollections');
    expect(db.objectStoreNames).toContain('syncConflicts');
    expect(db.objectStoreNames).toContain('cachedData');
  });
});

// ─── syncQueue CRUD ─────────────────────────────────────────────────────────

describe('syncQueue store', () => {
  it('adds and retrieves a sync queue item', async () => {
    const db = await getOfflineDb();
    const item: SyncQueueItem = {
      id: 'sync_1',
      entityType: 'client',
      entityId: 'local_123',
      operation: 'create',
      data: { first_name: 'Kwame', last_name: 'Mensah' },
      orgId: 'org-1',
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await db.add('syncQueue', item);
    const retrieved = await db.get('syncQueue', 'sync_1');
    expect(retrieved).toEqual(item);
  });

  it('queries by status index', async () => {
    const db = await getOfflineDb();
    const items: SyncQueueItem[] = [
      { id: 's1', entityType: 'client', entityId: 'e1', operation: 'create', data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0 },
      { id: 's2', entityType: 'loan', entityId: 'e2', operation: 'create', data: {}, orgId: 'o1', timestamp: 2, status: 'synced', retryCount: 0 },
      { id: 's3', entityType: 'repayment', entityId: 'e3', operation: 'create', data: {}, orgId: 'o1', timestamp: 3, status: 'pending', retryCount: 0 },
    ];

    for (const item of items) await db.add('syncQueue', item);

    const pending = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
    expect(pending).toHaveLength(2);
    expect(pending.map(p => p.id)).toEqual(['s1', 's3']);
  });

  it('queries by entity type index', async () => {
    const db = await getOfflineDb();
    await db.add('syncQueue', { id: 's1', entityType: 'client', entityId: 'e1', operation: 'create', data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0 });
    await db.add('syncQueue', { id: 's2', entityType: 'loan', entityId: 'e2', operation: 'create', data: {}, orgId: 'o1', timestamp: 2, status: 'pending', retryCount: 0 });
    await db.add('syncQueue', { id: 's3', entityType: 'client', entityId: 'e3', operation: 'create', data: {}, orgId: 'o1', timestamp: 3, status: 'pending', retryCount: 0 });

    const clients = await db.getAllFromIndex('syncQueue', 'by-entity', 'client');
    expect(clients).toHaveLength(2);
  });

  it('updates an item status via put', async () => {
    const db = await getOfflineDb();
    const item: SyncQueueItem = {
      id: 's1', entityType: 'client', entityId: 'e1', operation: 'create',
      data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0,
    };
    await db.add('syncQueue', item);

    await db.put('syncQueue', { ...item, status: 'syncing' });
    const updated = await db.get('syncQueue', 's1');
    expect(updated!.status).toBe('syncing');
  });

  it('tracks retry count and last error', async () => {
    const db = await getOfflineDb();
    const item: SyncQueueItem = {
      id: 's1', entityType: 'client', entityId: 'e1', operation: 'create',
      data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0,
    };
    await db.add('syncQueue', item);

    await db.put('syncQueue', { ...item, status: 'pending', retryCount: 2, lastError: 'Network timeout' });
    const updated = await db.get('syncQueue', 's1');
    expect(updated!.retryCount).toBe(2);
    expect(updated!.lastError).toBe('Network timeout');
  });
});

// ─── offlineClients CRUD ────────────────────────────────────────────────────

describe('offlineClients store', () => {
  it('stores and retrieves a client', async () => {
    const db = await getOfflineDb();
    const client: OfflineClient = {
      id: 'local_1',
      localId: 'local_1',
      orgId: 'org-1',
      data: { first_name: 'Ama', last_name: 'Darko', ghana_card_number: 'GHA-123' },
      syncStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.add('offlineClients', client);
    const retrieved = await db.get('offlineClients', 'local_1');
    expect(retrieved!.data.first_name).toBe('Ama');
  });

  it('queries by org index', async () => {
    const db = await getOfflineDb();
    await db.add('offlineClients', { id: 'c1', localId: 'c1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineClients', { id: 'c2', localId: 'c2', orgId: 'org-2', data: {}, syncStatus: 'pending', createdAt: 2, updatedAt: 2 });
    await db.add('offlineClients', { id: 'c3', localId: 'c3', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 3, updatedAt: 3 });

    const org1Clients = await db.getAllFromIndex('offlineClients', 'by-org', 'org-1');
    expect(org1Clients).toHaveLength(2);
  });

  it('updates with server ID after sync', async () => {
    const db = await getOfflineDb();
    const client: OfflineClient = {
      id: 'local_1', localId: 'local_1', orgId: 'org-1',
      data: { first_name: 'Ama' }, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    };
    await db.add('offlineClients', client);

    await db.put('offlineClients', {
      ...client, serverId: 'server-uuid-123', syncStatus: 'synced', updatedAt: Date.now(),
    });

    const updated = await db.get('offlineClients', 'local_1');
    expect(updated!.serverId).toBe('server-uuid-123');
    expect(updated!.syncStatus).toBe('synced');
  });
});

// ─── offlineLoans with parent references ────────────────────────────────────

describe('offlineLoans store', () => {
  it('stores a loan referencing a local client', async () => {
    const db = await getOfflineDb();
    const loan: OfflineLoan = {
      id: 'loan_local_1',
      localId: 'loan_local_1',
      clientLocalId: 'client_local_1',
      orgId: 'org-1',
      data: { principal: 5000, interest_rate: 24 },
      syncStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.add('offlineLoans', loan);
    const retrieved = await db.get('offlineLoans', 'loan_local_1');
    expect(retrieved!.clientLocalId).toBe('client_local_1');
    expect(retrieved!.data.principal).toBe(5000);
  });

  it('queries by client local ID', async () => {
    const db = await getOfflineDb();
    await db.add('offlineLoans', { id: 'l1', localId: 'l1', clientLocalId: 'c1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineLoans', { id: 'l2', localId: 'l2', clientLocalId: 'c2', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 2, updatedAt: 2 });
    await db.add('offlineLoans', { id: 'l3', localId: 'l3', clientLocalId: 'c1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 3, updatedAt: 3 });

    const c1Loans = await db.getAllFromIndex('offlineLoans', 'by-client', 'c1');
    expect(c1Loans).toHaveLength(2);
  });

  it('updates clientServerId after parent syncs', async () => {
    const db = await getOfflineDb();
    const loan: OfflineLoan = {
      id: 'l1', localId: 'l1', clientLocalId: 'local_c1', orgId: 'org-1',
      data: { principal: 1000 }, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    };
    await db.add('offlineLoans', loan);

    await db.put('offlineLoans', {
      ...loan, clientServerId: 'server-client-uuid', serverId: 'server-loan-uuid', syncStatus: 'synced',
    });

    const updated = await db.get('offlineLoans', 'l1');
    expect(updated!.clientServerId).toBe('server-client-uuid');
    expect(updated!.serverId).toBe('server-loan-uuid');
  });
});

// ─── offlineRepayments ──────────────────────────────────────────────────────

describe('offlineRepayments store', () => {
  it('stores a repayment referencing a local loan', async () => {
    const db = await getOfflineDb();
    const repayment: OfflineRepayment = {
      id: 'r1', localId: 'r1', loanLocalId: 'loan_local_1', orgId: 'org-1',
      data: { amount: 500, payment_date: '2026-02-09' },
      syncStatus: 'pending', createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.add('offlineRepayments', repayment);

    const retrieved = await db.get('offlineRepayments', 'r1');
    expect(retrieved!.loanLocalId).toBe('loan_local_1');
    expect(retrieved!.data.amount).toBe(500);
  });

  it('queries by loan local ID', async () => {
    const db = await getOfflineDb();
    await db.add('offlineRepayments', { id: 'r1', localId: 'r1', loanLocalId: 'l1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineRepayments', { id: 'r2', localId: 'r2', loanLocalId: 'l1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 2, updatedAt: 2 });
    await db.add('offlineRepayments', { id: 'r3', localId: 'r3', loanLocalId: 'l2', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 3, updatedAt: 3 });

    const l1Repayments = await db.getAllFromIndex('offlineRepayments', 'by-loan', 'l1');
    expect(l1Repayments).toHaveLength(2);
  });
});

// ─── offlineFieldCollections ────────────────────────────────────────────────

describe('offlineFieldCollections store', () => {
  it('stores a field collection with GPS data', async () => {
    const db = await getOfflineDb();
    const collection: OfflineFieldCollection = {
      id: 'fc1', localId: 'fc1', orgId: 'org-1',
      data: { amount_collected: 250, latitude: 5.6037, longitude: -0.1870, location_accuracy: 10 },
      syncStatus: 'pending', createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.add('offlineFieldCollections', collection);

    const retrieved = await db.get('offlineFieldCollections', 'fc1');
    expect(retrieved!.data.latitude).toBe(5.6037);
  });
});

// ─── syncConflicts ──────────────────────────────────────────────────────────

describe('syncConflicts store', () => {
  it('stores and retrieves a conflict', async () => {
    const db = await getOfflineDb();
    const conflict: SyncConflict = {
      id: 'conflict_1',
      entityType: 'client',
      entityId: 'local_c1',
      localData: { first_name: 'Kwame' },
      serverData: { first_name: 'Kofi' },
      conflictType: 'update_conflict',
      status: 'pending',
      createdAt: Date.now(),
    };
    await db.add('syncConflicts', conflict);

    const retrieved = await db.get('syncConflicts', 'conflict_1');
    expect(retrieved!.conflictType).toBe('update_conflict');
    expect(retrieved!.localData.first_name).toBe('Kwame');
    expect(retrieved!.serverData.first_name).toBe('Kofi');
  });

  it('queries pending conflicts by status', async () => {
    const db = await getOfflineDb();
    await db.add('syncConflicts', { id: 'c1', entityType: 'client', entityId: 'e1', localData: {}, serverData: {}, conflictType: 'update_conflict', status: 'pending', createdAt: 1 });
    await db.add('syncConflicts', { id: 'c2', entityType: 'loan', entityId: 'e2', localData: {}, serverData: {}, conflictType: 'duplicate', status: 'resolved_local', createdAt: 2 });
    await db.add('syncConflicts', { id: 'c3', entityType: 'client', entityId: 'e3', localData: {}, serverData: {}, conflictType: 'update_conflict', status: 'pending', createdAt: 3 });

    const pending = await db.getAllFromIndex('syncConflicts', 'by-status', 'pending');
    expect(pending).toHaveLength(2);
  });

  it('resolves a conflict and tracks metadata', async () => {
    const db = await getOfflineDb();
    const conflict: SyncConflict = {
      id: 'c1', entityType: 'client', entityId: 'e1',
      localData: { name: 'local' }, serverData: { name: 'server' },
      conflictType: 'update_conflict', status: 'pending', createdAt: 1,
    };
    await db.add('syncConflicts', conflict);

    await db.put('syncConflicts', {
      ...conflict, status: 'resolved_server', resolvedAt: Date.now(), resolvedBy: 'user-123',
    });

    const resolved = await db.get('syncConflicts', 'c1');
    expect(resolved!.status).toBe('resolved_server');
    expect(resolved!.resolvedBy).toBe('user-123');
    expect(resolved!.resolvedAt).toBeGreaterThan(0);
  });
});

// ─── cachedData ─────────────────────────────────────────────────────────────

describe('cachedData store', () => {
  it('stores and retrieves cached data with expiration', async () => {
    const db = await getOfflineDb();
    const cached: CachedDataItem = {
      key: 'kpis-org-1',
      type: 'kpi',
      data: { total_clients: 150, total_loans: 80 },
      cachedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    await db.add('cachedData', cached);

    const retrieved = await db.get('cachedData', 'kpis-org-1');
    expect(retrieved!.type).toBe('kpi');
    expect((retrieved!.data as any).total_clients).toBe(150);
  });

  it('queries by type index', async () => {
    const db = await getOfflineDb();
    await db.add('cachedData', { key: 'k1', type: 'kpi', data: {}, cachedAt: 1, expiresAt: 2 });
    await db.add('cachedData', { key: 'k2', type: 'report', data: {}, cachedAt: 1, expiresAt: 2 });
    await db.add('cachedData', { key: 'k3', type: 'kpi', data: {}, cachedAt: 1, expiresAt: 2 });

    const kpiItems = await db.getAllFromIndex('cachedData', 'by-type', 'kpi');
    expect(kpiItems).toHaveLength(2);
  });
});

// ─── clearOfflineData ───────────────────────────────────────────────────────

describe('clearOfflineData', () => {
  it('clears all stores', async () => {
    const db = await getOfflineDb();

    // Populate every store
    await db.add('syncQueue', { id: 's1', entityType: 'client', entityId: 'e1', operation: 'create', data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0 });
    await db.add('offlineClients', { id: 'c1', localId: 'c1', orgId: 'o1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineLoans', { id: 'l1', localId: 'l1', clientLocalId: 'c1', orgId: 'o1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineRepayments', { id: 'r1', localId: 'r1', loanLocalId: 'l1', orgId: 'o1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineFieldCollections', { id: 'fc1', localId: 'fc1', orgId: 'o1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('syncConflicts', { id: 'cf1', entityType: 'client', entityId: 'e1', localData: {}, serverData: {}, conflictType: 'update_conflict', status: 'pending', createdAt: 1 });
    await db.add('cachedData', { key: 'k1', type: 'kpi', data: {}, cachedAt: 1, expiresAt: 2 });

    await clearOfflineData();

    expect(await db.count('syncQueue')).toBe(0);
    expect(await db.count('offlineClients')).toBe(0);
    expect(await db.count('offlineLoans')).toBe(0);
    expect(await db.count('offlineRepayments')).toBe(0);
    expect(await db.count('offlineFieldCollections')).toBe(0);
    expect(await db.count('syncConflicts')).toBe(0);
    expect(await db.count('cachedData')).toBe(0);
  });
});

// ─── Dependency chain simulation ────────────────────────────────────────────

describe('dependency chain: client → loan → repayment', () => {
  it('stores a full offline chain and resolves IDs', async () => {
    const db = await getOfflineDb();

    // 1. Create client offline
    const clientId = generateLocalId();
    await db.add('offlineClients', {
      id: clientId, localId: clientId, orgId: 'org-1',
      data: { first_name: 'Kwame', ghana_card_number: 'GHA-001' },
      syncStatus: 'pending', createdAt: Date.now(), updatedAt: Date.now(),
    });

    // 2. Create loan referencing local client
    const loanId = generateLocalId();
    await db.add('offlineLoans', {
      id: loanId, localId: loanId, clientLocalId: clientId, orgId: 'org-1',
      data: { principal: 5000, client_id: clientId },
      syncStatus: 'pending', createdAt: Date.now(), updatedAt: Date.now(),
    });

    // 3. Create repayment referencing local loan
    const repaymentId = generateLocalId();
    await db.add('offlineRepayments', {
      id: repaymentId, localId: repaymentId, loanLocalId: loanId, orgId: 'org-1',
      data: { amount: 500, loan_id: loanId },
      syncStatus: 'pending', createdAt: Date.now(), updatedAt: Date.now(),
    });

    // Verify the chain
    const loan = await db.get('offlineLoans', loanId);
    expect(loan!.clientLocalId).toBe(clientId);

    const repayment = await db.get('offlineRepayments', repaymentId);
    expect(repayment!.loanLocalId).toBe(loanId);

    // Simulate sync: client gets server ID
    const client = await db.get('offlineClients', clientId);
    await db.put('offlineClients', { ...client!, serverId: 'server-client-uuid', syncStatus: 'synced' });

    // Verify server ID is accessible for loan sync
    const syncedClient = await db.get('offlineClients', clientId);
    expect(syncedClient!.serverId).toBe('server-client-uuid');

    // Simulate loan sync: resolve client reference, get server ID
    await db.put('offlineLoans', {
      ...loan!, clientServerId: 'server-client-uuid', serverId: 'server-loan-uuid', syncStatus: 'synced',
    });

    const syncedLoan = await db.get('offlineLoans', loanId);
    expect(syncedLoan!.serverId).toBe('server-loan-uuid');
    expect(syncedLoan!.clientServerId).toBe('server-client-uuid');
  });
});
