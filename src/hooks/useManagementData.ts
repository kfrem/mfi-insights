import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import type {
  DailyOperationsMetrics,
  CollectionsPerformance,
  DisbursementPerformance,
  StaffProductivity,
  BranchPerformance,
  ArrearsTracker,
  DailyActivityLog,
  TargetVsActual,
} from '@/types/management';
import { formatDate, subDays, startOfWeek, startOfMonth } from '@/lib/dateUtils';

// Mock data generators
const generateMockDailyMetrics = (orgId: string): DailyOperationsMetrics => ({
  org_id: orgId,
  date: formatDate(new Date(), 'yyyy-MM-dd'),
  collections_target: 85000,
  collections_actual: 72500,
  collections_rate: 85.3,
  payments_received: 47,
  clients_visited: 62,
  disbursement_target: 150000,
  disbursement_actual: 135000,
  disbursement_rate: 90.0,
  loans_disbursed: 12,
  applications_approved: 18,
  total_arrears: 185000,
  arrears_recovered: 28500,
  recovery_rate: 15.4,
});

const generateMockCollectionsPerformance = (): CollectionsPerformance[] => {
  const data: CollectionsPerformance[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const target = 80000 + Math.random() * 20000;
    const actual = target * (0.75 + Math.random() * 0.35);
    data.push({
      period: formatDate(date, 'yyyy-MM-dd'),
      target: Math.round(target),
      actual: Math.round(actual),
      rate: Math.round((actual / target) * 100 * 10) / 10,
      variance: Math.round(actual - target),
    });
  }
  return data;
};

const generateMockDisbursementPerformance = (): DisbursementPerformance[] => {
  const data: DisbursementPerformance[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const target = 120000 + Math.random() * 40000;
    const actual = target * (0.7 + Math.random() * 0.4);
    const loanCount = Math.floor(5 + Math.random() * 10);
    data.push({
      period: formatDate(date, 'yyyy-MM-dd'),
      target: Math.round(target),
      actual: Math.round(actual),
      rate: Math.round((actual / target) * 100 * 10) / 10,
      loan_count: loanCount,
      avg_loan_size: Math.round(actual / loanCount),
    });
  }
  return data;
};

const generateMockStaffProductivity = (): StaffProductivity[] => [
  {
    staff_id: 'S001',
    staff_name: 'Kofi Mensah',
    role: 'Loan Officer',
    branch: 'Accra Central',
    clients_managed: 85,
    active_loans: 72,
    portfolio_value: 425000,
    par_30_rate: 4.2,
    collections_target: 45000,
    collections_actual: 42000,
    collection_rate: 93.3,
    visits_today: 8,
    disbursements_mtd: 185000,
    applications_processed: 15,
  },
  {
    staff_id: 'S002',
    staff_name: 'Ama Serwaa',
    role: 'Loan Officer',
    branch: 'Accra Central',
    clients_managed: 92,
    active_loans: 78,
    portfolio_value: 520000,
    par_30_rate: 6.8,
    collections_target: 52000,
    collections_actual: 44500,
    collection_rate: 85.6,
    visits_today: 6,
    disbursements_mtd: 210000,
    applications_processed: 18,
  },
  {
    staff_id: 'S003',
    staff_name: 'Kwame Asante',
    role: 'Collections Officer',
    branch: 'Tema',
    clients_managed: 45,
    active_loans: 45,
    portfolio_value: 0,
    par_30_rate: 0,
    collections_target: 38000,
    collections_actual: 35200,
    collection_rate: 92.6,
    visits_today: 12,
    disbursements_mtd: 0,
    applications_processed: 0,
  },
  {
    staff_id: 'S004',
    staff_name: 'Abena Osei',
    role: 'Loan Officer',
    branch: 'Kumasi',
    clients_managed: 78,
    active_loans: 65,
    portfolio_value: 380000,
    par_30_rate: 3.1,
    collections_target: 40000,
    collections_actual: 38500,
    collection_rate: 96.3,
    visits_today: 7,
    disbursements_mtd: 165000,
    applications_processed: 12,
  },
  {
    staff_id: 'S005',
    staff_name: 'Yaw Boateng',
    role: 'Collections Officer',
    branch: 'Accra Central',
    clients_managed: 52,
    active_loans: 52,
    portfolio_value: 0,
    par_30_rate: 0,
    collections_target: 42000,
    collections_actual: 28000,
    collection_rate: 66.7,
    visits_today: 5,
    disbursements_mtd: 0,
    applications_processed: 0,
  },
];

const generateMockBranchPerformance = (): BranchPerformance[] => [
  {
    branch_id: 'B001',
    branch_name: 'Accra Central',
    staff_count: 8,
    active_clients: 245,
    active_loans: 198,
    portfolio_value: 1450000,
    par_30_rate: 5.8,
    collections_rate: 88.2,
    disbursement_mtd: 580000,
  },
  {
    branch_id: 'B002',
    branch_name: 'Tema',
    staff_count: 5,
    active_clients: 156,
    active_loans: 128,
    portfolio_value: 920000,
    par_30_rate: 7.2,
    collections_rate: 82.5,
    disbursement_mtd: 385000,
  },
  {
    branch_id: 'B003',
    branch_name: 'Kumasi',
    staff_count: 6,
    active_clients: 189,
    active_loans: 152,
    portfolio_value: 1080000,
    par_30_rate: 4.1,
    collections_rate: 91.8,
    disbursement_mtd: 425000,
  },
];

const generateMockArrearsTracker = (): ArrearsTracker[] => [
  {
    loan_id: 'L045',
    client_name: 'Kwesi Ampofo',
    phone: '024-555-1234',
    officer_name: 'Kofi Mensah',
    principal_outstanding: 12500,
    arrears_amount: 3200,
    days_overdue: 45,
    last_payment_date: '2025-12-15',
    last_contact_date: '2026-01-08',
    next_action: 'Home visit scheduled',
    priority: 'High',
  },
  {
    loan_id: 'L089',
    client_name: 'Akosua Mensah',
    phone: '020-555-5678',
    officer_name: 'Ama Serwaa',
    principal_outstanding: 8000,
    arrears_amount: 1800,
    days_overdue: 32,
    last_payment_date: '2025-12-20',
    last_contact_date: '2026-01-07',
    next_action: 'Call reminder',
    priority: 'Medium',
  },
  {
    loan_id: 'L112',
    client_name: 'Yaw Darko',
    phone: '027-555-9012',
    officer_name: 'Abena Osei',
    principal_outstanding: 18000,
    arrears_amount: 8500,
    days_overdue: 95,
    last_payment_date: '2025-10-05',
    last_contact_date: '2026-01-05',
    next_action: 'Escalate to management',
    priority: 'High',
  },
  {
    loan_id: 'L156',
    client_name: 'Efua Asante',
    phone: '055-555-3456',
    officer_name: 'Kwame Asante',
    principal_outstanding: 5500,
    arrears_amount: 850,
    days_overdue: 18,
    last_payment_date: '2025-12-28',
    next_action: 'SMS reminder sent',
    priority: 'Low',
  },
];

const generateMockActivityLog = (): DailyActivityLog[] => [
  { activity_id: 'A001', timestamp: '2026-01-10T14:32:00', staff_name: 'Kofi Mensah', activity_type: 'Disbursement', description: 'Loan disbursed to Ama Serwaa', amount: 15000, client_name: 'Ama Serwaa', loan_id: 'L201' },
  { activity_id: 'A002', timestamp: '2026-01-10T13:45:00', staff_name: 'Ama Serwaa', activity_type: 'Repayment', description: 'Weekly repayment received', amount: 850, client_name: 'Kofi Mensah', loan_id: 'L089' },
  { activity_id: 'A003', timestamp: '2026-01-10T12:20:00', staff_name: 'Kwame Asante', activity_type: 'Client Visit', description: 'Home visit for arrears follow-up', client_name: 'Yaw Darko', loan_id: 'L112' },
  { activity_id: 'A004', timestamp: '2026-01-10T11:15:00', staff_name: 'Abena Osei', activity_type: 'Application', description: 'New loan application submitted', amount: 8000, client_name: 'Efua Mensah' },
  { activity_id: 'A005', timestamp: '2026-01-10T10:30:00', staff_name: 'Branch Manager', activity_type: 'Approval', description: 'Loan approved', amount: 12000, client_name: 'Kwesi Boateng', loan_id: 'L199' },
  { activity_id: 'A006', timestamp: '2026-01-10T09:45:00', staff_name: 'Kofi Mensah', activity_type: 'Repayment', description: 'Monthly repayment received', amount: 2500, client_name: 'Akua Darko', loan_id: 'L056' },
  { activity_id: 'A007', timestamp: '2026-01-10T09:00:00', staff_name: 'System', activity_type: 'Disbursement', description: 'Batch disbursement processed', amount: 45000 },
];

const generateMockTargetVsActual = (): TargetVsActual[] => [
  { metric: 'Collections', daily_target: 85000, daily_actual: 72500, weekly_target: 425000, weekly_actual: 385000, monthly_target: 1700000, monthly_actual: 1450000, trend: 'up' },
  { metric: 'Disbursements', daily_target: 150000, daily_actual: 135000, weekly_target: 750000, weekly_actual: 720000, monthly_target: 3000000, monthly_actual: 2850000, trend: 'stable' },
  { metric: 'New Clients', daily_target: 5, daily_actual: 4, weekly_target: 25, weekly_actual: 22, monthly_target: 100, monthly_actual: 88, trend: 'down' },
  { metric: 'Loan Applications', daily_target: 15, daily_actual: 18, weekly_target: 75, weekly_actual: 82, monthly_target: 300, monthly_actual: 315, trend: 'up' },
  { metric: 'Client Visits', daily_target: 60, daily_actual: 62, weekly_target: 300, weekly_actual: 295, monthly_target: 1200, monthly_actual: 1180, trend: 'stable' },
];

// Hooks
export function useDailyMetrics() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['daily-metrics', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      return generateMockDailyMetrics(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });
}

export function useCollectionsPerformance() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['collections-performance', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockCollectionsPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

export function useDisbursementPerformance() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['disbursement-performance', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockDisbursementPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

export function useStaffProductivity() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['staff-productivity', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockStaffProductivity();
    },
    enabled: !!selectedOrgId,
  });
}

export function useBranchPerformance() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['branch-performance', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockBranchPerformance();
    },
    enabled: !!selectedOrgId,
  });
}

export function useArrearsTracker() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['arrears-tracker', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockArrearsTracker();
    },
    enabled: !!selectedOrgId,
  });
}

export function useDailyActivityLog() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['daily-activity-log', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockActivityLog();
    },
    enabled: !!selectedOrgId,
  });
}

export function useTargetVsActual() {
  const { selectedOrgId } = useOrganisation();
  
  return useQuery({
    queryKey: ['target-vs-actual', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      return generateMockTargetVsActual();
    },
    enabled: !!selectedOrgId,
  });
}
