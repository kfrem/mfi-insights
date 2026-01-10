import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoansForWorkflow, useTransitionLoanStatus, useLoanAuditTrail } from '@/hooks/useLoanWorkflow';
import { STATUS_CONFIG, STATUS_TRANSITIONS, type LoanStatus, type LoanWithClient } from '@/types/loanWorkflow';
import { format } from 'date-fns';
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  Banknote, 
  TrendingUp, 
  CheckCheck, 
  AlertTriangle, 
  XCircle, 
  Ban,
  History,
  ArrowRight,
  Filter
} from 'lucide-react';

const statusIcons: Record<string, React.ReactNode> = {
  Clock: <Clock className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
  Banknote: <Banknote className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  CheckCheck: <CheckCheck className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  XCircle: <XCircle className="h-4 w-4" />,
  Ban: <Ban className="h-4 w-4" />,
};

function StatusBadge({ status }: { status: LoanStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={`${config.bgColor} ${config.color} border-0 gap-1`}>
      {statusIcons[config.icon]}
      {config.label}
    </Badge>
  );
}

interface TransitionDialogProps {
  loan: LoanWithClient | null;
  targetStatus: LoanStatus | null;
  onClose: () => void;
}

function TransitionDialog({ loan, targetStatus, onClose }: TransitionDialogProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const transitionMutation = useTransitionLoanStatus();

  if (!loan || !targetStatus) return null;

  const handleSubmit = async () => {
    await transitionMutation.mutateAsync({
      loanId: loan.loan_id,
      newStatus: targetStatus,
      notes: notes || undefined,
      rejectionReason: rejectionReason || undefined,
      disbursedAmount: targetStatus === 'DISBURSED' ? Number(disbursedAmount) || loan.principal : undefined,
    });
    onClose();
  };

  const isRejection = targetStatus === 'REJECTED';
  const isDisbursement = targetStatus === 'DISBURSED';

  return (
    <Dialog open={!!loan && !!targetStatus} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transition to <StatusBadge status={targetStatus} />
          </DialogTitle>
          <DialogDescription>
            {STATUS_CONFIG[targetStatus].description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Loan Details</p>
            <p className="font-medium">
              {loan.clients?.first_name} {loan.clients?.last_name}
            </p>
            <p className="text-sm">
              Principal: GHS {loan.principal.toLocaleString()} • {loan.term_months} months
            </p>
          </div>

          {isDisbursement && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Disbursed Amount (GHS)</label>
              <Input
                type="number"
                placeholder={loan.principal.toString()}
                value={disbursedAmount}
                onChange={(e) => setDisbursedAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use approved principal amount
              </p>
            </div>
          )}

          {isRejection && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Provide reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={transitionMutation.isPending || (isRejection && !rejectionReason)}
            variant={isRejection ? 'destructive' : 'default'}
          >
            {transitionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm {STATUS_CONFIG[targetStatus].label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditTrailPanel({ loanId }: { loanId: string | null }) {
  const { data: auditTrail, isLoading } = useLoanAuditTrail(loanId);

  if (!loanId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a loan to view its audit trail
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!auditTrail?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No status changes recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {auditTrail.map((entry, index) => (
        <div 
          key={entry.id} 
          className={`relative pl-6 pb-6 ${index < auditTrail.length - 1 ? 'border-l-2 border-muted' : ''}`}
        >
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.previous_status && (
                <>
                  <StatusBadge status={entry.previous_status as LoanStatus} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </>
              )}
              <StatusBadge status={entry.new_status as LoanStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(entry.changed_at), 'PPpp')}
            </p>
            {entry.notes && (
              <p className="text-sm bg-muted/50 rounded p-2 mt-2">{entry.notes}</p>
            )}
            {entry.rejection_reason && (
              <p className="text-sm bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded p-2 mt-2">
                <strong>Rejection:</strong> {entry.rejection_reason}
              </p>
            )}
            {entry.approval_amount && (
              <p className="text-sm text-green-600">
                Disbursed: GHS {entry.approval_amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoanWorkflowPanel() {
  const { data: loans, isLoading } = useLoansForWorkflow();
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [selectedLoan, setSelectedLoan] = useState<LoanWithClient | null>(null);
  const [targetStatus, setTargetStatus] = useState<LoanStatus | null>(null);
  const [auditLoanId, setAuditLoanId] = useState<string | null>(null);

  const filteredLoans = loans?.filter(loan => 
    statusFilter === 'ALL' || loan.status === statusFilter
  ) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS', 
      minimumFractionDigits: 0 
    }).format(value);
  };

  const handleTransition = (loan: LoanWithClient, newStatus: LoanStatus) => {
    setSelectedLoan(loan);
    setTargetStatus(newStatus);
  };

  // Count loans by status
  const statusCounts = loans?.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Status Pipeline Overview */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setStatusFilter(status as LoanStatus)}
          >
            <CardContent className="p-3 text-center">
              <div className={`inline-flex p-2 rounded-full ${config.bgColor} mb-2`}>
                {statusIcons[config.icon]}
              </div>
              <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Reset */}
      {statusFilter !== 'ALL' && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Showing {STATUS_CONFIG[statusFilter].label} loans
          </span>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('ALL')}>
            Clear filter
          </Button>
        </div>
      )}

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Loan Queue</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Loan Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No loans found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-center">Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => {
                      const availableTransitions = STATUS_TRANSITIONS[loan.status];
                      
                      return (
                        <TableRow key={loan.loan_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {loan.clients?.first_name} {loan.clients?.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {loan.clients?.ghana_card_number}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{loan.loan_type}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(loan.principal)}
                          </TableCell>
                          <TableCell className="text-center">
                            {loan.term_months}m
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={loan.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(loan.application_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAuditLoanId(loan.loan_id)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              {availableTransitions.length > 0 && (
                                <Select
                                  onValueChange={(value) => handleTransition(loan, value as LoanStatus)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Action..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTransitions.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {STATUS_CONFIG[status].label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Status Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Loan Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Loan</label>
                  <Select 
                    value={auditLoanId || ''} 
                    onValueChange={setAuditLoanId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a loan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loans?.map((loan) => (
                        <SelectItem key={loan.loan_id} value={loan.loan_id}>
                          {loan.clients?.first_name} {loan.clients?.last_name} - {formatCurrency(loan.principal)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audit Trail */}
                <div className="md:col-span-2">
                  <AuditTrailPanel loanId={auditLoanId} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransitionDialog
        loan={selectedLoan}
        targetStatus={targetStatus}
        onClose={() => {
          setSelectedLoan(null);
          setTargetStatus(null);
        }}
      />
    </div>
  );
}
