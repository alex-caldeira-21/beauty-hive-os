import { useState, useCallback, useEffect } from "react";
import { Calendar, Clock, User, Filter, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FormModal } from "@/components/modals/FormModal";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Appointment = {
  id: string;
  client_id: string;
  employee_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  notes?: string;
  clients?: { name: string };
  employees?: { name: string };
  services?: { name: string };
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchAppointments();
    loadFilterData();
  }, [selectedDate]);

  const loadFilterData = async () => {
    try {
      const [clientsRes, employeesRes] = await Promise.all([
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("employees").select("id, name").eq("status", "active").order("name")
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(name),
          employees(name),
          services(name)
        `)
        .eq('appointment_date', selectedDate)
        .order('start_time');

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para novo agendamento
  const handleNovoAgendamento = useCallback(() => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  }, []);

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  }, []);

  const handleDeleteAppointment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento",
        variant: "destructive",
      });
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  }, []);

  const handleAppointmentSuccess = useCallback(() => {
    setIsModalOpen(false);
    setEditingAppointment(null);
    fetchAppointments();
    toast({
      title: "Sucesso",
      description: editingAppointment ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!",
    });
  }, [editingAppointment]);

  const handleCompleteAppointment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento marcado como concluído!",
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir agendamento",
        variant: "destructive",
      });
    }
  }, []);

  // Handler para filtros
  const handleFiltros = useCallback(() => {
    toast({
      title: "Filtros",
      description: "Modal de filtros será implementado",
    });
  }, []);

  // Handler para mudança de data
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // Handler para busca
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Filter appointments based on search term and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.employees?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.services?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = employeeFilter === "all" || appointment.employee_id === employeeFilter;
    const matchesClient = clientFilter === "all" || appointment.client_id === clientFilter;
    const matchesTime = !timeFilter || appointment.start_time.startsWith(timeFilter);
    
    return matchesSearch && matchesEmployee && matchesClient && matchesTime;
  });

  // Calculate daily summary
  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length;
  const pendingAppointments = filteredAppointments.filter(apt => apt.status === 'scheduled').length;
  const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Agendado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agendamentos</h2>
          <p className="text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <Button 
          className="gap-2" 
          onClick={handleNovoAgendamento}
          disabled={isLoading}
          aria-label="Criar novo agendamento"
        >
          <Plus className="w-4 h-4" />
          {isLoading ? "Carregando..." : "Novo Agendamento"}
        </Button>
      </div>

      {/* Weekly Calendar */}
      <WeeklyCalendar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        appointments={appointments.map(apt => ({
          id: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          client_name: apt.clients?.name,
          service_name: apt.services?.name,
          status: apt.status
        }))}
        onTimeSlotClick={(date, time) => {
          setSelectedDate(date);
          handleNovoAgendamento();
        }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por cliente, serviço ou funcionário..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
          aria-label="Buscar agendamentos"
        />
        
        <div className="flex gap-2">
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Funcionário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos funcionários</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Horário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos horários</SelectItem>
              <SelectItem value="07">07:00</SelectItem>
              <SelectItem value="08">08:00</SelectItem>
              <SelectItem value="09">09:00</SelectItem>
              <SelectItem value="10">10:00</SelectItem>
              <SelectItem value="11">11:00</SelectItem>
              <SelectItem value="12">12:00</SelectItem>
              <SelectItem value="13">13:00</SelectItem>
              <SelectItem value="14">14:00</SelectItem>
              <SelectItem value="15">15:00</SelectItem>
              <SelectItem value="16">16:00</SelectItem>
              <SelectItem value="17">17:00</SelectItem>
              <SelectItem value="18">18:00</SelectItem>
              <SelectItem value="19">19:00</SelectItem>
              <SelectItem value="20">20:00</SelectItem>
              <SelectItem value="21">21:00</SelectItem>
              <SelectItem value="22">22:00</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleFiltros}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{totalAppointments}</p>
              <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completedAppointments}</p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{pendingAppointments}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-sm text-muted-foreground">Receita Prevista</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando agendamentos...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado para esta data</h3>
              <p className="text-muted-foreground mb-4">
                Que tal começar agendando o primeiro cliente do dia?
              </p>
              <Button 
                className="gap-2"
                onClick={handleNovoAgendamento}
                aria-label="Criar primeiro agendamento do dia"
              >
                <Plus className="w-4 h-4" />
                Novo Agendamento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {appointment.start_time} - {appointment.end_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {appointment.clients?.name}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.services?.name}</TableCell>
                    <TableCell>{appointment.employees?.name}</TableCell>
                    <TableCell>
                      {appointment.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
      >
        <AppointmentForm 
          onSuccess={handleAppointmentSuccess} 
          appointment={editingAppointment}
        />
      </FormModal>
    </div>
  );
}