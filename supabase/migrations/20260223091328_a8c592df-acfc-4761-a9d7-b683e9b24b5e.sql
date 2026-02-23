
-- CRITICAL FIX: Grant base table privileges to authenticated and anon roles
-- Without these, RLS policies are never evaluated and all operations return 403

DO $$
BEGIN
  -- Organisations
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated';
  EXECUTE 'GRANT SELECT ON public.organisations TO anon';
  
  -- User organizations
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organizations TO authenticated';
  
  -- User roles
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated';
  
  -- Profiles
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated';
  
  -- Organisation settings
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.organisation_settings TO authenticated';
  
  -- Clients
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated';
  
  -- Loans
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated';
  
  -- Repayments
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.repayments TO authenticated';
  
  -- Field collections
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_collections TO authenticated';
  
  -- Group members
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated';
  
  -- Client documents
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated';
  
  -- Shareholders
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.shareholders TO authenticated';
  
  -- Shareholder transactions
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.shareholder_transactions TO authenticated';
  
  -- Dividend payouts
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.dividend_payouts TO authenticated';
  
  -- BOG tier config (read-only)
  EXECUTE 'GRANT SELECT ON public.bog_tier_config TO authenticated';
  EXECUTE 'GRANT SELECT ON public.bog_tier_config TO anon';
  
  -- Audit logs
  EXECUTE 'GRANT SELECT, INSERT ON public.activity_audit_log TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT ON public.loan_status_audit TO authenticated';
END
$$;

-- Force PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
