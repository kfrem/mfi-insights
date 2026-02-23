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
    console.warn('External Supabase not configured, using local/mock data');
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
      
      // Compute KPIs from local tables
      const { data: loans } = await supabase
        .from('loans')
        .select('principal, outstanding_principal, disbursed_amount, status, disbursement_date, expected_end_date')
        .eq('org_id', selectedOrgId);
      
      const { data: repayments } = await supabase
        .from('repayments')
        .select('amount')
        .eq('org_id', selectedOrgId);
      
      const activeLoans = (loans || []).filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status));
      const grossPortfolio = activeLoans.reduce((sum, l) => sum + (Number(l.outstanding_principal) || Number(l.disbursed_amount) || Number(l.principal) || 0), 0);
      const totalDisbursed = (loans || []).filter(l => l.disbursed_amount).reduce((sum, l) => sum + (Number(l.disbursed_amount) || 0), 0);
      const totalRepaid = (repayments || []).reduce((sum, r) => sum + Number(r.amount), 0);
      
      // Simple PAR calculation: loans past expected_end_date
      const now = new Date();
      const parLoans = activeLoans.filter(l => {
        if (!l.expected_end_date) return false;
        const endDate = new Date(l.expected_end_date);
        const daysDiff = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 30;
      });
      const par30Plus = parLoans.reduce((sum, l) => sum + (Number(l.outstanding_principal) || Number(l.principal) || 0), 0);
      const par30Rate = grossPortfolio > 0 ? (par30Plus / grossPortfolio) * 100 : 0;
      
      // Simple provisions: 1% current, 25% substandard (30-90 days), 50% doubtful (90-180), 100% loss (180+)
      let provisionsRequired = 0;
      activeLoans.forEach(l => {
        const outstanding = Number(l.outstanding_principal) || Number(l.principal) || 0;
        if (!l.expected_end_date) {
          provisionsRequired += outstanding * 0.01; // current
          return;
        }
        const daysPast = Math.floor((now.getTime() - new Date(l.expected_end_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysPast < 30) provisionsRequired += outstanding * 0.01;
        else if (daysPast < 90) provisionsRequired += outstanding * 0.25;
        else if (daysPast < 180) provisionsRequired += outstanding * 0.50;
        else provisionsRequired += outstanding;
      });
      
      return {
        org_id: selectedOrgId,
        gross_portfolio: grossPortfolio,
        active_loans: activeLoans.length,
        par_30_plus: par30Plus,
        par_30_rate: Math.round(par30Rate * 100) / 100,
        provisions_required: Math.round(provisionsRequired * 100) / 100,
        total_disbursed: totalDisbursed,
        total_repaid: totalRepaid,
      } as ExecKPI;
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
      
      // Compute from local loans table
      const { data: loans } = await supabase
        .from('loans')
        .select('outstanding_principal, principal, disbursed_amount, expected_end_date, status')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);
      
      if (!loans || loans.length === 0) return [];
      
      const now = new Date();
      const buckets: Record<string, { count: number; balance: number; rate: number }> = {
        'Current': { count: 0, balance: 0, rate: 0.01 },
        'Watch': { count: 0, balance: 0, rate: 0.05 },
        'Substandard': { count: 0, balance: 0, rate: 0.25 },
        'Doubtful': { count: 0, balance: 0, rate: 0.50 },
        'Loss': { count: 0, balance: 0, rate: 1.00 },
      };
      
      loans.forEach(l => {
        const outstanding = Number(l.outstanding_principal) || Number(l.disbursed_amount) || Number(l.principal) || 0;
        let bucket = 'Current';
        if (l.expected_end_date) {
          const daysPast = Math.floor((now.getTime() - new Date(l.expected_end_date).getTime()) / (1000 * 60 * 60 * 24));
          if (daysPast >= 180) bucket = 'Loss';
          else if (daysPast >= 90) bucket = 'Doubtful';
          else if (daysPast >= 30) bucket = 'Substandard';
          else if (daysPast >= 1) bucket = 'Watch';
        }
        buckets[bucket].count++;
        buckets[bucket].balance += outstanding;
      });
      
      return Object.entries(buckets)
        .filter(([, v]) => v.count > 0)
        .map(([name, v]) => ({
          org_id: selectedOrgId,
          bog_bucket: name,
          loan_count: v.count,
          outstanding_balance: v.balance,
          provision_rate: v.rate,
          provision_amount: Math.round(v.balance * v.rate * 100) / 100,
        })) as BogClassification[];
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
      
      // Compute from local data
      const { data: loans } = await supabase
        .from('loans')
        .select('loan_id, principal, outstanding_principal, disbursed_amount, expected_end_date, status, client_id, clients(first_name, last_name)')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);
      
      if (!loans) return [];
      
      const now = new Date();
      return loans.map(l => {
        const outstanding = Number(l.outstanding_principal) || Number(l.disbursed_amount) || Number(l.principal) || 0;
        let daysOverdue = 0;
        let bucket = 'Current';
        
        if (l.expected_end_date) {
          daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(l.expected_end_date).getTime()) / (1000 * 60 * 60 * 24)));
          if (daysOverdue >= 180) bucket = 'Loss';
          else if (daysOverdue >= 90) bucket = 'Doubtful';
          else if (daysOverdue >= 30) bucket = 'Substandard';
          else if (daysOverdue >= 1) bucket = 'Watch';
        }
        
        const client = l.clients as any;
        return {
          org_id: selectedOrgId,
          loan_id: l.loan_id,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
          principal: Number(l.principal),
          outstanding_balance: outstanding,
          days_overdue: daysOverdue,
          bog_bucket: bucket,
        };
      }).filter(l => l.days_overdue > 0)
        .sort((a, b) => b.days_overdue - a.days_overdue) as PortfolioAging[];
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
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { data: repayments } = await supabase
        .from('repayments')
        .select('amount, payment_date')
        .eq('org_id', selectedOrgId)
        .gte('payment_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('payment_date', { ascending: true });
      
      if (!repayments || repayments.length === 0) return [];
      
      // Group by date
      const grouped: Record<string, { total: number; count: number }> = {};
      repayments.forEach(r => {
        const date = r.payment_date;
        if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
        grouped[date].total += Number(r.amount);
        grouped[date].count++;
      });
      
      return Object.entries(grouped).map(([date, v]) => ({
        org_id: selectedOrgId,
        payment_date: date,
        total_amount: v.total,
        payment_count: v.count,
      })) as RepaymentDaily[];
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
      
      // Use local Supabase (public.clients table)
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('org_id', selectedOrgId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          return data as Client[];
        }
      } catch {
        // Fall through to external
      }
      
      // Fallback to external mfi schema
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
      // Use local Supabase (public.clients table)
      const { data, error } = await supabase
        .from('clients')
        .insert({
          org_id: input.org_id,
          client_type: input.client_type || 'INDIVIDUAL',
          first_name: input.first_name,
          last_name: input.last_name,
          ghana_card_number: input.ghana_card_number,
          ghana_card_expiry: input.ghana_card_expiry,
          date_of_birth: input.date_of_birth,
          gender: input.gender,
          nationality: input.nationality || 'Ghanaian',
          occupation: input.occupation,
          risk_category: input.risk_category,
          source_of_funds: input.source_of_funds,
          phone: input.phone,
          email: input.email,
          address: input.address,
          group_name: input.group_name,
          registration_number: input.registration_number,
          proof_of_residence_type: input.proof_of_residence_type,
        })
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
      // Calculate expected_end_date from disbursement_date + term_months
      let expectedEndDate: string | null = null;
      if (input.disbursement_date) {
        const start = new Date(input.disbursement_date);
        start.setMonth(start.getMonth() + input.term_months);
        expectedEndDate = start.toISOString().split('T')[0];
      }

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
          expected_end_date: expectedEndDate,
          total_interest: input.total_interest,
          total_repayable: input.total_repayable,
          outstanding_principal: input.principal,
          outstanding_interest: input.total_interest || 0,
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
      queryClient.invalidateQueries({ queryKey: ['bog-classification'] });
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
      // Insert repayment
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

      // Update loan outstanding balances
      const principalPaid = input.principal_portion || input.amount;
      const interestPaid = input.interest_portion || 0;
      
      const { data: loan } = await supabase
        .from('loans')
        .select('outstanding_principal, outstanding_interest')
        .eq('loan_id', input.loan_id)
        .single();
      
      if (loan) {
        const newOutstandingPrincipal = Math.max(0, (Number(loan.outstanding_principal) || 0) - principalPaid);
        const newOutstandingInterest = Math.max(0, (Number(loan.outstanding_interest) || 0) - interestPaid);
        
        const updateData: Record<string, any> = {
          outstanding_principal: newOutstandingPrincipal,
          outstanding_interest: newOutstandingInterest,
        };
        
        // Mark as COMPLETED if fully repaid
        if (newOutstandingPrincipal <= 0) {
          updateData.status = 'COMPLETED';
          updateData.actual_end_date = input.payment_date;
        } else if (loan.outstanding_principal && Number(loan.outstanding_principal) === newOutstandingPrincipal + principalPaid) {
          // Ensure loan is ACTIVE if not already
          updateData.status = 'ACTIVE';
        }
        
        await supabase
          .from('loans')
          .update(updateData)
          .eq('loan_id', input.loan_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayments-daily'] });
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      queryClient.invalidateQueries({ queryKey: ['exec-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-aging'] });
      queryClient.invalidateQueries({ queryKey: ['bog-classification'] });
      queryClient.invalidateQueries({ queryKey: ['client-exposure'] });
      toast.success('Repayment posted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to post repayment: ${error.message}`);
    },
  });
}
