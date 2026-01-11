-- Restrict bog_tier_config to authenticated users in organizations only
DROP POLICY IF EXISTS "Anyone can read tier config" ON public.bog_tier_config;

CREATE POLICY "Authenticated org users can read tier config" ON public.bog_tier_config
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = auth.uid()
  )
);