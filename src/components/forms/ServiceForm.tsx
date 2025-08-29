import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const serviceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  duration_minutes: z.string().min(1, "Duração é obrigatória"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ServiceFormData & { id: string }>;
  isEditing?: boolean;
}

export function ServiceForm({ onSuccess, initialData, isEditing = false }: ServiceFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData || {
      name: "",
      category: "",
      description: "",
      price: "",
      duration_minutes: "60",
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const serviceData = {
        name: data.name,
        category: data.category || null,
        description: data.description || null,
        price: parseFloat(data.price),
        duration_minutes: parseInt(data.duration_minutes),
        user_id: user.id,
      };

      let error;
      if (isEditing && initialData?.id) {
        const { error: updateError } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("services")
          .insert(serviceData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Serviço ${isEditing ? "atualizado" : "criado"} com sucesso!`,
      });

      if (!isEditing) form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar serviço. Tente novamente.",
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Corte de cabelo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Cabelo, Unhas, Estética..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder="50,00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição do serviço..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar Serviço" : "Criar Serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}