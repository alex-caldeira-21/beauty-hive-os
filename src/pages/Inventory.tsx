import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Package, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FormModal } from "@/components/modals/FormModal";
import { ProductForm } from "@/components/forms/ProductForm";

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const loadProducts = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto excluído com sucesso",
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  const getStockStatus = (stock: number, minAlert: number) => {
    if (stock === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (stock <= minAlert) return { label: "Estoque Baixo", variant: "secondary" as const };
    return { label: "Em Estoque", variant: "default" as const };
  };

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock_quantity > p.min_stock_alert).length,
    lowStock: products.filter(p => p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        
        <Button className="gap-2" onClick={handleNewProduct}>
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria ou código de barras..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products List or Empty State */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                {products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {products.length === 0
                  ? "Comece adicionando os primeiros produtos ao seu estoque"
                  : "Tente ajustar os filtros de busca"}
              </p>
              {products.length === 0 && (
                <Button className="gap-2" onClick={handleNewProduct}>
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Produto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge {...getStockStatus(product.stock_quantity, product.min_stock_alert)}>
                        {getStockStatus(product.stock_quantity, product.min_stock_alert).label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Categoria:</span>
                        <p className="font-medium">{product.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço:</span>
                        <p className="font-medium">R$ {product.price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estoque:</span>
                        <p className="font-medium">{product.stock_quantity} unidades</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Marca:</span>
                        <p className="font-medium">{product.brand || "N/A"}</p>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{stats.inStock}</p>
              <p className="text-sm text-muted-foreground">Em Estoque</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{stats.outOfStock}</p>
              <p className="text-sm text-muted-foreground">Sem Estoque</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Editar Produto" : "Novo Produto"}
      >
        <ProductForm
          initialData={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </div>
  );
}