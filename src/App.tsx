import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganisationProvider } from "@/contexts/OrganisationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardRefreshProvider } from "@/contexts/DashboardRefreshContext";
import { RegulatoryProvider } from "@/contexts/RegulatoryContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DrilldownProvider, GlobalDrilldownModal } from "@/components/drilldown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import '@/lib/i18n'; // Initialize i18n

// Lazy-loaded route components for code splitting
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
const SalesDemo = lazy(() => import("./pages/SalesDemo"));

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
        <RegulatoryProvider>
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
                        <Route path="/sales" element={<SalesDemo />} />
                        <Route path="/demo" element={<DemoAccess />} />
                        <Route path="/demo-access" element={<DemoAccess />} />
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
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                      <Route path="/" element={<ExecutiveDashboard />} />
                                      <Route path="/board" element={<BoardDashboard />} />
                                      <Route path="/shareholders" element={<ShareholderDashboard />} />
                                      <Route path="/management" element={<ManagementDashboard />} />
                                      <Route path="/departments" element={<DepartmentalReports />} />
                                      <Route path="/regulatory-reports" element={<RegulatoryReports />} />
                                      <Route path="/financial-reports" element={<FinancialReports />} />
                                      <Route path="/portfolio-aging" element={<PortfolioAging />} />
                                      <Route path="/repayments" element={<Repayments />} />
                                      <Route path="/field-operations" element={<FieldOperations />} />
                                      <Route path="/data-entry" element={<DataEntry />} />
                                      <Route path="/audit-log" element={<AuditLog />} />
                                      <Route path="/sync-conflicts" element={<SyncConflicts />} />
                                      <Route path="/user-management" element={<UserManagement />} />
                                      <Route path="/settings" element={<Settings />} />
                                      <Route path="*" element={<NotFound />} />
                                    </Routes>
                                  </Suspense>
                                </ErrorBoundary>
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
        </RegulatoryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
