import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organisation } from '@/types/mfi';
import { getExternalSupabase, isExternalSupabaseConfigured } from '@/integrations/external-supabase/client';

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
    async function fetchOrganisations() {
      if (!isExternalSupabaseConfigured()) {
        // Fallback to demo data if external Supabase not configured
        setOrganisations([{ org_id: 'org-1', name: 'MFI Demo Organisation' }]);
        setSelectedOrgId('org-1');
        setIsLoading(false);
        return;
      }

      try {
        const client = getExternalSupabase();
        if (!client) throw new Error('External Supabase not available');
        
        const { data, error } = await (client as any)
          .schema('mfi')
          .from('organisations')
          .select('org_id, name')
          .order('name');

        if (error) throw error;

        const orgs = data as Organisation[];
        setOrganisations(orgs);
        if (orgs.length > 0) {
          setSelectedOrgId(orgs[0].org_id);
        }
      } catch (err) {
        console.error('Failed to fetch organisations:', err);
        // Fallback to demo
        setOrganisations([{ org_id: 'org-1', name: 'MFI Demo Organisation' }]);
        setSelectedOrgId('org-1');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganisations();
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
