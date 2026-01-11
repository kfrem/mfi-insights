-- Drop existing field-evidence policies that were partially created
DROP POLICY IF EXISTS "Users can view field evidence in their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload field evidence in their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can update field evidence in their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete field evidence in their org" ON storage.objects;

-- Recreate org-scoped SELECT policy for field-evidence
CREATE POLICY "Users can view field evidence in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

-- Recreate org-scoped INSERT policy for field-evidence
CREATE POLICY "Users can upload field evidence in their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

-- Recreate org-scoped UPDATE policy for field-evidence
CREATE POLICY "Users can update field evidence in their org"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

-- Recreate org-scoped DELETE policy for field-evidence
CREATE POLICY "Users can delete field evidence in their org"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'field-evidence' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);