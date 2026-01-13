import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Shareholder, DividendPayout, ShareholderTransaction, ShareholderPortfolioSummary } from '@/types/shareholder';

export function useShareholderData() {
  const { selectedOrgId } = useOrganisation();
  const { user } = useAuth();

  // Fetch shareholder record for current user
  const { data: currentShareholder, isLoading: shareholderLoading } = useQuery({
    queryKey: ['shareholder', selectedOrgId, user?.id],
    queryFn: async () => {
      if (!selectedOrgId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('shareholders')
        .select('*')
        .eq('org_id', selectedOrgId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Shareholder | null;
    },
    enabled: !!selectedOrgId && !!user?.id,
  });

  // Fetch all shareholders for executives
  const { data: allShareholders, isLoading: allShareholdersLoading } = useQuery({
    queryKey: ['shareholders', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      
      const { data, error } = await supabase
        .from('shareholders')
        .select('*')
        .eq('org_id', selectedOrgId)
        .order('total_investment', { ascending: false });
      
      if (error) throw error;
      return data as Shareholder[];
    },
    enabled: !!selectedOrgId,
  });

  // Fetch dividends for current shareholder
  const { data: dividends, isLoading: dividendsLoading } = useQuery({
    queryKey: ['dividends', selectedOrgId, currentShareholder?.id],
    queryFn: async () => {
      if (!selectedOrgId || !currentShareholder?.id) return [];
      
      const { data, error } = await supabase
        .from('dividend_payouts')
        .select('*')
        .eq('shareholder_id', currentShareholder.id)
        .order('payout_date', { ascending: false });
      
      if (error) throw error;
      return data as DividendPayout[];
    },
    enabled: !!selectedOrgId && !!currentShareholder?.id,
  });

  // Fetch transactions for current shareholder
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['shareholder-transactions', selectedOrgId, currentShareholder?.id],
    queryFn: async () => {
      if (!selectedOrgId || !currentShareholder?.id) return [];
      
      const { data, error } = await supabase
        .from('shareholder_transactions')
        .select('*')
        .eq('shareholder_id', currentShareholder.id)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data as ShareholderTransaction[];
    },
    enabled: !!selectedOrgId && !!currentShareholder?.id,
  });

  // Fetch loan portfolio data for calculations
  const { data: portfolioData } = useQuery({
    queryKey: ['loan-portfolio', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      
      const { data, error } = await supabase
        .from('loans')
        .select('outstanding_principal, disbursed_amount, status')
        .eq('org_id', selectedOrgId)
        .in('status', ['ACTIVE', 'DISBURSED']);
      
      if (error) throw error;
      
      const totalLoaned = data?.reduce((sum, loan) => 
        sum + (Number(loan.outstanding_principal) || Number(loan.disbursed_amount) || 0), 0) || 0;
      
      return { totalLoaned, activeLoans: data?.length || 0 };
    },
    enabled: !!selectedOrgId,
  });

  // Calculate portfolio summary
  const portfolioSummary: ShareholderPortfolioSummary = (() => {
    const shareholders = allShareholders || [];
    const totalInvestment = shareholders.reduce((sum, s) => sum + Number(s.total_investment), 0);
    const totalShares = shareholders.reduce((sum, s) => sum + s.share_units, 0);
    const avgUnitValue = shareholders.length > 0 
      ? shareholders.reduce((sum, s) => sum + Number(s.share_unit_value), 0) / shareholders.length 
      : 100;
    
    const currentValue = totalShares * avgUnitValue;
    const portfolioLoaned = portfolioData?.totalLoaned || 0;
    const portfolioDeposit = totalInvestment - portfolioLoaned;
    const totalDividends = (dividends || []).reduce((sum, d) => sum + Number(d.amount), 0);
    
    const unrealizedGain = currentValue - totalInvestment;
    const roi = totalInvestment > 0 ? ((currentValue + totalDividends - totalInvestment) / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      currentValue,
      portfolioLoaned,
      portfolioDeposit: Math.max(0, portfolioDeposit),
      unrealizedGain,
      totalDividends,
      roi,
      shareholderCount: shareholders.length,
    };
  })();

  // Individual shareholder summary
  const myPortfolioSummary = currentShareholder ? {
    totalInvestment: Number(currentShareholder.total_investment),
    shareUnits: currentShareholder.share_units,
    currentUnitValue: Number(currentShareholder.share_unit_value),
    currentValue: currentShareholder.share_units * Number(currentShareholder.share_unit_value),
    totalDividends: (dividends || []).reduce((sum, d) => sum + Number(d.amount), 0),
    pendingDividends: (dividends || []).filter(d => d.status === 'PENDING').reduce((sum, d) => sum + Number(d.amount), 0),
    portfolioLoaned: portfolioData?.totalLoaned || 0,
    investmentDate: currentShareholder.investment_date,
    roi: 0,
  } : null;

  if (myPortfolioSummary) {
    const totalReturns = myPortfolioSummary.currentValue + myPortfolioSummary.totalDividends - myPortfolioSummary.totalInvestment;
    myPortfolioSummary.roi = myPortfolioSummary.totalInvestment > 0 
      ? (totalReturns / myPortfolioSummary.totalInvestment) * 100 
      : 0;
  }

  return {
    currentShareholder,
    allShareholders,
    dividends,
    transactions,
    portfolioSummary,
    myPortfolioSummary,
    isLoading: shareholderLoading || allShareholdersLoading || dividendsLoading || transactionsLoading,
  };
}
