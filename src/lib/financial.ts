/**
 * Pure financial calculation functions for MFI regulatory and loan calculations.
 * These are extracted from hooks/components so they can be unit tested.
 *
 * Functions accept an optional RegulatoryConfig for multi-country support.
 * When no config is provided, Ghana/BoG defaults are used for backward compatibility.
 */

import type {
  TierOneCapital,
  TierTwoCapital,
  RiskWeightedAssets,
  LiquidAssets,
  CurrentLiabilities,
} from '@/types/regulatory';
import type { ClassificationBucket, AffordabilityThresholds, CurrencyConfig } from '@/lib/regulatory/types';

// ─── Capital Adequacy Ratio (CAR) ────────────────────────────────────────────

export interface CARResult {
  adjusted_tier_one: number;
  total_tier_two: number;
  capped_tier_two: number;
  adjusted_capital_base: number;
  total_rwa: number;
  car_ratio: number;
  is_compliant: boolean;
}

export function calculateCAR(
  tier_one: TierOneCapital,
  tier_two: TierTwoCapital,
  rwa: RiskWeightedAssets,
  minimum_requirement = 10,
): CARResult {
  const gross_tier_one =
    tier_one.paid_up_capital +
    tier_one.statutory_reserves +
    tier_one.general_reserves +
    tier_one.special_reserves +
    tier_one.disclosed_reserves;

  const deductions =
    tier_one.goodwill_intangibles +
    tier_one.losses_not_provided +
    tier_one.investments_subsidiaries +
    tier_one.investments_other_banks +
    tier_one.connected_lending;

  const adjusted_tier_one = gross_tier_one - deductions;

  const total_tier_two =
    tier_two.undisclosed_reserves +
    tier_two.revaluation_reserves +
    tier_two.subordinated_debt +
    tier_two.hybrid_capital +
    tier_two.deposits_for_shares;

  // Tier II cannot exceed Tier I
  const capped_tier_two = Math.min(total_tier_two, adjusted_tier_one);

  const adjusted_capital_base = adjusted_tier_one + capped_tier_two;

  // RWA calculation with BoG risk weights
  const zero_weight = rwa.cash_on_hand + rwa.gog_securities + rwa.bog_securities;
  const twenty_pct_assets = rwa.cheques_other_banks + rwa.claims_on_banks;
  const fifty_pct_assets = rwa.residential_mortgages + rwa.export_financing + rwa.public_institution_loans;
  const contingent = rwa.contingent_liabilities_class1 * 0.5 + rwa.contingent_liabilities_class2 * 0.8;
  const market_risk = rwa.net_open_position * 0.5;

  const total_rwa =
    rwa.total_assets -
    zero_weight -
    twenty_pct_assets * 0.8 -
    fifty_pct_assets * 0.5 +
    contingent +
    market_risk +
    rwa.operational_risk_charge;

  const car_ratio = total_rwa === 0 ? 0 : (adjusted_capital_base / total_rwa) * 100;

  return {
    adjusted_tier_one,
    total_tier_two,
    capped_tier_two,
    adjusted_capital_base,
    total_rwa,
    car_ratio,
    is_compliant: car_ratio >= minimum_requirement,
  };
}

// ─── Liquidity Ratio ─────────────────────────────────────────────────────────

export interface LiquidityResult {
  total_liquid_assets: number;
  total_current_liabilities: number;
  liquidity_ratio: number;
  is_compliant: boolean;
}

export function calculateLiquidityRatio(
  liquid_assets: LiquidAssets,
  current_liabilities: CurrentLiabilities,
  minimum_requirement = 10,
): LiquidityResult {
  const total_liquid_assets = Object.values(liquid_assets).reduce((a, b) => a + b, 0);
  const total_current_liabilities = Object.values(current_liabilities).reduce((a, b) => a + b, 0);
  const liquidity_ratio =
    total_current_liabilities === 0 ? 0 : (total_liquid_assets / total_current_liabilities) * 100;

  return {
    total_liquid_assets,
    total_current_liabilities,
    liquidity_ratio,
    is_compliant: liquidity_ratio >= minimum_requirement,
  };
}

// ─── Loan Classification & Provisioning ──────────────────────────────────────
// Ghana/BoG defaults kept for backward compatibility.
// Use classifyLoan() and calculateProvisionFromConfig() for multi-country support.

export type BogBucket = 'Current' | 'OLEM' | 'Substandard' | 'Doubtful' | 'Loss';

export const BOG_PROVISION_RATES: Record<BogBucket, number> = {
  Current: 0.01,
  OLEM: 0.05,
  Substandard: 0.25,
  Doubtful: 0.50,
  Loss: 1.00,
};

/** @deprecated Use classifyLoan() with a RegulatoryConfig for multi-country support */
export function classifyLoanByDaysOverdue(daysOverdue: number): BogBucket {
  if (daysOverdue <= 0) return 'Current';
  if (daysOverdue <= 30) return 'OLEM';
  if (daysOverdue <= 90) return 'Substandard';
  if (daysOverdue <= 180) return 'Doubtful';
  return 'Loss';
}

/** @deprecated Use calculateProvisionFromConfig() for multi-country support */
export function calculateProvision(outstandingBalance: number, bucket: BogBucket): number {
  return outstandingBalance * BOG_PROVISION_RATES[bucket];
}

// ─── Config-driven classification & provisioning ────────────────────────────

export function classifyLoan(
  daysOverdue: number,
  buckets: ClassificationBucket[],
): ClassificationBucket {
  // Buckets must be sorted by daysOverdueMin ascending
  const sorted = [...buckets].sort((a, b) => a.daysOverdueMin - b.daysOverdueMin);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (daysOverdue >= sorted[i].daysOverdueMin) {
      return sorted[i];
    }
  }
  return sorted[0];
}

export function calculateProvisionFromConfig(
  outstandingBalance: number,
  daysOverdue: number,
  buckets: ClassificationBucket[],
): { bucket: ClassificationBucket; provisionAmount: number } {
  const bucket = classifyLoan(daysOverdue, buckets);
  return { bucket, provisionAmount: outstandingBalance * bucket.provisionRate };
}

// ─── Interest Calculations ───────────────────────────────────────────────────

export type InterestMethod = 'FLAT' | 'REDUCING_BALANCE';
export type RepaymentFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

export function getPeriodsPerYear(frequency: RepaymentFrequency): number {
  switch (frequency) {
    case 'DAILY': return 365;
    case 'WEEKLY': return 52;
    case 'FORTNIGHTLY': return 26;
    case 'MONTHLY': return 12;
    case 'QUARTERLY': return 4;
    case 'ANNUALLY': return 1;
  }
}

export function calculateFlatInterest(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  return (principal * annualRate * termMonths) / (12 * 100);
}

export function calculateReducingBalancePayment(
  principal: number,
  annualRate: number,
  numberOfPayments: number,
  periodsPerYear: number,
): number {
  const periodicRate = annualRate / 100 / periodsPerYear;
  if (periodicRate === 0) return principal / numberOfPayments;
  const factor = Math.pow(1 + periodicRate, numberOfPayments);
  return (principal * periodicRate * factor) / (factor - 1);
}

// ─── Loan Affordability ──────────────────────────────────────────────────────

export type AffordabilityResult = 'APPROVED' | 'CAUTION' | 'REJECTED';

export function assessAffordability(
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyRepayment: number,
  thresholds?: AffordabilityThresholds,
): { dti: number; safetyCushion: number; result: AffordabilityResult } {
  const t = thresholds ?? {
    approvedMaxDTI: 30,
    approvedMinSafetyCushion: 20,
    cautionMaxDTI: 40,
    cautionMinSafetyCushion: 10,
  };

  const disposableIncome = monthlyIncome - monthlyExpenses;
  const dti = monthlyIncome === 0 ? 100 : (monthlyRepayment / monthlyIncome) * 100;
  const netDisposable = disposableIncome - monthlyRepayment;
  const safetyCushion = monthlyIncome === 0 ? 0 : (netDisposable / monthlyIncome) * 100;

  let result: AffordabilityResult;
  if (dti <= t.approvedMaxDTI && safetyCushion >= t.approvedMinSafetyCushion) {
    result = 'APPROVED';
  } else if (dti <= t.cautionMaxDTI && safetyCushion >= t.cautionMinSafetyCushion) {
    result = 'CAUTION';
  } else {
    result = 'REJECTED';
  }

  return { dti, safetyCushion, result };
}

// ─── PAR (Portfolio at Risk) ─────────────────────────────────────────────────

export function calculatePARRate(
  arrearsBalance: number,
  grossPortfolio: number,
): number {
  if (grossPortfolio === 0) return 0;
  return (arrearsBalance / grossPortfolio) * 100;
}

// ─── Currency Formatting ─────────────────────────────────────────────────────

/** @deprecated Use formatCurrency() with a CurrencyConfig for multi-country support */
export function formatGHS(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currencyConfig: CurrencyConfig): string {
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currencyConfig.code,
    minimumFractionDigits: currencyConfig.decimalDigits,
    maximumFractionDigits: currencyConfig.decimalDigits,
  }).format(amount);
}
