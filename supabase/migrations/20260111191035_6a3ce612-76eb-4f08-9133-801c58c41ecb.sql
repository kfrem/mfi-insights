-- FIX 1: Restrict activity_audit_log INSERT to require matching user_id
-- This prevents users from inserting audit logs for other users
DROP POLICY IF EXISTS "Users can insert audit logs in their org" ON public.activity_audit_log;

CREATE POLICY "Users can insert own audit logs" ON public.activity_audit_log
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL AND
  -- User must belong to the organization
  user_belongs_to_org(auth.uid(), org_id) AND
  -- User can only create audit logs for themselves
  (user_id IS NULL OR user_id = auth.uid())
);

-- FIX 2: Restrict loan_status_audit INSERT to executives only
-- Field officers should not be able to directly insert loan status changes
DROP POLICY IF EXISTS "Users can insert audit logs in their org" ON public.loan_status_audit;

CREATE POLICY "Executives can insert loan status audit" ON public.loan_status_audit
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- FIX 3: Add trigger to automatically log loan status changes
-- This ensures audit trail is created by the system, not users directly
CREATE OR REPLACE FUNCTION public.log_loan_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.loan_status_audit (
            loan_id,
            org_id,
            previous_status,
            new_status,
            changed_by,
            approval_amount,
            notes
        ) VALUES (
            NEW.loan_id,
            NEW.org_id,
            OLD.status::text,
            NEW.status::text,
            auth.uid(),
            CASE WHEN NEW.status = 'DISBURSED' THEN NEW.disbursed_amount ELSE NULL END,
            NEW.notes
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_log_loan_status_change ON public.loans;
CREATE TRIGGER trigger_log_loan_status_change
    AFTER UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.log_loan_status_change();