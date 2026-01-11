-- Add assigned_officer_id to clients table to track which field officer is assigned to each client
ALTER TABLE public.clients 
ADD COLUMN assigned_officer_id uuid REFERENCES auth.users(id);

-- Create index for performance on assigned_officer_id lookups
CREATE INDEX idx_clients_assigned_officer ON public.clients(assigned_officer_id);

-- Create a helper function to check if user can access a client
CREATE OR REPLACE FUNCTION public.can_access_client(_user_id uuid, _org_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User must belong to the org
    user_belongs_to_org(_user_id, _org_id) AND (
      -- ADMIN or MANAGER can access all clients in their org
      has_role(_user_id, _org_id, 'ADMIN') OR 
      has_role(_user_id, _org_id, 'MANAGER') OR
      -- FIELD_OFFICER or TELLER can only access assigned clients
      EXISTS (
        SELECT 1 FROM public.clients 
        WHERE client_id = _client_id 
        AND org_id = _org_id
        AND (assigned_officer_id = _user_id OR assigned_officer_id IS NULL)
      )
    )
$$;

-- Create a helper function to check if user can access a loan (via client assignment)
CREATE OR REPLACE FUNCTION public.can_access_loan(_user_id uuid, _org_id uuid, _loan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_belongs_to_org(_user_id, _org_id) AND (
      has_role(_user_id, _org_id, 'ADMIN') OR 
      has_role(_user_id, _org_id, 'MANAGER') OR
      EXISTS (
        SELECT 1 FROM public.loans l
        JOIN public.clients c ON l.client_id = c.client_id
        WHERE l.loan_id = _loan_id 
        AND l.org_id = _org_id
        AND (c.assigned_officer_id = _user_id OR c.assigned_officer_id IS NULL)
      )
    )
$$;

-- Drop existing overly permissive policies on clients
DROP POLICY IF EXISTS "Users can view clients in their org" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients in their org" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their org" ON public.clients;

-- Create granular SELECT policy for clients
CREATE POLICY "Users can view assigned clients"
ON public.clients FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    assigned_officer_id = auth.uid() OR 
    assigned_officer_id IS NULL
  )
);

-- Create granular UPDATE policy for clients
CREATE POLICY "Users can update assigned clients"
ON public.clients FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    assigned_officer_id = auth.uid() OR 
    assigned_officer_id IS NULL
  )
);

-- Create INSERT policy for clients (assign to current user by default)
CREATE POLICY "Users can insert clients in their org"
ON public.clients FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id)
);

-- Add DELETE policy for ADMIN/MANAGER only
CREATE POLICY "Admins and managers can delete clients"
ON public.clients FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER')
  )
);

-- Drop existing policies on loans
DROP POLICY IF EXISTS "Users can view loans in their org" ON public.loans;
DROP POLICY IF EXISTS "Users can update loans in their org" ON public.loans;
DROP POLICY IF EXISTS "Users can insert loans in their org" ON public.loans;

-- Create granular SELECT policy for loans (based on client assignment)
CREATE POLICY "Users can view loans for assigned clients"
ON public.loans FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = loans.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create granular UPDATE policy for loans
CREATE POLICY "Users can update loans for assigned clients"
ON public.loans FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = loans.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create INSERT policy for loans
CREATE POLICY "Users can insert loans for assigned clients"
ON public.loans FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = loans.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Add DELETE policy for loans (ADMIN/MANAGER only)
CREATE POLICY "Admins and managers can delete loans"
ON public.loans FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER')
  )
);

-- Drop existing policies on repayments
DROP POLICY IF EXISTS "Users can view repayments in their org" ON public.repayments;
DROP POLICY IF EXISTS "Users can update repayments in their org" ON public.repayments;
DROP POLICY IF EXISTS "Users can insert repayments in their org" ON public.repayments;

-- Create granular SELECT policy for repayments
CREATE POLICY "Users can view repayments for assigned clients"
ON public.repayments FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create granular UPDATE policy for repayments
CREATE POLICY "Users can update repayments for assigned clients"
ON public.repayments FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create INSERT policy for repayments
CREATE POLICY "Users can insert repayments for assigned clients"
ON public.repayments FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Add DELETE policy for repayments (ADMIN/MANAGER only)
CREATE POLICY "Admins and managers can delete repayments"
ON public.repayments FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER')
  )
);

-- Drop existing policies on field_collections
DROP POLICY IF EXISTS "Users can view collections in their org" ON public.field_collections;
DROP POLICY IF EXISTS "Field officers can insert collections" ON public.field_collections;
DROP POLICY IF EXISTS "Collectors can update their pending collections" ON public.field_collections;

-- Create granular SELECT policy for field_collections
CREATE POLICY "Users can view collections for assigned clients"
ON public.field_collections FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    collected_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = field_collections.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create INSERT policy for field_collections
CREATE POLICY "Users can insert collections for assigned clients"
ON public.field_collections FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  auth.uid() = collected_by AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = field_collections.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create UPDATE policy for field_collections
CREATE POLICY "Users can update collections for assigned clients"
ON public.field_collections FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    collected_by = auth.uid()
  )
);

-- Add DELETE policy for field_collections (ADMIN/MANAGER only)
CREATE POLICY "Admins and managers can delete field collections"
ON public.field_collections FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER')
  )
);

-- Drop existing policies on client_documents
DROP POLICY IF EXISTS "Users can view documents in their org" ON public.client_documents;
DROP POLICY IF EXISTS "Users can upload documents in their org" ON public.client_documents;
DROP POLICY IF EXISTS "Users can update their uploaded documents" ON public.client_documents;
DROP POLICY IF EXISTS "Users can delete their uploaded documents" ON public.client_documents;

-- Create granular SELECT policy for client_documents
CREATE POLICY "Users can view documents for assigned clients"
ON public.client_documents FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = client_documents.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create INSERT policy for client_documents
CREATE POLICY "Users can upload documents for assigned clients"
ON public.client_documents FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  auth.uid() = uploaded_by AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = client_documents.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create UPDATE policy for client_documents
CREATE POLICY "Users can update documents for assigned clients"
ON public.client_documents FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    uploaded_by = auth.uid()
  )
);

-- Create DELETE policy for client_documents
CREATE POLICY "Users can delete documents for assigned clients"
ON public.client_documents FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    uploaded_by = auth.uid()
  )
);

-- Drop existing policies on group_members
DROP POLICY IF EXISTS "Users can view group members in their org" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert group members in their org" ON public.group_members;
DROP POLICY IF EXISTS "Users can update group members in their org" ON public.group_members;
DROP POLICY IF EXISTS "Users can delete group members in their org" ON public.group_members;

-- Create granular SELECT policy for group_members (based on parent client assignment)
CREATE POLICY "Users can view group members for assigned clients"
ON public.group_members FOR SELECT
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = group_members.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create INSERT policy for group_members
CREATE POLICY "Users can insert group members for assigned clients"
ON public.group_members FOR INSERT
WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = group_members.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create UPDATE policy for group_members
CREATE POLICY "Users can update group members for assigned clients"
ON public.group_members FOR UPDATE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = group_members.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Create DELETE policy for group_members
CREATE POLICY "Users can delete group members for assigned clients"
ON public.group_members FOR DELETE
USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    has_role(auth.uid(), org_id, 'ADMIN') OR 
    has_role(auth.uid(), org_id, 'MANAGER') OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.client_id = group_members.client_id 
      AND (c.assigned_officer_id = auth.uid() OR c.assigned_officer_id IS NULL)
    )
  )
);

-- Fix audit log INSERT policy to include org validation
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.activity_audit_log;

CREATE POLICY "Users can insert audit logs in their org"
ON public.activity_audit_log FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  user_belongs_to_org(auth.uid(), org_id)
);