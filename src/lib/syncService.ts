import { supabase } from '@/integrations/supabase/client';
import {
  getOfflineDb,
  SyncQueueItem,
  SyncConflict,
  OfflineClient,
  OfflineLoan,
  OfflineRepayment,
  OfflineFieldCollection,
  SyncStatus,
} from './offlineDb';

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  details: string[];
}

// Get pending items count
export async function getPendingSyncCount(): Promise<number> {
  const db = await getOfflineDb();
  const pending = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  return pending.length;
}

// Get all conflicts for review
export async function getPendingConflicts(): Promise<SyncConflict[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('syncConflicts', 'by-status', 'pending');
}

// Add item to sync queue
export async function addToSyncQueue(
  entityType: SyncQueueItem['entityType'],
  entityId: string,
  operation: SyncQueueItem['operation'],
  data: Record<string, unknown>,
  orgId: string
): Promise<void> {
  const db = await getOfflineDb();
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    entityType,
    entityId,
    operation,
    data,
    orgId,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  await db.add('syncQueue', item);
}

// Sync all pending items
export async function syncAll(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    conflicts: 0,
    errors: 0,
    details: [],
  };

  if (!navigator.onLine) {
    result.success = false;
    result.details.push('No internet connection');
    return result;
  }

  const db = await getOfflineDb();

  // Sync in order: clients first, then loans, then repayments, then field collections
  const entityOrder: SyncQueueItem['entityType'][] = [
    'client',
    'loan',
    'repayment',
    'field_collection',
  ];

  for (const entityType of entityOrder) {
    const items = await db.getAllFromIndex('syncQueue', 'by-entity', entityType);
    const pendingItems = items.filter((i) => i.status === 'pending');

    for (const item of pendingItems) {
      try {
        await syncItem(item, db, result);
      } catch (error) {
        result.errors++;
        result.details.push(`Error syncing ${entityType}: ${error}`);
      }
    }
  }

  return result;
}

async function syncItem(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  result: SyncResult
): Promise<void> {
  // Mark as syncing
  await db.put('syncQueue', { ...item, status: 'syncing' as SyncStatus });

  try {
    switch (item.entityType) {
      case 'client':
        await syncClient(item, db, result);
        break;
      case 'loan':
        await syncLoan(item, db, result);
        break;
      case 'repayment':
        await syncRepayment(item, db, result);
        break;
      case 'field_collection':
        await syncFieldCollection(item, db, result);
        break;
    }

    // Mark as synced
    await db.put('syncQueue', { ...item, status: 'synced' as SyncStatus });
    result.synced++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a conflict
    if (errorMessage.includes('conflict') || errorMessage.includes('duplicate')) {
      await createConflict(item, db, errorMessage);
      await db.put('syncQueue', { ...item, status: 'conflict' as SyncStatus });
      result.conflicts++;
    } else {
      // Retry logic
      const newRetryCount = item.retryCount + 1;
      if (newRetryCount >= 3) {
        await db.put('syncQueue', {
          ...item,
          status: 'error' as SyncStatus,
          retryCount: newRetryCount,
          lastError: errorMessage,
        });
        result.errors++;
      } else {
        await db.put('syncQueue', {
          ...item,
          status: 'pending' as SyncStatus,
          retryCount: newRetryCount,
          lastError: errorMessage,
        });
      }
    }
  }
}

async function syncClient(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  result: SyncResult
): Promise<void> {
  const clientData = item.data;
  
  if (item.operation === 'create') {
    // Check for existing client with same Ghana Card
    const { data: existing } = await supabase
      .from('clients')
      .select('client_id')
      .eq('ghana_card_number', clientData.ghana_card_number as string)
      .eq('org_id', item.orgId)
      .maybeSingle();

    if (existing) {
      throw new Error('conflict: Client with this Ghana Card already exists');
    }

    // Build insert object with explicit fields
    const insertData = {
      first_name: clientData.first_name as string,
      last_name: clientData.last_name as string,
      date_of_birth: clientData.date_of_birth as string,
      gender: clientData.gender as string,
      ghana_card_number: clientData.ghana_card_number as string,
      ghana_card_expiry: clientData.ghana_card_expiry as string,
      nationality: clientData.nationality as string,
      occupation: clientData.occupation as string,
      risk_category: clientData.risk_category as string,
      source_of_funds: clientData.source_of_funds as string,
      org_id: item.orgId,
      phone: clientData.phone as string | null,
      email: clientData.email as string | null,
      address: clientData.address as string | null,
      client_type: clientData.client_type as 'INDIVIDUAL' | 'GROUP' | 'COOPERATIVE' | 'SME',
      group_name: clientData.group_name as string | null,
      monthly_income: clientData.monthly_income as number | null,
      monthly_expenses: clientData.monthly_expenses as number | null,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
      .select('client_id')
      .single();

    if (error) throw error;

    // Update local record with server ID
    const offlineClient = await db.get('offlineClients', item.entityId);
    if (offlineClient) {
      await db.put('offlineClients', {
        ...offlineClient,
        serverId: data.client_id,
        syncStatus: 'synced' as SyncStatus,
      });
    }

    result.details.push(`Client synced: ${clientData.first_name} ${clientData.last_name}`);
  }
}

async function syncLoan(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  result: SyncResult
): Promise<void> {
  const loanData = item.data;
  
  if (item.operation === 'create') {
    // Get the server client ID if this was created with a local client
    let clientId = loanData.client_id as string;
    
    if (clientId.startsWith('local_')) {
      const offlineClient = await db.get('offlineClients', clientId);
      if (offlineClient?.serverId) {
        clientId = offlineClient.serverId;
      } else {
        throw new Error('Parent client not yet synced');
      }
    }

    const insertData = {
      client_id: clientId,
      org_id: item.orgId,
      principal: loanData.principal as number,
      interest_rate: loanData.interest_rate as number,
      term_months: loanData.term_months as number,
      loan_type: loanData.loan_type as string,
      interest_method: loanData.interest_method as 'FLAT' | 'REDUCING_BALANCE',
      interest_calc_frequency: loanData.interest_calc_frequency as 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
      repayment_frequency: loanData.repayment_frequency as 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY',
      purpose: loanData.purpose as string | null,
      penalty_type: loanData.penalty_type as 'NONE' | 'FLAT_AMOUNT' | 'PERCENT_OVERDUE' | 'PERCENT_INSTALLMENT' | 'DAILY_RATE',
      penalty_value: loanData.penalty_value as number | null,
      penalty_grace_days: loanData.penalty_grace_days as number | null,
    };

    const { data, error } = await supabase
      .from('loans')
      .insert(insertData)
      .select('loan_id')
      .single();

    if (error) throw error;

    // Update local record with server ID
    const offlineLoan = await db.get('offlineLoans', item.entityId);
    if (offlineLoan) {
      await db.put('offlineLoans', {
        ...offlineLoan,
        serverId: data.loan_id,
        clientServerId: clientId,
        syncStatus: 'synced' as SyncStatus,
      });
    }

    result.details.push(`Loan synced: ${loanData.principal} GHS`);
  }
}

async function syncRepayment(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  result: SyncResult
): Promise<void> {
  const repaymentData = item.data;
  
  if (item.operation === 'create') {
    let loanId = repaymentData.loan_id as string;
    
    if (loanId.startsWith('local_')) {
      const offlineLoan = await db.get('offlineLoans', loanId);
      if (offlineLoan?.serverId) {
        loanId = offlineLoan.serverId;
      } else {
        throw new Error('Parent loan not yet synced');
      }
    }

    const insertData = {
      loan_id: loanId,
      org_id: item.orgId,
      amount: repaymentData.amount as number,
      payment_date: repaymentData.payment_date as string,
      payment_method: repaymentData.payment_method as string | null,
      reference: repaymentData.reference as string | null,
      notes: repaymentData.notes as string | null,
      principal_portion: repaymentData.principal_portion as number | null,
      interest_portion: repaymentData.interest_portion as number | null,
      penalty_portion: repaymentData.penalty_portion as number | null,
    };

    const { error } = await supabase.from('repayments').insert(insertData);

    if (error) throw error;

    result.details.push(`Repayment synced: ${repaymentData.amount} GHS`);
  }
}

async function syncFieldCollection(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  result: SyncResult
): Promise<void> {
  const collectionData = item.data;
  
  if (item.operation === 'create') {
    let loanId = collectionData.loan_id as string;
    let clientId = collectionData.client_id as string;
    
    if (loanId.startsWith('local_')) {
      const offlineLoan = await db.get('offlineLoans', loanId);
      if (offlineLoan?.serverId) {
        loanId = offlineLoan.serverId;
      } else {
        throw new Error('Parent loan not yet synced');
      }
    }

    if (clientId.startsWith('local_')) {
      const offlineClient = await db.get('offlineClients', clientId);
      if (offlineClient?.serverId) {
        clientId = offlineClient.serverId;
      } else {
        throw new Error('Parent client not yet synced');
      }
    }

    const insertData = {
      loan_id: loanId,
      client_id: clientId,
      org_id: item.orgId,
      amount_collected: collectionData.amount_collected as number,
      collected_by: collectionData.collected_by as string,
      collection_method: collectionData.collection_method as string | null,
      latitude: collectionData.latitude as number | null,
      longitude: collectionData.longitude as number | null,
      location_accuracy: collectionData.location_accuracy as number | null,
      location_address: collectionData.location_address as string | null,
      receipt_photo_url: collectionData.receipt_photo_url as string | null,
      signature_url: collectionData.signature_url as string | null,
      notes: collectionData.notes as string | null,
    };

    const { error } = await supabase.from('field_collections').insert(insertData);

    if (error) throw error;

    result.details.push(`Field collection synced: ${collectionData.amount_collected} GHS`);
  }
}

async function createConflict(
  item: SyncQueueItem,
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  errorMessage: string
): Promise<void> {
  const conflict: SyncConflict = {
    id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    entityType: item.entityType,
    entityId: item.entityId,
    localData: item.data,
    serverData: {}, // Would be fetched from server in a real implementation
    conflictType: errorMessage.includes('duplicate') ? 'duplicate' : 'update_conflict',
    status: 'pending',
    createdAt: Date.now(),
  };
  await db.add('syncConflicts', conflict);
}

// Resolve a conflict
export async function resolveConflict(
  conflictId: string,
  resolution: 'local' | 'server',
  resolvedBy: string
): Promise<void> {
  const db = await getOfflineDb();
  const conflict = await db.get('syncConflicts', conflictId);
  
  if (!conflict) throw new Error('Conflict not found');

  if (resolution === 'local') {
    // Re-queue the local data for sync
    const queueItems = await db.getAll('syncQueue');
    const originalItem = queueItems.find(
      (q) => q.entityId === conflict.entityId && q.status === 'conflict'
    );
    
    if (originalItem) {
      await db.put('syncQueue', { ...originalItem, status: 'pending' as SyncStatus, retryCount: 0 });
    }
  }

  await db.put('syncConflicts', {
    ...conflict,
    status: resolution === 'local' ? 'resolved_local' : 'resolved_server',
    resolvedAt: Date.now(),
    resolvedBy,
  });
}
