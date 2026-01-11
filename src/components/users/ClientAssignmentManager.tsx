import { useState } from 'react';
import { 
  useFieldOfficers, 
  useUnassignedClients, 
  useClientsByOfficer, 
  useAssignClient,
  useBulkAssignClients 
} from '@/hooks/useUserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, ArrowRight, X } from 'lucide-react';

export function ClientAssignmentManager() {
  const { data: fieldOfficers, isLoading: loadingOfficers } = useFieldOfficers();
  const { data: unassignedClients, isLoading: loadingUnassigned } = useUnassignedClients();
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const { data: assignedClients, isLoading: loadingAssigned } = useClientsByOfficer(selectedOfficer);
  const assignClient = useAssignClient();
  const bulkAssign = useBulkAssignClients();
  
  const [selectedUnassigned, setSelectedUnassigned] = useState<string[]>([]);

  const handleSelectUnassigned = (clientId: string) => {
    setSelectedUnassigned(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAllUnassigned = () => {
    if (selectedUnassigned.length === unassignedClients?.length) {
      setSelectedUnassigned([]);
    } else {
      setSelectedUnassigned(unassignedClients?.map(c => c.client_id) || []);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedOfficer || selectedUnassigned.length === 0) return;
    await bulkAssign.mutateAsync({ clientIds: selectedUnassigned, officerId: selectedOfficer });
    setSelectedUnassigned([]);
  };

  const handleUnassignClient = async (clientId: string) => {
    await assignClient.mutateAsync({ clientId, officerId: null });
  };

  const isLoading = loadingOfficers || loadingUnassigned;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Unassigned Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unassigned Clients
            {unassignedClients && unassignedClients.length > 0 && (
              <Badge variant="secondary">{unassignedClients.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Clients without an assigned field officer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !unassignedClients?.length ? (
            <p className="text-muted-foreground text-center py-8">
              All clients are assigned to field officers
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={selectedOfficer || ''} onValueChange={setSelectedOfficer}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field officer to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOfficers?.map((officer) => (
                      <SelectItem key={officer.user_id} value={officer.user_id}>
                        {officer.display_name || officer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAssign}
                  disabled={!selectedOfficer || selectedUnassigned.length === 0 || bulkAssign.isPending}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign ({selectedUnassigned.length})
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedUnassigned.length === unassignedClients.length}
                          onCheckedChange={handleSelectAllUnassigned}
                        />
                      </TableHead>
                      <TableHead>Client Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedClients.map((client) => (
                      <TableRow key={client.client_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUnassigned.includes(client.client_id)}
                            onCheckedChange={() => handleSelectUnassigned(client.client_id)}
                          />
                        </TableCell>
                        <TableCell>
                          {client.first_name} {client.last_name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Officer's Assigned Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Officer Portfolio
            {assignedClients && assignedClients.length > 0 && (
              <Badge variant="secondary">{assignedClients.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            View and manage clients assigned to a field officer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedOfficer || ''} onValueChange={setSelectedOfficer}>
              <SelectTrigger>
                <SelectValue placeholder="Select field officer..." />
              </SelectTrigger>
              <SelectContent>
                {fieldOfficers?.map((officer) => (
                  <SelectItem key={officer.user_id} value={officer.user_id}>
                    {officer.display_name || officer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!selectedOfficer ? (
              <p className="text-muted-foreground text-center py-8">
                Select a field officer to view their portfolio
              </p>
            ) : loadingAssigned ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !assignedClients?.length ? (
              <p className="text-muted-foreground text-center py-8">
                No clients assigned to this officer
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedClients.map((client) => (
                      <TableRow key={client.client_id}>
                        <TableCell>
                          {client.first_name} {client.last_name}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignClient(client.client_id)}
                            disabled={assignClient.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
