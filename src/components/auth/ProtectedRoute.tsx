import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

export function ProtectedRoute({ children, requireOrg = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { organisations, isLoading: orgLoading } = useOrganisation();
  const location = useLocation();

  // Demo mode only allowed in development builds — production requires real auth
  const isDemoMode = import.meta.env.DEV && sessionStorage.getItem('mfi_demo_mode') === 'true';

  // Show loading while checking auth (skip if demo mode)
  if (!isDemoMode && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to landing if not authenticated and not in demo mode
  if (!isDemoMode && !isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // Show loading while checking organisations (skip for demo mode)
  if (!isDemoMode && requireOrg && orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to onboarding if user has no organisations (except on onboarding page)
  if (!isDemoMode && requireOrg && organisations.length === 0 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Helper to clear demo mode - can be used when navigating away
export function clearDemoMode() {
  sessionStorage.removeItem('mfi_demo_mode');
}
