import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organisation } from '@/types/organisation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Demo organisation ID - matches the one seeded in the database
const DEMO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

interface OrganisationContextType {
  organisations: Organisation[];
  selectedOrg: Organisation | null;
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  isLoading: boolean;
  isDemoMode: boolean;
  refetch: () => Promise<void>;
}

const OrganisationContext = createContext<OrganisationContextType | undefined>(undefined);

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Check if running in demo mode
  const isDemoMode = sessionStorage.getItem('mfi_demo_mode') === 'true';

  const fetchOrganisations = async () => {
    // In demo mode, fetch demo org directly
    if (isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('organisations')
          .select('*')
          .eq('org_id', DEMO_ORG_ID)
          .single();

        if (error) throw error;

        const demoOrg = data as Organisation;
        setOrganisations([demoOrg]);
        setSelectedOrgId(DEMO_ORG_ID);
      } catch (err) {
        console.error('Failed to fetch demo organisation:', err);
        setOrganisations([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular flow - fetch user's organisations
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
  }, [user, isDemoMode]);

  const selectedOrg = organisations.find(org => org.org_id === selectedOrgId) || null;

  return (
    <OrganisationContext.Provider value={{ 
      organisations, 
      selectedOrg,
      selectedOrgId, 
      setSelectedOrgId, 
      isLoading,
      isDemoMode,
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
