import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { toast } from 'sonner';
import type { LoanStatus, LoanWithClient, LoanStatusAudit, STATUS_TRANSITIONS } from '@/types/loanWorkflow';

export function useLoansForWorkflow() {
  const { selectedOrgId } = useOrganisation();

  return useQuery({
    queryKey: ['loans-workflow', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];

      const { data, error } = await supabase
        .from('loans')
        .select(`
          loan_id,
          org_id,
          client_id,
          loan_type,
          principal,
          interest_rate,
          term_months,
          status,
          application_date,
          approval_date,
          disbursement_date,
          disbursed_amount,
          total_interest,
          total_repayable,
          notes,
          purpose,
          created_at,
          clients (
            first_name,
            last_name,
            ghana_card_number,
            phone
          )
        `)
        .eq('org_id', selectedOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoanWithClient[];
    },
    enabled: !!selectedOrgId,
  });
}

export function useLoanAuditTrail(loanId: string | null) {
  return useQuery({
    queryKey: ['loan-audit', loanId],
    queryFn: async () => {
      if (!loanId) return [];

      const { data, error } = await supabase
        .from('loan_status_audit')
        .select('*')
        .eq('loan_id', loanId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data as LoanStatusAudit[];
    },
    enabled: !!loanId,
  });
}

interface TransitionParams {
  loanId: string;
  newStatus: LoanStatus;
  notes?: string;
  rejectionReason?: string;
  disbursedAmount?: number;
}

export function useTransitionLoanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loanId, newStatus, notes, rejectionReason, disbursedAmount }: TransitionParams) => {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      // Set appropriate dates based on transition
      if (newStatus === 'APPROVED') {
        updateData.approval_date = new Date().toISOString().split('T')[0];
      } else if (newStatus === 'DISBURSED' && disbursedAmount) {
        updateData.disbursement_date = new Date().toISOString().split('T')[0];
        updateData.disbursed_amount = disbursedAmount;
      }

      // Update the loan status
      const { error: loanError } = await supabase
        .from('loans')
        .update(updateData)
        .eq('loan_id', loanId);

      if (loanError) throw loanError;

      // The trigger will automatically create the audit log entry
      // But we can add additional notes manually if provided
      if (notes || rejectionReason) {
        const { data: loan } = await supabase
          .from('loans')
          .select('org_id')
          .eq('loan_id', loanId)
          .single();

        if (loan) {
          await supabase
            .from('loan_status_audit')
            .update({ 
              notes, 
              rejection_reason: rejectionReason 
            })
            .eq('loan_id', loanId)
            .eq('new_status', newStatus)
            .order('changed_at', { ascending: false })
            .limit(1);
        }
      }

      return { loanId, newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['loan-audit', data.loanId] });
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      toast.success(`Loan status updated to ${data.newStatus}`);
    },
    onError: (error) => {
      toast.error('Failed to update loan status: ' + (error as Error).message);
    },
  });
}
