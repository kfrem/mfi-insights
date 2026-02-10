-- ============================================================
-- MFI INSIGHTS - PART 1: CORE TABLES AND FUNCTIONS
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Rename existing conflicting tables (if they exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE public.clients RENAME TO _old_clients;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles RENAME TO _old_profiles;
  END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enums
DO $$ BEGIN
  CREATE TYPE public.client_type AS ENUM ('INDIVIDUAL', 'GROUP', 'COOPERATIVE', 'SME');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.group_member_role AS ENUM ('LEADER', 'SECRETARY', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.bog_mfi_tier AS ENUM ('TIER_1_RCB', 'TIER_2_SL', 'TIER_3_FH', 'TIER_4_MFC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interest_calc_frequency AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.repayment_frequency AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interest_method AS ENUM ('FLAT', 'REDUCING_BALANCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.penalty_type AS ENUM ('NONE', 'FLAT_AMOUNT', 'PERCENT_OVERDUE', 'PERCENT_INSTALLMENT', 'DAILY_RATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.loan_status AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'FIELD_OFFICER', 'TELLER', 'BOARD_DIRECTOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ORGANISATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organisations (
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

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organisations_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- USER_ORGANIZATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER_ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid NOT NULL,
  role public.user_role NOT NULL DEFAULT 'FIELD_OFFICER',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANISATION_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organisation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  bog_tier public.bog_mfi_tier NOT NULL DEFAULT 'TIER_4_MFC',
  license_number TEXT,
  license_expiry DATE,
  max_single_obligor_limit NUMERIC,
  max_loan_amount NUMERIC,
  min_capital_requirement NUMERIC,
  prudential_return_frequency TEXT DEFAULT 'MONTHLY',
  car_threshold NUMERIC DEFAULT 10.0,
  liquidity_threshold NUMERIC DEFAULT 15.0,
  net_worth NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organisation_settings
ADD CONSTRAINT fk_organisation_settings_org
FOREIGN KEY (org_id) REFERENCES public.organisations(org_id)
ON DELETE CASCADE;

CREATE TRIGGER update_org_settings_updated_at
BEFORE UPDATE ON public.organisation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BOG_TIER_CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bog_tier_config (
  tier public.bog_mfi_tier PRIMARY KEY,
  tier_name TEXT NOT NULL,
  tier_description TEXT,
  min_capital_ghs NUMERIC NOT NULL,
  max_loan_per_borrower_ghs NUMERIC,
  single_obligor_limit_percent NUMERIC DEFAULT 25,
  car_requirement NUMERIC DEFAULT 10,
  liquidity_requirement NUMERIC DEFAULT 15,
  prudential_frequency TEXT DEFAULT 'MONTHLY',
  requires_bog_license BOOLEAN DEFAULT true
);

ALTER TABLE public.bog_tier_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.bog_tier_config (tier, tier_name, tier_description, min_capital_ghs, max_loan_per_borrower_ghs, single_obligor_limit_percent, car_requirement, liquidity_requirement, prudential_frequency)
VALUES
  ('TIER_1_RCB', 'Rural & Community Bank', 'Licensed rural and community banks', 1000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_2_SL', 'Savings & Loans Company', 'Non-bank financial institutions', 15000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_3_FH', 'Finance House', 'Specialized credit institutions', 8000000, NULL, 25, 10, 15, 'MONTHLY'),
  ('TIER_4_MFC', 'Microfinance Company', 'Microfinance institutions', 500000, 50000, 10, 10, 20, 'MONTHLY')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  client_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  client_type public.client_type NOT NULL DEFAULT 'INDIVIDUAL',
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
  proof_of_residence_type TEXT,
  occupation TEXT NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
  source_of_funds TEXT NOT NULL,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  group_name TEXT,
  registration_number TEXT,
  registration_date DATE,
  assigned_officer_id uuid REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECEASED', 'MERGED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_ghana_card ON public.clients(ghana_card_number);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_officer ON public.clients(assigned_officer_id);

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- GROUP_MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  member_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'MEMBER',
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
  proof_of_residence_type TEXT,
  occupation TEXT NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
  source_of_funds TEXT NOT NULL,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_group_members_client_id ON public.group_members(client_id);
CREATE INDEX IF NOT EXISTS idx_group_members_org_id ON public.group_members(org_id);

CREATE TRIGGER update_group_members_updated_at
BEFORE UPDATE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- LOANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE RESTRICT,
  loan_type TEXT NOT NULL,
  purpose TEXT,
  principal NUMERIC NOT NULL CHECK (principal > 0),
  interest_rate NUMERIC NOT NULL CHECK (interest_rate >= 0),
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  interest_method public.interest_method NOT NULL DEFAULT 'REDUCING_BALANCE',
  interest_calc_frequency public.interest_calc_frequency NOT NULL DEFAULT 'MONTHLY',
  repayment_frequency public.repayment_frequency NOT NULL DEFAULT 'MONTHLY',
  penalty_type public.penalty_type NOT NULL DEFAULT 'NONE',
  penalty_value NUMERIC DEFAULT 0,
  penalty_grace_days INTEGER DEFAULT 0,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approval_date DATE,
  disbursement_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  disbursed_amount NUMERIC,
  total_interest NUMERIC,
  total_repayable NUMERIC,
  outstanding_principal NUMERIC,
  outstanding_interest NUMERIC,
  status public.loan_status NOT NULL DEFAULT 'PENDING',
  approved_by UUID,
  disbursed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_loans_client_id ON public.loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_org_id ON public.loans(org_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- REPAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.repayments (
  repayment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES public.loans(loan_id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  principal_portion NUMERIC DEFAULT 0,
  interest_portion NUMERIC DEFAULT 0,
  penalty_portion NUMERIC DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference TEXT,
  received_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON public.repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_org_id ON public.repayments(org_id);

-- ============================================================
-- LOAN_STATUS_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loan_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  approval_amount numeric,
  rejection_reason text
);

ALTER TABLE public.loan_status_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_loan_status_audit_loan_id ON public.loan_status_audit(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_status_audit_org_id ON public.loan_status_audit(org_id);

-- ============================================================
-- ACTIVITY_AUDIT_LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.activity_audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.activity_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.activity_audit_log(entity_type, entity_id);

-- ============================================================
-- FIELD_COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  repayment_id uuid REFERENCES public.repayments(repayment_id) ON DELETE CASCADE,
  loan_id uuid NOT NULL,
  client_id uuid NOT NULL,
  collected_by uuid REFERENCES auth.users(id) NOT NULL,
  amount_collected numeric NOT NULL,
  collection_date timestamp with time zone NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  location_accuracy numeric,
  location_address text,
  receipt_photo_url text,
  signature_url text,
  collection_method text,
  mobile_money_reference text,
  client_confirmation boolean DEFAULT false,
  notes text,
  status text DEFAULT 'PENDING',
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.field_collections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_field_collections_org ON public.field_collections(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_collections_collector ON public.field_collections(collected_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_collections_loan ON public.field_collections(loan_id);
CREATE INDEX IF NOT EXISTS idx_field_collections_client ON public.field_collections(client_id);

CREATE TRIGGER update_field_collections_updated_at
BEFORE UPDATE ON public.field_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENT_DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_size_bytes INTEGER,
  mime_type TEXT
);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_org_id ON public.client_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_document_type ON public.client_documents(document_type);

-- ============================================================
-- SHAREHOLDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shareholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  share_units INTEGER NOT NULL DEFAULT 0,
  share_unit_value NUMERIC(15,2) NOT NULL DEFAULT 100.00,
  total_investment NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_shareholders_updated_at
BEFORE UPDATE ON public.shareholders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DIVIDEND_PAYOUTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dividend_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  shareholder_id UUID NOT NULL REFERENCES public.shareholders(id) ON DELETE CASCADE,
  payout_date DATE NOT NULL,
  dividend_rate NUMERIC(5,4) NOT NULL,
  shares_at_payout INTEGER NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dividend_payouts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SHAREHOLDER_TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shareholder_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  shareholder_id UUID NOT NULL REFERENCES public.shareholders(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INVESTMENT', 'WITHDRAWAL', 'DIVIDEND_REINVEST', 'SHARE_TRANSFER_IN', 'SHARE_TRANSFER_OUT')),
  share_units INTEGER NOT NULL,
  unit_value NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shareholder_transactions ENABLE ROW LEVEL SECURITY;

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
) ON CONFLICT DO NOTHING;
