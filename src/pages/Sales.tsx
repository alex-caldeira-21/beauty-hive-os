import { useState, useEffect, useCallback } from "react";
import { Search, Plus, ShoppingCart, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FormModal } from "@/components/modals/FormModal";
import { SaleForm } from "@/components/forms/SaleForm";

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSales = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          clients(name),
          employees(name)
        `)
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false });

      if (error) throw error;

      setSales(data || []);
      setFilteredSales(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
  }, [sales, searchTerm]);

  const handleNewSale = () => {
    setIsModalOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) return;

    try {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Venda excluída com sucesso",
      });

      loadSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir venda",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    loadSales();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      cash: "Dinheiro",
      card: "Cartão",
      pix: "PIX",
      transfer: "Transferência",
    };
    return methods[method] || method;
  };

  const stats = {
    total: sales.length,
    totalRevenue: sales.reduce((acc, sale) => acc + (sale.total || 0), 0),
    averageTicket: sales.length > 0 ? sales.reduce((acc, sale) => acc + (sale.total || 0), 0) / sales.length : 0,
    pixSales: sales.filter(s => s.payment_method === "pix").length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Vendas</h2>
          <p className="text-muted-foreground">{sales.length} vendas realizadas</p>
        </div>
        
        <Button className="gap-2" onClick={handleNewSale}>
          <Plus className="w-4 h-4" />
          Nova Venda
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou forma de pagamento..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sales List or Empty State */}
      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                {sales.length === 0 ? "Nenhuma venda realizada" : "Nenhuma venda encontrada"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {sales.length === 0
                  ? "Registre sua primeira venda para começar a acompanhar o faturamento"
                  : "Tente ajustar os filtros de busca"}
              </p>
              {sales.length === 0 && (
                <Button className="gap-2" onClick={handleNewSale}>
                  <Plus className="w-4 h-4" />
                  Registrar Primeira Venda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        Venda #{sale.id.slice(-8).toUpperCase()}
                      </h3>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <p className="font-medium">{formatDate(sale.sale_date)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <p className="font-medium">{sale.clients?.name || "Cliente avulso"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Funcionário:</span>
                        <p className="font-medium">{sale.employees?.name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium text-lg text-primary">{formatCurrency(sale.total)}</p>
                      </div>
                    </div>

                    {sale.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{sale.notes}</p>
                    )}

                    {sale.discount > 0 && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Desconto: {formatCurrency(sale.discount)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSale(sale.id)}
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

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Receita Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-info">{formatCurrency(stats.averageTicket)}</p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.pixSales}</p>
              <p className="text-sm text-muted-foreground">Vendas PIX</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Venda"
      >
        <SaleForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </div>
  );
}