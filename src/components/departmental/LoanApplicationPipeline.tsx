import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ApplicationPipeline } from '@/types/departmental';
import { FileText, FolderOpen, ClipboardCheck, Users, CheckCircle, Banknote, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface LoanApplicationPipelineProps {
  data: ApplicationPipeline[];
}

const stageConfig: Record<ApplicationPipeline['stage'], { icon: React.ElementType; color: string; bgColor: string }> = {
  'New': { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  'Documents': { icon: FolderOpen, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950' },
  'Appraisal': { icon: ClipboardCheck, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  'Committee': { icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950' },
  'Approval': { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950' },
  'Disbursement': { icon: Banknote, color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950' },
};

const stageOrder: ApplicationPipeline['stage'][] = ['New', 'Documents', 'Appraisal', 'Committee', 'Approval', 'Disbursement'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

export default function LoanApplicationPipeline({ data }: LoanApplicationPipelineProps) {
  const totalApplications = data.reduce((sum, stage) => sum + stage.count, 0);
  const totalAmount = data.reduce((sum, stage) => sum + stage.total_amount, 0);
  
  // Sort data by stage order
  const sortedData = stageOrder.map(stage => data.find(d => d.stage === stage)).filter(Boolean) as ApplicationPipeline[];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Loan Application Pipeline
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalApplications} applications</span>
            </span>
            <span className="text-muted-foreground">
              Value: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Pipeline Flow Visualization */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
            {sortedData.map((stage, idx) => {
              const config = stageConfig[stage.stage];
              const Icon = config.icon;
              const percentage = totalApplications > 0 ? (stage.count / totalApplications) * 100 : 0;
              const isBottleneck = stage.avg_days_in_stage > 3;
              
              return (
                <TooltipProvider key={stage.stage}>
                  <div className="flex items-center flex-1 min-w-[140px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`relative flex-1 rounded-lg p-4 ${config.bgColor} border-2 border-transparent hover:border-primary/30 transition-colors cursor-pointer`}>
                          {isBottleneck && (
                            <div className="absolute -top-2 -right-2">
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Slow
                              </Badge>
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center">
                            <div className={`p-2 rounded-full ${config.bgColor} mb-2`}>
                              <Icon className={`h-6 w-6 ${config.color}`} />
                            </div>
                            <span className="text-sm font-medium">{stage.stage}</span>
                            <span className="text-2xl font-bold mt-1">{stage.count}</span>
                            <span className="text-xs text-muted-foreground">{formatCurrency(stage.total_amount)}</span>
                          </div>
                          <div className="mt-3">
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{stage.stage} Stage</p>
                          <p className="text-sm">Applications: {stage.count}</p>
                          <p className="text-sm">Total Value: {formatCurrency(stage.total_amount)}</p>
                          <p className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Avg Time: {stage.avg_days_in_stage.toFixed(1)} days
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Oldest: {stage.oldest_application_days} days
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    {idx < sortedData.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground mx-1 flex-shrink-0" />
                    )}
                  </div>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Stage Details Table */}
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Stage</th>
                <th className="text-right p-3 font-medium">Applications</th>
                <th className="text-right p-3 font-medium">Value</th>
                <th className="text-right p-3 font-medium">Avg Days</th>
                <th className="text-right p-3 font-medium">Oldest (Days)</th>
                <th className="text-right p-3 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((stage) => {
                const config = stageConfig[stage.stage];
                const Icon = config.icon;
                const percentage = totalApplications > 0 ? (stage.count / totalApplications) * 100 : 0;
                
                return (
                  <tr key={stage.stage} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                    </td>
                    <td className="text-right p-3 font-semibold">{stage.count}</td>
                    <td className="text-right p-3">{formatCurrency(stage.total_amount)}</td>
                    <td className="text-right p-3">
                      <span className={stage.avg_days_in_stage > 3 ? 'text-destructive font-medium' : ''}>
                        {stage.avg_days_in_stage.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className={stage.oldest_application_days > 7 ? 'text-destructive font-medium' : ''}>
                        {stage.oldest_application_days}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="p-3">Total</td>
                <td className="text-right p-3">{totalApplications}</td>
                <td className="text-right p-3">{formatCurrency(totalAmount)}</td>
                <td className="text-right p-3">—</td>
                <td className="text-right p-3">—</td>
                <td className="text-right p-3">
                  <Badge>100%</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>Bottleneck: Avg &gt; 3 days in stage</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Oldest: Longest pending application</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
