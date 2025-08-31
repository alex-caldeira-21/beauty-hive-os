import { useState, useEffect } from "react";
import { Calendar, User, Clock, DollarSign, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
}

export function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && client) {
      loadClientHistory();
    }
  }, [isOpen, client]);

  const loadClientHistory = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      // Buscar agendamentos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          employees:employee_id(name),
          services:service_id(name, price)
        `)
        .eq("client_id", client.id)
        .order("appointment_date", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          employees:employee_id(name),
          sale_items(*, products(name), services(name))
        `)
        .eq("client_id", client.id)
        .order("sale_date", { ascending: false });

      if (salesError) throw salesError;

      setAppointments(appointmentsData || []);
      setSales(salesData || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico do cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSpent = appointments
    .filter(app => app.status === 'completed' && app.price)
    .reduce((sum, app) => sum + Number(app.price), 0) +
    sales.reduce((sum, sale) => sum + Number(sale.total), 0);

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Histórico de {client.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            Carregando histórico...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{appointments.length}</p>
                    <p className="text-sm text-muted-foreground">Agendamentos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {appointments.filter(app => app.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatPrice(totalSpent)}</p>
                    <p className="text-sm text-muted-foreground">Total Gasto</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agendamentos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Agendamentos ({appointments.length})
              </h3>
              
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status === 'scheduled' && 'Agendado'}
                                {appointment.status === 'completed' && 'Concluído'}
                                {appointment.status === 'cancelled' && 'Cancelado'}
                              </Badge>
                              <span className="font-medium">{appointment.services?.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(appointment.appointment_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {appointment.employees?.name}
                              </div>
                            </div>
                          </div>
                          {appointment.price && (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-lg font-semibold">
                                <DollarSign className="w-4 h-4" />
                                {formatPrice(appointment.price)}
                              </div>
                            </div>
                          )}
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Observações:</strong> {appointment.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Vendas */}
            {sales.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Vendas ({sales.length})
                </h3>
                
                <div className="space-y-3">
                  {sales.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">Venda</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(sale.sale_date)}
                              </div>
                              {sale.employees && (
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {sale.employees.name}
                                </div>
                              )}
                              <div>Método: {sale.payment_method}</div>
                            </div>
                            {sale.sale_items && sale.sale_items.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-medium">Itens:</div>
                                <div className="text-sm text-muted-foreground">
                                  {sale.sale_items.map((item: any, index: number) => (
                                    <div key={index}>
                                      {item.products?.name || item.services?.name} x{item.quantity}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                              <DollarSign className="w-4 h-4" />
                              {formatPrice(sale.total)}
                            </div>
                          </div>
                        </div>
                        {sale.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Observações:</strong> {sale.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}