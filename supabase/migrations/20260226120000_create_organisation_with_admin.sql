-- Fix: Bypass RLS chicken-and-egg problem during onboarding.
-- A new user has no org membership yet, so the user_organizations SELECT policy
-- (which calls user_belongs_to_org) blocks reads needed by subsequent inserts.
-- Wrapping all four inserts in a SECURITY DEFINER function lets them run with
-- elevated privileges while still verifying auth.uid() is non-null.

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
SET row_security = off
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
  INSERT INTO public.organisations (
    name, trading_name, address, city, region, postal_code,
    country, phone, email, website, registration_number, tax_id, is_demo
  )
  VALUES (
    _name, _trading_name, _address, _city, _region, _postal_code,
    _country, _phone, _email, _website, _registration_number, _tax_id, false
  )
  RETURNING org_id INTO _org_id;

  -- 2. Link user to org
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

-- Allow authenticated users to invoke this function
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin TO authenticated;
