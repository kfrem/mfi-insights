-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'FIELD_OFFICER', 'TELLER');

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    org_id uuid NOT NULL,
    role user_role NOT NULL DEFAULT 'FIELD_OFFICER',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, org_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _org_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role = _role
  )
$$;

-- Security definer function to check if user has any role in org
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND org_id = _org_id
  )
$$;

-- Create comprehensive audit log table
CREATE TABLE public.activity_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL, -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW
    entity_type text NOT NULL, -- client, loan, repayment, etc.
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_audit_log ENABLE ROW LEVEL SECURITY;

-- Create index for efficient querying
CREATE INDEX idx_audit_log_org_created ON public.activity_audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON public.activity_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.activity_audit_log(entity_type, entity_id);

-- Only admins and managers can view audit logs
CREATE POLICY "Admins and managers can view audit logs"
ON public.activity_audit_log
FOR SELECT
USING (
  public.has_role(auth.uid(), org_id, 'ADMIN') OR 
  public.has_role(auth.uid(), org_id, 'MANAGER')
);

-- System can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.activity_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create field collection evidence table
CREATE TABLE public.field_collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    repayment_id uuid REFERENCES public.repayments(repayment_id) ON DELETE CASCADE,
    loan_id uuid NOT NULL,
    client_id uuid NOT NULL,
    collected_by uuid REFERENCES auth.users(id) NOT NULL,
    amount_collected numeric NOT NULL,
    collection_date timestamp with time zone NOT NULL DEFAULT now(),
    -- GPS location
    latitude numeric,
    longitude numeric,
    location_accuracy numeric,
    location_address text,
    -- Evidence
    receipt_photo_url text,
    signature_url text,
    -- Additional info
    collection_method text, -- CASH, MOBILE_MONEY, BANK_TRANSFER
    mobile_money_reference text,
    client_confirmation boolean DEFAULT false,
    notes text,
    -- Status
    status text DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    verified_by uuid REFERENCES auth.users(id),
    verified_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.field_collections ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_field_collections_org ON public.field_collections(org_id, created_at DESC);
CREATE INDEX idx_field_collections_collector ON public.field_collections(collected_by, created_at DESC);
CREATE INDEX idx_field_collections_loan ON public.field_collections(loan_id);
CREATE INDEX idx_field_collections_client ON public.field_collections(client_id);

-- Field officers can insert collections
CREATE POLICY "Field officers can insert collections"
ON public.field_collections
FOR INSERT
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), org_id) AND
  auth.uid() = collected_by
);

-- Users in org can view collections
CREATE POLICY "Users can view collections in their org"
ON public.field_collections
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Collectors can update their pending collections
CREATE POLICY "Collectors can update their pending collections"
ON public.field_collections
FOR UPDATE
USING (
  public.user_belongs_to_org(auth.uid(), org_id) AND
  (auth.uid() = collected_by OR public.has_role(auth.uid(), org_id, 'ADMIN') OR public.has_role(auth.uid(), org_id, 'MANAGER'))
);

-- Create storage bucket for field evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('field-evidence', 'field-evidence', false);

-- Storage policies for field evidence
CREATE POLICY "Users can upload field evidence"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view field evidence in their org"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL
);

-- Trigger to update field_collections updated_at
CREATE TRIGGER update_field_collections_updated_at
BEFORE UPDATE ON public.field_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();