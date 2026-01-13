-- Create organisations table to store company details
CREATE TABLE public.organisations (
  org_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trading_name TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Ghana',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  registration_number TEXT,
  tax_id TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing organisations (users can see orgs they belong to)
CREATE POLICY "Users can view their organisations"
ON public.organisations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.org_id = organisations.org_id
    AND uo.user_id = auth.uid()
  )
);

-- Allow authenticated users to create new organisations (for onboarding)
CREATE POLICY "Authenticated users can create organisations"
ON public.organisations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Executives can update their organisation details
CREATE POLICY "Executives can update organisation details"
ON public.organisations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.org_id = organisations.org_id
    AND uo.user_id = auth.uid()
    AND is_executive(auth.uid(), uo.org_id)
  )
);

-- Add foreign key from user_organizations to organisations
ALTER TABLE public.user_organizations
ADD CONSTRAINT fk_user_organizations_org
FOREIGN KEY (org_id) REFERENCES public.organisations(org_id)
ON DELETE CASCADE;

-- Add foreign key from organisation_settings to organisations  
ALTER TABLE public.organisation_settings
ADD CONSTRAINT fk_organisation_settings_org
FOREIGN KEY (org_id) REFERENCES public.organisations(org_id)
ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_organisations_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo organisation
INSERT INTO public.organisations (org_id, name, trading_name, address, city, region, country, phone, email, is_demo)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Microfinance Institution',
  'Demo MFI',
  '123 Finance Street',
  'Accra',
  'Greater Accra',
  'Ghana',
  '+233 20 000 0000',
  'demo@mfi-demo.com',
  true
);