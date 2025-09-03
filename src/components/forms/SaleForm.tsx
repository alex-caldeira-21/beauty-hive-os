import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Minus } from "lucide-react";

const saleItemSchema = z.object({
  product_id: z.string().optional(),
  service_id: z.string().optional(),
  quantity: z.number().min(1, "Quantidade mínima é 1"),
  unit_price: z.number().min(0, "Preço deve ser positivo"),
});

const saleSchema = z.object({
  client_id: z.string().optional(),
  employee_id: z.string().optional(),
  sale_date: z.string().min(1, "Data da venda é obrigatória"),
  payment_method: z.enum(["cash", "card", "pix", "transfer"]),
  discount: z.number().min(0, "Desconto deve ser positivo"),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Adicione pelo menos um item"),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SaleForm({ onSuccess, onCancel }: SaleFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      discount: 0,
      notes: "",
      items: [{ quantity: 1, unit_price: 0 }],
    },
  });

  const watchedItems = watch("items");
  const watchedDiscount = watch("discount");

  // Calculate totals
  const subtotal = watchedItems.reduce((acc, item) => 
    acc + (item.quantity || 0) * (item.unit_price || 0), 0
  );
  const total = subtotal - (watchedDiscount || 0);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [clientsRes, employeesRes, productsRes, servicesRes] = await Promise.all([
        supabase.from("clients").select("id, name").eq("user_id", user.id),
        supabase.from("employees").select("id, name").eq("user_id", user.id).eq("status", "active"),
        supabase.from("products").select("id, name, price").eq("user_id", user.id),
        supabase.from("services").select("id, name, price").eq("user_id", user.id),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    };

    loadData();
  }, [user]);

  const addItem = () => {
    const currentItems = watch("items");
    setValue("items", [...currentItems, { quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = watch("items");
    if (currentItems.length > 1) {
      setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.service_id`, undefined);
      setValue(`items.${index}.unit_price`, product.price);
    }
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.product_id`, undefined);
      setValue(`items.${index}.unit_price`, service.price);
    }
  };

  const onSubmit = async (data: SaleFormData) => {
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
      // Create sale
      const saleData = {
        user_id: user.id,
        client_id: data.client_id || null,
        employee_id: data.employee_id || null,
        sale_date: data.sale_date,
        payment_method: data.payment_method,
        subtotal,
        discount: data.discount,
        total,
        notes: data.notes,
      };

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = data.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar estoque dos produtos vendidos
      for (const item of data.items) {
        if (item.product_id) {
          const { error: stockError } = await supabase.rpc('update_product_stock', {
            p_product_id: item.product_id,
            p_quantity_sold: item.quantity
          });
          
          if (stockError) {
            console.error('Erro ao atualizar estoque:', stockError);
            // Continua mesmo com erro no estoque para não falhar a venda
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Venda registrada com sucesso",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar venda",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Venda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={watch("client_id")}
                onValueChange={(value) => setValue("client_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_id">Funcionário</Label>
              <Select
                value={watch("employee_id")}
                onValueChange={(value) => setValue("employee_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">Data da Venda *</Label>
              <Input
                id="sale_date"
                type="date"
                {...register("sale_date")}
                className={errors.sale_date ? "border-destructive" : ""}
              />
              {errors.sale_date && (
                <p className="text-sm text-destructive">{errors.sale_date.message}</p>
              )}
            </div>
          </div>

          {/* Itens da venda */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Itens da Venda</Label>
              <Button type="button" variant="outline" onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {watchedItems.map((_, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select
                      value={watch(`items.${index}.product_id`)}
                      onValueChange={(value) => handleProductChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <p className="text-sm font-medium">
                      Total: R$ {((watch(`items.${index}.quantity`) || 0) * (watch(`items.${index}.unit_price`) || 0)).toFixed(2)}
                    </p>
                    {watchedItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {errors.items && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </div>

          {/* Totais e forma de pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento *</Label>
                <Select
                  value={watch("payment_method")}
                  onValueChange={(value) => setValue("payment_method", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Observações sobre a venda"
                  rows={3}
                />
              </div>
            </div>

            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="discount">Desconto:</Label>
                  <div className="w-32">
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      {...register("discount", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processando..." : "Finalizar Venda"}
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