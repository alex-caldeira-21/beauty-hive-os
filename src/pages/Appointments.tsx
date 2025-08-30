import { useState, useCallback, useEffect } from "react";
import { Calendar, Clock, User, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FormModal } from "@/components/modals/FormModal";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
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

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

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

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment =>
    appointment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.employees?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.services?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-auto"
            aria-label="Selecionar data dos agendamentos"
          />
        </div>
        
        <Input
          placeholder="Buscar por cliente, serviço ou funcionário..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
          aria-label="Buscar agendamentos"
        />
        
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleFiltros}
          aria-label="Abrir filtros avançados"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
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