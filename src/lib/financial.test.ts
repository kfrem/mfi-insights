import { describe, it, expect } from 'vitest';
import {
  calculateCAR,
  calculateLiquidityRatio,
  classifyLoanByDaysOverdue,
  calculateProvision,
  BOG_PROVISION_RATES,
  calculateFlatInterest,
  calculateReducingBalancePayment,
  getPeriodsPerYear,
  assessAffordability,
  calculatePARRate,
  formatGHS,
  classifyLoan,
  calculateProvisionFromConfig,
  formatCurrency,
} from './financial';
import { ghanaConfig } from './regulatory/ghana';
import { bceaoConfig } from './regulatory/bceao';
import { kenyaConfig } from './regulatory/kenya';
import type {
  TierOneCapital,
  TierTwoCapital,
  RiskWeightedAssets,
  LiquidAssets,
  CurrentLiabilities,
} from '@/types/regulatory';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const baseTierOne: TierOneCapital = {
  paid_up_capital: 5_000_000,
  statutory_reserves: 1_200_000,
  general_reserves: 800_000,
  special_reserves: 200_000,
  disclosed_reserves: 2_200_000,
  goodwill_intangibles: 150_000,
  losses_not_provided: 0,
  investments_subsidiaries: 0,
  investments_other_banks: 100_000,
  connected_lending: 50_000,
};

const baseTierTwo: TierTwoCapital = {
  undisclosed_reserves: 500_000,
  revaluation_reserves: 300_000,
  subordinated_debt: 200_000,
  hybrid_capital: 0,
  deposits_for_shares: 100_000,
};

const baseRWA: RiskWeightedAssets = {
  total_assets: 25_000_000,
  cash_on_hand: 1_500_000,
  gog_securities: 3_000_000,
  bog_securities: 500_000,
  cheques_other_banks: 200_000,
  claims_on_banks: 800_000,
  residential_mortgages: 2_000_000,
  export_financing: 500_000,
  public_institution_loans: 1_000_000,
  contingent_liabilities_class1: 300_000,
  contingent_liabilities_class2: 200_000,
  net_open_position: 150_000,
  operational_risk_charge: 450_000,
};

const baseLiquidAssets: LiquidAssets = {
  cash_on_hand: 1_500_000,
  balances_bog: 800_000,
  balances_other_banks: 1_200_000,
  balances_other_fi: 300_000,
  gog_securities: 2_500_000,
  interbank_placements_30d: 500_000,
  placements_other_fi_30d: 200_000,
  inter_affiliate_placements: 100_000,
  other_liquid_assets: 150_000,
};

const baseCurrentLiabilities: CurrentLiabilities = {
  deposits_from_public: 4_000_000,
  interbank_borrowings: 500_000,
  inter_affiliate_borrowings: 200_000,
  other_short_term_borrowings: 300_000,
  net_contingent_liabilities: 150_000,
  other_current_liabilities: 250_000,
};

// ─── CAR Tests ───────────────────────────────────────────────────────────────

describe('calculateCAR', () => {
  it('calculates adjusted Tier I capital correctly', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    // Gross Tier I = 5M + 1.2M + 0.8M + 0.2M + 2.2M = 9.4M
    // Deductions = 150K + 0 + 0 + 100K + 50K = 300K
    // Adjusted Tier I = 9.1M
    expect(result.adjusted_tier_one).toBe(9_100_000);
  });

  it('calculates total Tier II capital correctly', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    // 500K + 300K + 200K + 0 + 100K = 1.1M
    expect(result.total_tier_two).toBe(1_100_000);
  });

  it('caps Tier II at Tier I level', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    // Tier II (1.1M) < Tier I (9.1M), so uncapped
    expect(result.capped_tier_two).toBe(1_100_000);
  });

  it('caps Tier II when it exceeds Tier I', () => {
    const largeTierTwo: TierTwoCapital = {
      undisclosed_reserves: 5_000_000,
      revaluation_reserves: 3_000_000,
      subordinated_debt: 2_000_000,
      hybrid_capital: 1_000_000,
      deposits_for_shares: 1_000_000,
    };
    const result = calculateCAR(baseTierOne, largeTierTwo, baseRWA);
    // Total Tier II = 12M, but Adjusted Tier I = 9.1M
    expect(result.total_tier_two).toBe(12_000_000);
    expect(result.capped_tier_two).toBe(9_100_000);
  });

  it('calculates adjusted capital base as Tier I + capped Tier II', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    expect(result.adjusted_capital_base).toBe(result.adjusted_tier_one + result.capped_tier_two);
  });

  it('calculates risk-weighted assets with correct weights', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    // Zero-weight: 1.5M + 3M + 0.5M = 5M (deducted fully)
    // 20% weight: (200K + 800K) × 0.8 = 800K deducted
    // 50% weight: (2M + 500K + 1M) × 0.5 = 1.75M deducted
    // Contingent: 300K × 0.5 + 200K × 0.8 = 150K + 160K = 310K added
    // Market risk: 150K × 0.5 = 75K added
    // Operational: 450K added
    // Total RWA = 25M - 5M - 800K - 1.75M + 310K + 75K + 450K = 18,285,000
    expect(result.total_rwa).toBe(18_285_000);
  });

  it('marks as compliant when CAR >= 10%', () => {
    const result = calculateCAR(baseTierOne, baseTierTwo, baseRWA);
    // 10,200,000 / 18,285,000 × 100 ≈ 55.78% — well above 10%
    expect(result.is_compliant).toBe(true);
    expect(result.car_ratio).toBeGreaterThan(10);
  });

  it('marks as non-compliant when CAR < 10%', () => {
    const tinyCapital: TierOneCapital = {
      ...baseTierOne,
      paid_up_capital: 100_000,
      statutory_reserves: 0,
      general_reserves: 0,
      special_reserves: 0,
      disclosed_reserves: 0,
    };
    const tinyTierTwo: TierTwoCapital = {
      undisclosed_reserves: 0,
      revaluation_reserves: 0,
      subordinated_debt: 0,
      hybrid_capital: 0,
      deposits_for_shares: 0,
    };
    const result = calculateCAR(tinyCapital, tinyTierTwo, baseRWA);
    expect(result.is_compliant).toBe(false);
    expect(result.car_ratio).toBeLessThan(10);
  });

  it('handles zero RWA without dividing by zero', () => {
    const zeroRWA: RiskWeightedAssets = {
      total_assets: 0,
      cash_on_hand: 0,
      gog_securities: 0,
      bog_securities: 0,
      cheques_other_banks: 0,
      claims_on_banks: 0,
      residential_mortgages: 0,
      export_financing: 0,
      public_institution_loans: 0,
      contingent_liabilities_class1: 0,
      contingent_liabilities_class2: 0,
      net_open_position: 0,
      operational_risk_charge: 0,
    };
    const result = calculateCAR(baseTierOne, baseTierTwo, zeroRWA);
    expect(result.car_ratio).toBe(0);
    expect(Number.isFinite(result.car_ratio)).toBe(true);
  });
});

// ─── Liquidity Ratio Tests ───────────────────────────────────────────────────

describe('calculateLiquidityRatio', () => {
  it('sums liquid assets correctly', () => {
    const result = calculateLiquidityRatio(baseLiquidAssets, baseCurrentLiabilities);
    // 1.5M + 0.8M + 1.2M + 0.3M + 2.5M + 0.5M + 0.2M + 0.1M + 0.15M = 7.25M
    expect(result.total_liquid_assets).toBe(7_250_000);
  });

  it('sums current liabilities correctly', () => {
    const result = calculateLiquidityRatio(baseLiquidAssets, baseCurrentLiabilities);
    // 4M + 0.5M + 0.2M + 0.3M + 0.15M + 0.25M = 5.4M
    expect(result.total_current_liabilities).toBe(5_400_000);
  });

  it('calculates liquidity ratio correctly', () => {
    const result = calculateLiquidityRatio(baseLiquidAssets, baseCurrentLiabilities);
    // 7.25M / 5.4M × 100 ≈ 134.26%
    expect(result.liquidity_ratio).toBeCloseTo(134.26, 1);
  });

  it('marks compliant when ratio >= 10%', () => {
    const result = calculateLiquidityRatio(baseLiquidAssets, baseCurrentLiabilities);
    expect(result.is_compliant).toBe(true);
  });

  it('marks non-compliant when ratio < 10%', () => {
    const tinyAssets: LiquidAssets = {
      cash_on_hand: 10_000,
      balances_bog: 0,
      balances_other_banks: 0,
      balances_other_fi: 0,
      gog_securities: 0,
      interbank_placements_30d: 0,
      placements_other_fi_30d: 0,
      inter_affiliate_placements: 0,
      other_liquid_assets: 0,
    };
    const result = calculateLiquidityRatio(tinyAssets, baseCurrentLiabilities);
    expect(result.is_compliant).toBe(false);
    expect(result.liquidity_ratio).toBeLessThan(10);
  });

  it('handles zero liabilities without dividing by zero', () => {
    const zeroLiabilities: CurrentLiabilities = {
      deposits_from_public: 0,
      interbank_borrowings: 0,
      inter_affiliate_borrowings: 0,
      other_short_term_borrowings: 0,
      net_contingent_liabilities: 0,
      other_current_liabilities: 0,
    };
    const result = calculateLiquidityRatio(baseLiquidAssets, zeroLiabilities);
    expect(result.liquidity_ratio).toBe(0);
    expect(Number.isFinite(result.liquidity_ratio)).toBe(true);
  });
});

// ─── BoG Classification Tests ────────────────────────────────────────────────

describe('classifyLoanByDaysOverdue', () => {
  it('classifies 0 days as Current', () => {
    expect(classifyLoanByDaysOverdue(0)).toBe('Current');
  });

  it('classifies negative days as Current', () => {
    expect(classifyLoanByDaysOverdue(-5)).toBe('Current');
  });

  it('classifies 1-30 days as OLEM', () => {
    expect(classifyLoanByDaysOverdue(1)).toBe('OLEM');
    expect(classifyLoanByDaysOverdue(15)).toBe('OLEM');
    expect(classifyLoanByDaysOverdue(30)).toBe('OLEM');
  });

  it('classifies 31-90 days as Substandard', () => {
    expect(classifyLoanByDaysOverdue(31)).toBe('Substandard');
    expect(classifyLoanByDaysOverdue(60)).toBe('Substandard');
    expect(classifyLoanByDaysOverdue(90)).toBe('Substandard');
  });

  it('classifies 91-180 days as Doubtful', () => {
    expect(classifyLoanByDaysOverdue(91)).toBe('Doubtful');
    expect(classifyLoanByDaysOverdue(120)).toBe('Doubtful');
    expect(classifyLoanByDaysOverdue(180)).toBe('Doubtful');
  });

  it('classifies 181+ days as Loss', () => {
    expect(classifyLoanByDaysOverdue(181)).toBe('Loss');
    expect(classifyLoanByDaysOverdue(365)).toBe('Loss');
    expect(classifyLoanByDaysOverdue(1000)).toBe('Loss');
  });
});

describe('calculateProvision', () => {
  it('applies 1% for Current loans', () => {
    expect(calculateProvision(100_000, 'Current')).toBe(1_000);
  });

  it('applies 5% for OLEM loans', () => {
    expect(calculateProvision(100_000, 'OLEM')).toBe(5_000);
  });

  it('applies 25% for Substandard loans', () => {
    expect(calculateProvision(100_000, 'Substandard')).toBe(25_000);
  });

  it('applies 50% for Doubtful loans', () => {
    expect(calculateProvision(100_000, 'Doubtful')).toBe(50_000);
  });

  it('applies 100% for Loss loans', () => {
    expect(calculateProvision(100_000, 'Loss')).toBe(100_000);
  });

  it('returns 0 for zero balance', () => {
    expect(calculateProvision(0, 'Loss')).toBe(0);
  });
});

// ─── Interest Calculation Tests ──────────────────────────────────────────────

describe('getPeriodsPerYear', () => {
  it('returns correct periods for each frequency', () => {
    expect(getPeriodsPerYear('DAILY')).toBe(365);
    expect(getPeriodsPerYear('WEEKLY')).toBe(52);
    expect(getPeriodsPerYear('FORTNIGHTLY')).toBe(26);
    expect(getPeriodsPerYear('MONTHLY')).toBe(12);
    expect(getPeriodsPerYear('QUARTERLY')).toBe(4);
    expect(getPeriodsPerYear('ANNUALLY')).toBe(1);
  });
});

describe('calculateFlatInterest', () => {
  it('calculates flat interest correctly for a 12-month loan', () => {
    // GHS 10,000 at 24% for 12 months = 10000 × 24 × 12 / (12 × 100) = 2,400
    expect(calculateFlatInterest(10_000, 24, 12)).toBe(2_400);
  });

  it('calculates flat interest for a 6-month loan', () => {
    // GHS 10,000 at 24% for 6 months = 10000 × 24 × 6 / (12 × 100) = 1,200
    expect(calculateFlatInterest(10_000, 24, 6)).toBe(1_200);
  });

  it('returns 0 for zero rate', () => {
    expect(calculateFlatInterest(10_000, 0, 12)).toBe(0);
  });

  it('returns 0 for zero principal', () => {
    expect(calculateFlatInterest(0, 24, 12)).toBe(0);
  });
});

describe('calculateReducingBalancePayment', () => {
  it('calculates monthly payment for reducing balance', () => {
    // GHS 10,000 at 24% annual for 12 monthly payments
    const payment = calculateReducingBalancePayment(10_000, 24, 12, 12);
    // Expected ~945.60 per month (standard amortization)
    expect(payment).toBeCloseTo(945.60, 0);
  });

  it('returns simple division for 0% interest', () => {
    const payment = calculateReducingBalancePayment(12_000, 0, 12, 12);
    expect(payment).toBe(1_000);
  });

  it('total reducing balance cost is less than flat interest', () => {
    const principal = 10_000;
    const rate = 24;
    const months = 12;
    const reducingPayment = calculateReducingBalancePayment(principal, rate, months, 12);
    const totalReducing = reducingPayment * months - principal;
    const totalFlat = calculateFlatInterest(principal, rate, months);
    expect(totalReducing).toBeLessThan(totalFlat);
  });
});

// ─── Affordability Tests ─────────────────────────────────────────────────────

describe('assessAffordability', () => {
  it('approves low DTI with good cushion', () => {
    // Income 10K, expenses 5K, repayment 2K → DTI 20%, cushion 30%
    const result = assessAffordability(10_000, 5_000, 2_000);
    expect(result.dti).toBe(20);
    expect(result.safetyCushion).toBe(30);
    expect(result.result).toBe('APPROVED');
  });

  it('returns caution for moderate DTI', () => {
    // Income 10K, expenses 5K, repayment 3.5K → DTI 35%, cushion 15%
    const result = assessAffordability(10_000, 5_000, 3_500);
    expect(result.dti).toBe(35);
    expect(result.safetyCushion).toBe(15);
    expect(result.result).toBe('CAUTION');
  });

  it('rejects high DTI', () => {
    // Income 10K, expenses 5K, repayment 5K → DTI 50%, cushion 0%
    const result = assessAffordability(10_000, 5_000, 5_000);
    expect(result.dti).toBe(50);
    expect(result.result).toBe('REJECTED');
  });

  it('rejects when cushion is too low even if DTI is borderline', () => {
    // Income 10K, expenses 8.5K, repayment 1K → DTI 10%, cushion 5%
    const result = assessAffordability(10_000, 8_500, 1_000);
    expect(result.dti).toBe(10);
    expect(result.safetyCushion).toBe(5);
    expect(result.result).toBe('REJECTED');
  });

  it('handles zero income without dividing by zero', () => {
    const result = assessAffordability(0, 0, 1_000);
    expect(result.dti).toBe(100);
    expect(result.safetyCushion).toBe(0);
    expect(result.result).toBe('REJECTED');
  });
});

// ─── PAR Rate Tests ──────────────────────────────────────────────────────────

describe('calculatePARRate', () => {
  it('calculates PAR rate correctly', () => {
    expect(calculatePARRate(185_000, 2_450_000)).toBeCloseTo(7.55, 1);
  });

  it('returns 0 for zero portfolio', () => {
    expect(calculatePARRate(100, 0)).toBe(0);
  });

  it('returns 0 when no arrears', () => {
    expect(calculatePARRate(0, 1_000_000)).toBe(0);
  });
});

// ─── Currency Formatting Tests ───────────────────────────────────────────────

describe('formatGHS', () => {
  it('formats positive amounts with 2 decimal places', () => {
    const formatted = formatGHS(1234.5);
    expect(formatted).toContain('1,234.50');
    expect(formatted).toContain('GH');
  });

  it('formats zero', () => {
    const formatted = formatGHS(0);
    expect(formatted).toContain('0.00');
  });

  it('formats large amounts with thousands separators', () => {
    const formatted = formatGHS(1_000_000);
    expect(formatted).toContain('1,000,000.00');
  });

  it('rounds to 2 decimal places', () => {
    const formatted = formatGHS(1234.567);
    expect(formatted).toContain('1,234.57');
  });
});

// ─── BoG Provision Rate Constants ────────────────────────────────────────────

describe('BOG_PROVISION_RATES', () => {
  it('has correct rates per BoG regulations', () => {
    expect(BOG_PROVISION_RATES.Current).toBe(0.01);
    expect(BOG_PROVISION_RATES.OLEM).toBe(0.05);
    expect(BOG_PROVISION_RATES.Substandard).toBe(0.25);
    expect(BOG_PROVISION_RATES.Doubtful).toBe(0.50);
    expect(BOG_PROVISION_RATES.Loss).toBe(1.00);
  });
});

// ─── Config-driven classification (multi-country) ───────────────────────────

describe('classifyLoan (config-driven)', () => {
  it('classifies correctly with Ghana/BoG buckets', () => {
    const buckets = ghanaConfig.loanClassification.buckets;
    expect(classifyLoan(0, buckets).name).toBe('Current');
    expect(classifyLoan(15, buckets).name).toBe('OLEM');
    expect(classifyLoan(60, buckets).name).toBe('Substandard');
    expect(classifyLoan(120, buckets).name).toBe('Doubtful');
    expect(classifyLoan(200, buckets).name).toBe('Loss');
  });

  it('classifies correctly with BCEAO buckets', () => {
    const buckets = bceaoConfig.loanClassification.buckets;
    expect(classifyLoan(0, buckets).name).toBe('Sain');
    expect(classifyLoan(45, buckets).name).toBe('Sensible');
    expect(classifyLoan(150, buckets).name).toBe('Impayé');
    expect(classifyLoan(300, buckets).name).toBe('Douteux');
    expect(classifyLoan(400, buckets).name).toBe('Perte');
  });

  it('classifies correctly with Kenya/CBK buckets', () => {
    const buckets = kenyaConfig.loanClassification.buckets;
    expect(classifyLoan(10, buckets).name).toBe('Normal');
    expect(classifyLoan(60, buckets).name).toBe('Watch');
    expect(classifyLoan(120, buckets).name).toBe('Substandard');
    expect(classifyLoan(250, buckets).name).toBe('Doubtful');
    expect(classifyLoan(400, buckets).name).toBe('Loss');
  });
});

describe('calculateProvisionFromConfig (config-driven)', () => {
  it('uses Ghana provision rates', () => {
    const buckets = ghanaConfig.loanClassification.buckets;
    const result = calculateProvisionFromConfig(100_000, 15, buckets);
    expect(result.bucket.name).toBe('OLEM');
    expect(result.provisionAmount).toBe(5_000); // 5% of 100k
  });

  it('uses BCEAO provision rates (0% for Sain)', () => {
    const buckets = bceaoConfig.loanClassification.buckets;
    const result = calculateProvisionFromConfig(100_000, 0, buckets);
    expect(result.bucket.name).toBe('Sain');
    expect(result.provisionAmount).toBe(0); // 0% for current/sain
  });

  it('uses Kenya provision rates (3% for Watch)', () => {
    const buckets = kenyaConfig.loanClassification.buckets;
    const result = calculateProvisionFromConfig(100_000, 60, buckets);
    expect(result.bucket.name).toBe('Watch');
    expect(result.provisionAmount).toBe(3_000); // 3% of 100k
  });
});

describe('assessAffordability with custom thresholds', () => {
  it('uses BCEAO thresholds (33% DTI approved vs 30% Ghana)', () => {
    // DTI = 32%, Safety Cushion = 28%
    // Ghana: CAUTION (32 > 30)
    // BCEAO: APPROVED (32 <= 33)
    const ghResult = assessAffordability(5000, 1000, 1600);
    expect(ghResult.result).toBe('CAUTION');

    const bceaoResult = assessAffordability(5000, 1000, 1600, bceaoConfig.affordability);
    expect(bceaoResult.result).toBe('APPROVED');
  });
});

describe('formatCurrency (config-driven)', () => {
  it('formats GHS correctly', () => {
    const result = formatCurrency(1234.56, ghanaConfig.currency);
    expect(result).toContain('1,234.56');
  });

  it('formats XOF without decimals', () => {
    const result = formatCurrency(5000, bceaoConfig.currency);
    expect(result).toContain('5');
    // XOF has 0 decimal digits
    expect(result).not.toContain('.00');
  });

  it('formats KES correctly', () => {
    const result = formatCurrency(75000.50, kenyaConfig.currency);
    expect(result).toContain('75,000.50');
  });
});
