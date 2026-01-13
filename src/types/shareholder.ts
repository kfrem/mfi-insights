export interface Shareholder {
  id: string;
  org_id: string;
  user_id?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  share_units: number;
  share_unit_value: number;
  total_investment: number;
  investment_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface DividendPayout {
  id: string;
  org_id: string;
  shareholder_id: string;
  payout_date: string;
  dividend_rate: number;
  shares_at_payout: number;
  amount: number;
  payment_method?: string | null;
  payment_reference?: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  notes?: string | null;
  created_at: string;
}

export interface ShareholderTransaction {
  id: string;
  org_id: string;
  shareholder_id: string;
  transaction_type: 'INVESTMENT' | 'WITHDRAWAL' | 'DIVIDEND_REINVEST' | 'SHARE_TRANSFER_IN' | 'SHARE_TRANSFER_OUT';
  share_units: number;
  unit_value: number;
  total_amount: number;
  transaction_date: string;
  notes?: string | null;
  processed_by?: string | null;
  created_at: string;
}

export interface ShareholderPortfolioSummary {
  totalInvestment: number;
  currentValue: number;
  portfolioLoaned: number;
  portfolioDeposit: number;
  unrealizedGain: number;
  totalDividends: number;
  roi: number;
  shareholderCount: number;
}
