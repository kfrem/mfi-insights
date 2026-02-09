/**
 * Tests for syncService.ts — sync orchestration, conflict detection, retry logic
 *
 * Uses fake-indexeddb for real IndexedDB + vi.mock for Supabase.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  getOfflineDb,
  clearOfflineData,
  type SyncQueueItem,
  type SyncConflict,
  type OfflineClient,
  type OfflineLoan,
  type OfflineRepayment,
} from './offlineDb';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: { client_id: 'server-uuid-1' }, error: null }),
    insert: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: vi.fn(() => mockChain),
    },
  };
});

import {
  addToSyncQueue,
  getPendingSyncCount,
  getPendingConflicts,
  syncAll,
  resolveConflict,
} from './syncService';
import { supabase } from '@/integrations/supabase/client';

beforeEach(async () => {
  await clearOfflineData();
  vi.clearAllMocks();
});

// ─── addToSyncQueue ──────────────────────────────────────────────────────────

describe('addToSyncQueue', () => {
  it('adds an item to the sync queue with correct structure', async () => {
    await addToSyncQueue('client', 'local_123', 'create', { first_name: 'Kwame' }, 'org-1');

    const db = await getOfflineDb();
    const items = await db.getAll('syncQueue');
    expect(items).toHaveLength(1);
    expect(items[0].entityType).toBe('client');
    expect(items[0].entityId).toBe('local_123');
    expect(items[0].operation).toBe('create');
    expect(items[0].orgId).toBe('org-1');
    expect(items[0].status).toBe('pending');
    expect(items[0].retryCount).toBe(0);
    expect(items[0].data).toEqual({ first_name: 'Kwame' });
  });

  it('generates a sync_ prefixed ID', async () => {
    await addToSyncQueue('loan', 'l1', 'create', {}, 'org-1');

    const db = await getOfflineDb();
    const items = await db.getAll('syncQueue');
    expect(items[0].id).toMatch(/^sync_/);
  });

  it('can queue multiple items of different entity types', async () => {
    await addToSyncQueue('client', 'c1', 'create', {}, 'org-1');
    await addToSyncQueue('loan', 'l1', 'create', {}, 'org-1');
    await addToSyncQueue('repayment', 'r1', 'create', {}, 'org-1');

    const db = await getOfflineDb();
    const items = await db.getAll('syncQueue');
    expect(items).toHaveLength(3);
  });
});

// ─── getPendingSyncCount ─────────────────────────────────────────────────────

describe('getPendingSyncCount', () => {
  it('returns 0 when queue is empty', async () => {
    const count = await getPendingSyncCount();
    expect(count).toBe(0);
  });

  it('counts only pending items', async () => {
    const db = await getOfflineDb();
    await db.add('syncQueue', { id: 's1', entityType: 'client', entityId: 'e1', operation: 'create', data: {}, orgId: 'o1', timestamp: 1, status: 'pending', retryCount: 0 });
    await db.add('syncQueue', { id: 's2', entityType: 'loan', entityId: 'e2', operation: 'create', data: {}, orgId: 'o1', timestamp: 2, status: 'synced', retryCount: 0 });
    await db.add('syncQueue', { id: 's3', entityType: 'repayment', entityId: 'e3', operation: 'create', data: {}, orgId: 'o1', timestamp: 3, status: 'pending', retryCount: 0 });
    await db.add('syncQueue', { id: 's4', entityType: 'client', entityId: 'e4', operation: 'create', data: {}, orgId: 'o1', timestamp: 4, status: 'error', retryCount: 3 });

    const count = await getPendingSyncCount();
    expect(count).toBe(2);
  });
});

// ─── getPendingConflicts ─────────────────────────────────────────────────────

describe('getPendingConflicts', () => {
  it('returns empty array when no conflicts', async () => {
    const conflicts = await getPendingConflicts();
    expect(conflicts).toEqual([]);
  });

  it('returns only pending conflicts', async () => {
    const db = await getOfflineDb();
    await db.add('syncConflicts', { id: 'c1', entityType: 'client', entityId: 'e1', localData: {}, serverData: {}, conflictType: 'duplicate', status: 'pending', createdAt: 1 });
    await db.add('syncConflicts', { id: 'c2', entityType: 'loan', entityId: 'e2', localData: {}, serverData: {}, conflictType: 'update_conflict', status: 'resolved_local', createdAt: 2 });
    await db.add('syncConflicts', { id: 'c3', entityType: 'client', entityId: 'e3', localData: {}, serverData: {}, conflictType: 'duplicate', status: 'pending', createdAt: 3 });

    const conflicts = await getPendingConflicts();
    expect(conflicts).toHaveLength(2);
    expect(conflicts.every(c => c.status === 'pending')).toBe(true);
  });
});

// ─── syncAll ─────────────────────────────────────────────────────────────────

describe('syncAll', () => {
  it('returns failure when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

    const result = await syncAll();
    expect(result.success).toBe(false);
    expect(result.details).toContain('No internet connection');

    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  it('returns success with no pending items', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const result = await syncAll();
    expect(result.success).toBe(true);
    expect(result.synced).toBe(0);
    expect(result.conflicts).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('syncs a pending client successfully', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    // Set up offline client
    const clientData = {
      first_name: 'Ama',
      last_name: 'Darko',
      ghana_card_number: 'GHA-001',
    };
    await db.add('offlineClients', {
      id: 'local_c1', localId: 'local_c1', orgId: 'org-1',
      data: clientData, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: clientData, orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    // Mock: no existing client (maybeSingle → null), insert succeeds
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { client_id: 'server-uuid-1' }, error: null }),
      insert: vi.fn().mockReturnThis(),
    };
    (supabase.from as Mock).mockReturnValue(mockChain);

    const result = await syncAll();
    expect(result.synced).toBe(1);
    expect(result.errors).toBe(0);

    // Verify queue item marked as synced
    const queueItem = await db.get('syncQueue', 'sq1');
    expect(queueItem!.status).toBe('synced');

    // Verify offline client got server ID
    const syncedClient = await db.get('offlineClients', 'local_c1');
    expect(syncedClient!.serverId).toBe('server-uuid-1');
    expect(syncedClient!.syncStatus).toBe('synced');
  });

  it('detects conflicts on duplicate Ghana Card', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    const clientData = {
      first_name: 'Kwame',
      last_name: 'Mensah',
      ghana_card_number: 'GHA-DUPLICATE',
    };
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: clientData, orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    // Mock: existing client found (conflict scenario)
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { client_id: 'existing-uuid' }, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
    };
    (supabase.from as Mock).mockReturnValue(mockChain);

    const result = await syncAll();
    expect(result.conflicts).toBe(1);

    // Verify queue item marked as conflict
    const queueItem = await db.get('syncQueue', 'sq1');
    expect(queueItem!.status).toBe('conflict');

    // Verify conflict record created
    const conflicts = await db.getAll('syncConflicts');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].conflictType).toBe('update_conflict');
    expect(conflicts[0].status).toBe('pending');
    expect(conflicts[0].entityId).toBe('local_c1');
  });

  it('retries on non-conflict errors and marks error after 3 attempts', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    // Item already has retryCount 2 (this will be attempt 3)
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: { first_name: 'Test', ghana_card_number: 'GHA-ERR' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 2,
    });

    // Mock: server error (not a conflict) — use a real Error instance
    const mockInsertSelectChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('Internal server error')),
      }),
    };
    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnValue(mockInsertSelectChain),
    }));

    const result = await syncAll();
    expect(result.errors).toBe(1);

    // Verify queue item marked as error (not pending)
    const queueItem = await db.get('syncQueue', 'sq1');
    expect(queueItem!.status).toBe('error');
    expect(queueItem!.retryCount).toBe(3);
  });

  it('increments retry count on first failure', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: { first_name: 'Test', ghana_card_number: 'GHA-RETRY' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    // Mock: server error — use a real Error so instanceof check works
    const mockInsertSelectChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('Connection timeout')),
      }),
    };
    (supabase.from as Mock).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnValue(mockInsertSelectChain),
    }));

    await syncAll();

    const queueItem = await db.get('syncQueue', 'sq1');
    // retryCount should be 1, status back to pending for retry
    expect(queueItem!.retryCount).toBe(1);
    expect(queueItem!.status).toBe('pending');
    expect(queueItem!.lastError).toContain('Connection timeout');
  });

  it('syncs in dependency order: clients before loans', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();
    const syncOrder: string[] = [];

    // Add loan queue item first, client second (wrong order)
    await db.add('syncQueue', {
      id: 'sq2', entityType: 'loan', entityId: 'local_l1', operation: 'create',
      data: { principal: 5000, client_id: 'local_c1' },
      orgId: 'org-1', timestamp: 2, status: 'pending', retryCount: 0,
    });
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: { first_name: 'Ama', ghana_card_number: 'GHA-002' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    // Set up offline client for server ID resolution
    await db.add('offlineClients', {
      id: 'local_c1', localId: 'local_c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });
    await db.add('offlineLoans', {
      id: 'local_l1', localId: 'local_l1', clientLocalId: 'local_c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });

    // Track which entity types get synced and in what order
    (supabase.from as Mock).mockImplementation((table: string) => {
      syncOrder.push(table);
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({
          data: table === 'clients'
            ? { client_id: 'server-client-uuid' }
            : { loan_id: 'server-loan-uuid' },
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      };
      return mockChain;
    });

    const result = await syncAll();
    expect(result.synced).toBe(2);

    // Client table should be accessed before loan table
    const clientIdx = syncOrder.indexOf('clients');
    const loanIdx = syncOrder.indexOf('loans');
    expect(clientIdx).toBeLessThan(loanIdx);
  });

  it('resolves local client ID to server ID when syncing loans', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    // Client already synced with server ID
    await db.add('offlineClients', {
      id: 'local_c1', localId: 'local_c1', serverId: 'server-client-uuid', orgId: 'org-1',
      data: {}, syncStatus: 'synced', createdAt: 1, updatedAt: 1,
    });

    // Loan referencing local client
    await db.add('offlineLoans', {
      id: 'local_l1', localId: 'local_l1', clientLocalId: 'local_c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'loan', entityId: 'local_l1', operation: 'create',
      data: { principal: 3000, client_id: 'local_c1' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    let insertedData: any = null;
    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { loan_id: 'server-loan-uuid' }, error: null }),
      insert: vi.fn().mockImplementation((data: any) => {
        insertedData = data;
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { loan_id: 'server-loan-uuid' }, error: null }),
        };
      }),
    }));

    const result = await syncAll();
    expect(result.synced).toBe(1);

    // Verify the local_c1 was resolved to server-client-uuid in the insert
    expect(insertedData).toBeTruthy();
    expect(insertedData.client_id).toBe('server-client-uuid');
  });

  it('retries repayment when parent loan not yet synced', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    // Loan with no server ID (not yet synced)
    await db.add('offlineLoans', {
      id: 'local_l1', localId: 'local_l1', clientLocalId: 'local_c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });

    // Repayment referencing unsynced loan
    await db.add('syncQueue', {
      id: 'sq1', entityType: 'repayment', entityId: 'local_r1', operation: 'create',
      data: { amount: 500, loan_id: 'local_l1' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    const result = await syncAll();

    // "Parent loan not yet synced" triggers retry, not immediate error
    // retryCount goes from 0 to 1, status back to pending
    const queueItem = await db.get('syncQueue', 'sq1');
    expect(queueItem!.retryCount).toBe(1);
    expect(queueItem!.status).toBe('pending');
    expect(queueItem!.lastError).toContain('Parent loan not yet synced');
    // Not counted as a final error (retryCount < 3)
    expect(result.errors).toBe(0);
  });

  it('skips already-synced items', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: {}, orgId: 'org-1', timestamp: 1, status: 'synced', retryCount: 0,
    });

    const result = await syncAll();
    expect(result.synced).toBe(0);
    // supabase.from should not be called for synced items
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// ─── resolveConflict ─────────────────────────────────────────────────────────

describe('resolveConflict', () => {
  it('throws when conflict not found', async () => {
    await expect(resolveConflict('nonexistent', 'local', 'user-1'))
      .rejects.toThrow('Conflict not found');
  });

  it('resolves conflict with server data', async () => {
    const db = await getOfflineDb();

    // Create a conflict
    const conflict: SyncConflict = {
      id: 'conflict_1', entityType: 'client', entityId: 'local_c1',
      localData: { first_name: 'Kwame' }, serverData: { first_name: 'Kofi' },
      conflictType: 'duplicate', status: 'pending', createdAt: Date.now(),
    };
    await db.add('syncConflicts', conflict);

    await resolveConflict('conflict_1', 'server', 'admin-user');

    const resolved = await db.get('syncConflicts', 'conflict_1');
    expect(resolved!.status).toBe('resolved_server');
    expect(resolved!.resolvedBy).toBe('admin-user');
    expect(resolved!.resolvedAt).toBeGreaterThan(0);
  });

  it('resolves conflict with local data and re-queues for sync', async () => {
    const db = await getOfflineDb();

    // Create the conflict
    const conflict: SyncConflict = {
      id: 'conflict_1', entityType: 'client', entityId: 'local_c1',
      localData: { first_name: 'Kwame' }, serverData: { first_name: 'Kofi' },
      conflictType: 'update_conflict', status: 'pending', createdAt: Date.now(),
    };
    await db.add('syncConflicts', conflict);

    // Create the original queue item with conflict status
    const queueItem: SyncQueueItem = {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: { first_name: 'Kwame' }, orgId: 'org-1', timestamp: 1,
      status: 'conflict', retryCount: 1,
    };
    await db.add('syncQueue', queueItem);

    await resolveConflict('conflict_1', 'local', 'admin-user');

    // Conflict should be marked as resolved_local
    const resolved = await db.get('syncConflicts', 'conflict_1');
    expect(resolved!.status).toBe('resolved_local');

    // Queue item should be re-queued as pending with retryCount reset
    const reQueued = await db.get('syncQueue', 'sq1');
    expect(reQueued!.status).toBe('pending');
    expect(reQueued!.retryCount).toBe(0);
  });

  it('handles server resolution without re-queuing', async () => {
    const db = await getOfflineDb();

    const conflict: SyncConflict = {
      id: 'conflict_1', entityType: 'loan', entityId: 'local_l1',
      localData: { principal: 5000 }, serverData: { principal: 4500 },
      conflictType: 'update_conflict', status: 'pending', createdAt: Date.now(),
    };
    await db.add('syncConflicts', conflict);

    // No queue item — server resolution doesn't need one
    await resolveConflict('conflict_1', 'server', 'manager');

    const resolved = await db.get('syncConflicts', 'conflict_1');
    expect(resolved!.status).toBe('resolved_server');

    // No queue item should be re-queued for server resolution
    const pendingCount = await getPendingSyncCount();
    expect(pendingCount).toBe(0);
  });
});

// ─── Conflict detection ──────────────────────────────────────────────────────

describe('conflict type detection', () => {
  it('detects duplicate conflicts from "duplicate" error message', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

    const db = await getOfflineDb();

    await db.add('syncQueue', {
      id: 'sq1', entityType: 'client', entityId: 'local_c1', operation: 'create',
      data: { first_name: 'Test', ghana_card_number: 'GHA-DUP' },
      orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });

    // Mock: maybeSingle returns null (no existing), but insert throws duplicate error
    const mockInsertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error('duplicate key value violates unique constraint')),
    };
    (supabase.from as Mock).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnValue(mockInsertChain),
    }));

    const result = await syncAll();
    expect(result.conflicts).toBe(1);

    const conflicts = await db.getAll('syncConflicts');
    expect(conflicts[0].conflictType).toBe('duplicate');
  });
});
