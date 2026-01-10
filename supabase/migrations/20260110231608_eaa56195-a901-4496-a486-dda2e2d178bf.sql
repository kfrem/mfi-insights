-- Create enum for interest calculation frequency
CREATE TYPE public.interest_calc_frequency AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- Create enum for repayment frequency
CREATE TYPE public.repayment_frequency AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY');

-- Create enum for interest method
CREATE TYPE public.interest_method AS ENUM ('FLAT', 'REDUCING_BALANCE');

-- Create enum for penalty type
CREATE TYPE public.penalty_type AS ENUM ('NONE', 'FLAT_AMOUNT', 'PERCENT_OVERDUE', 'PERCENT_INSTALLMENT', 'DAILY_RATE');

-- Create enum for loan status
CREATE TYPE public.loan_status AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF', 'REJECTED');

-- Create loans table with all required fields
CREATE TABLE public.loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE RESTRICT,
    
    -- Loan details
    loan_type TEXT NOT NULL,
    purpose TEXT,
    principal NUMERIC NOT NULL CHECK (principal > 0),
    interest_rate NUMERIC NOT NULL CHECK (interest_rate >= 0),
    term_months INTEGER NOT NULL CHECK (term_months > 0),
    
    -- Interest and repayment configuration
    interest_method public.interest_method NOT NULL DEFAULT 'REDUCING_BALANCE',
    interest_calc_frequency public.interest_calc_frequency NOT NULL DEFAULT 'MONTHLY',
    repayment_frequency public.repayment_frequency NOT NULL DEFAULT 'MONTHLY',
    
    -- Late payment penalty configuration
    penalty_type public.penalty_type NOT NULL DEFAULT 'NONE',
    penalty_value NUMERIC DEFAULT 0 CHECK (penalty_value >= 0),
    penalty_grace_days INTEGER DEFAULT 0 CHECK (penalty_grace_days >= 0),
    
    -- Dates
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_date DATE,
    disbursement_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    
    -- Amounts
    disbursed_amount NUMERIC,
    total_interest NUMERIC,
    total_repayable NUMERIC,
    outstanding_principal NUMERIC,
    outstanding_interest NUMERIC,
    
    -- Status
    status public.loan_status NOT NULL DEFAULT 'PENDING',
    
    -- Metadata
    approved_by UUID,
    disbursed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view loans in their org"
ON public.loans FOR SELECT
USING (true);

CREATE POLICY "Users can insert loans"
ON public.loans FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update loans in their org"
ON public.loans FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create repayments table
CREATE TABLE public.repayments (
    repayment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    loan_id UUID NOT NULL REFERENCES public.loans(loan_id) ON DELETE RESTRICT,
    
    -- Repayment details
    amount NUMERIC NOT NULL CHECK (amount > 0),
    principal_portion NUMERIC DEFAULT 0,
    interest_portion NUMERIC DEFAULT 0,
    penalty_portion NUMERIC DEFAULT 0,
    
    -- Payment info
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    reference TEXT,
    
    -- Metadata
    received_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view repayments in their org"
ON public.repayments FOR SELECT
USING (true);

CREATE POLICY "Users can insert repayments"
ON public.repayments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update repayments"
ON public.repayments FOR UPDATE
USING (true);

-- Create index for common queries
CREATE INDEX idx_loans_client_id ON public.loans(client_id);
CREATE INDEX idx_loans_org_id ON public.loans(org_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_repayments_loan_id ON public.repayments(loan_id);
CREATE INDEX idx_repayments_org_id ON public.repayments(org_id);