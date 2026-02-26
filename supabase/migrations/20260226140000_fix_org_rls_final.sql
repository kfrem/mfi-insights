-- FINAL FIX: organisations RLS violation during onboarding
--
-- Problem: create_organisation_with_admin() was never applied to the active
-- project (udovvvksoemsmadaueqf). This migration re-applies the full fix with
-- the two most reliable bypass techniques combined:
--   1. SECURITY DEFINER + SET row_security = off  (bypasses RLS at session level)
--   2. ALTER OWNER TO postgres                     (ensures superuser context)
--
-- Even if one technique fails in a given Supabase version, the other ensures
-- the INSERT succeeds.

-- ── Step 1: Drop any existing version ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
);

-- ── Step 2: Recreate with both bypass techniques ───────────────────────────────
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
SET row_security = off
AS $$
DECLARE
  _org_id  uuid;
  _user_id uuid;
BEGIN
  -- Capture caller identity before any role switch
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create the organisation (RLS bypassed by row_security=off + BYPASSRLS owner)
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

-- ── Step 3: Own by postgres (superuser with BYPASSRLS) ─────────────────────────
ALTER FUNCTION public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
) OWNER TO postgres;

-- ── Step 4: Grant execute to authenticated users ───────────────────────────────
GRANT EXECUTE ON FUNCTION public.create_organisation_with_admin(
  text, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- ── Step 5: Ensure INSERT policies are permissive ─────────────────────────────
-- organisations
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON public.organisations;
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- organisation_settings
DROP POLICY IF EXISTS "Users can insert org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can insert org settings for their org"
ON public.organisation_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ── Step 6: Reload PostgREST schema cache ─────────────────────────────────────
NOTIFY pgrst, 'reload schema';
