-- Create enum for BoG MFI Tiers
CREATE TYPE public.bog_mfi_tier AS ENUM (
  'TIER_1_RCB',      -- Rural and Community Banks
  'TIER_2_SL',       -- Savings and Loans Companies
  'TIER_3_FH',       -- Finance Houses
  'TIER_4_MFC'       -- Microfinance Companies (Money Lenders, Susu)
);

-- Create organisation settings table to store MFI tier and related config
CREATE TABLE public.organisation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  -- BoG MFI Tier Classification
  bog_tier public.bog_mfi_tier NOT NULL DEFAULT 'TIER_4_MFC',
  license_number TEXT,
  license_expiry DATE,
  -- Tier-specific limits (per BoG regulations)
  max_single_obligor_limit NUMERIC, -- Max loan to single borrower
  max_loan_amount NUMERIC,          -- Max loan amount per tier
  min_capital_requirement NUMERIC,  -- Minimum capital per tier
  -- Regulatory reporting settings
  prudential_return_frequency TEXT DEFAULT 'MONTHLY' CHECK (prudential_return_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY')),
  car_threshold NUMERIC DEFAULT 10.0, -- Capital Adequacy Ratio threshold %
  liquidity_threshold NUMERIC DEFAULT 15.0, -- Liquidity ratio threshold %
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view org settings"
ON public.organisation_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update org settings"
ON public.organisation_settings FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can insert org settings"
ON public.organisation_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index
CREATE INDEX idx_org_settings_org_id ON public.organisation_settings(org_id);

-- Trigger for updated_at
CREATE TRIGGER update_org_settings_updated_at
BEFORE UPDATE ON public.organisation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create reference table for tier configurations (BoG regulatory requirements)
CREATE TABLE public.bog_tier_config (
  tier public.bog_mfi_tier PRIMARY KEY,
  tier_name TEXT NOT NULL,
  tier_description TEXT,
  min_capital_ghs NUMERIC NOT NULL,
  max_loan_per_borrower_ghs NUMERIC,
  single_obligor_limit_percent NUMERIC DEFAULT 25, -- % of net worth
  car_requirement NUMERIC DEFAULT 10, -- Capital Adequacy Ratio %
  liquidity_requirement NUMERIC DEFAULT 15, -- Liquidity Ratio %
  prudential_frequency TEXT DEFAULT 'MONTHLY',
  requires_bog_license BOOLEAN DEFAULT true
);

-- Insert BoG tier configurations
INSERT INTO public.bog_tier_config (tier, tier_name, tier_description, min_capital_ghs, max_loan_per_borrower_ghs, single_obligor_limit_percent, car_requirement, liquidity_requirement, prudential_frequency)
VALUES
  ('TIER_1_RCB', 'Rural & Community Bank', 'Licensed rural and community banks regulated under Banking Act', 1000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_2_SL', 'Savings & Loans Company', 'Non-bank financial institutions accepting deposits and granting loans', 15000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_3_FH', 'Finance House', 'Specialized credit institutions not accepting demand deposits', 8000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_4_MFC', 'Microfinance Company', 'Microfinance institutions including money lenders and susu collectors', 500000, 50000, 10, 10, 20, 'MONTHLY');

-- RLS for tier config (read-only reference)
ALTER TABLE public.bog_tier_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tier config"
ON public.bog_tier_config FOR SELECT
TO authenticated
USING (true);