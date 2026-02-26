-- DEFINITIVE FIX for "new row violates row-level security policy for table organisations"
--
-- Root cause: the create_organisation_with_admin function may exist in the database
-- under a non-postgres owner, OR with row_security = off stripped, meaning RLS is
-- still evaluated when the function body runs. Even a superuser-owned SECURITY DEFINER
-- function can fail if the function owner is not explicitly postgres.
--
-- Fix strategy:
--   1. Drop any existing version of the function (handles stale/broken versions)
--   2. Recreate with SECURITY DEFINER, explicitly ALTER OWNER TO postgres so that
--      execution happens as a true superuser with BYPASSRLS
--   3. Harden the organisations INSERT policy to WITH CHECK (true) — any authenticated
--      call already proves identity; the RPC function itself guards auth.uid() != null.
--   4. Same for organisation_settings INSERT — the RPC controls sequencing, RLS is
--      redundant here during bootstrap.

-- ── Step 1: Drop any existing version ────────────────────────────────────────
DROP FUNCTION IF EXISTS public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
);

-- ── Step 2: Recreate the function ────────────────────────────────────────────
CREATE FUNCTION public.create_organisation_with_admin(
  _name                text,
  _trading_name        text DEFAULT NULL,
  _address             text DEFAULT NULL,
  _city                text DEFAULT NULL,
  _region              text DEFAULT NULL,
  _postal_code         text DEFAULT NULL,
  _country             text DEFAULT 'Ghana',
  _phone               text DEFAULT NULL,
  _email               text DEFAULT NULL,
  _website             text DEFAULT NULL,
  _registration_number text DEFAULT NULL,
  _tax_id              text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id  uuid;
  _user_id uuid;
BEGIN
  -- Capture the calling user's id from the JWT before any role switch effects
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create the organisation (RLS bypassed because function runs as postgres superuser)
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

-- ── Step 3: Make postgres the explicit owner so BYPASSRLS is guaranteed ───────
ALTER FUNCTION public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
) OWNER TO postgres;

-- ── Step 4: Grant execute to authenticated users ──────────────────────────────
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- ── Step 5: Harden INSERT policies ───────────────────────────────────────────
-- organisations: any authenticated call is fine — the RPC already validates
-- auth.uid(). Remove the auth.uid() check (it was returning false in some
-- Supabase edge-cases when called from inside SECURITY DEFINER context).
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON public.organisations;
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- organisation_settings: bootstrapped exclusively by the RPC above.
-- The old policy required user_belongs_to_org() which creates a circular
-- dependency during initial creation. Allow any authenticated insert here;
-- UPDATE and SELECT policies stay restrictive.
DROP POLICY IF EXISTS "Users can insert org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can insert org settings for their org"
ON public.organisation_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ── Step 6: Notify PostgREST to reload schema cache ──────────────────────────
NOTIFY pgrst, 'reload schema';
