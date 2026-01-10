// BoG MFI Tier types
export type BogMfiTier = 'TIER_1_RCB' | 'TIER_2_SL' | 'TIER_3_FH' | 'TIER_4_MFC';

export interface BogTierConfig {
  tier: BogMfiTier;
  tier_name: string;
  tier_description: string;
  min_capital_ghs: number;
  max_loan_per_borrower_ghs: number | null;
  single_obligor_limit_percent: number;
  car_requirement: number;
  liquidity_requirement: number;
  prudential_frequency: string;
  requires_bog_license: boolean;
}

export interface OrganisationSettings {
  id: string;
  org_id: string;
  bog_tier: BogMfiTier;
  license_number: string | null;
  license_expiry: string | null;
  max_single_obligor_limit: number | null;
  max_loan_amount: number | null;
  min_capital_requirement: number | null;
  prudential_return_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  car_threshold: number;
  liquidity_threshold: number;
  created_at: string;
  updated_at: string;
}

export const BOG_TIER_LABELS: Record<BogMfiTier, { name: string; shortName: string; color: string }> = {
  TIER_1_RCB: { name: 'Rural & Community Bank', shortName: 'RCB', color: 'bg-emerald-500' },
  TIER_2_SL: { name: 'Savings & Loans', shortName: 'S&L', color: 'bg-blue-500' },
  TIER_3_FH: { name: 'Finance House', shortName: 'FH', color: 'bg-purple-500' },
  TIER_4_MFC: { name: 'Microfinance Company', shortName: 'MFC', color: 'bg-orange-500' },
};