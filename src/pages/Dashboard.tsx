import { useState, useEffect } from "react";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    totalClients: 0,
    lowStock: 0,
  });
  const [revenueData, setRevenueData] = useState<{ date: string; value: number }[]>([]);
  const [appointmentData, setAppointmentData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Today's appointments
        const { data: todayAppts } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .eq('appointment_date', today);

        // Today's revenue from sales
        const { data: todaySales } = await supabase
          .from('sales')
          .select('total')
          .eq('user_id', user.id)
          .eq('sale_date', today);

        // Total clients count
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        // Low stock products (quantity < 10)
        const { data: lowStockData } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .lt('stock_quantity', 10);

        // Last 7 days revenue data
        const { data: last7DaysRevenue } = await supabase
          .from('sales')
          .select('sale_date, total')
          .eq('user_id', user.id)
          .gte('sale_date', sevenDaysAgo)
          .order('sale_date');

        // Last 7 days appointments data
        const { data: last7DaysAppts } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('user_id', user.id)
          .gte('appointment_date', sevenDaysAgo)
          .order('appointment_date');

        // Upcoming appointments (current week)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of current week
        
        const { data: upcomingData } = await supabase
          .from('appointments')
          .select(`
            *,
            clients(name),
            employees(name),
            services(name)
          `)
          .eq('user_id', user.id)
          .gte('appointment_date', weekStart.toISOString().split('T')[0])
          .lte('appointment_date', weekEnd.toISOString().split('T')[0])
          .order('appointment_date')
          .order('start_time');

        // Process metrics
        setMetrics({
          todayAppointments: todayAppts?.length || 0,
          todayRevenue: todaySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0,
          totalClients: clientsData?.length || 0,
          lowStock: lowStockData?.length || 0,
        });

        // Process revenue chart data
        const revenueByDate: { [key: string]: number } = {};
        last7DaysRevenue?.forEach(sale => {
          const date = new Date(sale.sale_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          revenueByDate[date] = (revenueByDate[date] || 0) + (sale.total || 0);
        });

        // Process appointments chart data
        const appointmentsByDate: { [key: string]: number } = {};
        last7DaysAppts?.forEach(appt => {
          const date = new Date(appt.appointment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          appointmentsByDate[date] = (appointmentsByDate[date] || 0) + 1;
        });

        // Generate last 7 days array
        const chartData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          return {
            date: dateStr,
            revenue: revenueByDate[dateStr] || 0,
            appointments: appointmentsByDate[dateStr] || 0,
          };
        });

        setRevenueData(chartData.map(d => ({ date: d.date, value: d.revenue })));
        setAppointmentData(chartData.map(d => ({ date: d.date, value: d.appointments })));
        setUpcomingAppointments(upcomingData || []);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Agendamentos Hoje"
          value={metrics.todayAppointments.toString()}
          subtitle={metrics.todayAppointments > 0 ? `${metrics.todayAppointments} agendamento${metrics.todayAppointments > 1 ? 's' : ''} hoje` : "Nenhum agendamento hoje"}
          icon={Calendar}
          variant="info"
        />
        
        <MetricCard
          title="Receita Hoje"
          value={`R$ ${metrics.todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={metrics.todayRevenue > 0 ? "Vendas realizadas hoje" : "Nenhuma venda hoje"}
          icon={DollarSign}
          variant="success"
        />
        
        <MetricCard
          title="Total de Clientes"
          value={metrics.totalClients.toString()}
          subtitle={`${metrics.totalClients} cliente${metrics.totalClients !== 1 ? 's' : ''} cadastrado${metrics.totalClients !== 1 ? 's' : ''}`}
          icon={Users}
          variant="default"
        />
        
        <MetricCard
          title="Estoque Baixo"
          value={metrics.lowStock.toString()}
          subtitle={metrics.lowStock > 0 ? "Produtos precisam reposição" : "Estoque em dia"}
          icon={AlertTriangle}
          variant={metrics.lowStock > 0 ? "warning" : "default"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        
        <div className="lg:col-span-2">
          <WeeklyCalendar
            selectedDate={new Date().toISOString().split('T')[0]}
            onDateChange={() => {}}
            appointments={upcomingAppointments.map(apt => ({
              id: apt.id,
              start_time: `${apt.appointment_date}T${apt.start_time}`,
              end_time: `${apt.appointment_date}T${apt.end_time || apt.start_time}`,
              client_name: apt.clients?.name,
              service_name: apt.services?.name,
              status: apt.status
            }))}
            compact={true}
            className="h-fit"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value) => [`R$ ${value}`, "Receita"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value) => [value, "Agendamentos"]}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}