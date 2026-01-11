import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityAuditLog, ActionType, EntityType } from '@/types/audit';

export function useAuditLogs(orgId: string | undefined, filters?: {
  userId?: string;
  entityType?: EntityType;
  actionType?: ActionType;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['audit-logs', orgId, filters],
    queryFn: async () => {
      if (!orgId) return [];
      
      let query = supabase
        .from('activity_audit_log')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ActivityAuditLog[];
    },
    enabled: !!orgId,
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      org_id: string;
      action_type: ActionType;
      entity_type: EntityType;
      entity_id?: string;
      old_values?: Record<string, unknown>;
      new_values?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }) => {
      // Use server-side function for tamper-proof audit logging
      const { error } = await supabase.rpc('log_activity', {
        _org_id: log.org_id,
        _action_type: log.action_type,
        _entity_type: log.entity_type,
        _entity_id: log.entity_id || null,
        _old_values: log.old_values ? JSON.stringify(log.old_values) : null,
        _new_values: log.new_values ? JSON.stringify(log.new_values) : null,
        _metadata: log.metadata ? JSON.stringify(log.metadata) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useUserRole(userId: string | undefined, orgId: string | undefined) {
  return useQuery({
    queryKey: ['user-role', userId, orgId],
    queryFn: async () => {
      if (!userId || !orgId) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId && !!orgId,
  });
}
