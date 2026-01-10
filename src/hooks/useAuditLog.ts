import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityAuditLog, ActionType, EntityType } from '@/types/audit';
import { Json } from '@/integrations/supabase/types';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('activity_audit_log')
        .insert([{
          org_id: log.org_id,
          action_type: log.action_type,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          old_values: log.old_values as Json,
          new_values: log.new_values as Json,
          metadata: log.metadata as Json,
          user_id: user.id,
          user_agent: navigator.userAgent,
        }]);

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
