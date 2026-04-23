import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeesPage from "./pages/admin/EmployeesPage";
import DocumentsPage from "./pages/admin/DocumentsPage";
import TimeTrackingPage from "./pages/admin/TimeTrackingPage";
import SettingsPage from "./pages/admin/SettingsPage";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useUserSync } from "./hooks/useUserSync";

const queryClient = new QueryClient();

const App = () => {
  // Automatically sync user to Convex database on login
  useUserSync();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute requireRole="admin">
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute requireRole="admin">
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/time-tracking"
              element={
                <ProtectedRoute requireRole="admin">
                  <TimeTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireRole="admin">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Employee Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute requireRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/*"
              element={
                <ProtectedRoute requireRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
