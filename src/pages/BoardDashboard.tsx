import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExecutiveSummaryPanel } from '@/components/board/ExecutiveSummaryPanel';
import { StrategicKPIsPanel } from '@/components/board/StrategicKPIsPanel';
import { RiskAnalysisPanel } from '@/components/board/RiskAnalysisPanel';
import { TrendsAndPeerPanel } from '@/components/board/TrendsAndPeerPanel';
import { useBoardExecutiveSummary, useStrategicKPIs, useRiskMetrics, useQuarterlyTrends, usePeerComparison } from '@/hooks/useBoardData';
import { BoardPeriod } from '@/types/board';
import { Briefcase } from 'lucide-react';

export default function BoardDashboard() {
  const [period, setPeriod] = useState<BoardPeriod>('monthly');
  
  const { data: summary, isLoading: summaryLoading } = useBoardExecutiveSummary(period);
  const { data: kpis, isLoading: kpisLoading } = useStrategicKPIs();
  const { data: risks, isLoading: risksLoading } = useRiskMetrics();
  const { data: trends, isLoading: trendsLoading } = useQuarterlyTrends();
  const { data: peers, isLoading: peersLoading } = usePeerComparison();

  return (
    <div className="p-8">
      <header className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Board of Directors Dashboard
          </h1>
          <p className="page-subtitle">Strategic overview and governance reporting</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as BoardPeriod)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Tabs defaultValue="summary" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="kpis">Strategic KPIs</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Peers</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <ExecutiveSummaryPanel data={summary} isLoading={summaryLoading} period={period} />
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          <StrategicKPIsPanel data={kpis} isLoading={kpisLoading} />
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <RiskAnalysisPanel data={risks} isLoading={risksLoading} />
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <TrendsAndPeerPanel trendsData={trends} peerData={peers} isLoading={trendsLoading || peersLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
