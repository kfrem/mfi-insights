import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Mail, Phone, TrendingUp, TrendingDown, UserCheck, UserX } from 'lucide-react';
import { formatGHS } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Shareholder } from '@/types/shareholder';

interface ShareholdersListProps {
  shareholders: Shareholder[];
  isLoading: boolean;
}

export function ShareholdersList({ shareholders, isLoading }: ShareholdersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const filteredShareholders = shareholders.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (shareholder: Shareholder) => {
    const newStatus = shareholder.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    
    const { error } = await supabase
      .from('shareholders')
      .update({ status: newStatus })
      .eq('id', shareholder.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success(`Shareholder ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
    queryClient.invalidateQueries({ queryKey: ['shareholders'] });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-status-current/10 text-status-current border-status-current/30">Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalInvestment = shareholders.reduce((sum, s) => sum + Number(s.total_investment), 0);
  const totalShares = shareholders.reduce((sum, s) => sum + s.share_units, 0);
  const activeShareholders = shareholders.filter(s => s.status === 'ACTIVE').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Shareholders Registry</CardTitle>
            <CardDescription>
              {activeShareholders} active investors • {totalShares.toLocaleString()} total shares • {formatGHS(totalInvestment)} invested
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shareholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Unit Value</TableHead>
                <TableHead className="text-right">Total Investment</TableHead>
                <TableHead>Since</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShareholders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No shareholders match your search' : 'No shareholders registered yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredShareholders.map((shareholder) => (
                  <TableRow key={shareholder.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shareholder.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {shareholder.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {shareholder.email}
                            </span>
                          )}
                          {shareholder.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {shareholder.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {shareholder.share_units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {Number(shareholder.share_unit_value) > 100 ? (
                          <TrendingUp className="h-3 w-3 text-status-current" />
                        ) : Number(shareholder.share_unit_value) < 100 ? (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        ) : null}
                        {formatGHS(Number(shareholder.share_unit_value))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGHS(Number(shareholder.total_investment))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(shareholder.investment_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shareholder.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(shareholder)}>
                            {shareholder.status === 'ACTIVE' ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
