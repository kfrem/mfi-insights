import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useMfiData';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Search, Users, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import type { RiskCategory } from '@/types/mfi';

const riskCategoryConfig: Record<RiskCategory, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof Shield }> = {
  LOW: { label: 'Low Risk', variant: 'default', icon: Shield },
  MEDIUM: { label: 'Medium Risk', variant: 'secondary', icon: AlertTriangle },
  HIGH: { label: 'High Risk', variant: 'destructive', icon: ShieldAlert },
};

export function ClientListView() {
  const { data: clients, isLoading } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskCategory | 'ALL'>('ALL');

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
        client.occupation?.toLowerCase().includes(searchLower);
      
      // Risk category filter
      const matchesRisk = 
        riskFilter === 'ALL' || 
        client.risk_category === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [clients, searchQuery, riskFilter]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredClients.length} of {clients?.length || 0} clients
          </span>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Low: {riskCounts.LOW}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Medium: {riskCounts.MEDIUM}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            High: {riskCounts.HIGH}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, Ghana Card, phone, occupation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={riskFilter} onValueChange={(val) => setRiskFilter(val as RiskCategory | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by risk" />
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
              <TableHead>Name</TableHead>
              <TableHead>Ghana Card</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery || riskFilter !== 'ALL' 
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
                
                return (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium">
                      {client.first_name} {client.last_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {client.ghana_card_number || '—'}
                    </TableCell>
                    <TableCell>{client.phone || '—'}</TableCell>
                    <TableCell>{client.occupation || '—'}</TableCell>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
