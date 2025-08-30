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
  service_id: z.string().min(1, "Serviço é obrigatório"),
  appointment_date: z.string().min(1, "Data é obrigatória"),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().min(1, "Horário de fim é obrigatório"),
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

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_id: appointment?.client_id || "",
      employee_id: appointment?.employee_id || "",
      service_id: appointment?.service_id || "",
      appointment_date: appointment?.appointment_date || "",
      start_time: appointment?.start_time || "",
      end_time: appointment?.end_time || "",
      notes: appointment?.notes || "",
      price: appointment?.price?.toString() || "",
    },
  });

  useEffect(() => {
    loadFormData();
  }, []);

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
      const appointmentData = {
        user_id: user.id,
        client_id: data.client_id,
        employee_id: data.employee_id,
        service_id: data.service_id,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: data.end_time,
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  // Preenche automaticamente o preço quando um serviço é selecionado
                  const selectedService = services.find(s => s.id === value);
                  if (selectedService) {
                    form.setValue("price", selectedService.price.toString());
                  }
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price?.toFixed(2) || "0,00"}
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
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Fim</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
              </FormControl>
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