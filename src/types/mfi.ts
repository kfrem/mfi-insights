// Types matching the existing MFI database schemas

// mfi schema - operational tables
export interface Organisation {
  org_id: string;
  name: string;
  code?: string;
  created_at?: string;
}

export interface Client {
  client_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface Loan {
  loan_id: string;
  org_id: string;
  client_id: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  disbursement_date: string;
  status: 'pending' | 'active' | 'closed' | 'written_off';
  created_at?: string;
}

export interface Repayment {
  repayment_id: string;
  org_id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  reference: string;
  created_at?: string;
}

// mfi_reporting schema - views
export interface ExecKPI {
  org_id: string;
  gross_portfolio: number;
  active_loans: number;
  par_30_plus: number;
  par_30_rate: number;
  provisions_required: number;
  total_disbursed: number;
  total_repaid: number;
}

export interface BogClassification {
  org_id: string;
  bog_bucket: string;
  loan_count: number;
  outstanding_balance: number;
  provision_rate: number;
  provision_amount: number;
}

export interface PortfolioAging {
  org_id: string;
  loan_id: string;
  client_name: string;
  principal: number;
  outstanding_balance: number;
  days_overdue: number;
  bog_bucket: string;
}

export interface RepaymentDaily {
  org_id: string;
  payment_date: string;
  total_amount: number;
  payment_count: number;
}

// Form input types
export interface CreateClientInput {
  org_id: string;
  first_name: string;
  last_name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateLoanInput {
  org_id: string;
  client_id: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  disbursement_date: string;
}

export interface PostRepaymentInput {
  org_id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  reference: string;
}
