-- Step 2: Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, _org_id, 'ADMIN') 
      OR has_role(_user_id, _org_id, 'MANAGER')
$$;

CREATE OR REPLACE FUNCTION public.is_board_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, _org_id, 'BOARD_DIRECTOR')
$$;

-- Step 3: Update can_access_client function (remove NULL condition)
CREATE OR REPLACE FUNCTION public.can_access_client(_user_id uuid, _org_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_belongs_to_org(_user_id, _org_id) AND (
      is_executive(_user_id, _org_id) OR
      is_board_member(_user_id, _org_id) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.client_id = _client_id 
        AND c.org_id = _org_id
        AND c.assigned_officer_id = _user_id
      )
    )
$$;

-- Step 4: Update can_access_loan function (remove NULL condition)
CREATE OR REPLACE FUNCTION public.can_access_loan(_user_id uuid, _org_id uuid, _loan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_belongs_to_org(_user_id, _org_id) AND (
      is_executive(_user_id, _org_id) OR
      is_board_member(_user_id, _org_id) OR
      EXISTS (
        SELECT 1 FROM public.loans l
        JOIN public.clients c ON l.client_id = c.client_id
        WHERE l.loan_id = _loan_id 
        AND l.org_id = _org_id
        AND c.assigned_officer_id = _user_id
      )
    )
$$;

-- Step 5: Drop and recreate CLIENTS policies
DROP POLICY IF EXISTS "Users can view assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients in their org" ON public.clients;
DROP POLICY IF EXISTS "Admins and managers can delete clients" ON public.clients;

CREATE POLICY "Users can view clients" ON public.clients
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    assigned_officer_id = auth.uid()
  )
);

CREATE POLICY "Users can update clients" ON public.clients
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    assigned_officer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert clients" ON public.clients
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  NOT is_board_member(auth.uid(), org_id)
);

CREATE POLICY "Executives can delete clients" ON public.clients
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 6: Drop and recreate LOANS policies
DROP POLICY IF EXISTS "Users can view loans for assigned clients" ON public.loans;
DROP POLICY IF EXISTS "Users can update loans for assigned clients" ON public.loans;
DROP POLICY IF EXISTS "Users can insert loans for assigned clients" ON public.loans;
DROP POLICY IF EXISTS "Admins and managers can delete loans" ON public.loans;

CREATE POLICY "Users can view loans" ON public.loans
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = loans.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update loans" ON public.loans
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = loans.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert loans" ON public.loans
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  NOT is_board_member(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = loans.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Executives can delete loans" ON public.loans
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 7: Drop and recreate REPAYMENTS policies
DROP POLICY IF EXISTS "Users can view repayments for assigned clients" ON public.repayments;
DROP POLICY IF EXISTS "Users can update repayments for assigned clients" ON public.repayments;
DROP POLICY IF EXISTS "Users can insert repayments for assigned clients" ON public.repayments;
DROP POLICY IF EXISTS "Admins and managers can delete repayments" ON public.repayments;

CREATE POLICY "Users can view repayments" ON public.repayments
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update repayments" ON public.repayments
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert repayments" ON public.repayments
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  NOT is_board_member(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON l.client_id = c.client_id
      WHERE l.loan_id = repayments.loan_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Executives can delete repayments" ON public.repayments
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 8: Drop and recreate FIELD_COLLECTIONS policies
DROP POLICY IF EXISTS "Users can view collections for assigned clients" ON public.field_collections;
DROP POLICY IF EXISTS "Users can update collections for assigned clients" ON public.field_collections;
DROP POLICY IF EXISTS "Users can insert collections for assigned clients" ON public.field_collections;
DROP POLICY IF EXISTS "Admins and managers can delete field collections" ON public.field_collections;

CREATE POLICY "Users can view field collections" ON public.field_collections
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    collected_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = field_collections.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update field collections" ON public.field_collections
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    collected_by = auth.uid()
  )
);

CREATE POLICY "Users can insert field collections" ON public.field_collections
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  auth.uid() = collected_by AND
  NOT is_board_member(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = field_collections.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Executives can delete field collections" ON public.field_collections
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 9: Drop and recreate CLIENT_DOCUMENTS policies
DROP POLICY IF EXISTS "Users can view documents for assigned clients" ON public.client_documents;
DROP POLICY IF EXISTS "Users can update documents for assigned clients" ON public.client_documents;
DROP POLICY IF EXISTS "Users can upload documents for assigned clients" ON public.client_documents;
DROP POLICY IF EXISTS "Users can delete documents for assigned clients" ON public.client_documents;

CREATE POLICY "Users can view client documents" ON public.client_documents
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = client_documents.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update client documents" ON public.client_documents
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can upload client documents" ON public.client_documents
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  auth.uid() = uploaded_by AND
  NOT is_board_member(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = client_documents.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Executives can delete client documents" ON public.client_documents
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 10: Drop and recreate GROUP_MEMBERS policies
DROP POLICY IF EXISTS "Users can view group members for assigned clients" ON public.group_members;
DROP POLICY IF EXISTS "Users can update group members for assigned clients" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert group members for assigned clients" ON public.group_members;
DROP POLICY IF EXISTS "Users can delete group members for assigned clients" ON public.group_members;

CREATE POLICY "Users can view group members" ON public.group_members
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    is_board_member(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = group_members.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update group members" ON public.group_members
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = group_members.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert group members" ON public.group_members
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND
  NOT is_board_member(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.client_id = group_members.client_id
      AND c.assigned_officer_id = auth.uid()
    )
  )
);

CREATE POLICY "Executives can delete group members" ON public.group_members
FOR DELETE USING (
  user_belongs_to_org(auth.uid(), org_id) AND
  is_executive(auth.uid(), org_id)
);

-- Step 11: Update ACTIVITY_AUDIT_LOG policies to include Board read access
DROP POLICY IF EXISTS "Admins and managers can view audit logs" ON public.activity_audit_log;

CREATE POLICY "Executives and board can view audit logs" ON public.activity_audit_log
FOR SELECT USING (
  is_executive(auth.uid(), org_id) OR
  is_board_member(auth.uid(), org_id)
);