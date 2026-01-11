import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { toast } from 'sonner';

export type UserRole = 'ADMIN' | 'MANAGER' | 'FIELD_OFFICER' | 'TELLER' | 'BOARD_DIRECTOR';

export interface OrgUser {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: UserRole[];
  created_at: string;
}

export interface ClientAssignment {
  client_id: string;
  first_name: string;
  last_name: string;
  assigned_officer_id: string | null;
}

export function useOrgUsers() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['org-users', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      // Get all users in the organization
      const { data: orgUsers, error: orgError } = await supabase
        .from('user_organizations')
        .select('user_id, created_at')
        .eq('org_id', selectedOrgId);

      if (orgError) throw orgError;
      if (!orgUsers?.length) return [];

      const userIds = orgUsers.map(u => u.user_id);

      // Get profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Get roles for these users
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('org_id', selectedOrgId)
        .in('user_id', userIds);

      if (roleError) throw roleError;

      // Combine data
      const users: OrgUser[] = orgUsers.map(ou => {
        const profile = profiles?.find(p => p.user_id === ou.user_id);
        const userRoles = roles?.filter(r => r.user_id === ou.user_id).map(r => r.role as UserRole) || [];
        
        return {
          user_id: ou.user_id,
          email: profile?.email || 'Unknown',
          display_name: profile?.display_name || null,
          roles: userRoles,
          created_at: ou.created_at,
        };
      });

      return users;
    },
    enabled: !!selectedOrgId,
  });
}

export function useFieldOfficers() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['field-officers', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      // Get users with FIELD_OFFICER role
      const { data: fieldOfficerRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('org_id', selectedOrgId)
        .eq('role', 'FIELD_OFFICER');

      if (roleError) throw roleError;
      if (!fieldOfficerRoles?.length) return [];

      const userIds = fieldOfficerRoles.map(r => r.user_id);

      // Get profiles for field officers
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
    enabled: !!selectedOrgId,
  });
}

export function useUnassignedClients() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['unassigned-clients', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('client_id, first_name, last_name, assigned_officer_id')
        .eq('org_id', selectedOrgId)
        .is('assigned_officer_id', null);

      if (error) throw error;
      return data as ClientAssignment[];
    },
    enabled: !!selectedOrgId,
  });
}

export function useClientsByOfficer(officerId: string | null) {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['clients-by-officer', selectedOrgId, officerId],
    queryFn: async () => {
      if (!selectedOrgId || !officerId) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('client_id, first_name, last_name, assigned_officer_id')
        .eq('org_id', selectedOrgId)
        .eq('assigned_officer_id', officerId);

      if (error) throw error;
      return data as ClientAssignment[];
    },
    enabled: !!selectedOrgId && !!officerId,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrganisation();

  return useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: UserRole; action: 'add' | 'remove' }) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, org_id: selectedOrgId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('org_id', selectedOrgId)
          .eq('role', role);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action, role }) => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      queryClient.invalidateQueries({ queryKey: ['field-officers'] });
      toast.success(`Role ${action === 'add' ? 'added' : 'removed'} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

export function useAssignClient() {
  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrganisation();

  return useMutation({
    mutationFn: async ({ clientId, officerId }: { clientId: string; officerId: string | null }) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      const { error } = await supabase
        .from('clients')
        .update({ assigned_officer_id: officerId })
        .eq('client_id', clientId)
        .eq('org_id', selectedOrgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-by-officer'] });
      toast.success('Client assignment updated');
    },
    onError: (error) => {
      toast.error(`Failed to assign client: ${error.message}`);
    },
  });
}

export function useBulkAssignClients() {
  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrganisation();

  return useMutation({
    mutationFn: async ({ clientIds, officerId }: { clientIds: string[]; officerId: string }) => {
      if (!selectedOrgId) throw new Error('No organization selected');

      const { error } = await supabase
        .from('clients')
        .update({ assigned_officer_id: officerId })
        .in('client_id', clientIds)
        .eq('org_id', selectedOrgId);

      if (error) throw error;
    },
    onSuccess: (_, { clientIds }) => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-by-officer'] });
      toast.success(`${clientIds.length} clients assigned successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to assign clients: ${error.message}`);
    },
  });
}
