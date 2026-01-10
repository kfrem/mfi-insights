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
    async function fetchOrganisations() {
      try {
        const { data, error } = await (supabase as any)
          .schema('mfi')
          .from('organisations')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching organisations:', error);
          // Use mock data if table doesn't exist
          setOrganisations([
            { org_id: 'org-1', name: 'MFI Demo Organisation' },
          ]);
        } else if (data && data.length > 0) {
          setOrganisations(data as Organisation[]);
          setSelectedOrgId(data[0].org_id);
        } else {
          // No data - use demo
          setOrganisations([
            { org_id: 'org-1', name: 'MFI Demo Organisation' },
          ]);
          setSelectedOrgId('org-1');
        }
      } catch (err) {
        console.error('Failed to fetch organisations:', err);
        setOrganisations([
          { org_id: 'org-1', name: 'MFI Demo Organisation' },
        ]);
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
