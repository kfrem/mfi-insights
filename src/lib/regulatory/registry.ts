/**
 * Regulatory Configuration Registry
 *
 * Central registry of all supported country configurations.
 * Use getConfig() to retrieve a config, listConfigs() to enumerate them.
 */
import type { RegulatoryConfig, SupportedCountry } from './types';
import { ghanaConfig } from './ghana';
import { bceaoConfig } from './bceao';
import { kenyaConfig } from './kenya';

const configs: Record<SupportedCountry, RegulatoryConfig> = {
  GH: ghanaConfig,
  BCEAO: bceaoConfig,
  KE: kenyaConfig,
  // DEMO uses Ghana as the base, but is resolved at the context level
  DEMO: ghanaConfig,
};

export function getConfig(country: SupportedCountry): RegulatoryConfig {
  return configs[country];
}

export function listConfigs(): Array<{ code: SupportedCountry; label: string; flag: string }> {
  return [
    { code: 'GH', label: 'Ghana (BoG)', flag: '🇬🇭' },
    { code: 'BCEAO', label: 'WAEMU / BCEAO (Francophone)', flag: '🏦' },
    { code: 'KE', label: 'Kenya (CBK)', flag: '🇰🇪' },
  ];
}

export { ghanaConfig, bceaoConfig, kenyaConfig };
export type { RegulatoryConfig, SupportedCountry };
