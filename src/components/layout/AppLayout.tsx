import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingDown, 
  DollarSign, 
  PlusCircle,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useOrganisation } from '@/contexts/OrganisationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/portfolio-aging', label: 'Portfolio Ageing', icon: TrendingDown },
  { path: '/repayments', label: 'Repayments', icon: DollarSign },
  { path: '/data-entry', label: 'Data Entry', icon: PlusCircle },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { organisations, selectedOrgId, setSelectedOrgId, isLoading } = useOrganisation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Building2 className="h-7 w-7 text-sidebar-primary mr-3" />
          <span className="text-lg font-semibold text-sidebar-foreground">MFI Dashboard</span>
        </div>

        {/* Organisation Selector */}
        <div className="p-4 border-b border-sidebar-border">
          <label className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2 block">
            Organisation
          </label>
          <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId} disabled={isLoading}>
            <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue placeholder="Select organisation" />
            </SelectTrigger>
            <SelectContent>
              {organisations.map((org) => (
                <SelectItem key={org.org_id} value={org.org_id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
