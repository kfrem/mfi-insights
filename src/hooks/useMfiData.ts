import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExternalSupabase, isExternalSupabaseConfigured } from '@/integrations/external-supabase/client';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
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
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// Type-safe schema query helper for external schemas (mfi/mfi_reporting)
const schemaQuery = (schema: string, table: string) => {
  const client = getExternalSupabase();
  if (!client) throw new Error('External Supabase not configured');
  return (client as any).schema(schema).from(table);
};

// Check if external database is available
const checkExternalDb = () => {
  if (!isExternalSupabaseConfigured()) {
    logger.warn('External Supabase not configured, using local/mock data', 'MfiData');
    return false;
  }
  return true;
};

// Mock data for demo when database isn't connected
const mockExecKpis: ExecKPI = {
  org_id: 'org-1',
  gross_portfolio: 2450000,
  active_loans: 342,
  par_30_plus: 185000,
  par_30_rate: 7.55,
  provisions_required: 45000,
  total_disbursed: 5200000,
  total_repaid: 2750000,
};

const mockBogClassification: BogClassification[] = [
  { org_id: 'org-1', bog_bucket: 'Current', loan_count: 285, outstanding_balance: 2050000, provision_rate: 0.01, provision_amount: 20500 },
  { org_id: 'org-1', bog_bucket: 'Watch', loan_count: 32, outstanding_balance: 215000, provision_rate: 0.05, provision_amount: 10750 },
  { org_id: 'org-1', bog_bucket: 'Substandard', loan_count: 15, outstanding_balance: 95000, provision_rate: 0.25, provision_amount: 23750 },
  { org_id: 'org-1', bog_bucket: 'Doubtful', loan_count: 7, outstanding_balance: 62000, provision_rate: 0.50, provision_amount: 31000 },
  { org_id: 'org-1', bog_bucket: 'Loss', loan_count: 3, outstanding_balance: 28000, provision_rate: 1.00, provision_amount: 28000 },
];

const mockPortfolioAging: PortfolioAging[] = [
  { org_id: 'org-1', loan_id: 'L001', client_name: 'Kwame Asante', principal: 15000, outstanding_balance: 12500, days_overdue: 95, bog_bucket: 'Doubtful' },
  { org_id: 'org-1', loan_id: 'L002', client_name: 'Ama Serwaa', principal: 8000, outstanding_balance: 6200, days_overdue: 45, bog_bucket: 'Substandard' },
  { org_id: 'org-1', loan_id: 'L003', client_name: 'Kofi Mensah', principal: 25000, outstanding_balance: 22000, days_overdue: 32, bog_bucket: 'Watch' },
  { org_id: 'org-1', loan_id: 'L004', client_name: 'Abena Osei', principal: 12000, outstanding_balance: 9800, days_overdue: 15, bog_bucket: 'Current' },
  { org_id: 'org-1', loan_id: 'L005', client_name: 'Yaw Boateng', principal: 18000, outstanding_balance: 18000, days_overdue: 180, bog_bucket: 'Loss' },
];

const generateMockRepayments = (): RepaymentDaily[] => {
  const data: RepaymentDaily[] = [];
  const today = new Date();
  
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    data.push({
      org_id: 'org-1',
      payment_date: date.toISOString().split('T')[0],
      total_amount: isWeekend ? 0 : Math.floor(Math.random() * 15000) + 5000,
      payment_count: isWeekend ? 0 : Math.floor(Math.random() * 12) + 3,
    });
  }
  
  return data;
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
      } catch {
        // Return mock data if view doesn't exist
        return { ...mockExecKpis, org_id: selectedOrgId };
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
      } catch {
        return mockBogClassification.map(r => ({ ...r, org_id: selectedOrgId }));
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
      } catch {
        return mockPortfolioAging.map(r => ({ ...r, org_id: selectedOrgId }));
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
      } catch {
        return generateMockRepayments().map(r => ({ ...r, org_id: selectedOrgId }));
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
