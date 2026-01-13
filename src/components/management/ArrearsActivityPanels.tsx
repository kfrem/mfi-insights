import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useArrearsTracker, useDailyActivityLog } from '@/hooks/useManagementData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  Users,
  FileText,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { formatDate, parseISO } from '@/lib/dateUtils';
import { useDrilldown } from '@/components/drilldown/DrilldownContext';
import { DrilldownConfig } from '@/components/drilldown/types';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export function ArrearsTrackerPanel() {
  const { data: arrears, isLoading } = useArrearsTracker();
  const drilldown = useDrilldown();

  const highPriorityConfig: DrilldownConfig = {
    metricId: 'high_priority_arrears',
    title: 'High Priority Arrears',
    hasSource: true,
    sourceDescription: 'Loans marked as high priority for collections',
    calculation: 'Loans with arrears amount > GHS 5,000 OR days overdue > 60'
  };

  const totalArrearsConfig: DrilldownConfig = {
    metricId: 'total_arrears_amount',
    title: 'Total Arrears',
    hasSource: true,
    sourceDescription: 'Sum of all overdue amounts across all delinquent loans',
    calculation: 'Sum of (expected repayment - actual repayment) for all overdue loans'
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!arrears || arrears.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-status-current" />
          <p>No overdue loans requiring attention</p>
        </CardContent>
      </Card>
    );
  }

  const highPriority = arrears.filter(a => a.priority === 'High');
  const totalArrears = arrears.reduce((sum, a) => sum + a.arrears_amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ${highPriority.length > 0 ? 'border-status-loss' : ''}`}
          onClick={() => drilldown.openDrilldown(highPriorityConfig)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-status-loss flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-status-loss underline decoration-dotted underline-offset-4 decoration-primary/40">
              {highPriority.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{arrears.length}</span>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
          onClick={() => drilldown.openDrilldown(totalArrearsConfig)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrears</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold underline decoration-dotted underline-offset-4 decoration-primary/40">
              {formatCurrency(totalArrears)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Arrears List */}
      {arrears.map((a) => (
        <Card key={a.loan_id} className={a.priority === 'High' ? 'border-status-loss' : a.priority === 'Medium' ? 'border-status-watch' : ''}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.client_name}</span>
                  <Badge 
                    variant={a.priority === 'High' ? 'destructive' : a.priority === 'Medium' ? 'outline' : 'secondary'}
                    className={a.priority === 'Medium' ? 'bg-status-watch/10 text-status-watch border-status-watch' : ''}
                  >
                    {a.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{a.loan_id}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {a.phone}
                  </span>
                  <span>Officer: {a.officer_name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-status-loss">{formatCurrency(a.arrears_amount)}</p>
                <p className="text-xs text-muted-foreground">{a.days_overdue} days overdue</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Outstanding: {formatCurrency(a.principal_outstanding)}</span>
                <span>Last payment: {formatDate(parseISO(a.last_payment_date), 'dd MMM yyyy')}</span>
                {a.last_contact_date && (
                  <span>Last contact: {formatDate(parseISO(a.last_contact_date), 'dd MMM')}</span>
                )}
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                {a.next_action}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ActivityLogPanel() {
  const { data: activities, isLoading } = useDailyActivityLog();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Disbursement': return <Wallet className="h-4 w-4 text-primary" />;
      case 'Repayment': return <CheckCircle className="h-4 w-4 text-status-current" />;
      case 'Client Visit': return <MapPin className="h-4 w-4 text-status-watch" />;
      case 'Application': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'Approval': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'Disbursement': return 'bg-primary/10 text-primary border-primary';
      case 'Repayment': return 'bg-status-current/10 text-status-current border-status-current';
      case 'Client Visit': return 'bg-status-watch/10 text-status-watch border-status-watch';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Activity Log
          </CardTitle>
          <Badge variant="outline">{activities?.length ?? 0} activities</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No activities recorded today</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.activity_id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getActivityColor(activity.activity_type)}>
                      {activity.activity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(parseISO(activity.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>By: {activity.staff_name}</span>
                    {activity.client_name && <span>Client: {activity.client_name}</span>}
                    {activity.amount && <span className="font-medium text-foreground">{formatCurrency(activity.amount)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
