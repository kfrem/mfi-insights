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
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import BoardDashboard from "./pages/BoardDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import DepartmentalReports from "./pages/DepartmentalReports";
import RegulatoryReports from "./pages/RegulatoryReports";
import FinancialReports from "./pages/FinancialReports";
import PortfolioAging from "./pages/PortfolioAging";
import Repayments from "./pages/Repayments";
import DataEntry from "./pages/DataEntry";
import FieldOperations from "./pages/FieldOperations";
import AuditLog from "./pages/AuditLog";
import SyncConflicts from "./pages/SyncConflicts";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import ShareholderDashboard from "./pages/ShareholderDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrganisationOnboarding from "./pages/OrganisationOnboarding";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ActivateLicense from "./pages/ActivateLicense";
import DemoAccess from "./pages/DemoAccess";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

const App = () => (
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
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </DrilldownProvider>
          </DashboardRefreshProvider>
        </OrganisationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
