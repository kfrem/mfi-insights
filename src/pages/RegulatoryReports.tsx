import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CARCalculator } from '@/components/regulatory/CARCalculator';
import { LiquidityCalculator } from '@/components/regulatory/LiquidityCalculator';
import { PrudentialReturnsTracker } from '@/components/regulatory/PrudentialReturnsTracker';
import { AMLReportsPanel } from '@/components/regulatory/AMLReportsPanel';
import { BogClassificationTable } from '@/components/dashboard/BogClassificationTable';
import { useBogClassification } from '@/hooks/useMfiData';
import { Shield, Percent, Droplets, FileCheck, AlertTriangle, ClipboardList } from 'lucide-react';

export default function RegulatoryReports() {
  const { data: bogData, isLoading: bogLoading } = useBogClassification();

  return (
    <div className="p-8">
      <header className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          BoG Regulatory Reports
        </h1>
        <p className="page-subtitle">
          Bank of Ghana prudential reporting, capital adequacy, and compliance monitoring
        </p>
      </header>

      <Tabs defaultValue="car" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="car" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Capital Adequacy</span>
            <span className="sm:hidden">CAR</span>
          </TabsTrigger>
          <TabsTrigger value="liquidity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">Liquidity Ratio</span>
            <span className="sm:hidden">Liquidity</span>
          </TabsTrigger>
          <TabsTrigger value="classification" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Classification</span>
            <span className="sm:hidden">Class.</span>
          </TabsTrigger>
          <TabsTrigger value="returns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Prudential Returns</span>
            <span className="sm:hidden">Returns</span>
          </TabsTrigger>
          <TabsTrigger value="aml" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">AML Reports</span>
            <span className="sm:hidden">AML</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="car" className="mt-6">
          <CARCalculator />
        </TabsContent>

        <TabsContent value="liquidity" className="mt-6">
          <LiquidityCalculator />
        </TabsContent>

        <TabsContent value="classification" className="mt-6">
          <BogClassificationTable data={bogData ?? []} isLoading={bogLoading} />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <PrudentialReturnsTracker />
        </TabsContent>

        <TabsContent value="aml" className="mt-6">
          <AMLReportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
