import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganisationProvider } from "@/contexts/OrganisationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
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
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<ExecutiveDashboard />} />
                        <Route path="/board" element={<BoardDashboard />} />
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
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </OrganisationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
