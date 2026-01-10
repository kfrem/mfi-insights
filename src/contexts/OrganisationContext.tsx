import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organisation } from '@/types/mfi';
import { supabase } from '@/integrations/supabase/client';

interface OrganisationContextType {
  organisations: Organisation[];
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  isLoading: boolean;
}

const OrganisationContext = createContext<OrganisationContextType | undefined>(undefined);

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Using demo data since external schemas (mfi/mfi_reporting) are not available in Lovable Cloud
    // Connect your external Supabase project to use real data
    setOrganisations([
      { org_id: 'org-1', name: 'MFI Demo Organisation' },
    ]);
    setSelectedOrgId('org-1');
    setIsLoading(false);
  }, []);

  return (
    <OrganisationContext.Provider value={{ organisations, selectedOrgId, setSelectedOrgId, isLoading }}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const context = useContext(OrganisationContext);
  if (context === undefined) {
    throw new Error('useOrganisation must be used within an OrganisationProvider');
  }
  return context;
}
