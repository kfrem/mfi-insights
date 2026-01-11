import { useState } from 'react';
import { format } from 'date-fns';
import { 
  History, 
  User, 
  LogIn, 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye,
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuditLogs } from '@/hooks/useAuditLog';
import { ActionType, EntityType, ActivityAuditLog } from '@/types/audit';
import { useOrganisation } from '@/contexts/OrganisationContext';

export function AuditLogViewer() {
  const { selectedOrgId } = useOrganisation();
  const [actionFilter, setActionFilter] = useState<ActionType | 'ALL'>('ALL');
  const [entityFilter, setEntityFilter] = useState<EntityType | 'ALL'>('ALL');
  const [selectedLog, setSelectedLog] = useState<ActivityAuditLog | null>(null);

  const logs = useAuditLogs(selectedOrgId || '', {
    actionType: actionFilter === 'ALL' ? undefined : actionFilter,
    entityType: entityFilter === 'ALL' ? undefined : entityFilter,
  });

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'LOGIN':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'LOGOUT':
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'CREATE':
        return <Plus className="h-4 w-4 text-blue-600" />;
      case 'UPDATE':
        return <Pencil className="h-4 w-4 text-orange-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'VIEW':
        return <Eye className="h-4 w-4 text-purple-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: ActionType) => {
    const variants: Record<ActionType, string> = {
      LOGIN: 'bg-green-100 text-green-700 border-green-200',
      LOGOUT: 'bg-gray-100 text-gray-700 border-gray-200',
      CREATE: 'bg-blue-100 text-blue-700 border-blue-200',
      UPDATE: 'bg-orange-100 text-orange-700 border-orange-200',
      DELETE: 'bg-red-100 text-red-700 border-red-200',
      VIEW: 'bg-purple-100 text-purple-700 border-purple-200',
    };

    return (
      <Badge variant="outline" className={variants[action]}>
        {getActionIcon(action)}
        <span className="ml-1">{action}</span>
      </Badge>
    );
  };

  const exportLogs = () => {
    if (!logs.data) return;
    
    const csv = [
      ['Timestamp', 'Action', 'Entity', 'Entity ID', 'User Agent'].join(','),
      ...logs.data.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action_type,
        log.entity_type,
        log.entity_id || '',
        `"${log.user_agent || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (logs.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity Audit Log
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionType | 'ALL')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v as EntityType | 'ALL')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
                <SelectItem value="field_collection">Field Collection</SelectItem>
                <SelectItem value="session">Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action_type as ActionType)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.entity_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {log.entity_id?.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!logs.data || logs.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  {getActionBadge(selectedLog.action_type as ActionType)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-sm">{selectedLog.entity_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{selectedLog.user_id || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Previous Values</p>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">New Values</p>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Additional Metadata</p>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm text-muted-foreground">User Agent</p>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
