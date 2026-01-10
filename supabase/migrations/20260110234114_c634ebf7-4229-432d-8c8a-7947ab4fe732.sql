-- Create user_organizations table to map users to their organizations
CREATE TABLE public.user_organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    org_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, org_id)
);

-- Enable RLS on user_organizations
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own org memberships
CREATE POLICY "Users can view their own org memberships"
ON public.user_organizations
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check org membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organizations
    WHERE user_id = _user_id
      AND org_id = _org_id
  )
$$;

-- Drop and recreate clients policies with org check
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients in their org" ON public.clients;

CREATE POLICY "Users can insert clients in their org"
ON public.clients
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update clients in their org"
ON public.clients
FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Drop and recreate group_members policies with org check
DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can update group members in their org" ON public.group_members;
DROP POLICY IF EXISTS "Users can delete group members" ON public.group_members;

CREATE POLICY "Users can insert group members in their org"
ON public.group_members
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update group members in their org"
ON public.group_members
FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can delete group members in their org"
ON public.group_members
FOR DELETE
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Drop and recreate loans policies with org check
DROP POLICY IF EXISTS "Users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update loans in their org" ON public.loans;

CREATE POLICY "Users can insert loans in their org"
ON public.loans
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update loans in their org"
ON public.loans
FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Drop and recreate loan_status_audit policies with org check
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.loan_status_audit;

CREATE POLICY "Users can insert audit logs in their org"
ON public.loan_status_audit
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

-- Drop and recreate organisation_settings policies with org check
DROP POLICY IF EXISTS "Users can insert org settings" ON public.organisation_settings;
DROP POLICY IF EXISTS "Users can update org settings" ON public.organisation_settings;

CREATE POLICY "Users can insert org settings for their org"
ON public.organisation_settings
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update org settings for their org"
ON public.organisation_settings
FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Drop and recreate repayments policies with org check
DROP POLICY IF EXISTS "Users can insert repayments" ON public.repayments;
DROP POLICY IF EXISTS "Users can update repayments" ON public.repayments;

CREATE POLICY "Users can insert repayments in their org"
ON public.repayments
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update repayments in their org"
ON public.repayments
FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Update SELECT policies to also check org membership
DROP POLICY IF EXISTS "Users can view clients in their org" ON public.clients;
CREATE POLICY "Users can view clients in their org"
ON public.clients
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view group members in their org" ON public.group_members;
CREATE POLICY "Users can view group members in their org"
ON public.group_members
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view loans in their org" ON public.loans;
CREATE POLICY "Users can view loans in their org"
ON public.loans
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view audit logs in their org" ON public.loan_status_audit;
CREATE POLICY "Users can view audit logs in their org"
ON public.loan_status_audit
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view org settings" ON public.organisation_settings;
CREATE POLICY "Users can view org settings"
ON public.organisation_settings
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view repayments in their org" ON public.repayments;
CREATE POLICY "Users can view repayments in their org"
ON public.repayments
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view documents in their org" ON public.client_documents;
CREATE POLICY "Users can view documents in their org"
ON public.client_documents
FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), org_id));

-- Update client_documents INSERT policy
DROP POLICY IF EXISTS "Users can upload documents" ON public.client_documents;
CREATE POLICY "Users can upload documents in their org"
ON public.client_documents
FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), org_id) AND auth.uid() = uploaded_by);