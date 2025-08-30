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

const revenueData = [
  { date: "19/08", value: 0 },
  { date: "20/08", value: 0 },
  { date: "21/08", value: 0 },
  { date: "22/08", value: 0 },
  { date: "23/08", value: 0 },
  { date: "24/08", value: 0 },
  { date: "25/08", value: 0 },
];

const appointmentData = [
  { date: "19/08", value: 0 },
  { date: "20/08", value: 0 },
  { date: "21/08", value: 0 },
  { date: "22/08", value: 0 },
  { date: "23/08", value: 0 },
  { date: "24/08", value: 0 },
  { date: "25/08", value: 0 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingAppointments = async () => {
      if (!user) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
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

        if (error) throw error;
        setUpcomingAppointments(data || []);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUpcomingAppointments();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Agendamentos Hoje"
          value="0"
          subtitle="Próximo às 14:00"
          icon={Calendar}
          variant="info"
        />
        
        <MetricCard
          title="Receita Hoje"
          value="R$ 0,00"
          subtitle="-100% em relação a ontem"
          icon={DollarSign}
          variant="success"
        />
        
        <MetricCard
          title="Total de Clientes"
          value="1"
          subtitle="+5 novos esta semana"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
          variant="default"
        />
        
        <MetricCard
          title="Estoque Baixo"
          value="0"
          subtitle="Produtos precisam reposição"
          icon={AlertTriangle}
          variant="warning"
        />
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
    </div>
  );
}