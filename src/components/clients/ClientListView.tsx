import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useMfiData';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, AlertTriangle, Shield, ShieldAlert, FileText, User, Building2, Briefcase } from 'lucide-react';
import { ClientDocumentsModal } from './ClientDocumentsModal';
import { GroupMembersModal } from './GroupMembersModal';
import type { RiskCategory, Client, ClientType } from '@/types/mfi';

const riskCategoryConfig: Record<RiskCategory, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof Shield }> = {
  LOW: { label: 'Low Risk', variant: 'default', icon: Shield },
  MEDIUM: { label: 'Medium Risk', variant: 'secondary', icon: AlertTriangle },
  HIGH: { label: 'High Risk', variant: 'destructive', icon: ShieldAlert },
};

const clientTypeConfig: Record<ClientType, { label: string; icon: typeof User; variant: 'default' | 'secondary' | 'outline' }> = {
  INDIVIDUAL: { label: 'Individual', icon: User, variant: 'outline' },
  GROUP: { label: 'Group', icon: Users, variant: 'default' },
  COOPERATIVE: { label: 'Cooperative', icon: Building2, variant: 'secondary' },
  SME: { label: 'SME', icon: Briefcase, variant: 'secondary' },
};

export function ClientListView() {
  const { data: clients, isLoading } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskCategory | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ClientType | 'ALL'>('ALL');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const handleViewDocs = (client: Client) => {
    setSelectedClient(client);
    setIsDocsModalOpen(true);
  };

  const handleViewMembers = (client: Client) => {
    setSelectedClient(client);
    setIsMembersModalOpen(true);
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter((client) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        client.first_name?.toLowerCase().includes(searchLower) ||
        client.last_name?.toLowerCase().includes(searchLower) ||
        client.ghana_card_number?.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower) ||
        client.occupation?.toLowerCase().includes(searchLower) ||
        client.group_name?.toLowerCase().includes(searchLower);
      
      // Risk category filter
      const matchesRisk = 
        riskFilter === 'ALL' || 
        client.risk_category === riskFilter;

      // Client type filter
      const matchesType =
        typeFilter === 'ALL' ||
        client.client_type === typeFilter;
      
      return matchesSearch && matchesRisk && matchesType;
    });
  }, [clients, searchQuery, riskFilter, typeFilter]);

  const riskCounts = useMemo(() => {
    if (!clients) return { LOW: 0, MEDIUM: 0, HIGH: 0 };
    return clients.reduce(
      (acc, client) => {
        if (client.risk_category) {
          acc[client.risk_category as RiskCategory]++;
        }
        return acc;
      },
      { LOW: 0, MEDIUM: 0, HIGH: 0 }
    );
  }, [clients]);

  const typeCounts = useMemo(() => {
    if (!clients) return { INDIVIDUAL: 0, GROUP: 0, COOPERATIVE: 0, SME: 0 };
    return clients.reduce(
      (acc, client) => {
        const type = client.client_type || 'INDIVIDUAL';
        acc[type as ClientType]++;
        return acc;
      },
      { INDIVIDUAL: 0, GROUP: 0, COOPERATIVE: 0, SME: 0 }
    );
  }, [clients]);

  const isGroupClient = (client: Client) => 
    client.client_type === 'GROUP' || 
    client.client_type === 'COOPERATIVE' || 
    client.client_type === 'SME';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredClients.length} of {clients?.length || 0} clients
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Individual: {typeCounts.INDIVIDUAL}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Groups: {typeCounts.GROUP}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            Cooperatives: {typeCounts.COOPERATIVE}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Briefcase className="h-3 w-3" />
            SMEs: {typeCounts.SME}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, Ghana Card, phone, group name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as ClientType | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Client type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
            <SelectItem value="GROUP">Group</SelectItem>
            <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
            <SelectItem value="SME">SME</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={(val) => setRiskFilter(val as RiskCategory | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Risk Levels</SelectItem>
            <SelectItem value="LOW">Low Risk</SelectItem>
            <SelectItem value="MEDIUM">Medium Risk</SelectItem>
            <SelectItem value="HIGH">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Ghana Card</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery || riskFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'No clients match your filters' 
                    : 'No clients found. Create your first client above.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const riskConfig = client.risk_category 
                  ? riskCategoryConfig[client.risk_category as RiskCategory] 
                  : null;
                const RiskIcon = riskConfig?.icon || Shield;
                const typeConfig = clientTypeConfig[client.client_type as ClientType] || clientTypeConfig.INDIVIDUAL;
                const TypeIcon = typeConfig.icon;
                const isGroup = isGroupClient(client);
                
                return (
                  <TableRow key={client.client_id}>
                    <TableCell>
                      <Badge variant={typeConfig.variant} className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        {isGroup && client.group_name ? (
                          <>
                            <div>{client.group_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Contact: {client.first_name} {client.last_name}
                            </div>
                          </>
                        ) : (
                          `${client.first_name} ${client.last_name}`
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {client.ghana_card_number || '—'}
                    </TableCell>
                    <TableCell>{client.phone || '—'}</TableCell>
                    <TableCell>
                      {riskConfig ? (
                        <Badge variant={riskConfig.variant} className="gap-1">
                          <RiskIcon className="h-3 w-3" />
                          {riskConfig.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {client.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isGroup && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMembers(client)}
                            className="gap-1"
                          >
                            <Users className="h-4 w-4" />
                            Members
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocs(client)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Docs
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Documents Modal */}
      <ClientDocumentsModal
        client={selectedClient}
        open={isDocsModalOpen}
        onOpenChange={setIsDocsModalOpen}
      />

      {/* Group Members Modal */}
      <GroupMembersModal
        client={selectedClient}
        open={isMembersModalOpen}
        onOpenChange={setIsMembersModalOpen}
      />
    </div>
  );
}