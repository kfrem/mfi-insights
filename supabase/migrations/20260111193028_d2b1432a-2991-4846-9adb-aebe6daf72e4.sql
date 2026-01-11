-- Fix loan_status_audit SELECT to restrict to executives and board only
DROP POLICY IF EXISTS "Users can view audit logs in their org" ON public.loan_status_audit;

CREATE POLICY "Executives and board can view loan status audit" ON public.loan_status_audit
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id)
  )
);