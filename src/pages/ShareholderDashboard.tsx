import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Banknote, 
  PieChart, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  BarChart3,
  Users,
  Settings
} from 'lucide-react';
import { useShareholderData } from '@/hooks/useShareholderData';
import { formatGHS } from '@/lib/utils';
import { format } from 'date-fns';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { AddShareholderForm } from '@/components/shareholders/AddShareholderForm';
import { RecordTransactionForm } from '@/components/shareholders/RecordTransactionForm';
import { ProcessDividendForm } from '@/components/shareholders/ProcessDividendForm';
import { ShareholdersList } from '@/components/shareholders/ShareholdersList';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ShareholderDashboard() {
  const { 
    currentShareholder, 
    allShareholders,
    dividends, 
    transactions, 
    portfolioSummary,
    myPortfolioSummary,
    isLoading 
  } = useShareholderData();
  const { user } = useAuth();
  const { selectedOrgId } = useOrganisation();

  // Check if user is admin/executive
  const { data: userRole } = useQuery({
    queryKey: ['user-role', selectedOrgId, user?.id],
    queryFn: async () => {
      if (!selectedOrgId || !user?.id) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('org_id', selectedOrgId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.role;
    },
    enabled: !!selectedOrgId && !!user?.id,
  });

  const isAdmin = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Check if in demo mode
  const isDemoMode = sessionStorage.getItem('mfi_demo_mode') === 'true';

  // Generate demo data if in demo mode
  const demoPortfolio = isDemoMode ? {
    totalInvestment: 50000,
    shareUnits: 500,
    currentUnitValue: 112.50,
    currentValue: 56250,
    totalDividends: 3750,
    pendingDividends: 625,
    portfolioLoaned: 35000,
    investmentDate: '2024-01-15',
    roi: 20.0,
  } : myPortfolioSummary;

  const demoDividends = isDemoMode ? [
    { id: '1', payout_date: '2025-01-01', dividend_rate: 0.025, shares_at_payout: 500, amount: 1250, status: 'PAID' as const },
    { id: '2', payout_date: '2024-10-01', dividend_rate: 0.025, shares_at_payout: 500, amount: 1250, status: 'PAID' as const },
    { id: '3', payout_date: '2024-07-01', dividend_rate: 0.025, shares_at_payout: 500, amount: 1250, status: 'PAID' as const },
    { id: '4', payout_date: '2025-04-01', dividend_rate: 0.025, shares_at_payout: 500, amount: 625, status: 'PENDING' as const },
  ] : dividends;

  const demoTransactions = isDemoMode ? [
    { id: '1', transaction_type: 'INVESTMENT' as const, share_units: 400, unit_value: 100, total_amount: 40000, transaction_date: '2024-01-15' },
    { id: '2', transaction_type: 'DIVIDEND_REINVEST' as const, share_units: 50, unit_value: 100, total_amount: 5000, transaction_date: '2024-04-15' },
    { id: '3', transaction_type: 'INVESTMENT' as const, share_units: 50, unit_value: 100, total_amount: 5000, transaction_date: '2024-06-01' },
  ] : transactions;

  const portfolio = demoPortfolio || {
    totalInvestment: 0,
    shareUnits: 0,
    currentUnitValue: 100,
    currentValue: 0,
    totalDividends: 0,
    pendingDividends: 0,
    portfolioLoaned: 0,
    investmentDate: null,
    roi: 0,
  };

  // Portfolio allocation chart data
  const allocationData = [
    { name: 'Loaned Out', value: portfolio.portfolioLoaned },
    { name: 'In Reserve', value: Math.max(0, portfolio.currentValue - portfolio.portfolioLoaned) },
  ];

  // Performance trend data (mock for demo)
  const performanceData = [
    { month: 'Jul', value: 100, investment: 100 },
    { month: 'Aug', value: 102, investment: 100 },
    { month: 'Sep', value: 104, investment: 100 },
    { month: 'Oct', value: 106, investment: 100 },
    { month: 'Nov', value: 108, investment: 100 },
    { month: 'Dec', value: 110, investment: 100 },
    { month: 'Jan', value: 112.5, investment: 100 },
  ];

  // Dividend history chart data
  const dividendChartData = (demoDividends || [])
    .filter(d => d.status === 'PAID')
    .map(d => ({
      date: format(new Date(d.payout_date), 'MMM yy'),
      amount: Number(d.amount),
      rate: Number(d.dividend_rate) * 100,
    }))
    .reverse();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investor Dashboard</h1>
          <p className="text-muted-foreground">
            Track your investment performance, dividends, and portfolio allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              Demo Portfolio
            </Badge>
          )}
          {(isAdmin || isDemoMode) && (
            <div className="flex items-center gap-2">
              <AddShareholderForm />
              <RecordTransactionForm shareholders={allShareholders || []} />
              <ProcessDividendForm shareholders={allShareholders || []} />
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Total Investment</p>
                <p className="text-2xl font-bold">{formatGHS(portfolio.totalInvestment)}</p>
                <p className="text-xs opacity-70">{portfolio.shareUnits} share units</p>
              </div>
              <Wallet className="h-10 w-10 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold text-foreground">{formatGHS(portfolio.currentValue)}</p>
                <div className="flex items-center gap-1 text-xs">
                  {portfolio.roi >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-status-current" />
                      <span className="text-status-current">+{portfolio.roi.toFixed(1)}% ROI</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                      <span className="text-destructive">{portfolio.roi.toFixed(1)}% ROI</span>
                    </>
                  )}
                </div>
              </div>
              <TrendingUp className="h-10 w-10 text-status-current opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dividends Earned</p>
                <p className="text-2xl font-bold text-foreground">{formatGHS(portfolio.totalDividends)}</p>
                {portfolio.pendingDividends > 0 && (
                  <p className="text-xs text-accent">{formatGHS(portfolio.pendingDividends)} pending</p>
                )}
              </div>
              <Banknote className="h-10 w-10 text-accent opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unit Value</p>
                <p className="text-2xl font-bold text-foreground">{formatGHS(portfolio.currentUnitValue)}</p>
                <p className="text-xs text-muted-foreground">per share unit</p>
              </div>
              <PiggyBank className="h-10 w-10 text-chart-3 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Portfolio Allocation
            </CardTitle>
            <CardDescription>How your investment is being utilized</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatGHS(Number(value))} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Loaned Out</span>
                </div>
                <span className="font-medium">{formatGHS(portfolio.portfolioLoaned)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span>In Reserve</span>
                </div>
                <span className="font-medium">{formatGHS(Math.max(0, portfolio.currentValue - portfolio.portfolioLoaned))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Value Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Share Unit Performance
            </CardTitle>
            <CardDescription>Value appreciation over time (indexed to 100)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[95, 120]} className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Unit Value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="investment" 
                    name="Base Investment" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Dividends and Transactions */}
      <Tabs defaultValue={isAdmin || isDemoMode ? 'manage' : 'dividends'} className="space-y-4">
        <TabsList>
          {(isAdmin || isDemoMode) && (
            <TabsTrigger value="manage" className="gap-2">
              <Settings className="h-4 w-4" />
              Manage Investors
            </TabsTrigger>
          )}
          <TabsTrigger value="dividends" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Dividend History
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Calendar className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          {allShareholders && allShareholders.length > 0 && (
            <TabsTrigger value="overview" className="gap-2">
              <Users className="h-4 w-4" />
              Fund Overview
            </TabsTrigger>
          )}
        </TabsList>

        {/* Management Tab - Admin Only */}
        {(isAdmin || isDemoMode) && (
          <TabsContent value="manage">
            <ShareholdersList 
              shareholders={allShareholders || []} 
              isLoading={isLoading} 
            />
          </TabsContent>
        )}

        <TabsContent value="dividends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dividend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Dividend Payouts</CardTitle>
                <CardDescription>Quarterly dividend distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dividendChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value) => formatGHS(Number(value))} />
                      <Bar dataKey="amount" name="Dividend Amount" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Dividend Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>All dividend payments received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(demoDividends || []).map((dividend) => (
                    <div 
                      key={dividend.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{format(new Date(dividend.payout_date), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {dividend.shares_at_payout} shares @ {(Number(dividend.dividend_rate) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatGHS(Number(dividend.amount))}</p>
                        <Badge 
                          variant={dividend.status === 'PAID' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {dividend.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!demoDividends || demoDividends.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No dividends yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All investment activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(demoTransactions || []).map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.transaction_type === 'INVESTMENT' || tx.transaction_type === 'DIVIDEND_REINVEST'
                          ? 'bg-status-current/10 text-status-current'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {tx.transaction_type === 'INVESTMENT' || tx.transaction_type === 'DIVIDEND_REINVEST' 
                          ? <ArrowUpRight className="h-5 w-5" />
                          : <ArrowDownRight className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.transaction_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {tx.transaction_type === 'WITHDRAWAL' || tx.transaction_type === 'SHARE_TRANSFER_OUT' 
                          ? '-' : '+'
                        }
                        {formatGHS(Number(tx.total_amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.share_units} units @ {formatGHS(Number(tx.unit_value))}
                      </p>
                    </div>
                  </div>
                ))}
                {(!demoTransactions || demoTransactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {allShareholders && allShareholders.length > 0 && (
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fund Size</p>
                      <p className="text-2xl font-bold">{formatGHS(portfolioSummary.totalInvestment)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Investors</p>
                      <p className="text-2xl font-bold">{portfolioSummary.shareholderCount}</p>
                    </div>
                    <Users className="h-8 w-8 text-accent opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Utilization</p>
                      <p className="text-2xl font-bold">
                        {portfolioSummary.totalInvestment > 0 
                          ? ((portfolioSummary.portfolioLoaned / portfolioSummary.totalInvestment) * 100).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-chart-3 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
