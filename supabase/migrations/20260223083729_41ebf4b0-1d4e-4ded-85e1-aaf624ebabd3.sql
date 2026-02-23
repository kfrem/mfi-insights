
-- Fix organisations INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can create organisations" ON public.organisations;
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix organisations SELECT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can view their organisations" ON public.organisations;
CREATE POLICY "Users can view their organisations"
ON public.organisations FOR SELECT
TO authenticated
USING (
  (is_demo = true) OR
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid()
  )
);

-- Fix organisations UPDATE policy to be PERMISSIVE
DROP POLICY IF EXISTS "Executives can update organisation details" ON public.organisations;
CREATE POLICY "Executives can update organisation details"
ON public.organisations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.org_id = organisations.org_id AND uo.user_id = auth.uid()
    AND is_executive(auth.uid(), uo.org_id)
  )
);

-- Fix user_organizations INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can insert own org membership" ON public.user_organizations;
CREATE POLICY "Users can insert own org membership"
ON public.user_organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR is_executive(auth.uid(), org_id));

-- Fix user_organizations SELECT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can view org memberships" ON public.user_organizations;
CREATE POLICY "Users can view org memberships"
ON public.user_organizations FOR SELECT
TO authenticated
USING (user_belongs_to_org(auth.uid(), org_id) OR auth.uid() = user_id);

-- Fix user_organizations DELETE policy to be PERMISSIVE
DROP POLICY IF EXISTS "Executives can delete org memberships" ON public.user_organizations;
CREATE POLICY "Executives can delete org memberships"
ON public.user_organizations FOR DELETE
TO authenticated
USING (is_executive(auth.uid(), org_id));

-- Fix user_roles INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can insert own role or executives can insert" ON public.user_roles;
CREATE POLICY "Users can insert own role or executives can insert"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR is_executive(auth.uid(), org_id));

-- Fix user_roles SELECT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_belongs_to_org(auth.uid(), org_id) OR auth.uid() = user_id);

-- Fix user_roles UPDATE/DELETE policies to be PERMISSIVE
DROP POLICY IF EXISTS "Executives can update roles" ON public.user_roles;
CREATE POLICY "Executives can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (is_executive(auth.uid(), org_id));

DROP POLICY IF EXISTS "Executives can delete roles" ON public.user_roles;
CREATE POLICY "Executives can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (is_executive(auth.uid(), org_id));

-- Fix profiles policies to be PERMISSIVE
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner or executives can view profiles" ON public.profiles;
CREATE POLICY "Owner or executives can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_organizations viewer
    JOIN user_organizations target ON target.org_id = viewer.org_id
    WHERE viewer.user_id = auth.uid() AND target.user_id = profiles.user_id
    AND is_executive(auth.uid(), viewer.org_id)
  )
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix organisation_settings INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Users can insert org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can insert org settings for their org"
ON public.organisation_settings FOR INSERT
TO authenticated
WITH CHECK (user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can update org settings for their org" ON public.organisation_settings;
CREATE POLICY "Users can update org settings for their org"
ON public.organisation_settings FOR UPDATE
TO authenticated
USING (user_belongs_to_org(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can view org settings" ON public.organisation_settings;
CREATE POLICY "Users can view org settings"
ON public.organisation_settings FOR SELECT
TO authenticated
USING (user_belongs_to_org(auth.uid(), org_id));

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
