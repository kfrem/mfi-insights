
-- Grant base table permissions to authenticated role for all tables
GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organisation_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repayments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shareholders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shareholder_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dividend_payouts TO authenticated;
GRANT SELECT ON public.bog_tier_config TO authenticated;
GRANT SELECT, INSERT ON public.activity_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.loan_status_audit TO authenticated;

-- Also grant to anon for demo mode read access
GRANT SELECT ON public.organisations TO anon;
GRANT SELECT ON public.bog_tier_config TO anon;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
