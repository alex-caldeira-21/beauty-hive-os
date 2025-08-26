import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout title="Dashboard" />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/appointments" element={<MainLayout title="Agendamentos" />}>
            <Route index element={<Appointments />} />
          </Route>
          <Route path="/clients" element={<MainLayout title="Clientes" />}>
            <Route index element={<Clients />} />
          </Route>
          <Route path="/employees" element={<MainLayout title="Funcionários" />}>
            <Route index element={<Employees />} />
          </Route>
          <Route path="/inventory" element={<MainLayout title="Estoque" />}>
            <Route index element={<Inventory />} />
          </Route>
          <Route path="/sales" element={<MainLayout title="Vendas" />}>
            <Route index element={<Sales />} />
          </Route>
          <Route path="/reports" element={<MainLayout title="Relatórios" />}>
            <Route index element={<Reports />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
