import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import WebGIS from "./pages/WebGIS";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider, useAuth, UserRole } from "./context/AuthContext";
import CreateProject from "./pages/CreateProject";
import ManageProject from "./pages/ManageProject";
import Verification from "./pages/Verification";
import WeeklyReport from "./pages/WeeklyReport";
import MonthlyReport from "./pages/MonthlyReport";
import IntegrationPage from "./pages/Integration";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route 
              path="/projects/create" 
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PPTK", "PPK"]}>
                  <CreateProject />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id/manage" 
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PPTK", "PPK", "KONSULTAN", "KONTRAKTOR", "KONTRAKTOR_UMUM"]}>
                  <ManageProject />
                </ProtectedRoute>
              } 
            />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/reports/weekly" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
            <Route path="/reports/monthly" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
            <Route 
              path="/verification" 
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PPK", "PPTK", "STAF_DINAS"]}>
                  <Verification />
                </ProtectedRoute>
              } 
            />
            <Route path="/webgis" element={<ProtectedRoute><WebGIS /></ProtectedRoute>} />
            <Route 
              path="/integration" 
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <IntegrationPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
