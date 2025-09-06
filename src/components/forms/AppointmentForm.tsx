import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const appointmentSchema = z.object({
  client_id: z.string().min(1, "Cliente é obrigatório"),
  employee_id: z.string().min(1, "Funcionário é obrigatório"),
  service_ids: z.array(z.string()).min(1, "Pelo menos um serviço é obrigatório"),
  appointment_date: z.string().min(1, "Data é obrigatória"),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  notes: z.string().optional(),
  price: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onSuccess?: () => void;
  appointment?: {
    id: string;
    client_id: string;
    employee_id: string;
    service_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    notes?: string;
    price?: number;
  };
}

export function AppointmentForm({ onSuccess, appointment }: AppointmentFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [calculatedEndTime, setCalculatedEndTime] = useState("");

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_id: appointment?.client_id || "",
      employee_id: appointment?.employee_id || "",
      service_ids: appointment?.service_id ? [appointment.service_id] : [],
      appointment_date: appointment?.appointment_date || "",
      start_time: appointment?.start_time || "",
      notes: appointment?.notes || "",
      price: appointment?.price?.toString() || "",
    },
  });

  // Função para calcular horário de fim baseado nos serviços selecionados
  const calculateEndTime = (startTime: string, serviceIds: string[]) => {
    if (!startTime || serviceIds.length === 0) return "";
    
    const totalDuration = serviceIds.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.duration_minutes || 0);
    }, 0);

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  useEffect(() => {
    loadFormData();
  }, []);

  // Atualizar serviços selecionados quando o formulário é carregado
  useEffect(() => {
    if (appointment?.service_id) {
      setSelectedServices([appointment.service_id]);
    }
  }, [appointment]);

  // Calcular preço total e horário de fim quando serviços ou horário de início mudam
  useEffect(() => {
    if (selectedServices.length > 0) {
      const startTime = form.getValues("start_time");
      const endTime = calculateEndTime(startTime, selectedServices);
      setCalculatedEndTime(endTime);

      // Calcular preço total
      const totalPrice = selectedServices.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (Number(service?.price) || 0);
      }, 0);

      if (totalPrice > 0) {
        form.setValue("price", totalPrice.toString(), { shouldValidate: false });
      }
    }
  }, [selectedServices, services]);

  // Separar o watch do start_time para evitar loop infinito
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_time' && selectedServices.length > 0) {
        const startTime = value.start_time || "";
        const endTime = calculateEndTime(startTime, selectedServices);
        setCalculatedEndTime(endTime);
      }
    });

    return () => subscription.unsubscribe();
  }, [selectedServices, form]);

  const loadFormData = async () => {
    if (!user?.id) return;

    try {
      const [clientsRes, employeesRes, servicesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase.from("employees").select("*").eq("user_id", user.id),
        supabase.from("services").select("*").eq("user_id", user.id),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Para múltiplos serviços, usar o primeiro serviço para compatibilidade com a estrutura atual
      // Em uma implementação futura, seria ideal criar uma tabela de relacionamento
      const primaryServiceId = data.service_ids[0];
      
      const appointmentData = {
        user_id: user.id,
        client_id: data.client_id,
        employee_id: data.employee_id,
        service_id: primaryServiceId,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: calculatedEndTime,
        notes: data.notes || null,
        price: data.price ? parseFloat(data.price) : null,
      };

      if (appointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id);

        if (error) throw error;
      } else {
        // Create new appointment
        const { error } = await supabase
          .from("appointments")
          .insert(appointmentData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: appointment ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!",
      });

      if (!appointment) {
        form.reset();
        setSelectedServices([]);
        setCalculatedEndTime("");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funcionário</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-2">
          <FormField
            control={form.control}
            name="service_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviços</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-lg">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onChange={(e) => {
                          const newSelectedServices = e.target.checked
                            ? [...selectedServices, service.id]
                            : selectedServices.filter(id => id !== service.id);
                          
                          setSelectedServices(newSelectedServices);
                          field.onChange(newSelectedServices);
                        }}
                        className="w-4 h-4 rounded border-input"
                      />
                      <label htmlFor={service.id} className="text-sm font-medium leading-none cursor-pointer flex-1">
                        <div>
                          <span className="font-semibold">{service.name}</span>
                          <div className="text-xs text-muted-foreground">
                            R$ {service.price?.toFixed(2) || "0,00"} • {service.duration_minutes}min
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <strong>Serviços selecionados:</strong> {selectedServices.length} • 
                    <strong> Duração total:</strong> {selectedServices.reduce((total, serviceId) => {
                      const service = services.find(s => s.id === serviceId);
                      return total + (service?.duration_minutes || 0);
                    }, 0)}min • 
                    <strong> Valor total:</strong> R$ {selectedServices.reduce((total, serviceId) => {
                      const service = services.find(s => s.id === serviceId);
                      return total + (Number(service?.price) || 0);
                    }, 0).toFixed(2)}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="appointment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Início</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = i + 7; // 7:00 às 22:00
                      const timeValue = `${hour.toString().padStart(2, '0')}:00`;
                      return (
                        <SelectItem key={timeValue} value={timeValue}>
                          {timeValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Label>Horário de Fim (Calculado Automaticamente)</Label>
            <Input
              type="time"
              value={calculatedEndTime}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Baseado na duração total dos serviços selecionados
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Total (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente com a soma dos serviços selecionados
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o agendamento..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : appointment ? "Atualizar Agendamento" : "Salvar Agendamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}