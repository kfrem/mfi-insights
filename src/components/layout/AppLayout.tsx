import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingDown, 
  DollarSign, 
  PlusCircle,
  Building2,
  LogOut,
  User,
  Shield,
  Activity,
  Briefcase,
  Building,
  FileText,
  MapPin,
  History,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NetworkStatusIndicator } from '@/components/offline/NetworkStatusIndicator';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/board', label: 'Board Dashboard', icon: Briefcase },
  { path: '/management', label: 'Management', icon: Activity },
  { path: '/departments', label: 'Departments', icon: Building },
  { path: '/regulatory-reports', label: 'BoG Reports', icon: Shield },
  { path: '/financial-reports', label: 'Financial Reports', icon: FileText },
  { path: '/portfolio-aging', label: 'Portfolio Ageing', icon: TrendingDown },
  { path: '/repayments', label: 'Repayments', icon: DollarSign },
  { path: '/field-operations', label: 'Field Operations', icon: MapPin },
  { path: '/data-entry', label: 'Data Entry', icon: PlusCircle },
  { path: '/user-management', label: 'User Management', icon: Users },
  { path: '/audit-log', label: 'Audit Trail', icon: History },
  { path: '/sync-conflicts', label: 'Sync Conflicts', icon: AlertTriangle },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { organisations, selectedOrgId, setSelectedOrgId, isLoading } = useOrganisation();
  const { user, signOut } = useAuth();
  
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
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
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
        
        {/* User Menu */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-sidebar-primary-foreground" />
                  </div>
                  <div className="flex-1 text-left truncate">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        {/* Top Bar with Network Status */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-end h-14 px-6">
            <NetworkStatusIndicator />
          </div>
        </div>
        
        <div className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
