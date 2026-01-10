export type LoanStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'DISBURSED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'DEFAULTED' 
  | 'WRITTEN_OFF' 
  | 'REJECTED';

export interface LoanStatusAudit {
  id: string;
  loan_id: string;
  org_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  approval_amount: number | null;
  rejection_reason: string | null;
}

export interface LoanWithClient {
  loan_id: string;
  org_id: string;
  client_id: string;
  loan_type: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  status: LoanStatus;
  application_date: string;
  approval_date: string | null;
  disbursement_date: string | null;
  disbursed_amount: number | null;
  total_interest: number | null;
  total_repayable: number | null;
  notes: string | null;
  purpose: string | null;
  created_at: string;
  clients?: {
    first_name: string;
    last_name: string;
    ghana_card_number: string;
    phone: string | null;
  };
}

// Valid status transitions
export const STATUS_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['DISBURSED', 'REJECTED'],
  DISBURSED: ['ACTIVE'],
  ACTIVE: ['COMPLETED', 'DEFAULTED'],
  COMPLETED: [],
  DEFAULTED: ['WRITTEN_OFF', 'ACTIVE'],
  WRITTEN_OFF: [],
  REJECTED: [],
};

export const STATUS_CONFIG: Record<LoanStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
  icon: string;
}> = {
  PENDING: { 
    label: 'Pending', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100',
    description: 'Awaiting review and approval',
    icon: 'Clock'
  },
  APPROVED: { 
    label: 'Approved', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    description: 'Approved, ready for disbursement',
    icon: 'CheckCircle'
  },
  DISBURSED: { 
    label: 'Disbursed', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    description: 'Funds released to client',
    icon: 'Banknote'
  },
  ACTIVE: { 
    label: 'Active', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    description: 'Loan is active and in repayment',
    icon: 'TrendingUp'
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100',
    description: 'Fully repaid',
    icon: 'CheckCheck'
  },
  DEFAULTED: { 
    label: 'Defaulted', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    description: 'Loan is in default',
    icon: 'AlertTriangle'
  },
  WRITTEN_OFF: { 
    label: 'Written Off', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    description: 'Loan written off as loss',
    icon: 'XCircle'
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'text-rose-700', 
    bgColor: 'bg-rose-100',
    description: 'Application rejected',
    icon: 'Ban'
  },
};
