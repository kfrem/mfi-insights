import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, User, Phone, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Client } from '@/types/mfi';

interface ClientSearchSelectProps {
  clients: Client[] | undefined;
  isLoading: boolean;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ClientSearchSelect({
  clients,
  isLoading,
  value,
  onValueChange,
  placeholder = 'Search clients...',
}: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedClient = useMemo(() => {
    if (!value || !clients) return null;
    return clients.find((c) => c.client_id === value);
  }, [value, clients]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.first_name.toLowerCase().includes(query) ||
        client.last_name.toLowerCase().includes(query) ||
        client.ghana_card_number.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.occupation?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
        >
          {selectedClient ? (
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {selectedClient.first_name} {selectedClient.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedClient.ghana_card_number}
                </p>
              </div>
              <Badge variant={getRiskBadgeVariant(selectedClient.risk_category)} className="text-xs">
                {selectedClient.risk_category}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, Ghana Card, or phone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <User className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No clients found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search or create a new client
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup heading={`${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} found`}>
              {filteredClients.slice(0, 50).map((client) => (
                <CommandItem
                  key={client.client_id}
                  value={client.client_id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="py-3"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <Badge
                          variant={getRiskBadgeVariant(client.risk_category)}
                          className="text-xs flex-shrink-0"
                        >
                          {client.risk_category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {client.ghana_card_number}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.occupation && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {client.occupation}
                          </span>
                        )}
                      </div>
                      {(client.monthly_income || client.monthly_expenses) && (
                        <div className="flex gap-3 text-xs pt-1">
                          {client.monthly_income && (
                            <span className="text-green-600">
                              Income: {formatCurrency(client.monthly_income)}
                            </span>
                          )}
                          {client.monthly_expenses && (
                            <span className="text-amber-600">
                              Expenses: {formatCurrency(client.monthly_expenses)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        value === client.client_id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredClients.length > 50 && (
              <div className="py-2 px-3 text-xs text-muted-foreground text-center border-t">
                Showing first 50 results. Refine your search to see more.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
