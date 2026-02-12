import { ReactNode, useState } from 'react';
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
  Users,
  Menu,
  Settings,
  PieChart
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { NetworkStatusIndicator } from '@/components/offline/NetworkStatusIndicator';
import { DemoModeBanner } from '@/components/layout/DemoModeBanner';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/board', label: 'Board Dashboard', icon: Briefcase, roles: ['ADMIN', 'BOARD_DIRECTOR', 'MANAGER'] },
  { path: '/shareholders', label: 'Investor Portal', icon: PieChart, roles: ['ADMIN', 'BOARD_DIRECTOR', 'MANAGER'] },
  { path: '/management', label: 'Management', icon: Activity, roles: ['ADMIN', 'MANAGER'] },
  { path: '/departments', label: 'Departments', icon: Building, roles: ['ADMIN', 'MANAGER'] },
  { path: '/regulatory-reports', label: 'BoG Reports', icon: Shield, roles: ['ADMIN', 'MANAGER'] },
  { path: '/financial-reports', label: 'Financial Reports', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { path: '/portfolio-aging', label: 'Portfolio Ageing', icon: TrendingDown },
  { path: '/repayments', label: 'Repayments', icon: DollarSign },
  { path: '/field-operations', label: 'Field Operations', icon: MapPin, roles: ['ADMIN', 'MANAGER', 'FIELD_OFFICER'] },
  { path: '/data-entry', label: 'Data Entry', icon: PlusCircle, roles: ['ADMIN', 'MANAGER', 'TELLER', 'FIELD_OFFICER'] },
  { path: '/user-management', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { path: '/audit-log', label: 'Audit Trail', icon: History, roles: ['ADMIN'] },
  { path: '/sync-conflicts', label: 'Sync Conflicts', icon: AlertTriangle, roles: ['ADMIN', 'MANAGER'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const location = useLocation();
  const { organisations, selectedOrgId, setSelectedOrgId, isLoading, isDemoMode } = useOrganisation();
  const { user, signOut, userRoles } = useAuth();

  const visibleNavItems = navItems.filter(item => {
    if (!item.roles || isDemoMode) return true;
    return userRoles.some(role => item.roles!.includes(role));
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-sidebar-border shrink-0">
        <Building2 className="h-6 w-6 lg:h-7 lg:w-7 text-sidebar-primary mr-2 lg:mr-3" />
        <span className="text-base lg:text-lg font-semibold text-sidebar-foreground">MFI Dashboard</span>
      </div>

      {/* Organisation Selector */}
      <div className="p-3 lg:p-4 border-b border-sidebar-border shrink-0">
        <label className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2 block">
          Organisation
        </label>
        <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId} disabled={isLoading}>
          <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm">
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
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Menu */}
      {user && (
        <div className="p-3 lg:p-4 border-t border-sidebar-border shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 lg:gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-auto py-2"
              >
                <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
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
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Demo Mode Banner */}
      <DemoModeBanner />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border h-14 flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center ml-3">
          <Building2 className="h-6 w-6 text-sidebar-primary mr-2" />
          <span className="text-base font-semibold text-sidebar-foreground">MFI Dashboard</span>
        </div>
        <div className="ml-auto">
          <NetworkStatusIndicator />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0">
        {/* Desktop Top Bar with Network Status */}
        <div className="hidden lg:block sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
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
