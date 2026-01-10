// Types for Management Dashboard - Daily Operations

export interface DailyOperationsMetrics {
  org_id: string;
  date: string;
  // Collections
  collections_target: number;
  collections_actual: number;
  collections_rate: number;
  payments_received: number;
  clients_visited: number;
  // Disbursements
  disbursement_target: number;
  disbursement_actual: number;
  disbursement_rate: number;
  loans_disbursed: number;
  applications_approved: number;
  // Arrears
  total_arrears: number;
  arrears_recovered: number;
  recovery_rate: number;
}

export interface CollectionsPerformance {
  period: string;
  target: number;
  actual: number;
  rate: number;
  variance: number;
}

export interface DisbursementPerformance {
  period: string;
  target: number;
  actual: number;
  rate: number;
  loan_count: number;
  avg_loan_size: number;
}

export interface StaffProductivity {
  staff_id: string;
  staff_name: string;
  role: 'Loan Officer' | 'Collections Officer' | 'Branch Manager' | 'Teller';
  branch: string;
  // Loan Officers
  clients_managed: number;
  active_loans: number;
  portfolio_value: number;
  par_30_rate: number;
  // Collections
  collections_target: number;
  collections_actual: number;
  collection_rate: number;
  visits_today: number;
  // Disbursements
  disbursements_mtd: number;
  applications_processed: number;
}

export interface BranchPerformance {
  branch_id: string;
  branch_name: string;
  staff_count: number;
  active_clients: number;
  active_loans: number;
  portfolio_value: number;
  par_30_rate: number;
  collections_rate: number;
  disbursement_mtd: number;
}

export interface ArrearsTracker {
  loan_id: string;
  client_name: string;
  phone: string;
  officer_name: string;
  principal_outstanding: number;
  arrears_amount: number;
  days_overdue: number;
  last_payment_date: string;
  last_contact_date?: string;
  next_action: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DailyActivityLog {
  activity_id: string;
  timestamp: string;
  staff_name: string;
  activity_type: 'Disbursement' | 'Repayment' | 'Client Visit' | 'Application' | 'Approval' | 'Write-off';
  description: string;
  amount?: number;
  client_name?: string;
  loan_id?: string;
}

export interface TargetVsActual {
  metric: string;
  daily_target: number;
  daily_actual: number;
  weekly_target: number;
  weekly_actual: number;
  monthly_target: number;
  monthly_actual: number;
  trend: 'up' | 'down' | 'stable';
}
