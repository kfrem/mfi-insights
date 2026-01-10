import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyOperationsPanel } from '@/components/management/DailyOperationsPanel';
import { CollectionsChart, DisbursementsChart } from '@/components/management/PerformanceCharts';
import { StaffProductivityPanel } from '@/components/management/StaffProductivityPanel';
import { ArrearsTrackerPanel, ActivityLogPanel } from '@/components/management/ArrearsActivityPanels';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Activity 
} from 'lucide-react';

export default function ManagementDashboard() {
  return (
    <div className="p-8">
      <header className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Management Dashboard
        </h1>
        <p className="page-subtitle">
          Daily operations, collections performance, and staff productivity
        </p>
      </header>

      <Tabs defaultValue="operations" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="operations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Operations</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Collections</span>
            <span className="sm:hidden">Collect</span>
          </TabsTrigger>
          <TabsTrigger value="disbursements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Disbursements</span>
            <span className="sm:hidden">Disburse</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Staff Productivity</span>
            <span className="sm:hidden">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="arrears" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Arrears Tracker</span>
            <span className="sm:hidden">Arrears</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="mt-6 space-y-6">
          <DailyOperationsPanel />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityLogPanel />
          </div>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <CollectionsChart />
        </TabsContent>

        <TabsContent value="disbursements" className="mt-6">
          <DisbursementsChart />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <StaffProductivityPanel />
        </TabsContent>

        <TabsContent value="arrears" className="mt-6">
          <ArrearsTrackerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
