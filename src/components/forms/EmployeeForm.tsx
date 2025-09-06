import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const employeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().min(1, "Cargo é obrigatório"),
  commission_percentage: z.number().min(0).max(100, "Comissão deve ser entre 0% e 100%"),
  hire_date: z.string().min(1, "Data de contratação é obrigatória"),
  status: z.enum(["active", "inactive"]),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<EmployeeFormData & { id: string }>;
}

export function EmployeeForm({ onSuccess, onCancel, initialData }: EmployeeFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "",
      commission_percentage: initialData?.commission_percentage || 0,
      hire_date: initialData?.hire_date || new Date().toISOString().split("T")[0],
      status: initialData?.status || "active",
    },
  });

  const roles = [
    "Cabeleireira",
    "Manicure",
    "Esteticista",
    "Maquiadora",
    "Massagista",
    "Recepcionista",
    "Gerente",
    "Outros"
  ];

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { name, role, ...otherData } = data;
      const employeeData = {
        name,
        role,
        ...otherData,
        user_id: user.id,
        email: data.email || null,
      };

      if (initialData?.id) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", initialData.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Funcionário atualizado com sucesso",
        });
      } else {
        // Create new employee
        const { error } = await supabase
          .from("employees")
          .insert(employeeData);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Funcionário cadastrado com sucesso",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar funcionário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData?.id ? "Editar Funcionário" : "Novo Funcionário"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nome completo do funcionário"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="funcionario@salao.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="role">Cargo *</Label>
              <Select
                value={watch("role") || undefined}
                onValueChange={(value) => setValue("role", value)}
              >
                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {/* Comissão */}
            <div className="space-y-2">
              <Label htmlFor="commission_percentage">Comissão (%)</Label>
              <Input
                id="commission_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("commission_percentage", { valueAsNumber: true })}
                placeholder="30.00"
                className={errors.commission_percentage ? "border-destructive" : ""}
              />
              {errors.commission_percentage && (
                <p className="text-sm text-destructive">{errors.commission_percentage.message}</p>
              )}
            </div>

            {/* Data de Contratação */}
            <div className="space-y-2">
              <Label htmlFor="hire_date">Data de Contratação *</Label>
              <Input
                id="hire_date"
                type="date"
                {...register("hire_date")}
                className={errors.hire_date ? "border-destructive" : ""}
              />
              {errors.hire_date && (
                <p className="text-sm text-destructive">{errors.hire_date.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as "active" | "inactive")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar" : "Cadastrar"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}