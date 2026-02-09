/**
 * Ghana — Bank of Ghana (BoG) Regulatory Configuration
 *
 * Source: BoG Banking Supervision directives, AML/CFT&P 2022 guidelines.
 * This is the production config for the Ghana market.
 */
import type { RegulatoryConfig } from './types';

export const ghanaConfig: RegulatoryConfig = {
  country: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    region: 'West Africa',
  },

  currency: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghana Cedi',
    locale: 'en-GH',
    decimalDigits: 2,
  },

  regulator: {
    name: 'Bank of Ghana',
    abbreviation: 'BoG',
    website: 'https://www.bog.gov.gh',
  },

  identityDocument: {
    name: 'Ghana Card',
    fieldLabel: 'Ghana Card Number',
    format: 'GHA-XXXXXXXXX-X',
    digits: 13,
  },

  capitalAdequacy: {
    minimumCAR: 10,
    tier2Cap: 'tier1',
  },

  liquidity: {
    minimumRatio: 10,
    defaultThreshold: 15,
  },

  loanClassification: {
    buckets: [
      { name: 'Current', daysOverdueMin: 0, daysOverdueMax: 0, provisionRate: 0.01 },
      { name: 'OLEM', daysOverdueMin: 1, daysOverdueMax: 30, provisionRate: 0.05 },
      { name: 'Substandard', daysOverdueMin: 31, daysOverdueMax: 90, provisionRate: 0.25 },
      { name: 'Doubtful', daysOverdueMin: 91, daysOverdueMax: 180, provisionRate: 0.50 },
      { name: 'Loss', daysOverdueMin: 181, daysOverdueMax: null, provisionRate: 1.00 },
    ],
  },

  riskWeights: {
    zeroWeight: ['Cash on hand', 'GoG securities', 'BoG securities'],
    twentyPercent: ['Cheques from other banks', 'Claims on banks'],
    fiftyPercent: ['Residential mortgages', 'Export financing', 'Public institution loans'],
    hundredPercent: ['All other assets'],
    contingentClass1Weight: 0.5,
    contingentClass2Weight: 0.8,
    marketRiskWeight: 0.5,
  },

  affordability: {
    approvedMaxDTI: 30,
    approvedMinSafetyCushion: 20,
    cautionMaxDTI: 40,
    cautionMinSafetyCushion: 10,
  },

  institutionTiers: [
    {
      id: 'TIER_1_RCB',
      name: 'Rural & Community Bank',
      shortName: 'RCB',
      description: 'BoG-licensed rural and community banks serving local communities',
      minCapital: 1_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 25,
      carRequirement: 10,
      liquidityRequirement: 15,
      prudentialFrequency: 'MONTHLY',
      requiresLicense: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'TIER_2_SL',
      name: 'Savings & Loans',
      shortName: 'S&L',
      description: 'BoG-licensed savings and loans companies',
      minCapital: 15_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 25,
      carRequirement: 10,
      liquidityRequirement: 15,
      prudentialFrequency: 'MONTHLY',
      requiresLicense: true,
      color: 'bg-blue-500',
    },
    {
      id: 'TIER_3_FH',
      name: 'Finance House',
      shortName: 'FH',
      description: 'BoG-licensed finance houses',
      minCapital: 8_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 25,
      carRequirement: 10,
      liquidityRequirement: 15,
      prudentialFrequency: 'MONTHLY',
      requiresLicense: true,
      color: 'bg-purple-500',
    },
    {
      id: 'TIER_4_MFC',
      name: 'Microfinance Company',
      shortName: 'MFC',
      description: 'BoG-licensed microfinance companies',
      minCapital: 500_000,
      maxLoanPerBorrower: 50_000,
      singleObligorLimitPercent: 10,
      carRequirement: 10,
      liquidityRequirement: 20,
      prudentialFrequency: 'MONTHLY',
      requiresLicense: true,
      color: 'bg-orange-500',
    },
  ],

  aml: {
    name: 'AML/CFT&P 2022',
    riskCategories: ['LOW', 'MEDIUM', 'HIGH'],
    ctrThreshold: 20_000,
    proofOfResidenceTypes: ['UTILITY_BILL', 'GPS_ADDRESS', 'LEASE_AGREEMENT', 'BANK_STATEMENT'],
  },

  reporting: {
    defaultPrudentialFrequency: 'MONTHLY',
    portalName: 'BoG ORASS portal',
  },
};
