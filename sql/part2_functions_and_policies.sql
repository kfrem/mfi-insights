-- ============================================================
-- MFI INSIGHTS - PART 2: HELPER FUNCTIONS AND RLS POLICIES
-- Run this SECOND in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS (Security Definer)
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_id = _user_id AND org_id = _org_id
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _org_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL OR _role IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND org_id = _org_id AND role = _role
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND org_id = _org_id
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE has_role(_user_id, _org_id, 'ADMIN') OR has_role(_user_id, _org_id, 'MANAGER')
  END
$$;

CREATE OR REPLACE FUNCTION public.is_board_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _org_id IS NULL THEN FALSE
    ELSE has_role(_user_id, _org_id, 'BOARD_DIRECTOR')
  END
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- ============================================================
-- ONBOARDING FUNCTION (handles org creation + membership + role in one transaction)
-- This bypasses the chicken-and-egg RLS problem
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_organisation_with_admin(
  _name text,
  _trading_name text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _postal_code text DEFAULT NULL,
  _country text DEFAULT 'Ghana',
  _phone text DEFAULT NULL,
  _email text DEFAULT NULL,
  _website text DEFAULT NULL,
  _registration_number text DEFAULT NULL,
  _tax_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create the organisation
  INSERT INTO public.organisations (name, trading_name, address, city, region, postal_code, country, phone, email, website, registration_number, tax_id, is_demo)
  VALUES (_name, _trading_name, _address, _city, _region, _postal_code, _country, _phone, _email, _website, _registration_number, _tax_id, false)
  RETURNING org_id INTO _org_id;

  -- 2. Add user to the organisation
  INSERT INTO public.user_organizations (user_id, org_id)
  VALUES (_user_id, _org_id);

  -- 3. Assign ADMIN role
  INSERT INTO public.user_roles (user_id, org_id, role)
  VALUES (_user_id, _org_id, 'ADMIN');

  -- 4. Create default organisation settings
  INSERT INTO public.organisation_settings (org_id, bog_tier)
  VALUES (_org_id, 'TIER_4_MFC');

  RETURN _org_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin TO authenticated;

-- ============================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_activity(
  _org_id uuid, _action_type text, _entity_type text,
  _entity_id uuid DEFAULT NULL, _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL, _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _org_id IS NULL OR _action_type IS NULL OR _entity_type IS NULL THEN RAISE EXCEPTION 'Missing required fields'; END IF;
  IF NOT public.user_belongs_to_org(auth.uid(), _org_id) THEN RAISE EXCEPTION 'Not a member of this organization'; END IF;
  INSERT INTO public.activity_audit_log (org_id, action_type, entity_type, entity_id, old_values, new_values, metadata, user_id)
  VALUES (_org_id, _action_type, _entity_type, _entity_id, _old_values, _new_values, _metadata, auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb) TO authenticated;

-- ============================================================
-- LOAN STATUS CHANGE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_loan_status_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.loan_status_audit (loan_id, org_id, previous_status, new_status, changed_by, approval_amount, notes)
    VALUES (NEW.loan_id, NEW.org_id, OLD.status::text, NEW.status::text, auth.uid(),
      CASE WHEN NEW.status = 'DISBURSED' THEN NEW.disbursed_amount ELSE NULL END, NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_loan_status_change ON public.loans;
CREATE TRIGGER trigger_log_loan_status_change
AFTER UPDATE ON public.loans FOR EACH ROW
EXECUTE FUNCTION public.log_loan_status_change();

-- ============================================================
-- RLS POLICIES - ORGANISATIONS
-- ============================================================

CREATE POLICY "Users can view their organisations" ON public.organisations
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid())
  OR is_demo = true
);

CREATE POLICY "Authenticated users can create organisations" ON public.organisations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Executives can update organisation details" ON public.organisations
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid() AND is_executive(auth.uid(), uo.org_id))
);

-- ============================================================
-- RLS POLICIES - USER_ORGANIZATIONS
-- ============================================================

CREATE POLICY "Users can view org memberships" ON public.user_organizations
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id) OR auth.uid() = user_id);

-- CRITICAL: Allow self-insert for onboarding (user adds themselves to new org)
CREATE POLICY "Users can create their own org membership" ON public.user_organizations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives can insert org memberships" ON public.user_organizations
FOR INSERT WITH CHECK (is_executive(auth.uid(), org_id));

CREATE POLICY "Executives can delete org memberships" ON public.user_organizations
FOR DELETE USING (is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - USER_ROLES
-- ============================================================

CREATE POLICY "Users can view roles in their org" ON public.user_roles
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id));

-- CRITICAL: Allow self-insert for onboarding (user gives themselves ADMIN on new org)
CREATE POLICY "Users can create their own initial role" ON public.user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (is_executive(auth.uid(), org_id));

CREATE POLICY "Executives can update roles" ON public.user_roles
FOR UPDATE USING (is_executive(auth.uid(), org_id));

CREATE POLICY "Executives can delete roles" ON public.user_roles
FOR DELETE USING (is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - ORGANISATION_SETTINGS
-- ============================================================

CREATE POLICY "Users can view org settings" ON public.organisation_settings
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id));

-- Allow insert for onboarding
CREATE POLICY "Authenticated users can create org settings" ON public.organisation_settings
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Executives can update org settings" ON public.organisation_settings
FOR UPDATE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - BOG_TIER_CONFIG
-- ============================================================

CREATE POLICY "Authenticated users can read tier config" ON public.bog_tier_config
FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES - PROFILES
-- ============================================================

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Executives can view org profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_organizations viewer
    JOIN public.user_organizations target ON target.org_id = viewer.org_id
    WHERE viewer.user_id = auth.uid() AND target.user_id = profiles.user_id
    AND public.is_executive(auth.uid(), viewer.org_id)
  )
);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES - CLIENTS
-- ============================================================

CREATE POLICY "Users can view clients" ON public.clients
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR assigned_officer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert clients" ON public.clients
FOR INSERT WITH CHECK (
  user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id)
);

CREATE POLICY "Users can update clients" ON public.clients
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR assigned_officer_id = auth.uid())
);

CREATE POLICY "Executives can delete clients" ON public.clients
FOR DELETE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - LOANS
-- ============================================================

CREATE POLICY "Users can view loans" ON public.loans
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.client_id = loans.client_id AND c.assigned_officer_id = auth.uid())
  )
);

CREATE POLICY "Users can insert loans" ON public.loans
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id));

CREATE POLICY "Users can update loans" ON public.loans
FOR UPDATE USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.client_id = loans.client_id AND c.assigned_officer_id = auth.uid())
  )
);

CREATE POLICY "Executives can delete loans" ON public.loans
FOR DELETE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - REPAYMENTS
-- ============================================================

CREATE POLICY "Users can view repayments" ON public.repayments
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR
    EXISTS (SELECT 1 FROM public.loans l JOIN public.clients c ON l.client_id = c.client_id WHERE l.loan_id = repayments.loan_id AND c.assigned_officer_id = auth.uid())
  )
);

CREATE POLICY "Users can insert repayments" ON public.repayments
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id));

CREATE POLICY "Users can update repayments" ON public.repayments
FOR UPDATE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

CREATE POLICY "Executives can delete repayments" ON public.repayments
FOR DELETE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - AUDIT TABLES
-- ============================================================

CREATE POLICY "Executives and board can view loan status audit" ON public.loan_status_audit
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id)));

CREATE POLICY "Executives can insert loan status audit" ON public.loan_status_audit
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

CREATE POLICY "Executives and board can view activity audit" ON public.activity_audit_log
FOR SELECT USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - FIELD_COLLECTIONS
-- ============================================================

CREATE POLICY "Users can view field collections" ON public.field_collections
FOR SELECT USING (
  user_belongs_to_org(auth.uid(), org_id) AND (
    is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR collected_by = auth.uid()
  )
);

CREATE POLICY "Users can insert field collections" ON public.field_collections
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND auth.uid() = collected_by);

CREATE POLICY "Users can update field collections" ON public.field_collections
FOR UPDATE USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR collected_by = auth.uid()));

-- ============================================================
-- RLS POLICIES - CLIENT_DOCUMENTS
-- ============================================================

CREATE POLICY "Users can view client documents" ON public.client_documents
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can upload client documents" ON public.client_documents
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update client documents" ON public.client_documents
FOR UPDATE USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR uploaded_by = auth.uid()));

CREATE POLICY "Executives can delete client documents" ON public.client_documents
FOR DELETE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - GROUP_MEMBERS
-- ============================================================

CREATE POLICY "Users can view group members" ON public.group_members
FOR SELECT USING (user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can insert group members" ON public.group_members
FOR INSERT WITH CHECK (user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Users can update group members" ON public.group_members
FOR UPDATE USING (user_belongs_to_org(auth.uid(), org_id));

CREATE POLICY "Executives can delete group members" ON public.group_members
FOR DELETE USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - SHAREHOLDERS
-- ============================================================

CREATE POLICY "Executives can view shareholders" ON public.shareholders
FOR SELECT USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own record" ON public.shareholders
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Executives can manage shareholders" ON public.shareholders
FOR ALL USING (is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - DIVIDEND_PAYOUTS
-- ============================================================

CREATE POLICY "Executives can view dividend payouts" ON public.dividend_payouts
FOR SELECT USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own dividends" ON public.dividend_payouts
FOR SELECT USING (EXISTS (SELECT 1 FROM public.shareholders s WHERE s.id = shareholder_id AND s.user_id = auth.uid()));

CREATE POLICY "Executives can manage dividend payouts" ON public.dividend_payouts
FOR ALL USING (is_executive(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES - SHAREHOLDER_TRANSACTIONS
-- ============================================================

CREATE POLICY "Executives can view shareholder transactions" ON public.shareholder_transactions
FOR SELECT USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own transactions" ON public.shareholder_transactions
FOR SELECT USING (EXISTS (SELECT 1 FROM public.shareholders s WHERE s.id = shareholder_id AND s.user_id = auth.uid()));

CREATE POLICY "Executives can manage shareholder transactions" ON public.shareholder_transactions
FOR ALL USING (is_executive(auth.uid(), org_id));

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.repayments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_collections;
