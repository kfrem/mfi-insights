/**
 * Tests for getOfflineCounts from useOfflineStorage.ts
 *
 * The React hooks in useOfflineStorage.ts require context providers and React Query,
 * but getOfflineCounts is a pure async utility function that we can test directly.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOfflineDb, clearOfflineData } from './offlineDb';

// Mock supabase (required by syncService import chain)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// Import after mock setup
import { getOfflineCounts } from '@/hooks/useOfflineStorage';

beforeEach(async () => {
  await clearOfflineData();
});

describe('getOfflineCounts', () => {
  it('returns all zeros when nothing is pending', async () => {
    const counts = await getOfflineCounts();
    expect(counts).toEqual({
      clients: 0,
      loans: 0,
      repayments: 0,
      fieldCollections: 0,
      pendingSync: 0,
    });
  });

  it('counts pending clients', async () => {
    const db = await getOfflineDb();
    await db.add('offlineClients', {
      id: 'c1', localId: 'c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });
    await db.add('offlineClients', {
      id: 'c2', localId: 'c2', orgId: 'org-1',
      data: {}, syncStatus: 'synced', createdAt: 2, updatedAt: 2,
    });
    await db.add('offlineClients', {
      id: 'c3', localId: 'c3', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 3, updatedAt: 3,
    });

    const counts = await getOfflineCounts();
    expect(counts.clients).toBe(2);
  });

  it('counts pending loans', async () => {
    const db = await getOfflineDb();
    await db.add('offlineLoans', {
      id: 'l1', localId: 'l1', clientLocalId: 'c1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });

    const counts = await getOfflineCounts();
    expect(counts.loans).toBe(1);
  });

  it('counts pending repayments', async () => {
    const db = await getOfflineDb();
    await db.add('offlineRepayments', {
      id: 'r1', localId: 'r1', loanLocalId: 'l1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });
    await db.add('offlineRepayments', {
      id: 'r2', localId: 'r2', loanLocalId: 'l1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 2, updatedAt: 2,
    });

    const counts = await getOfflineCounts();
    expect(counts.repayments).toBe(2);
  });

  it('counts pending field collections', async () => {
    const db = await getOfflineDb();
    await db.add('offlineFieldCollections', {
      id: 'fc1', localId: 'fc1', orgId: 'org-1',
      data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1,
    });

    const counts = await getOfflineCounts();
    expect(counts.fieldCollections).toBe(1);
  });

  it('counts pending sync queue items', async () => {
    const db = await getOfflineDb();
    await db.add('syncQueue', {
      id: 's1', entityType: 'client', entityId: 'e1', operation: 'create',
      data: {}, orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0,
    });
    await db.add('syncQueue', {
      id: 's2', entityType: 'loan', entityId: 'e2', operation: 'create',
      data: {}, orgId: 'org-1', timestamp: 2, status: 'synced', retryCount: 0,
    });
    await db.add('syncQueue', {
      id: 's3', entityType: 'repayment', entityId: 'e3', operation: 'create',
      data: {}, orgId: 'org-1', timestamp: 3, status: 'pending', retryCount: 0,
    });

    const counts = await getOfflineCounts();
    expect(counts.pendingSync).toBe(2);
  });

  it('counts across all entity types simultaneously', async () => {
    const db = await getOfflineDb();

    await db.add('offlineClients', { id: 'c1', localId: 'c1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineLoans', { id: 'l1', localId: 'l1', clientLocalId: 'c1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineRepayments', { id: 'r1', localId: 'r1', loanLocalId: 'l1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('offlineFieldCollections', { id: 'fc1', localId: 'fc1', orgId: 'org-1', data: {}, syncStatus: 'pending', createdAt: 1, updatedAt: 1 });
    await db.add('syncQueue', { id: 's1', entityType: 'client', entityId: 'c1', operation: 'create', data: {}, orgId: 'org-1', timestamp: 1, status: 'pending', retryCount: 0 });
    await db.add('syncQueue', { id: 's2', entityType: 'loan', entityId: 'l1', operation: 'create', data: {}, orgId: 'org-1', timestamp: 2, status: 'pending', retryCount: 0 });

    const counts = await getOfflineCounts();
    expect(counts.clients).toBe(1);
    expect(counts.loans).toBe(1);
    expect(counts.repayments).toBe(1);
    expect(counts.fieldCollections).toBe(1);
    expect(counts.pendingSync).toBe(2);
  });
});
