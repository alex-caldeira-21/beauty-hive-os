import { useState } from "react";
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

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  price: z.number().min(0, "Preço deve ser positivo"),
  cost: z.number().min(0, "Custo deve ser positivo").optional(),
  stock_quantity: z.number().int().min(0, "Quantidade deve ser positiva"),
  min_stock_alert: z.number().int().min(0, "Alerta mínimo deve ser positivo"),
  barcode: z.string().optional(),
  brand: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<ProductFormData & { id: string }>;
}

export function ProductForm({ onSuccess, onCancel, initialData }: ProductFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      price: initialData?.price || 0,
      cost: initialData?.cost || 0,
      stock_quantity: initialData?.stock_quantity || 0,
      min_stock_alert: initialData?.min_stock_alert || 5,
      barcode: initialData?.barcode || "",
      brand: initialData?.brand || "",
    },
  });

  const categories = [
    "Cabelo",
    "Unhas",
    "Maquiagem",
    "Cuidados",
    "Equipamentos",
    "Outros"
  ];

  const onSubmit = async (data: ProductFormData) => {
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
      const { name, ...otherData } = data;
      const productData = {
        name,
        ...otherData,
        user_id: user.id,
      };

      if (initialData?.id) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Produto atualizado com sucesso",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Produto cadastrado com sucesso",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto",
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
          {initialData?.id ? "Editar Produto" : "Novo Produto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nome do produto"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={watch("category") || undefined}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* Custo */}
            <div className="space-y-2">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register("cost", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.cost ? "border-destructive" : ""}
              />
              {errors.cost && (
                <p className="text-sm text-destructive">{errors.cost.message}</p>
              )}
            </div>

            {/* Estoque */}
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
              <Input
                id="stock_quantity"
                type="number"
                {...register("stock_quantity", { valueAsNumber: true })}
                placeholder="0"
                className={errors.stock_quantity ? "border-destructive" : ""}
              />
              {errors.stock_quantity && (
                <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
              )}
            </div>

            {/* Alerta Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="min_stock_alert">Alerta Estoque Mínimo</Label>
              <Input
                id="min_stock_alert"
                type="number"
                {...register("min_stock_alert", { valueAsNumber: true })}
                placeholder="5"
                className={errors.min_stock_alert ? "border-destructive" : ""}
              />
              {errors.min_stock_alert && (
                <p className="text-sm text-destructive">{errors.min_stock_alert.message}</p>
              )}
            </div>

            {/* Código de Barras */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                {...register("barcode")}
                placeholder="Código de barras"
              />
            </div>

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                {...register("brand")}
                placeholder="Marca do produto"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição detalhada do produto"
              rows={3}
            />
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