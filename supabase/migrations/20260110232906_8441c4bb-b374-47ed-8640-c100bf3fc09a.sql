-- Create loan status audit trail table
CREATE TABLE public.loan_status_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id uuid NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
    org_id uuid NOT NULL,
    previous_status text,
    new_status text NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone NOT NULL DEFAULT now(),
    notes text,
    approval_amount numeric,
    rejection_reason text
);

-- Enable RLS
ALTER TABLE public.loan_status_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view audit logs in their org"
ON public.loan_status_audit
FOR SELECT
USING (true);

CREATE POLICY "Users can insert audit logs"
ON public.loan_status_audit
FOR INSERT
WITH CHECK (true);

-- Create index for fast loan lookups
CREATE INDEX idx_loan_status_audit_loan_id ON public.loan_status_audit(loan_id);
CREATE INDEX idx_loan_status_audit_org_id ON public.loan_status_audit(org_id);

-- Create function to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.loan_status_audit (
            loan_id,
            org_id,
            previous_status,
            new_status,
            changed_by,
            approval_amount
        ) VALUES (
            NEW.loan_id,
            NEW.org_id,
            OLD.status::text,
            NEW.status::text,
            NEW.approved_by,
            CASE WHEN NEW.status = 'DISBURSED' THEN NEW.disbursed_amount ELSE NULL END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic audit logging
CREATE TRIGGER loan_status_change_trigger
AFTER UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.log_loan_status_change();