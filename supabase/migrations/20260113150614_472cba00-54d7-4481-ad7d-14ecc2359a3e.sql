-- Create shareholders table to track investor information
CREATE TABLE public.shareholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  user_id UUID, -- Optional: linked to auth user for portal access
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  share_units INTEGER NOT NULL DEFAULT 0,
  share_unit_value NUMERIC(15,2) NOT NULL DEFAULT 100.00, -- Value per share unit
  total_investment NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dividend payouts table
CREATE TABLE public.dividend_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(org_id) ON DELETE CASCADE,
  shareholder_id UUID NOT NULL REFERENCES public.shareholders(id) ON DELETE CASCADE,
  payout_date DATE NOT NULL,
  dividend_rate NUMERIC(5,4) NOT NULL, -- e.g., 0.0250 for 2.5%
  shares_at_payout INTEGER NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shareholder transactions table (for tracking investments/withdrawals)
CREATE TABLE public.shareholder_transactions (
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

-- Enable RLS
ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareholder_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shareholders
CREATE POLICY "Executives can view shareholders" 
ON public.shareholders FOR SELECT 
USING (public.is_executive(auth.uid(), org_id) OR public.is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own record" 
ON public.shareholders FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Executives can manage shareholders" 
ON public.shareholders FOR ALL 
USING (public.is_executive(auth.uid(), org_id));

-- RLS Policies for dividend_payouts
CREATE POLICY "Executives can view dividend payouts" 
ON public.dividend_payouts FOR SELECT 
USING (public.is_executive(auth.uid(), org_id) OR public.is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own dividends" 
ON public.dividend_payouts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shareholders s 
    WHERE s.id = shareholder_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage dividend payouts" 
ON public.dividend_payouts FOR ALL 
USING (public.is_executive(auth.uid(), org_id));

-- RLS Policies for shareholder_transactions
CREATE POLICY "Executives can view transactions" 
ON public.shareholder_transactions FOR SELECT 
USING (public.is_executive(auth.uid(), org_id) OR public.is_board_member(auth.uid(), org_id));

CREATE POLICY "Shareholders can view own transactions" 
ON public.shareholder_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shareholders s 
    WHERE s.id = shareholder_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Executives can manage transactions" 
ON public.shareholder_transactions FOR ALL 
USING (public.is_executive(auth.uid(), org_id));

-- Triggers for updated_at
CREATE TRIGGER update_shareholders_updated_at
BEFORE UPDATE ON public.shareholders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();