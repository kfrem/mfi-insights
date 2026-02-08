import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExternalSupabase } from '@/integrations/external-supabase/client';
import { supabase } from '@/integrations/supabase/client';
import {
  ExecKPI,
  BogClassification,
  PortfolioAging,
  RepaymentDaily,
  CreateClientInput,
  CreateLoanInput,
  PostRepaymentInput,
  Client,
  Loan
} from '@/types/mfi';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { toast } from 'sonner';

// Type-safe schema query helper for external schemas (mfi/mfi_reporting)
const schemaQuery = (schema: string, table: string) => {
  const client = getExternalSupabase();
  if (!client) throw new Error('External Supabase not configured');
  return (client as any).schema(schema).from(table);
};

export function useExecKpis() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['exec-kpis', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      
      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_exec_kpis')
          .select('*')
          .eq('org_id', selectedOrgId)
          .single();
        
        if (error) throw error;
        return data as ExecKPI;
      } catch (err) {
        throw new Error(`Failed to load KPIs: ${err instanceof Error ? err.message : 'Database unavailable'}`);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useBogClassification() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['bog-classification', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_bog_classification_of_advances')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('bog_bucket');
        
        if (error) throw error;
        return data as BogClassification[];
      } catch (err) {
        throw new Error(`Failed to load BoG classification: ${err instanceof Error ? err.message : 'Database unavailable'}`);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function usePortfolioAging() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['portfolio-aging', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      try {
        const { data, error } = await schemaQuery('mfi_reporting', 'v_portfolio_aging')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('days_overdue', { ascending: false });
        
        if (error) throw error;
        return data as PortfolioAging[];
      } catch (err) {
        throw new Error(`Failed to load portfolio aging: ${err instanceof Error ? err.message : 'Database unavailable'}`);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useRepaymentDaily() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['repayments-daily', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const { data, error } = await schemaQuery('mfi_reporting', 'v_repayments_daily')
          .select('*')
          .eq('org_id', selectedOrgId)
          .gte('payment_date', sixtyDaysAgo.toISOString().split('T')[0])
          .order('payment_date', { ascending: true });
        
        if (error) throw error;
        return data as RepaymentDaily[];
      } catch (err) {
        throw new Error(`Failed to load repayments: ${err instanceof Error ? err.message : 'Database unavailable'}`);
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useClients() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['clients', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      try {
        const { data, error } = await schemaQuery('mfi', 'clients')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as Client[];
      } catch {
        return [];
      }
    },
    enabled: !!selectedOrgId,
  });
}

export function useActiveLoans() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['active-loans', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      // Try local Supabase first (public.loans)
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('*, clients(first_name, last_name)')
          .eq('org_id', selectedOrgId)
          .in('status', ['ACTIVE', 'DISBURSED', 'PENDING'])
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          return data as (Loan & { clients: { first_name: string; last_name: string } })[];
        }
      } catch {
        // Fall through to external
      }
      
      // Fallback to external mfi schema
      try {
        const { data, error } = await schemaQuery('mfi', 'loans')
          .select('*, clients(first_name, last_name)')
          .eq('org_id', selectedOrgId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as (Loan & { clients: { first_name: string; last_name: string } })[];
      } catch {
        return [];
      }
    },
    enabled: !!selectedOrgId,
  });
}

// Hook to get total exposure for a specific client (sum of all active loans)
export function useClientExposure(clientId: string | null) {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['client-exposure', selectedOrgId, clientId],
    queryFn: async () => {
      if (!selectedOrgId || !clientId) return { totalExposure: 0, loanCount: 0, loans: [] };
      
      // Try local Supabase first
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('loan_id, principal, status, disbursement_date')
          .eq('org_id', selectedOrgId)
          .eq('client_id', clientId)
          .in('status', ['ACTIVE', 'PENDING', 'DISBURSED']);
        
        if (!error && data) {
          const loans = data as { loan_id: string; principal: number; status: string; disbursement_date: string }[];
          const totalExposure = loans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
          
          return {
            totalExposure,
            loanCount: loans.length,
            loans,
          };
        }
      } catch {
        // Fall through to external
      }
      
      // Fallback to external mfi schema
      try {
        const { data, error } = await schemaQuery('mfi', 'loans')
          .select('loan_id, principal, status, disbursement_date')
          .eq('org_id', selectedOrgId)
          .eq('client_id', clientId)
          .in('status', ['active', 'pending']);
        
        if (error) throw error;
        
        const loans = data as { loan_id: string; principal: number; status: string; disbursement_date: string }[];
        const totalExposure = loans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
        
        return {
          totalExposure,
          loanCount: loans.length,
          loans,
        };
      } catch {
        return { totalExposure: 0, loanCount: 0, loans: [] };
      }
    },
    enabled: !!selectedOrgId && !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const { data, error } = await schemaQuery('mfi', 'clients')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateLoanInput) => {
      // Use local Supabase (public.loans table)
      const { data, error } = await supabase
        .from('loans')
        .insert({
          org_id: input.org_id,
          client_id: input.client_id,
          loan_type: input.loan_type,
          purpose: input.purpose,
          principal: input.principal,
          interest_rate: input.interest_rate,
          term_months: input.term_months,
          interest_method: input.interest_method,
          interest_calc_frequency: input.interest_calc_frequency,
          repayment_frequency: input.repayment_frequency,
          penalty_type: input.penalty_type,
          penalty_value: input.penalty_value || 0,
          penalty_grace_days: input.penalty_grace_days || 0,
          disbursement_date: input.disbursement_date,
          total_interest: input.total_interest,
          total_repayable: input.total_repayable,
          outstanding_principal: input.principal,
          notes: input.notes,
          status: 'PENDING',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-exposure'] });
      queryClient.invalidateQueries({ queryKey: ['exec-kpis'] });
      toast.success('Loan created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create loan: ${error.message}`);
    },
  });
}

export function usePostRepayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: PostRepaymentInput) => {
      // Use local Supabase (public.repayments table)
      const { data, error } = await supabase
        .from('repayments')
        .insert({
          org_id: input.org_id,
          loan_id: input.loan_id,
          amount: input.amount,
          principal_portion: input.principal_portion || 0,
          interest_portion: input.interest_portion || 0,
          penalty_portion: input.penalty_portion || 0,
          payment_date: input.payment_date,
          payment_method: input.payment_method,
          reference: input.reference,
          notes: input.notes,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('A repayment with this reference already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments-daily'] });
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      queryClient.invalidateQueries({ queryKey: ['exec-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-aging'] });
      toast.success('Repayment posted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to post repayment: ${error.message}`);
    },
  });
}
