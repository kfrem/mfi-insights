/**
 * Regulatory Configuration Types
 *
 * This module defines the shape of a country's regulatory configuration.
 * Each country/central bank supported by MFI Clarity provides an implementation
 * of the RegulatoryConfig interface. This allows the same codebase to serve
 * Ghana (BoG), WAEMU/BCEAO, Kenya (CBK), and any future African market.
 */

// ─── Loan Classification ────────────────────────────────────────────────────

export interface ClassificationBucket {
  name: string;
  daysOverdueMin: number;
  daysOverdueMax: number | null; // null = unbounded
  provisionRate: number; // 0.01 = 1%
}

// ─── Risk Weight Category ───────────────────────────────────────────────────

export interface RiskWeightCategory {
  label: string;
  weight: number; // 0.0 = 0%, 0.20 = 20%, etc.
}

// ─── Institution Tier ───────────────────────────────────────────────────────

export interface InstitutionTier {
  id: string;
  name: string;
  shortName: string;
  description: string;
  minCapital: number;
  maxLoanPerBorrower: number | null;
  singleObligorLimitPercent: number;
  carRequirement: number;
  liquidityRequirement: number;
  prudentialFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  requiresLicense: boolean;
  color: string;
}

// ─── Affordability Thresholds ───────────────────────────────────────────────

export interface AffordabilityThresholds {
  approvedMaxDTI: number;
  approvedMinSafetyCushion: number;
  cautionMaxDTI: number;
  cautionMinSafetyCushion: number;
}

// ─── Country Identity ───────────────────────────────────────────────────────

export interface CountryIdentity {
  code: string; // ISO 3166-1 alpha-2 (GH, SN, KE)
  name: string;
  nameLocal?: string; // Name in local language
  flag: string; // Emoji flag
  region: string; // e.g. "West Africa", "East Africa"
}

export interface CurrencyConfig {
  code: string; // ISO 4217 (GHS, XOF, KES)
  symbol: string; // ₵, FCFA, KSh
  name: string; // "Ghana Cedi", "CFA Franc"
  locale: string; // Intl locale (en-GH, fr-SN, en-KE)
  decimalDigits: number;
}

export interface RegulatorInfo {
  name: string; // "Bank of Ghana"
  abbreviation: string; // "BoG"
  website?: string;
}

export interface IdentityDocument {
  name: string; // "Ghana Card", "Carte d'identité nationale"
  fieldLabel: string; // "Ghana Card Number", "Numéro CNI"
  format?: string; // "GHA-XXXXXXXXX-X"
  digits?: number;
}

// ─── AML/CFT Framework ──────────────────────────────────────────────────────

export interface AMLFramework {
  name: string; // "AML/CFT&P 2022", "LBC/FT"
  riskCategories: string[];
  ctrThreshold?: number; // Cash Transaction Report threshold in local currency
  proofOfResidenceTypes: string[];
}

// ─── Full Configuration ─────────────────────────────────────────────────────

export interface RegulatoryConfig {
  country: CountryIdentity;
  currency: CurrencyConfig;
  regulator: RegulatorInfo;
  identityDocument: IdentityDocument;

  // Prudential ratios
  capitalAdequacy: {
    minimumCAR: number; // percentage
    tier2Cap: 'tier1' | 'percentage';
    tier2CapValue?: number;
  };
  liquidity: {
    minimumRatio: number;
    defaultThreshold: number;
  };

  // Loan classification & provisioning
  loanClassification: {
    buckets: ClassificationBucket[];
  };

  // Risk-weighted asset categories
  riskWeights: {
    zeroWeight: string[];
    twentyPercent: string[];
    fiftyPercent: string[];
    hundredPercent: string[];
    contingentClass1Weight: number;
    contingentClass2Weight: number;
    marketRiskWeight: number;
  };

  // Affordability assessment
  affordability: AffordabilityThresholds;

  // Institution tiers
  institutionTiers: InstitutionTier[];

  // AML/CFT
  aml: AMLFramework;

  // Reporting
  reporting: {
    defaultPrudentialFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    portalName?: string; // "BoG ORASS portal"
  };
}

// ─── Supported country codes ────────────────────────────────────────────────

export type SupportedCountry = 'GH' | 'BCEAO' | 'KE' | 'DEMO';
