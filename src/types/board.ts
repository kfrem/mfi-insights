// Types for Board of Directors Dashboard

export type BoardPeriod = 'weekly' | 'monthly' | 'quarterly';

// Executive Summary for Board
export interface BoardExecutiveSummary {
  org_id: string;
  period: BoardPeriod;
  period_start: string;
  period_end: string;
  // Financial Highlights
  total_revenue: number;
  revenue_growth: number;
  operating_expenses: number;
  net_income: number;
  net_income_growth: number;
  roe: number; // Return on Equity
  roa: number; // Return on Assets
  // Portfolio Highlights
  gross_portfolio: number;
  portfolio_growth: number;
  active_clients: number;
  client_growth: number;
  active_loans: number;
  avg_loan_size: number;
  // Asset Quality
  npl_ratio: number;
  npl_change: number;
  par_30_rate: number;
  provision_coverage: number;
  write_offs: number;
  // Regulatory Compliance
  car_ratio: number;
  car_status: 'Compliant' | 'Watch' | 'Non-Compliant';
  liquidity_ratio: number;
  liquidity_status: 'Compliant' | 'Watch' | 'Non-Compliant';
}

// Strategic KPIs for Board
export interface StrategicKPI {
  kpi_name: string;
  category: 'Growth' | 'Profitability' | 'Efficiency' | 'Risk' | 'Compliance';
  current_value: number;
  previous_value: number;
  target_value: number;
  variance_percent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'On Track' | 'At Risk' | 'Off Track';
  unit: 'currency' | 'percent' | 'number' | 'ratio';
}

// Risk Analysis for Board
export interface RiskMetrics {
  org_id: string;
  report_date: string;
  // Credit Risk
  concentration_top_10: number;
  concentration_top_20: number;
  sector_concentration: { sector: string; exposure: number; percentage: number }[];
  geographic_concentration: { region: string; exposure: number; percentage: number }[];
  // Liquidity Risk
  funding_gap: number;
  deposit_concentration: number;
  loan_to_deposit_ratio: number;
  // Operational Risk
  fraud_incidents: number;
  fraud_amount: number;
  system_downtime_hours: number;
  customer_complaints: number;
  complaint_resolution_rate: number;
  // Market Risk
  interest_rate_sensitivity: number;
  forex_exposure: number;
}

// Quarterly Trends for Board
export interface QuarterlyTrend {
  quarter: string;
  year: number;
  gross_portfolio: number;
  net_income: number;
  active_clients: number;
  npl_ratio: number;
  car_ratio: number;
  roe: number;
  efficiency_ratio: number;
}

// Peer Comparison for Board
export interface PeerComparison {
  metric_name: string;
  org_value: number;
  peer_average: number;
  peer_median: number;
  industry_best: number;
  percentile_rank: number;
  unit: 'currency' | 'percent' | 'number' | 'ratio';
}

// Board Meeting Agenda Items
export interface BoardAgendaItem {
  item_number: number;
  category: 'Information' | 'Discussion' | 'Decision Required';
  title: string;
  summary: string;
  recommendation?: string;
  risk_level?: 'Low' | 'Medium' | 'High';
  documents?: string[];
}

// Key Decisions Tracker
export interface BoardDecision {
  decision_id: string;
  meeting_date: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  responsible_person: string;
  due_date: string;
  progress_notes?: string;
}
