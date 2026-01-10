-- Add net_worth column to organisation_settings for single obligor limit calculation
ALTER TABLE public.organisation_settings 
ADD COLUMN IF NOT EXISTS net_worth numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organisation_settings.net_worth IS 'Institution net worth/capital for calculating single obligor limit';