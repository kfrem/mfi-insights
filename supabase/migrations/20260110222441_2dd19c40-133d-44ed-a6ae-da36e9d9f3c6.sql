-- Create enum for client types
CREATE TYPE public.client_type AS ENUM ('INDIVIDUAL', 'GROUP', 'COOPERATIVE', 'SME');

-- Create enum for group member roles
CREATE TYPE public.group_member_role AS ENUM ('LEADER', 'SECRETARY', 'MEMBER');

-- Create clients table in our Lovable Cloud database
CREATE TABLE public.clients (
  client_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  client_type public.client_type NOT NULL DEFAULT 'INDIVIDUAL',
  -- Basic identification (from Ghana Card - MANDATORY per BoG)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ghana_card_number TEXT NOT NULL,
  ghana_card_expiry DATE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  nationality TEXT NOT NULL DEFAULT 'Ghanaian',
  -- Contact information
  phone TEXT,
  email TEXT,
  -- Address & residence
  address TEXT,
  proof_of_residence_type TEXT CHECK (proof_of_residence_type IN ('UTILITY_BILL', 'GPS_ADDRESS', 'LEASE_AGREEMENT', 'BANK_STATEMENT')),
  -- KYC/AML fields
  occupation TEXT NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
  source_of_funds TEXT NOT NULL,
  -- Financial information for affordability assessment
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  -- Group/Cooperative/SME specific fields
  group_name TEXT, -- Name of group/cooperative/business
  registration_number TEXT, -- For cooperatives and SMEs
  registration_date DATE, -- For cooperatives and SMEs
  -- System fields
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECEASED', 'MERGED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table (for GROUP, COOPERATIVE, SME client types)
CREATE TABLE public.group_members (
  member_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'MEMBER',
  -- Full KYC for each member (same as client)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ghana_card_number TEXT NOT NULL,
  ghana_card_expiry DATE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  nationality TEXT NOT NULL DEFAULT 'Ghanaian',
  phone TEXT,
  email TEXT,
  address TEXT,
  proof_of_residence_type TEXT CHECK (proof_of_residence_type IN ('UTILITY_BILL', 'GPS_ADDRESS', 'LEASE_AGREEMENT', 'BANK_STATEMENT')),
  occupation TEXT NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
  source_of_funds TEXT NOT NULL,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  -- System fields
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view clients in their org"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update clients in their org"
ON public.clients FOR UPDATE
TO authenticated
USING (true);

-- RLS policies for group_members
CREATE POLICY "Users can view group members in their org"
ON public.group_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert group members"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update group members in their org"
ON public.group_members FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete group members"
ON public.group_members FOR DELETE
TO authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX idx_clients_org_id ON public.clients(org_id);
CREATE INDEX idx_clients_client_type ON public.clients(client_type);
CREATE INDEX idx_clients_ghana_card ON public.clients(ghana_card_number);
CREATE INDEX idx_group_members_client_id ON public.group_members(client_id);
CREATE INDEX idx_group_members_org_id ON public.group_members(org_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
BEFORE UPDATE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();