import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganisationProvider } from "@/contexts/OrganisationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardRefreshProvider } from "@/contexts/DashboardRefreshContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DrilldownProvider, GlobalDrilldownModal } from "@/components/drilldown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const BoardDashboard = lazy(() => import("./pages/BoardDashboard"));
const ManagementDashboard = lazy(() => import("./pages/ManagementDashboard"));
const DepartmentalReports = lazy(() => import("./pages/DepartmentalReports"));
const RegulatoryReports = lazy(() => import("./pages/RegulatoryReports"));
const FinancialReports = lazy(() => import("./pages/FinancialReports"));
const PortfolioAging = lazy(() => import("./pages/PortfolioAging"));
const Repayments = lazy(() => import("./pages/Repayments"));
const DataEntry = lazy(() => import("./pages/DataEntry"));
const FieldOperations = lazy(() => import("./pages/FieldOperations"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const SyncConflicts = lazy(() => import("./pages/SyncConflicts"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Settings = lazy(() => import("./pages/Settings"));
const ShareholderDashboard = lazy(() => import("./pages/ShareholderDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const OrganisationOnboarding = lazy(() => import("./pages/OrganisationOnboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ActivateLicense = lazy(() => import("./pages/ActivateLicense"));
const DemoAccess = lazy(() => import("./pages/DemoAccess"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OrganisationProvider>
            <DashboardRefreshProvider>
              <DrilldownProvider>
                <Toaster />
                <Sonner />
                <GlobalDrilldownModal />
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public marketing & access routes */}
                      <Route path="/welcome" element={<LandingPage />} />
                      <Route path="/activate" element={<ActivateLicense />} />
                      <Route path="/demo" element={<DemoAccess />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/onboarding" element={<ProtectedRoute requireOrg={false}><OrganisationOnboarding /></ProtectedRoute>} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* Protected app routes */}
                      <Route
                        path="/*"
                        element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<PageLoader />}>
                                <Routes>
                                  <Route path="/" element={<ExecutiveDashboard />} />
                                  <Route path="/board" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'BOARD_DIRECTOR', 'MANAGER']}>
                                      <BoardDashboard />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/shareholders" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'BOARD_DIRECTOR', 'MANAGER']}>
                                      <ShareholderDashboard />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/management" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                      <ManagementDashboard />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/departments" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                      <DepartmentalReports />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/regulatory-reports" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                      <RegulatoryReports />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/financial-reports" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                      <FinancialReports />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/portfolio-aging" element={<PortfolioAging />} />
                                  <Route path="/repayments" element={<Repayments />} />
                                  <Route path="/field-operations" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'FIELD_OFFICER']}>
                                      <FieldOperations />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/data-entry" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TELLER', 'FIELD_OFFICER']}>
                                      <DataEntry />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/audit-log" element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                      <AuditLog />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/sync-conflicts" element={
                                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                      <SyncConflicts />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/user-management" element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                      <UserManagement />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/settings" element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                      <Settings />
                                    </ProtectedRoute>
                                  } />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </DrilldownProvider>
            </DashboardRefreshProvider>
          </OrganisationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
