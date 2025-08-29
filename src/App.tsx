import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import WhatsAppIntegration from "./pages/WhatsAppIntegration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout title="Dashboard" />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
            <Route path="/appointments" element={
              <ProtectedRoute>
                <MainLayout title="Agendamentos" />
              </ProtectedRoute>
            }>
              <Route index element={<Appointments />} />
            </Route>
            <Route path="/clients" element={
              <ProtectedRoute>
                <MainLayout title="Clientes" />
              </ProtectedRoute>
            }>
              <Route index element={<Clients />} />
            </Route>
            <Route path="/employees" element={
              <ProtectedRoute>
                <MainLayout title="Funcionários" />
              </ProtectedRoute>
            }>
              <Route index element={<Employees />} />
            </Route>
            <Route path="/services" element={
              <ProtectedRoute>
                <MainLayout title="Serviços" />
              </ProtectedRoute>
            }>
              <Route index element={<Services />} />
            </Route>
            <Route path="/inventory" element={
              <ProtectedRoute>
                <MainLayout title="Estoque" />
              </ProtectedRoute>
            }>
              <Route index element={<Inventory />} />
            </Route>
            <Route path="/sales" element={
              <ProtectedRoute>
                <MainLayout title="Vendas" />
              </ProtectedRoute>
            }>
              <Route index element={<Sales />} />
            </Route>
            <Route path="/reports" element={
              <ProtectedRoute>
                <MainLayout title="Relatórios" />
              </ProtectedRoute>
            }>
              <Route index element={<Reports />} />
            </Route>
            <Route path="/whatsapp" element={
              <ProtectedRoute>
                <MainLayout title="Integração WhatsApp" />
              </ProtectedRoute>
            }>
              <Route index element={<WhatsAppIntegration />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
