/**
 * WAEMU / BCEAO Regulatory Configuration
 *
 * Covers all 8 WAEMU member states:
 * Senegal, Côte d'Ivoire, Mali, Burkina Faso,
 * Guinea-Bissau, Niger, Togo, Benin
 *
 * Source: BCEAO Instructions relatives aux normes prudentielles applicables
 * aux SFD (Systèmes Financiers Décentralisés)
 */
import type { RegulatoryConfig } from './types';

export const bceaoConfig: RegulatoryConfig = {
  country: {
    code: 'BCEAO',
    name: 'WAEMU Zone',
    nameLocal: 'Zone UEMOA',
    flag: '🏦',
    region: 'West Africa',
  },

  currency: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'CFA Franc (BCEAO)',
    locale: 'fr-SN',
    decimalDigits: 0, // CFA franc has no minor unit
  },

  regulator: {
    name: 'Banque Centrale des États de l\'Afrique de l\'Ouest',
    abbreviation: 'BCEAO',
    website: 'https://www.bceao.int',
  },

  identityDocument: {
    name: 'Carte Nationale d\'Identité',
    fieldLabel: 'Numéro CNI',
    format: undefined,
    digits: undefined,
  },

  capitalAdequacy: {
    minimumCAR: 8,
    tier2Cap: 'tier1',
  },

  liquidity: {
    minimumRatio: 100, // BCEAO uses 100% minimum liquidity coefficient
    defaultThreshold: 100,
  },

  loanClassification: {
    buckets: [
      { name: 'Sain', daysOverdueMin: 0, daysOverdueMax: 0, provisionRate: 0.00 },
      { name: 'Sensible', daysOverdueMin: 1, daysOverdueMax: 90, provisionRate: 0.25 },
      { name: 'Impayé', daysOverdueMin: 91, daysOverdueMax: 180, provisionRate: 0.50 },
      { name: 'Douteux', daysOverdueMin: 181, daysOverdueMax: 360, provisionRate: 0.75 },
      { name: 'Perte', daysOverdueMin: 361, daysOverdueMax: null, provisionRate: 1.00 },
    ],
  },

  riskWeights: {
    zeroWeight: ['Encaisse', 'Créances sur État', 'Créances sur BCEAO'],
    twentyPercent: ['Créances sur banques UEMOA'],
    fiftyPercent: ['Prêts hypothécaires résidentiels'],
    hundredPercent: ['Autres actifs'],
    contingentClass1Weight: 0.5,
    contingentClass2Weight: 1.0,
    marketRiskWeight: 0.5,
  },

  affordability: {
    approvedMaxDTI: 33,
    approvedMinSafetyCushion: 15,
    cautionMaxDTI: 45,
    cautionMinSafetyCushion: 10,
  },

  institutionTiers: [
    {
      id: 'SFD_MUTUALIST',
      name: 'Institution Mutualiste d\'Épargne et de Crédit',
      shortName: 'IMEC',
      description: 'Coopérative d\'épargne et de crédit régie par la loi PARMEC',
      minCapital: 15_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 10,
      carRequirement: 8,
      liquidityRequirement: 100,
      prudentialFrequency: 'QUARTERLY',
      requiresLicense: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'SFD_SA',
      name: 'Société Anonyme de Microfinance',
      shortName: 'SA-MF',
      description: 'Institution de microfinance constituée en société anonyme',
      minCapital: 300_000_000,
      maxLoanPerBorrower: null,
      singleObligorLimitPercent: 10,
      carRequirement: 8,
      liquidityRequirement: 100,
      prudentialFrequency: 'QUARTERLY',
      requiresLicense: true,
      color: 'bg-blue-500',
    },
    {
      id: 'SFD_GROUPEMENT',
      name: 'Groupement d\'Épargne et de Crédit',
      shortName: 'GEC',
      description: 'Groupement d\'épargne et de crédit à base communautaire',
      minCapital: 5_000_000,
      maxLoanPerBorrower: 2_000_000,
      singleObligorLimitPercent: 5,
      carRequirement: 8,
      liquidityRequirement: 100,
      prudentialFrequency: 'QUARTERLY',
      requiresLicense: true,
      color: 'bg-orange-500',
    },
  ],

  aml: {
    name: 'LBC/FT (Loi Uniforme)',
    riskCategories: ['FAIBLE', 'MOYEN', 'ÉLEVÉ'],
    ctrThreshold: 5_000_000, // 5M FCFA
    proofOfResidenceTypes: ['FACTURE_SERVICES', 'CERTIFICAT_RÉSIDENCE', 'CONTRAT_BAIL', 'ATTESTATION_DOMICILE'],
  },

  reporting: {
    defaultPrudentialFrequency: 'QUARTERLY',
    portalName: 'Portail SFD BCEAO',
  },
};
