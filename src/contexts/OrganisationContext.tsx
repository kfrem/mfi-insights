import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organisation } from '@/types/organisation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrganisationContextType {
  organisations: Organisation[];
  selectedOrg: Organisation | null;
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const OrganisationContext = createContext<OrganisationContextType | undefined>(undefined);

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrganisations = async () => {
    if (!user) {
      setOrganisations([]);
      setSelectedOrgId(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch organisations that the user belongs to
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .order('name');

      if (error) throw error;

      const orgs = (data || []) as Organisation[];
      setOrganisations(orgs);
      
      // Auto-select first org if none selected
      if (orgs.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgs[0].org_id);
      } else if (orgs.length === 0) {
        setSelectedOrgId(null);
      }
    } catch (err) {
      console.error('Failed to fetch organisations:', err);
      setOrganisations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, [user]);

  const selectedOrg = organisations.find(org => org.org_id === selectedOrgId) || null;

  return (
    <OrganisationContext.Provider value={{ 
      organisations, 
      selectedOrg,
      selectedOrgId, 
      setSelectedOrgId, 
      isLoading,
      refetch: fetchOrganisations
    }}>
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
