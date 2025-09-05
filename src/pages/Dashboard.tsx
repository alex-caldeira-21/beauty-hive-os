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

        // Upcoming appointments
        const { data: upcomingData } = await supabase
          .from('appointments')
          .select(`
            *,
            clients(name),
            employees(name),
            services(name)
          `)
          .eq('user_id', user.id)
          .gte('appointment_date', today)
          .eq('status', 'scheduled')
          .order('appointment_date')
          .order('start_time')
          .limit(5);

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
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregando agendamentos...</p>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {appointment.start_time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="w-4 h-4" />
                        {appointment.clients?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.services?.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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