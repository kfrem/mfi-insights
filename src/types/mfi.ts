// Types matching the existing MFI database schemas

// mfi schema - operational tables
export interface Organisation {
  org_id: string;
  name: string;
  code?: string;
  created_at?: string;
}

// Risk categories per BoG AML/CFT&P guidelines
export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH';

// Gender per Ghana Card
export type Gender = 'M' | 'F';

// Proof of residence types per BoG requirements
export type ProofOfResidenceType = 'UTILITY_BILL' | 'GPS_ADDRESS' | 'LEASE_AGREEMENT' | 'BANK_STATEMENT';

// Client types for different account structures
export type ClientType = 'INDIVIDUAL' | 'GROUP' | 'COOPERATIVE' | 'SME';

// Group member roles
export type GroupMemberRole = 'LEADER' | 'SECRETARY' | 'MEMBER';

export interface Client {
  client_id: string;
  org_id: string;
  client_type: ClientType;
  // Basic identification (from Ghana Card - MANDATORY per BoG)
  first_name: string;
  last_name: string;
  ghana_card_number: string; // 13-digit, mandatory per BoG AML/CFT&P 2022
  ghana_card_expiry: string; // Required per BoG
  date_of_birth: string; // From Ghana Card
  gender: Gender;
  nationality: string;
  // Contact information
  phone?: string;
  email?: string;
  // Address & residence
  address?: string;
  proof_of_residence_type?: ProofOfResidenceType;
  // KYC/AML fields
  occupation: string; // Required for risk classification
  risk_category: RiskCategory; // LOW/MEDIUM/HIGH per BoG
  source_of_funds: string; // Required for AML
  // Financial information for affordability assessment
  monthly_income?: number;
  monthly_expenses?: number;
  // Group/Cooperative/SME specific fields
  group_name?: string;
  registration_number?: string;
  registration_date?: string;
  // System fields
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED' | 'MERGED';
  created_at?: string;
  updated_at?: string;
}

export interface GroupMember {
  member_id: string;
  org_id: string;
  client_id: string;
  role: GroupMemberRole;
  // Full KYC for each member
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  ghana_card_expiry: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  phone?: string;
  email?: string;
  address?: string;
  proof_of_residence_type?: ProofOfResidenceType;
  occupation: string;
  risk_category: RiskCategory;
  source_of_funds: string;
  monthly_income?: number;
  monthly_expenses?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  client_type: ClientType;
  // Mandatory fields per BoG
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  ghana_card_expiry: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  occupation: string;
  risk_category: RiskCategory;
  source_of_funds: string;
  // Optional fields
  phone?: string;
  email?: string;
  address?: string;
  proof_of_residence_type?: ProofOfResidenceType;
  // Group/Cooperative/SME fields
  group_name?: string;
  registration_number?: string;
  registration_date?: string;
}

export interface GroupMemberInput {
  role: GroupMemberRole;
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  ghana_card_expiry: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  phone?: string;
  email?: string;
  address?: string;
  proof_of_residence_type?: ProofOfResidenceType;
  occupation: string;
  risk_category: RiskCategory;
  source_of_funds: string;
  monthly_income?: number;
  monthly_expenses?: number;
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
