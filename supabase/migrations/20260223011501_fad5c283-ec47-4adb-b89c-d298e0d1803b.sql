-- Fix ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- This is critical because RESTRICTIVE policies without any PERMISSIVE policies = deny all

-- ========== organisations ==========
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON public.organisations;
CREATE POLICY "Authenticated users can create organisations" ON public.organisations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their organisations" ON public.organisations;
CREATE POLICY "Users can view their organisations" ON public.organisations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid()));

DROP POLICY IF EXISTS "Executives can update organisation details" ON public.organisations;
CREATE POLICY "Executives can update organisation details" ON public.organisations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid() AND is_executive(auth.uid(), uo.org_id)));

-- ========== profiles ==========
DROP POLICY IF EXISTS "Executives can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner or executives can view profiles" ON public.profiles;
CREATE POLICY "Owner or executives can view profiles" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM user_organizations viewer JOIN user_organizations target ON target.org_id = viewer.org_id WHERE viewer.user_id = auth.uid() AND target.user_id = profiles.user_id AND is_executive(auth.uid(), viewer.org_id))));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== user_organizations ==========
DROP POLICY IF EXISTS "Users can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view their own org memberships" ON public.user_organizations;
CREATE POLICY "Users can view org memberships" ON public.user_organizations FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Executives can insert org memberships" ON public.user_organizations;
CREATE POLICY "Users can insert own org membership" ON public.user_organizations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_executive(auth.uid(), org_id));

DROP POLICY IF EXISTS "Executives can delete org memberships" ON public.user_organizations;
CREATE POLICY "Executives can delete org memberships" ON public.user_organizations FOR DELETE TO authenticated USING (is_executive(auth.uid(), org_id));

-- ========== user_roles ==========
DROP POLICY IF EXISTS "Users can view roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Executives can insert roles" ON public.user_roles;
CREATE POLICY "Users can insert own role or executives can insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_executive(auth.uid(), org_id));

DROP POLICY IF EXISTS "Executives can update roles" ON public.user_roles;
CREATE POLICY "Executives can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (is_executive(auth.uid(), org_id));

DROP POLICY IF EXISTS "Executives can delete roles" ON public.user_roles;
CREATE POLICY "Executives can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (is_executive(auth.uid(), org_id));

-- ========== organisation_settings ==========
DROP POLICY IF EXISTS "Users can view org settings" ON public.organisation_settings;
CREATE POLICY "Users can view org settings" ON public.organisation_settings FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can insert org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can insert org settings for their org" ON public.organisation_settings FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can update org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can update org settings for their org" ON public.organisation_settings FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id));

-- ========== clients ==========
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
CREATE POLICY "Users can view clients" ON public.clients FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR assigned_officer_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
CREATE POLICY "Users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Executives can update client assignments" ON public.clients;
CREATE POLICY "Users can update clients" ON public.clients FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR assigned_officer_id = auth.uid()));

DROP POLICY IF EXISTS "Executives can delete clients" ON public.clients;
CREATE POLICY "Executives can delete clients" ON public.clients FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== loans ==========
DROP POLICY IF EXISTS "Users can view loans" ON public.loans;
CREATE POLICY "Users can view loans" ON public.loans FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = loans.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert loans" ON public.loans;
CREATE POLICY "Users can insert loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = loans.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update loans" ON public.loans;
CREATE POLICY "Users can update loans" ON public.loans FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = loans.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Executives can delete loans" ON public.loans;
CREATE POLICY "Executives can delete loans" ON public.loans FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== repayments ==========
DROP POLICY IF EXISTS "Users can view repayments" ON public.repayments;
CREATE POLICY "Users can view repayments" ON public.repayments FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM loans l JOIN clients c ON l.client_id = c.client_id WHERE l.loan_id = repayments.loan_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert repayments" ON public.repayments;
CREATE POLICY "Users can insert repayments" ON public.repayments FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM loans l JOIN clients c ON l.client_id = c.client_id WHERE l.loan_id = repayments.loan_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update repayments" ON public.repayments;
CREATE POLICY "Users can update repayments" ON public.repayments FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM loans l JOIN clients c ON l.client_id = c.client_id WHERE l.loan_id = repayments.loan_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Executives can delete repayments" ON public.repayments;
CREATE POLICY "Executives can delete repayments" ON public.repayments FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== activity_audit_log ==========
DROP POLICY IF EXISTS "Executives and board can view audit logs" ON public.activity_audit_log;
CREATE POLICY "Executives and board can view audit logs" ON public.activity_audit_log FOR SELECT TO authenticated USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id));

-- Allow the log_activity function to insert (it's SECURITY DEFINER, but we need a permissive policy)
CREATE POLICY "System can insert audit logs" ON public.activity_audit_log FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id));

-- ========== loan_status_audit ==========
DROP POLICY IF EXISTS "Executives and board can view loan status audit" ON public.loan_status_audit;
CREATE POLICY "Executives and board can view loan status audit" ON public.loan_status_audit FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id)));

DROP POLICY IF EXISTS "Executives can insert loan status audit" ON public.loan_status_audit;
CREATE POLICY "Executives can insert loan status audit" ON public.loan_status_audit FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== field_collections ==========
DROP POLICY IF EXISTS "Users can view field collections" ON public.field_collections;
CREATE POLICY "Users can view field collections" ON public.field_collections FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR collected_by = auth.uid() OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = field_collections.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert field collections" ON public.field_collections;
CREATE POLICY "Users can insert field collections" ON public.field_collections FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND auth.uid() = collected_by AND NOT is_board_member(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = field_collections.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update field collections" ON public.field_collections;
CREATE POLICY "Users can update field collections" ON public.field_collections FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR collected_by = auth.uid()));

DROP POLICY IF EXISTS "Executives can delete field collections" ON public.field_collections;
CREATE POLICY "Executives can delete field collections" ON public.field_collections FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== group_members ==========
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = group_members.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;
CREATE POLICY "Users can insert group members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND NOT is_board_member(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = group_members.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update group members" ON public.group_members;
CREATE POLICY "Users can update group members" ON public.group_members FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = group_members.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Executives can delete group members" ON public.group_members;
CREATE POLICY "Executives can delete group members" ON public.group_members FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== client_documents ==========
DROP POLICY IF EXISTS "Users can view client documents" ON public.client_documents;
CREATE POLICY "Users can view client documents" ON public.client_documents FOR SELECT TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = client_documents.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can upload client documents" ON public.client_documents;
CREATE POLICY "Users can upload client documents" ON public.client_documents FOR INSERT TO authenticated WITH CHECK (user_belongs_to_org(auth.uid(), org_id) AND auth.uid() = uploaded_by AND NOT is_board_member(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM clients c WHERE c.client_id = client_documents.client_id AND c.assigned_officer_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update client documents" ON public.client_documents;
CREATE POLICY "Users can update client documents" ON public.client_documents FOR UPDATE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND (is_executive(auth.uid(), org_id) OR uploaded_by = auth.uid()));

DROP POLICY IF EXISTS "Executives can delete client documents" ON public.client_documents;
CREATE POLICY "Executives can delete client documents" ON public.client_documents FOR DELETE TO authenticated USING (user_belongs_to_org(auth.uid(), org_id) AND is_executive(auth.uid(), org_id));

-- ========== shareholders ==========
DROP POLICY IF EXISTS "Executives can manage shareholders" ON public.shareholders;
DROP POLICY IF EXISTS "Executives can view shareholders" ON public.shareholders;
DROP POLICY IF EXISTS "Shareholders can view own record" ON public.shareholders;
CREATE POLICY "View shareholders" ON public.shareholders FOR SELECT TO authenticated USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR user_id = auth.uid());
CREATE POLICY "Executives can manage shareholders" ON public.shareholders FOR ALL TO authenticated USING (is_executive(auth.uid(), org_id)) WITH CHECK (is_executive(auth.uid(), org_id));

-- ========== shareholder_transactions ==========
DROP POLICY IF EXISTS "Executives can manage transactions" ON public.shareholder_transactions;
DROP POLICY IF EXISTS "Executives can view transactions" ON public.shareholder_transactions;
DROP POLICY IF EXISTS "Shareholders can view own transactions" ON public.shareholder_transactions;
CREATE POLICY "View shareholder transactions" ON public.shareholder_transactions FOR SELECT TO authenticated USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM shareholders s WHERE s.id = shareholder_transactions.shareholder_id AND s.user_id = auth.uid()));
CREATE POLICY "Executives can manage transactions" ON public.shareholder_transactions FOR ALL TO authenticated USING (is_executive(auth.uid(), org_id)) WITH CHECK (is_executive(auth.uid(), org_id));

-- ========== dividend_payouts ==========
DROP POLICY IF EXISTS "Executives can manage dividend payouts" ON public.dividend_payouts;
DROP POLICY IF EXISTS "Executives can view dividend payouts" ON public.dividend_payouts;
DROP POLICY IF EXISTS "Shareholders can view own dividends" ON public.dividend_payouts;
CREATE POLICY "View dividend payouts" ON public.dividend_payouts FOR SELECT TO authenticated USING (is_executive(auth.uid(), org_id) OR is_board_member(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM shareholders s WHERE s.id = dividend_payouts.shareholder_id AND s.user_id = auth.uid()));
CREATE POLICY "Executives can manage dividend payouts" ON public.dividend_payouts FOR ALL TO authenticated USING (is_executive(auth.uid(), org_id)) WITH CHECK (is_executive(auth.uid(), org_id));

-- ========== bog_tier_config ==========
DROP POLICY IF EXISTS "Authenticated org users can read tier config" ON public.bog_tier_config;
CREATE POLICY "Authenticated users can read tier config" ON public.bog_tier_config FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM user_organizations WHERE user_organizations.user_id = auth.uid()));