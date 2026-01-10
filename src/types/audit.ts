export type UserRole = 'ADMIN' | 'MANAGER' | 'FIELD_OFFICER' | 'TELLER';

export type ActionType = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

export type EntityType = 'client' | 'loan' | 'repayment' | 'field_collection' | 'user' | 'session';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  org_id: string;
  role: UserRole;
  created_at: string;
}

export interface ActivityAuditLog {
  id: string;
  org_id: string;
  user_id: string | null;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type CollectionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type CollectionMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';

export interface FieldCollection {
  id: string;
  org_id: string;
  repayment_id: string | null;
  loan_id: string;
  client_id: string;
  collected_by: string;
  amount_collected: number;
  collection_date: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  location_address: string | null;
  receipt_photo_url: string | null;
  signature_url: string | null;
  collection_method: CollectionMethod | null;
  mobile_money_reference: string | null;
  client_confirmation: boolean;
  notes: string | null;
  status: CollectionStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldCollectionWithDetails extends FieldCollection {
  client?: {
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  loan?: {
    principal: number;
    outstanding_principal: number | null;
  };
}

export interface CreateFieldCollectionInput {
  org_id: string;
  loan_id: string;
  client_id: string;
  amount_collected: number;
  collection_method: CollectionMethod;
  mobile_money_reference?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_address?: string;
  receipt_photo_url?: string;
  signature_url?: string;
}
