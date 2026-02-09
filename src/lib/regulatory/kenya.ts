/**
 * Kenya — Central Bank of Kenya (CBK) Regulatory Configuration
 *
 * Source: CBK Prudential Guidelines, Microfinance Act 2006,
 * Central Bank of Kenya Act (Cap 491)
 */
import type { RegulatoryConfig } from './types';

export const kenyaConfig: RegulatoryConfig = {
  country: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    region: 'East Africa',
  },

  currency: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    locale: 'en-KE',
    decimalDigits: 2,
  },

  regulator: {
    name: 'Central Bank of Kenya',
    abbreviation: 'CBK',
    website: 'https://www.centralbank.go.ke',
  },

  identityDocument: {
    name: 'National ID',
    fieldLabel: 'National ID Number',
    format: undefined,
    digits: 8,
  },

  capitalAdequacy: {
    minimumCAR: 14.5, // CBK requires 14.5% (10.5% + 2.5% conservation + 1.5% counter-cyclical)
    tier2Cap: 'tier1',
  },

  liquidity: {
    minimumRatio: 20, // CBK minimum liquidity ratio
    defaultThreshold: 20,
  },

  loanClassification: {
    buckets: [
      { name: 'Normal', daysOverdueMin: 0, daysOverdueMax: 30, provisionRate: 0.01 },
      { name: 'Watch', daysOverdueMin: 31, daysOverdueMax: 90, provisionRate: 0.03 },
      { name: 'Substandard', daysOverdueMin: 91, daysOverdueMax: 180, provisionRate: 0.20 },
      { name: 'Doubtful', daysOverdueMin: 181, daysOverdueMax: 360, provisionRate: 0.50 },
      { name: 'Loss', daysOverdueMin: 361, daysOverdueMax: null, provisionRate: 1.00 },
    ],
  },

  riskWeights: {
    zeroWeight: ['Cash', 'Government securities', 'CBK balances'],
    twentyPercent: ['Claims on banks rated AA-'],
    fiftyPercent: ['Residential mortgages', 'Claims on county governments'],
    hundredPercent: ['All other assets'],
    contingentClass1Weight: 0.5,
    contingentClass2Weight: 1.0,
    marketRiskWeight: 0.5,
  },

  affordability: {
    approvedMaxDTI: 33,
    approvedMinSafetyCushion: 20,
    cautionMaxDTI: 50,
    cautionMinSafetyCushion: 10,
  },

  institutionTiers: [
    {
      id: 'DTM',
      name: 'Deposit-Taking Microfinance Institution',
      shortName: 'DTM',
      description: 'CBK-licensed deposit-taking microfinance institution',
      minCapital: 60_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 25,
      carRequirement: 14.5,
      liquidityRequirement: 20,
      prudentialFrequency: 'MONTHLY',
      requiresLicense: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'NON_DTM',
      name: 'Non-Deposit-Taking MFI',
      shortName: 'Non-DTM',
      description: 'Credit-only microfinance institution',
      minCapital: 20_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 25,
      carRequirement: 14.5,
      liquidityRequirement: 20,
      prudentialFrequency: 'QUARTERLY',
      requiresLicense: true,
      color: 'bg-blue-500',
    },
    {
      id: 'SACCO',
      name: 'Savings and Credit Co-operative',
      shortName: 'SACCO',
      description: 'SASRA-regulated co-operative society taking deposits',
      minCapital: 10_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 10,
      carRequirement: 10,
      liquidityRequirement: 15,
      prudentialFrequency: 'QUARTERLY',
      requiresLicense: true,
      color: 'bg-orange-500',
    },
  ],

  aml: {
    name: 'POCAMLA 2009',
    riskCategories: ['LOW', 'MEDIUM', 'HIGH'],
    ctrThreshold: 1_000_000, // KSh 1M
    proofOfResidenceTypes: ['UTILITY_BILL', 'BANK_STATEMENT', 'LEASE_AGREEMENT', 'KRA_PIN_CERTIFICATE'],
  },

  reporting: {
    defaultPrudentialFrequency: 'MONTHLY',
    portalName: 'CBK Electronic Regulatory System',
  },
};
