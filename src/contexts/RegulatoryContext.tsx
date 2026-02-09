import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { RegulatoryConfig, SupportedCountry } from '@/lib/regulatory/types';
import { getConfig } from '@/lib/regulatory/registry';

interface RegulatoryContextValue {
  config: RegulatoryConfig;
  countryCode: SupportedCountry;
  setCountry: (code: SupportedCountry) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
}

const RegulatoryContext = createContext<RegulatoryContextValue | null>(null);

interface RegulatoryProviderProps {
  children: ReactNode;
  initialCountry?: SupportedCountry;
}

export function RegulatoryProvider({ children, initialCountry = 'GH' }: RegulatoryProviderProps) {
  const [countryCode, setCountryCode] = useState<SupportedCountry>(initialCountry);
  const config = getConfig(countryCode);

  const setCountry = useCallback((code: SupportedCountry) => {
    setCountryCode(code);
  }, []);

  const formatCurrency = useCallback(
    (amount: number): string => {
      return new Intl.NumberFormat(config.currency.locale, {
        style: 'currency',
        currency: config.currency.code,
        minimumFractionDigits: config.currency.decimalDigits,
        maximumFractionDigits: config.currency.decimalDigits,
      }).format(amount);
    },
    [config.currency],
  );

  const formatCurrencyCompact = useCallback(
    (amount: number): string => {
      if (Math.abs(amount) >= 1_000_000_000) {
        return `${config.currency.symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
      }
      if (Math.abs(amount) >= 1_000_000) {
        return `${config.currency.symbol}${(amount / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(amount) >= 1_000) {
        return `${config.currency.symbol}${(amount / 1_000).toFixed(1)}K`;
      }
      return formatCurrency(amount);
    },
    [config.currency.symbol, formatCurrency],
  );

  return (
    <RegulatoryContext.Provider value={{ config, countryCode, setCountry, formatCurrency, formatCurrencyCompact }}>
      {children}
    </RegulatoryContext.Provider>
  );
}

export function useRegulatory(): RegulatoryContextValue {
  const ctx = useContext(RegulatoryContext);
  if (!ctx) {
    throw new Error('useRegulatory must be used within a RegulatoryProvider');
  }
  return ctx;
}
