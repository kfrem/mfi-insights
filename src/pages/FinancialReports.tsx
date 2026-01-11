import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, ShieldAlert, BarChart3, Wallet } from 'lucide-react';
import { FinancialStatementsPanel } from '@/components/financial/FinancialStatementsPanel';
import { ProfitabilityMetricsPanel } from '@/components/financial/ProfitabilityMetricsPanel';
import { GovernanceRiskPanel } from '@/components/financial/GovernanceRiskPanel';
import { PARAgingPanel } from '@/components/financial/PARAgingPanel';
import { DepositMonitoringPanel } from '@/components/financial/DepositMonitoringPanel';
import { TierComplianceWidget } from '@/components/regulatory/TierComplianceWidget';
import { useFinancialRatios } from '@/hooks/useFinancialData';
import { useCapitalAdequacy, useLiquidityRatio } from '@/hooks/useRegulatoryData';

export default function FinancialReports() {
  const { data: ratios } = useFinancialRatios();
  const { data: car } = useCapitalAdequacy();
  const { data: liquidity } = useLiquidityRatio();

  return (
    <div className="p-8">
      <header className="page-header">
        <h1 className="page-title">Financial Reports</h1>
        <p className="page-subtitle">
          Comprehensive financial statements, profitability metrics, portfolio quality, and governance risk indicators
        </p>
      </header>

      {/* Compliance Summary */}
      <div className="mb-6">
        <TierComplianceWidget 
          currentCAR={car?.car_ratio} 
          currentLiquidity={liquidity?.liquidity_ratio}
          compact
        />
      </div>

      <Tabs defaultValue="statements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden lg:inline">Financial</span> Statements
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profitability
          </TabsTrigger>
          <TabsTrigger value="par" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            PAR Analysis
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Deposits
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statements">
          <FinancialStatementsPanel />
        </TabsContent>

        <TabsContent value="profitability">
          <ProfitabilityMetricsPanel />
        </TabsContent>

        <TabsContent value="par">
          <PARAgingPanel />
        </TabsContent>

        <TabsContent value="deposits">
          <DepositMonitoringPanel />
        </TabsContent>

        <TabsContent value="governance">
          <GovernanceRiskPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
