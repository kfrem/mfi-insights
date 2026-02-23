
-- Fix 1: client-documents storage bucket - restrict to org-scoped access
DROP POLICY IF EXISTS "Authenticated users can view client documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploaded files" ON storage.objects;

CREATE POLICY "Users can view client documents in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload client documents in their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update client documents in their org"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete client documents in their org"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.user_organizations WHERE user_id = auth.uid()
  )
);
